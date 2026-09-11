import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ parse: vi.fn(), request: vi.fn(), initiate: vi.fn(), response: vi.fn(), error: vi.fn() }));
vi.mock("@/core/payment-capability", () => ({ paymentAccessSchema: { safeParse: mocks.parse } }));
vi.mock("@/core/payment-http", () => ({ paymentRequest: mocks.request, paymentResponse: mocks.response, paymentError: mocks.error }));
vi.mock("@/core/razorpay-payments", () => ({ initiatePayment: mocks.initiate }));
import { POST } from "@/app/api/payments/razorpay/order/route";

describe("Razorpay order route", () => {
  it("logs only the internal failure code and keeps the public response generic", async () => {
    const error = new Error("RAZORPAY_TEST_CONFIGURATION_REQUIRED");
    mocks.request.mockResolvedValue({}); mocks.parse.mockReturnValue({ success: true, data: { paymentIntentId: "intent", paymentAccessToken: "a".repeat(64) } }); mocks.initiate.mockRejectedValue(error); mocks.error.mockReturnValue(new Response("{}", { status: 503 }));
    const logged = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const response = await POST(new Request("https://preview.test/api/payments/razorpay/order", { method: "POST", body: "{}" }));
    expect(response.status).toBe(503);
    expect(logged).toHaveBeenCalledWith("Razorpay order creation failed", { code: "RAZORPAY_TEST_CONFIGURATION_REQUIRED" });
    expect(JSON.stringify(logged.mock.calls)).not.toContain("a".repeat(64));
    logged.mockRestore();
  });
});
