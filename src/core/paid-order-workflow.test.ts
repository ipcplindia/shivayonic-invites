import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ updateMany: vi.fn(), findUnique: vi.fn(), update: vi.fn(), email: vi.fn() }));
vi.mock("@/db/client", () => ({ prisma: { paymentIntent: { updateMany: mocks.updateMany, findUnique: mocks.findUnique, update: mocks.update } } }));
vi.mock("@/features/public/notify", () => ({ sendEmail: mocks.email }));

import { createInvoiceForPaidOrder, sendPaidConfirmation } from "@/core/paid-order-workflow";

const payment = { id: "payment-1", status: "PAID", amountMinor: 5_000_000n, currency: "INR", providerPaymentId: "pay_test", paidAt: new Date("2026-09-12"), zohoCustomerId: "customer-1", zohoInvoiceId: null, invoiceSentAt: null, invoiceCreatedAt: null, enquiry: { planKey: "SILVER", customerEmail: "customer@example.test", customerName: "Customer", customerPhone: "999", address1: "1 Road", city: "Delhi", state: "DL", pincode: "110001", country: "India", designName: "Diwali Nights" } };
const ok = (value: object) => new Response(JSON.stringify({ code: 0, ...value }), { status: 200, headers: { "content-type": "application/json" } });

function configure() {
  vi.stubEnv("ZOHO_INVOICING_ENABLED", "true"); vi.stubEnv("ZOHO_CLIENT_ID", "client"); vi.stubEnv("ZOHO_CLIENT_SECRET", "secret"); vi.stubEnv("ZOHO_REFRESH_TOKEN", "refresh"); vi.stubEnv("ZOHO_ORGANIZATION_ID", "organization"); vi.stubEnv("ZOHO_ACCOUNTS_BASE_URL", "https://accounts.zoho.test"); vi.stubEnv("ZOHO_BOOKS_BASE_URL", "https://books.zoho.test/books/v3"); vi.stubEnv("ZOHO_ITEM_SILVER_ID", "item-silver"); vi.stubEnv("ZOHO_INVOICE_TEMPLATE_ID", "template-1"); vi.stubEnv("ZOHO_BUSINESS_UNIT_TAG_ID", "tag-1"); vi.stubEnv("ZOHO_BUSINESS_UNIT_TAG_OPTION_ID", "tag-option-1"); vi.stubEnv("VERCEL_ENV", "preview");
}

function happyResponses(existingPayment = false) {
  return [
    ok({ access_token: "access" }),
    ok({ reporting_tags: [{ tag_id: "tag-actual", tag_name: "Business Unit" }] }),
    ok({ results: [{ option_id: "option-actual", option_name: "Shivayonic Invites" }] }),
    ok({ invoices: [] }),
    ok({ invoice: { invoice_id: "invoice-1" } }),
    ok({ invoice: { invoice_id: "invoice-1", invoice_number: "INV-1", customer_id: "customer-1", total: 50000, balance: 50000 } }),
    ok(existingPayment ? { payments: [{ payment_id: "customer-payment-1", amount: 50000 }] } : { payments: [] }),
    ...(existingPayment ? [] : [ok({ payment: { payment_id: "customer-payment-1" } })]),
    ok({ invoice: { invoice_id: "invoice-1", invoice_number: "INV-1", customer_id: "customer-1", total: 50000, balance: 0 } }),
    ok({}),
  ];
}

