import "server-only";

import { prisma } from "@/db/client";
import { sendEmail } from "@/features/public/notify";

type PaidOrder = { id: string; planKey: string; customerEmail: string; customerName: string; customerPhone: string; address1: string; city: string; state: string; pincode: string; designName: string | null; amountMinor: bigint; currency: string };

function zohoConfig(plan: string) {
  const item = process.env[`ZOHO_ITEM_${plan}_ID`];
  const required = ["ZOHO_BOOKS_ORGANIZATION_ID", "ZOHO_CLIENT_ID", "ZOHO_CLIENT_SECRET", "ZOHO_REFRESH_TOKEN"] as const;
  if (!item || required.some(key => !process.env[key])) throw new Error("ZOHO_CONFIGURATION_REQUIRED");
  return { item, organizationId: process.env.ZOHO_BOOKS_ORGANIZATION_ID!, base: (process.env.ZOHO_BOOKS_BASE_URL || "https://www.zohoapis.in/books/v3").replace(/\/$/, "") };
}

async function zohoToken() {
  const body = new URLSearchParams({ refresh_token: process.env.ZOHO_REFRESH_TOKEN!, client_id: process.env.ZOHO_CLIENT_ID!, client_secret: process.env.ZOHO_CLIENT_SECRET!, grant_type: "refresh_token" });
  const response = await fetch("https://accounts.zoho.in/oauth/v2/token", { method: "POST", body, signal: AbortSignal.timeout(10_000) });
  const value = await response.json().catch(() => null) as { access_token?: string } | null;
  if (!response.ok || !value?.access_token) throw new Error("ZOHO_TOKEN_FAILED");
  return value.access_token;
}

async function zohoRequest(path: string, token: string, init?: RequestInit) {
  const response = await fetch(path, { ...init, headers: { Authorization: `Zoho-oauthtoken ${token}`, "content-type": "application/json", ...(init?.headers || {}) }, signal: AbortSignal.timeout(15_000) });
  const value = await response.json().catch(() => null) as Record<string, unknown> | null;
  if (!response.ok || value?.code && value.code !== 0) throw new Error("ZOHO_API_FAILED");
  return value || {};
}

async function createZohoInvoice(order: PaidOrder) {
  const config = zohoConfig(order.planKey);
  const token = await zohoToken();
  // Stable provider-side reference closes the crash window between Zoho create
  // and our local persistence: retries reuse this invoice instead of creating one.
  const invoiceQuery = new URLSearchParams({ organization_id: config.organizationId, reference_number: order.id });
  const existing = await zohoRequest(`${config.base}/invoices?${invoiceQuery}`, token) as { invoices?: Array<{ invoice_id?: string; invoice_number?: string; customer_id?: string }> };
  const known = existing.invoices?.[0];
  if (known?.invoice_id) return { token, config, customerId: known.customer_id ?? null, invoiceId: known.invoice_id, invoiceNumber: known.invoice_number ?? null };
  const query = new URLSearchParams({ organization_id: config.organizationId, email: order.customerEmail });
  const contacts = await zohoRequest(`${config.base}/contacts?${query}`, token) as { contacts?: Array<{ contact_id?: string }> };
  let customerId = contacts.contacts?.[0]?.contact_id;
  if (!customerId) {
    const contact = await zohoRequest(`${config.base}/contacts?organization_id=${encodeURIComponent(config.organizationId)}`, token, { method: "POST", body: JSON.stringify({ contact_name: order.customerName, contact_type: "customer", email: order.customerEmail, phone: order.customerPhone, billing_address: { address: order.address1, city: order.city, state: order.state, zip: order.pincode } }) }) as { contact?: { contact_id?: string };
    };
    customerId = contact.contact?.contact_id;
  }
  if (!customerId) throw new Error("ZOHO_CUSTOMER_FAILED");
  const invoice = await zohoRequest(`${config.base}/invoices?organization_id=${encodeURIComponent(config.organizationId)}`, token, { method: "POST", body: JSON.stringify({ customer_id: customerId, reference_number: order.id, line_items: [{ item_id: config.item, quantity: 1, rate: Number(order.amountMinor) / 100 }] }) }) as { invoice?: { invoice_id?: string; invoice_number?: string } };
  const invoiceId = invoice.invoice?.invoice_id;
  if (!invoiceId) throw new Error("ZOHO_INVOICE_FAILED");
  return { token, config, customerId, invoiceId, invoiceNumber: invoice.invoice?.invoice_number ?? null };
}

