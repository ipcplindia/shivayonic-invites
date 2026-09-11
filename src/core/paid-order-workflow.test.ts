import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ updateMany: vi.fn(), findUnique: vi.fn(), update: vi.fn(), email: vi.fn() }));
vi.mock("@/db/client", () => ({ prisma: { paymentIntent: { updateMany: mocks.updateMany, findUnique: mocks.findUnique, update: mocks.update } } }));
vi.mock("@/features/public/notify", () => ({ sendEmail: mocks.email }));

import { createInvoiceForPaidOrder, sendPaidConfirmation } from "@/core/paid-order-workflow";

const payment = { id: "payment-1", status: "PAID", amountMinor: 5_000_000n, currency: "INR", enquiry: { planKey: "SILVER", customerEmail: "customer@example.test", customerName: "Customer", customerPhone: "999", address1: "1 Road", city: "Delhi", state: "DL", pincode: "110001", designName: "Diwali Nights" } };

describe("paid order workflow", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.updateMany.mockResolvedValue({ count: 1 }); mocks.findUnique.mockResolvedValue(payment); mocks.email.mockResolvedValue({ ok: true }); });

  it("sends confirmation once after a durable PAID transition", async () => {
    await sendPaidConfirmation("payment-1");
    expect(mocks.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ status: "PAID", paymentConfirmationSentAt: null }) }));
    expect(mocks.email).toHaveBeenCalledOnce();
  });

  it("does no duplicate work when a previous worker owns the invoice claim", async () => {
    mocks.updateMany.mockResolvedValue({ count: 0 });
    await createInvoiceForPaidOrder("payment-1");
    expect(mocks.findUnique).not.toHaveBeenCalled();
  });

  it("keeps payment authority separate when Zoho configuration is absent", async () => {
    await createInvoiceForPaidOrder("payment-1");
    expect(mocks.update).toHaveBeenLastCalledWith(expect.objectContaining({ data: { invoiceStatus: "FAILED" } }));
  });
});
