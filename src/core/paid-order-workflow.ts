import "server-only";

import { prisma } from "@/db/client";
import { sendEmail } from "@/features/public/notify";

type PaidOrder = { id: string; planKey: string; customerEmail: string; customerName: string; customerPhone: string; address1: string; city: string; state: string; pincode: string; country: string; amountMinor: bigint; currency: string; providerPaymentId: string | null; paidAt: Date | null; zohoCustomerId: string | null; zohoInvoiceId: string | null; invoiceSentAt: Date | null };
type ZohoConfig = { itemId: string; organizationId: string; accountsBase: string; booksBase: string };
type ZohoInvoice = { invoice_id?: string; invoice_number?: string; customer_id?: string; total?: number; balance?: number };
type ZohoPayment = { payment_id?: string; amount?: number };

class ZohoError extends Error { constructor(readonly code: string) { super(code); } }

/** Opt-in only: payment authority and confirmation email never depend on Zoho. */
export function zohoInvoicingEnabled() { return process.env.ZOHO_INVOICING_ENABLED === "true"; }

function httpsBase(value: string | undefined) {
  try { const url = new URL(value ?? ""); return url.protocol === "https:" ? url.toString().replace(/\/$/, "") : null; } catch { return null; }
}

function zohoConfig(plan: string): ZohoConfig {
  if (!/^(SILVER|GOLD|PLATINUM|CUSTOM)$/.test(plan)) throw new ZohoError("ZOHO_CONFIGURATION_REQUIRED");
  const itemId = process.env[`ZOHO_ITEM_${plan}_ID`];
  const organizationId = process.env.ZOHO_ORGANIZATION_ID;
  const accountsBase = httpsBase(process.env.ZOHO_ACCOUNTS_BASE_URL);
  const booksBase = httpsBase(process.env.ZOHO_BOOKS_BASE_URL);
  if (!itemId || !organizationId || !accountsBase || !booksBase || !process.env.ZOHO_CLIENT_ID || !process.env.ZOHO_CLIENT_SECRET || !process.env.ZOHO_REFRESH_TOKEN) throw new ZohoError("ZOHO_CONFIGURATION_REQUIRED");
  return { itemId, organizationId, accountsBase, booksBase };
}

function asMinor(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) throw new ZohoError("ZOHO_AMOUNT_MISMATCH");
  return BigInt(Math.round(value * 100));
}

function asDate(value: Date | null) { return (value ?? new Date()).toISOString().slice(0, 10); }
function reference(order: PaidOrder) { return `${process.env.VERCEL_ENV === "preview" ? "SHIVAYONIC TEST" : "SHIVAYONIC"} ${order.id}`; }

async function zohoToken(config: ZohoConfig) {
  const body = new URLSearchParams({ refresh_token: process.env.ZOHO_REFRESH_TOKEN!, client_id: process.env.ZOHO_CLIENT_ID!, client_secret: process.env.ZOHO_CLIENT_SECRET!, grant_type: "refresh_token" });
  let response: Response;
  try { response = await fetch(`${config.accountsBase}/oauth/v2/token`, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body, cache: "no-store", signal: AbortSignal.timeout(10_000) }); } catch { throw new ZohoError("ZOHO_TRANSIENT"); }
  const value = await response.json().catch(() => null) as { access_token?: string } | null;
  if (!response.ok || !value?.access_token) throw new ZohoError(response.status >= 500 ? "ZOHO_TRANSIENT" : "ZOHO_AUTH_FAILED");
  return value.access_token;
}

async function zohoRequest<T>(url: string, token: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try { response = await fetch(url, { ...init, headers: { Authorization: `Zoho-oauthtoken ${token}`, "content-type": "application/json", ...(init?.headers ?? {}) }, cache: "no-store", signal: AbortSignal.timeout(15_000) }); } catch { throw new ZohoError("ZOHO_TRANSIENT"); }
  const value = await response.json().catch(() => null) as { code?: number } | null;
  if (response.status === 401 || response.status === 403) throw new ZohoError("ZOHO_AUTH_RETRY");
  if (response.status === 429) throw new ZohoError("ZOHO_RATE_LIMITED");
  if (response.status >= 500) throw new ZohoError("ZOHO_TRANSIENT");
  if (!response.ok || !value || (typeof value.code === "number" && value.code !== 0)) throw new ZohoError("ZOHO_API_REJECTED");
  return value as T;
}

async function withZohoToken<T>(config: ZohoConfig, work: (token: string) => Promise<T>) {
  let token = await zohoToken(config);
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try { return await work(token); } catch (error) {
      if (!(error instanceof ZohoError) || error.code !== "ZOHO_AUTH_RETRY" || attempt) throw error;
      token = await zohoToken(config);
    }
  }
  throw new ZohoError("ZOHO_AUTH_FAILED");
}

function orgQuery(config: ZohoConfig, values: Record<string, string>) { return new URLSearchParams({ organization_id: config.organizationId, ...values }); }

