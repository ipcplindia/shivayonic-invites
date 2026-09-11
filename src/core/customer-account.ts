import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/db/client";
import { getPublicOrganizationId } from "@/core/public-organization";
import { createPaymentCapability } from "@/core/payment-capability";
import { customerOrigin, customerOrderPath } from "@/core/customer-order";
import { consumeDurableRateLimit } from "@/auth/rate-limit";
import { sendEmail } from "@/features/public/notify";

const digest = (token: string) => createHash("sha256").update(token).digest("hex");
export const CUSTOMER_COOKIE = "shivayonic-customer";
export const CUSTOMER_SESSION_SECONDS = 30 * 24 * 60 * 60;
const identityKey = (org: string) => `customer-email:${org}`;

// Customer verification/session rows use distinct namespaces and are never
// Better Auth Session rows. Even an admin's email cannot create admin access.
export async function requestCustomerSignIn(email: string) {
  const normalized = email.trim().toLowerCase();
  const organizationId = await getPublicOrganizationId();
  if (!organizationId) return;
  if (!(await consumeDurableRateLimit(`customer-email:${normalized}`, { window: 600, max: 3 })).allowed) return;
  const token = randomBytes(32).toString("hex");
  await prisma.verification.create({ data: { id: `customer-magic:${digest(token)}`, identifier: identityKey(organizationId), value: normalized, expiresAt: new Date(Date.now() + 15 * 60_000) } });
  try {
    await sendEmail({ subject: "Sign in to your Shivayonic orders", body: `Open this private link to verify your email and view your orders. It expires in 15 minutes and works once.\n\n${customerOrigin()}/account#verify=${token}\n\nIf you did not request this, ignore this email.`, short: "" }, normalized);
  } catch { /* Generic response prevents email enumeration; no secrets logged. */ }
}

export async function verifyCustomerSignIn(token: string) {
  if (!/^[a-f0-9]{64}$/.test(token)) throw new Error("PAYMENT_ACCESS_DENIED");
  const org = await getPublicOrganizationId();
  if (!org) throw new Error("PAYMENT_ACCESS_DENIED");
  const session = randomBytes(32).toString("hex");
  await prisma.$transaction(async tx => {
    const id = `customer-magic:${digest(token)}`;
    const row = await tx.verification.findUnique({ where: { id } });
    if (!row || row.identifier !== identityKey(org) || row.expiresAt <= new Date()) throw new Error("PAYMENT_ACCESS_DENIED");
    const claimed = await tx.verification.deleteMany({ where: { id, identifier: identityKey(org), expiresAt: { gt: new Date() } } });
    if (claimed.count !== 1) throw new Error("PAYMENT_ACCESS_DENIED");
    await tx.verification.create({ data: { id: `customer-session:${digest(session)}`, identifier: identityKey(org), value: row.value, expiresAt: new Date(Date.now() + CUSTOMER_SESSION_SECONDS * 1000) } });
  });
  return session;
}

export async function customerIdentity(token: string | undefined) {
  if (!token || !/^[a-f0-9]{64}$/.test(token)) throw new Error("PAYMENT_ACCESS_DENIED");
  const org = await getPublicOrganizationId();
  if (!org) throw new Error("PAYMENT_ACCESS_DENIED");
  const row = await prisma.verification.findUnique({ where: { id: `customer-session:${digest(token)}` } });
  if (!row || row.identifier !== identityKey(org) || row.expiresAt <= new Date()) throw new Error("PAYMENT_ACCESS_DENIED");
  return { organizationId: org, email: row.value };
}

export async function customerOrders(session: string | undefined) {
  const identity = await customerIdentity(session);
  return prisma.checkoutEnquiry.findMany({ where: { organizationId: identity.organizationId, customerEmail: { equals: identity.email, mode: "insensitive" } }, select: { id: true, designName: true, planKey: true, status: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 100 });
}

export async function openCustomerOrder(session: string | undefined, enquiryId: string) {
  const identity = await customerIdentity(session);
  const capability = createPaymentCapability();
  await prisma.$transaction(async tx => {
    const order = await tx.checkoutEnquiry.findFirst({ where: { id: enquiryId, organizationId: identity.organizationId, customerEmail: { equals: identity.email, mode: "insensitive" } }, include: { paymentIntent: true } });
    if (!order) throw new Error("PAYMENT_ACCESS_DENIED");
    if (order.paymentIntent) {
      if (order.paymentIntent.organizationId !== identity.organizationId) throw new Error("PAYMENT_ACCESS_DENIED");
      await tx.paymentIntent.update({ where: { id: order.paymentIntent.id }, data: { paymentAccessHash: capability.hash, paymentAccessExpiresAt: capability.expiresAt } });
    } else {
      await tx.verification.upsert({ where: { id: `order-access:${order.id}` }, create: { id: `order-access:${order.id}`, identifier: identity.organizationId, value: capability.hash, expiresAt: capability.expiresAt }, update: { value: capability.hash, expiresAt: capability.expiresAt } });
    }
  });
  return customerOrderPath(enquiryId, capability.token);
}

export async function signOutCustomer(token: string | undefined) {
  if (token && /^[a-f0-9]{64}$/.test(token)) await prisma.verification.deleteMany({ where: { id: `customer-session:${digest(token)}` } });
}
