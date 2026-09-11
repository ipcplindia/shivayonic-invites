import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ parse: vi.fn(), persist: vi.fn(), deliver: vi.fn(), delivered: vi.fn(), limit: vi.fn() }));
vi.mock("@/core/checkout", () => ({ checkoutInputSchema: { safeParse: mocks.parse }, persistPublicCheckout: mocks.persist }));
vi.mock("@/features/public/notify", () => ({ deliverSubmission: mocks.deliver, isDelivered: mocks.delivered }));
vi.mock("@/auth/rate-limit", () => ({ checkPublicWriteRateLimit: mocks.limit }));

import { POST } from "@/app/api/public/orders/route";

const input = { customer: { name: "Customer", email: "customer@example.test", phone: "9999999999", whatsapp: "", address1: "1 Test Road", address2: "", city: "Mumbai", state: "MH", pincode: "400001", country: "India", eventDate: "", eventLocation: "", notes: "", contactEmail: "yes", contactSms: "", marketing: "" }, design: null, selectedPlan: "silver", briefSubmitted: false };

describe("public checkout route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.limit.mockResolvedValue({ allowed: true }); mocks.parse.mockReturnValue({ success: true, data: input });
    mocks.persist.mockResolvedValue({ enquiryId: "enquiry-1", paymentIntentId: "intent-1", status: "PAYMENT_PENDING_APPROVAL", planName: "Silver", reused: false });
    mocks.deliver.mockResolvedValue([{ channel: "email", ok: true }]); mocks.delivered.mockReturnValue(true);
  });

  it("returns only opaque persisted anchors, not financial or secret state", async () => {
    const response = await POST(new Request("https://www.shivayonic.com/api/public/orders", { method: "POST", headers: { "content-type": "application/json", "idempotency-key": "4187612f-6e12-46c8-a217-b3a2e5ac11f4" }, body: "{}" }));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ ok: true, enquiryId: "enquiry-1", status: "PAYMENT_PENDING_APPROVAL", delivery: "delivered" });
    expect(JSON.stringify(body)).not.toMatch(/secret|price|amount|currency|provider/i);
  });
});