async function getInvoice(config: ZohoConfig, token: string, id: string) {
  const result = await zohoRequest<{ invoice?: ZohoInvoice }>(`${config.booksBase}/invoices/${encodeURIComponent(id)}?${orgQuery(config, {})}`, token);
  if (!result.invoice?.invoice_id) throw new ZohoError("ZOHO_INVOICE_FAILED");
  return result.invoice;
}

async function resolveInvoice(config: ZohoConfig, token: string, order: PaidOrder) {
  if (order.zohoInvoiceId) return getInvoice(config, token, order.zohoInvoiceId);
  const found = await zohoRequest<{ invoices?: ZohoInvoice[] }>(`${config.booksBase}/invoices?${orgQuery(config, { reference_number: reference(order) })}`, token);
  const existing = found.invoices?.find(invoice => invoice.invoice_id);
  if (existing?.invoice_id) return getInvoice(config, token, existing.invoice_id);
  let customerId = order.zohoCustomerId;
  if (!customerId) {
    const byEmail = await zohoRequest<{ contacts?: Array<{ contact_id?: string }> }>(`${config.booksBase}/contacts?${orgQuery(config, { email: order.customerEmail })}`, token);
    customerId = byEmail.contacts?.find(contact => contact.contact_id)?.contact_id ?? null;
  }
  if (!customerId && order.customerPhone) {
    const byPhone = await zohoRequest<{ contacts?: Array<{ contact_id?: string }> }>(`${config.booksBase}/contacts?${orgQuery(config, { phone: order.customerPhone })}`, token);
    customerId = byPhone.contacts?.find(contact => contact.contact_id)?.contact_id ?? null;
  }
  if (!customerId) {
    const contact = await zohoRequest<{ contact?: { contact_id?: string } }>(`${config.booksBase}/contacts?${orgQuery(config, {})}`, token, { method: "POST", body: JSON.stringify({ contact_name: order.customerName, contact_type: "customer", email: order.customerEmail, phone: order.customerPhone, billing_address: { address: order.address1, city: order.city, state: order.state, zip: order.pincode, country: order.country } }) });
    customerId = contact.contact?.contact_id ?? null;
  }
  if (!customerId) throw new ZohoError("ZOHO_CUSTOMER_FAILED");
  const created = await zohoRequest<{ invoice?: ZohoInvoice }>(`${config.booksBase}/invoices?${orgQuery(config, {})}`, token, { method: "POST", body: JSON.stringify({ customer_id: customerId, reference_number: reference(order), line_items: [{ item_id: config.itemId, quantity: 1, rate: Number(order.amountMinor) / 100 }] }) });
  if (!created.invoice?.invoice_id) throw new ZohoError("ZOHO_INVOICE_FAILED");
  return getInvoice(config, token, created.invoice.invoice_id);
}

async function resolveCustomerPayment(config: ZohoConfig, token: string, order: PaidOrder, invoice: ZohoInvoice) {
  if (!order.providerPaymentId || !invoice.invoice_id || !invoice.customer_id) throw new ZohoError("ZOHO_PAYMENT_REFERENCE_REQUIRED");
  const found = await zohoRequest<{ payments?: ZohoPayment[] }>(`${config.booksBase}/customerpayments?${orgQuery(config, { reference_number: order.providerPaymentId })}`, token);
  const existing = found.payments?.find(payment => payment.payment_id);
  if (existing) {
    if (existing.amount !== undefined && asMinor(existing.amount) !== order.amountMinor) throw new ZohoError("ZOHO_AMOUNT_MISMATCH");
    return existing;
  }
  const created = await zohoRequest<{ payment?: ZohoPayment }>(`${config.booksBase}/customerpayments?${orgQuery(config, {})}`, token, { method: "POST", body: JSON.stringify({ customer_id: invoice.customer_id, payment_mode: "others", amount: Number(order.amountMinor) / 100, date: asDate(order.paidAt), reference_number: order.providerPaymentId, description: `${process.env.VERCEL_ENV === "preview" ? "SHIVAYONIC TEST " : ""}Razorpay payment`, invoices: [{ invoice_id: invoice.invoice_id, amount_applied: Number(order.amountMinor) / 100 }] }) });
  if (!created.payment?.payment_id) throw new ZohoError("ZOHO_CUSTOMER_PAYMENT_FAILED");
  return created.payment;
}

async function createZohoInvoice(order: PaidOrder) {
  const config = zohoConfig(order.planKey);
  return withZohoToken(config, async token => {
    const invoice = await resolveInvoice(config, token, order);
    if (!invoice.invoice_id || asMinor(invoice.total) !== order.amountMinor) throw new ZohoError("ZOHO_AMOUNT_MISMATCH");
    const payment = await resolveCustomerPayment(config, token, order, invoice);
    const paidInvoice = await getInvoice(config, token, invoice.invoice_id);
    if (asMinor(paidInvoice.total) !== order.amountMinor || asMinor(paidInvoice.balance) !== 0n) throw new ZohoError("ZOHO_PAYMENT_RECONCILIATION_REQUIRED");
    return { token, config, invoice: paidInvoice, customerId: paidInvoice.customer_id ?? invoice.customer_id ?? null, payment };
  });
}