export async function sendPaidConfirmation(paymentIntentId: string) {
  const claimed = await prisma.paymentIntent.updateMany({ where: { id: paymentIntentId, status: "PAID", paymentConfirmationSentAt: null }, data: { paymentConfirmationSentAt: new Date() } });
  if (!claimed.count) return;
  const payment = await prisma.paymentIntent.findUnique({ where: { id: paymentIntentId }, include: { enquiry: true } });
  if (!payment?.enquiry) return;
  await sendEmail({ subject: "Payment received — Shivayonic Invites", short: "", body: `Thank you for your purchase.\n\nDesign: ${payment.enquiry.designName || "Invitation"}\nPlan: ${payment.enquiry.planKey}\nAmount: ${payment.currency} ${(payment.amountMinor / 100n).toLocaleString("en-IN")}\nReference: ${payment.enquiry.id}\n\nYour payment has been received. Keep your private order link or sign in to My Orders for updates.` }, payment.enquiry.customerEmail).catch(() => undefined);
}

/** Idempotent: durable status claim prevents duplicate invoices from duplicate provider events. */
export async function createInvoiceForPaidOrder(paymentIntentId: string) {
  const claimed = await prisma.paymentIntent.updateMany({ where: { id: paymentIntentId, status: "PAID", zohoInvoiceId: null, OR: [{ invoiceStatus: null }, { invoiceStatus: "RETRY_REQUIRED" }, { invoiceStatus: "FAILED" }] }, data: { invoiceStatus: "PENDING" } });
  if (!claimed.count) return;
  const payment = await prisma.paymentIntent.findUnique({ where: { id: paymentIntentId }, include: { enquiry: true } });
  if (!payment?.enquiry) return;
  const order: PaidOrder = { id: payment.id, planKey: payment.enquiry.planKey, customerEmail: payment.enquiry.customerEmail, customerName: payment.enquiry.customerName, customerPhone: payment.enquiry.customerPhone, address1: payment.enquiry.address1, city: payment.enquiry.city, state: payment.enquiry.state, pincode: payment.enquiry.pincode, designName: payment.enquiry.designName, amountMinor: payment.amountMinor, currency: payment.currency };
  try {
    const created = await createZohoInvoice(order);
    await prisma.paymentIntent.update({ where: { id: payment.id }, data: { invoiceStatus: "CREATED", zohoCustomerId: created.customerId, zohoInvoiceId: created.invoiceId, invoiceNumber: created.invoiceNumber, invoiceCreatedAt: new Date() } });
    try {
      await zohoRequest(`${created.config.base}/invoices/${encodeURIComponent(created.invoiceId)}/email?organization_id=${encodeURIComponent(created.config.organizationId)}`, created.token, { method: "POST", body: JSON.stringify({ to_mail_ids: [order.customerEmail] }) });
      await prisma.paymentIntent.update({ where: { id: payment.id }, data: { invoiceStatus: "SENT", invoiceSentAt: new Date() } });
    } catch { await prisma.paymentIntent.update({ where: { id: payment.id }, data: { invoiceStatus: "RETRY_REQUIRED" } }); }
  } catch (error) {
    await prisma.paymentIntent.update({ where: { id: payment.id }, data: { invoiceStatus: error instanceof Error && error.message === "ZOHO_CONFIGURATION_REQUIRED" ? "FAILED" : "RETRY_REQUIRED" } });
  }
}

export async function runPaidOrderWorkflow(paymentIntentId: string) {
  await Promise.allSettled([sendPaidConfirmation(paymentIntentId), createInvoiceForPaidOrder(paymentIntentId)]);
}