describe("paid order workflow", () => {
  beforeEach(() => { vi.resetAllMocks(); mocks.updateMany.mockResolvedValue({ count: 1 }); mocks.findUnique.mockResolvedValue(payment); mocks.email.mockResolvedValue({ ok: true }); vi.spyOn(console, "error").mockImplementation(() => undefined); });
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

  it("sends confirmation once after a durable PAID transition", async () => {
    await sendPaidConfirmation("payment-1");
    expect(mocks.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ status: "PAID", paymentConfirmationSentAt: null }) }));
    expect(mocks.email).toHaveBeenCalledOnce();
  });

  it("does zero Zoho work while disabled", async () => {
    vi.stubGlobal("fetch", vi.fn());
    await createInvoiceForPaidOrder("payment-1");
    expect(mocks.updateMany).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("claims once, reuses the saved customer, reconciles amount, records one payment, and emails once", async () => {
    configure(); vi.stubEnv("VERCEL_ENV", "production"); const fetchMock = vi.fn(); vi.stubGlobal("fetch", fetchMock); happyResponses().forEach(response => fetchMock.mockResolvedValueOnce(response));
    await createInvoiceForPaidOrder("payment-1");
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes("/contacts"))).toBe(false);
    expect(fetchMock.mock.calls.some(([url, init]) => String(url).includes("/customerpayments") && init?.method === "POST")).toBe(true);
    const invoiceCreate = fetchMock.mock.calls.find(([url, init]) => String(url).includes("/invoices?") && init?.method === "POST");
    expect(JSON.parse(String(invoiceCreate?.[1]?.body))).toEqual(expect.objectContaining({ is_inclusive_tax: true, tags: [{ tag_id: "tag-actual", tag_option_id: "option-actual" }], line_items: [expect.objectContaining({ tags: [{ tag_id: "tag-actual", tag_option_id: "option-actual" }] })] }));
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ zohoCustomerId: "customer-1", zohoInvoiceId: "invoice-1", invoiceNumber: "INV-1", invoiceStatus: "PAID" }) }));
    expect(mocks.update).toHaveBeenLastCalledWith(expect.objectContaining({ data: expect.objectContaining({ invoiceStatus: "SENT", invoiceSentAt: expect.any(Date) }) }));
  });

  it("never emails a Preview invoice and repeated completed work performs no provider calls", async () => {
    configure(); const fetchMock = vi.fn(); vi.stubGlobal("fetch", fetchMock); happyResponses().forEach(response => fetchMock.mockResolvedValueOnce(response));
    await createInvoiceForPaidOrder("payment-1");
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes("/email"))).toBe(false);
    expect(mocks.update).toHaveBeenLastCalledWith(expect.objectContaining({ data: expect.objectContaining({ invoiceStatus: "PAID" }) }));
    const calls = fetchMock.mock.calls.length;
    mocks.updateMany.mockResolvedValue({ count: 0 });
    await createInvoiceForPaidOrder("payment-1");
    expect(fetchMock).toHaveBeenCalledTimes(calls);
  });

  it("reuses a matching Zoho customer found through documented search_text", async () => {
    configure(); const fetchMock = vi.fn(); vi.stubGlobal("fetch", fetchMock); mocks.findUnique.mockResolvedValue({ ...payment, zohoCustomerId: null });
    [ok({ access_token: "access" }), ok({ reporting_tags: [{ tag_id: "tag-actual", tag_name: "Business Unit" }] }), ok({ results: [{ option_id: "option-actual", option_name: "Shivayonic Invites" }] }), ok({ invoices: [] }), ok({ contacts: [{ contact_id: "customer-existing", phone: "+91-999" }] }), ...happyResponses().slice(4)].forEach(response => fetchMock.mockResolvedValueOnce(response));
    await createInvoiceForPaidOrder("payment-1");
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes("search_text=Customer"))).toBe(true);
    expect(fetchMock.mock.calls.some(([url, init]) => String(url).includes("/contacts?") && init?.method === "POST")).toBe(false);
  });

  it("does not create a duplicate invoice or payment when another worker owns the claim", async () => {
    configure(); mocks.updateMany.mockResolvedValue({ count: 0 }); vi.stubGlobal("fetch", vi.fn());
    await createInvoiceForPaidOrder("payment-1");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("reuses an existing customer payment by Razorpay reference", async () => {
    configure(); const fetchMock = vi.fn(); vi.stubGlobal("fetch", fetchMock); happyResponses(true).forEach(response => fetchMock.mockResolvedValueOnce(response));
    await createInvoiceForPaidOrder("payment-1");
    expect(fetchMock.mock.calls.some(([url, init]) => String(url).includes("/customerpayments") && init?.method === "POST")).toBe(false);
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ invoiceStatus: "PAID" }) }));
  });

  it("marks an exact Zoho total mismatch failed without recording a customer payment", async () => {
    configure(); const fetchMock = vi.fn(); vi.stubGlobal("fetch", fetchMock);
    [ok({ access_token: "access" }), ok({ reporting_tags: [{ tag_id: "tag-actual", tag_name: "Business Unit" }] }), ok({ results: [{ option_id: "option-actual", option_name: "Shivayonic Invites" }] }), ok({ invoices: [] }), ok({ invoice: { invoice_id: "invoice-1" } }), ok({ invoice: { invoice_id: "invoice-1", customer_id: "customer-1", total: 50001, balance: 50001 } })].forEach(response => fetchMock.mockResolvedValueOnce(response));
    await createInvoiceForPaidOrder("payment-1");
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes("/customerpayments"))).toBe(false);
    expect(mocks.update).toHaveBeenLastCalledWith(expect.objectContaining({ data: { invoiceStatus: "FAILED" } }));
  });

  it("refreshes once after a Zoho 401 and marks 429 retryable", async () => {
    configure(); const fetchMock = vi.fn(); vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockResolvedValueOnce(ok({ access_token: "old" })).mockResolvedValueOnce(new Response("{}", { status: 401 })).mockResolvedValueOnce(ok({ access_token: "new" }));
    happyResponses().slice(1).forEach(response => fetchMock.mockResolvedValueOnce(response));
    await createInvoiceForPaidOrder("payment-1");
    expect(fetchMock.mock.calls.filter(([url]) => String(url).includes("/oauth/v2/token")).length).toBe(2);
    mocks.update.mockClear(); mocks.updateMany.mockResolvedValue({ count: 1 }); mocks.findUnique.mockResolvedValue(payment);
    const limited = vi.fn().mockResolvedValueOnce(ok({ access_token: "access" })).mockResolvedValueOnce(new Response("{}", { status: 429 })); vi.stubGlobal("fetch", limited);
    await createInvoiceForPaidOrder("payment-1");
    expect(mocks.update).toHaveBeenLastCalledWith(expect.objectContaining({ data: { invoiceStatus: "RETRY_REQUIRED" } }));
  });

  it("trims Vercel OAuth secret whitespace before refreshing", async () => {
    configure(); vi.stubEnv("ZOHO_CLIENT_ID", " client "); vi.stubEnv("ZOHO_CLIENT_SECRET", " secret "); vi.stubEnv("ZOHO_REFRESH_TOKEN", " refresh ");
    const fetchMock = vi.fn(); vi.stubGlobal("fetch", fetchMock); happyResponses().forEach(response => fetchMock.mockResolvedValueOnce(response));
    await createInvoiceForPaidOrder("payment-1");
    expect(String(fetchMock.mock.calls[0]?.[1]?.body)).toContain("client_id=client");
    expect(String(fetchMock.mock.calls[0]?.[1]?.body)).toContain("refresh_token=refresh");
  });

  it("logs only a safe provider rejection category", async () => {
    configure(); const fetchMock = vi.fn(); vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockResolvedValueOnce(ok({ access_token: "access" })).mockResolvedValueOnce(ok({ reporting_tags: [{ tag_id: "tag-actual", tag_name: "Business Unit" }] })).mockResolvedValueOnce(ok({ results: [{ option_id: "option-actual", option_name: "Shivayonic Invites" }] })).mockResolvedValueOnce(ok({ invoices: [] })).mockResolvedValueOnce(new Response(JSON.stringify({ code: -1, message: "Invoice template is not valid for this customer" }), { status: 400, headers: { "content-type": "application/json" } }));
    await createInvoiceForPaidOrder("payment-1");
    expect(console.error).toHaveBeenCalledWith("Zoho Books request rejected", expect.objectContaining({ message: "TEMPLATE_REJECTED" }));
    expect(mocks.update).toHaveBeenLastCalledWith(expect.objectContaining({ data: { invoiceStatus: "FAILED" } }));
  });
});