export async function sendPaidConfirmation(paymentIntentId: string) {
  const claimed = await prisma.paymentIntent.updateMany({ where: { id: paymentIntentId, status: "PAID", paymentConfirmationSentAt: null }, data: { paymentConfirmationSentAt: new Date() } });
  if (!claimed.count) return;
  const payment = await prisma.paymentIntent.findUnique({ where: { id: paymentIntentId }, include: { enquiry: true } });
  if (!payment?.enquiry) return;
  await sendEmail({ subject: "Payment received — Shivayonic Invites", short: "", body: `Thank you for your purchase.\n\nDesign: ${payment.enquiry.designName || "Invitation"}\nPlan: ${payment.enquiry.planKey}\nAmount: ${payment.currency} ${(payment.amountMinor / 100n).toLocaleString("en-IN")}\nReference: ${payment.enquiry.id}\n\nYour payment has been received. Keep your private order link or sign in to My Orders for updates.` }, payment.enquiry.customerEmail).catch(() => undefined);
}

function failureStatus(error: unknown) {
  const code = error instanceof ZohoError ? error.code : "ZOHO_TRANSIENT";
  return ["ZOHO_CONFIGURATION_REQUIRED", "ZOHO_AMOUNT_MISMATCH", "ZOHO_PAYMENT_REFERENCE_REQUIRED", "ZOHO_API_REJECTED", "ZOHO_AUTH_FAILED"].includes(code) ? "FAILED" as const : "RETRY_REQUIRED" as const;
}

/** Idempotent: durable claims and stable Zoho references prevent duplicate invoices or payments. */
export async function createInvoiceForPaidOrder(paymentIntentId: string) {
  if (!zohoInvoicingEnabled()) return;
  const claimed = await prisma.paymentIntent.updateMany({ where: { id: paymentIntentId, status: "PAID", OR: [{ invoiceStatus: null }, { invoiceStatus: "RETRY_REQUIRED" }, { invoiceStatus: "FAILED" }] }, data: { invoiceStatus: "PENDING" } });
  if (!claimed.count) return;
  const payment = await prisma.paymentIntent.findUnique({ where: { id: paymentIntentId }, include: { enquiry: true } });
  if (!payment?.enquiry) return;
  const order: PaidOrder = { id: payment.id, planKey: payment.enquiry.planKey, customerEmail: payment.enquiry.customerEmail, customerName: payment.enquiry.customerName, customerPhone: payment.enquiry.customerPhone, address1: payment.enquiry.address1, city: payment.enquiry.city, state: payment.enquiry.state, pincode: payment.enquiry.pincode, country: payment.enquiry.country, amountMinor: payment.amountMinor, currency: payment.currency, providerPaymentId: payment.providerPaymentId, paidAt: payment.paidAt, zohoCustomerId: payment.zohoCustomerId, zohoInvoiceId: payment.zohoInvoiceId, invoiceSentAt: payment.invoiceSentAt };
  try {
    const created = await createZohoInvoice(order);
    const invoiceId = created.invoice.invoice_id!;
    await prisma.paymentIntent.update({ where: { id: payment.id }, data: { invoiceStatus: "PAID", zohoCustomerId: created.customerId, zohoInvoiceId: invoiceId, invoiceNumber: created.invoice.invoice_number ?? null, invoiceCreatedAt: payment.invoiceCreatedAt ?? new Date() } });
    if (order.invoiceSentAt) return;
    try {
      await zohoRequest(`${created.config.booksBase}/invoices/${encodeURIComponent(invoiceId)}/email?${orgQuery(created.config, {})}`, created.token, { method: "POST", body: JSON.stringify({ to_mail_ids: [order.customerEmail] }) });
      await prisma.paymentIntent.update({ where: { id: payment.id }, data: { invoiceStatus: "SENT", invoiceSentAt: new Date() } });
    } catch { await prisma.paymentIntent.update({ where: { id: payment.id }, data: { invoiceStatus: "RETRY_REQUIRED" } }); }
  } catch (error) {
    const code = error instanceof ZohoError ? error.code : "ZOHO_TRANSIENT";
    console.error("Zoho invoice workflow failed", { code });
    await prisma.paymentIntent.update({ where: { id: payment.id }, data: { invoiceStatus: failureStatus(error) } });
  }
}

export async function runPaidOrderWorkflow(paymentIntentId: string) {
  await Promise.allSettled([sendPaidConfirmation(paymentIntentId), createInvoiceForPaidOrder(paymentIntentId)]);
}
