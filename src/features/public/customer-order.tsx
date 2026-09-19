"use client";
import { useEffect, useState } from "react";
import { PaymentCheckout } from "@/features/public/payment-checkout";

export type CustomerOrderData = { reference: string; design: string | null; plan: string; eventDate: string | null; amount: string; status: string; paymentStatus: string; paymentIntentId: string | null };
export function CustomerOrderSummary({ order, access }: { order: CustomerOrderData; access: string }) {
  return <>
    <dl>{Object.entries({ Reference: order.reference, Design: order.design, Plan: order.plan, Amount: order.amount, "Event date": order.eventDate, "Order status": order.status, "Payment status": order.paymentStatus }).map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{value || "—"}</dd></div>)}</dl>
    {order.paymentStatus === "PENDING_APPROVAL" ? <p>Your commission is awaiting studio approval.</p> : null}
    {order.paymentStatus === "PAID" ? <p>Payment received</p> : null}
    {order.paymentStatus === "READY" ? <p>Your payment is ready.</p> : null}
    {order.paymentStatus === "PROCESSING" ? <p>Payment pending. Check its status before trying again.</p> : null}
    {order.paymentIntentId && ["READY", "PROCESSING"].includes(order.paymentStatus) ? <PaymentCheckout paymentIntentId={order.paymentIntentId} paymentAccessToken={access} /> : null}
  </>;
}
export function CustomerOrder({ enquiryId }: { enquiryId: string }) {
  const [order, setOrder] = useState<CustomerOrderData | null>(null);
  const [access, setAccess] = useState("");
  const [message, setMessage] = useState("Loading your order…");
  useEffect(() => {
    const controller = new AbortController();
    const token = new URLSearchParams(window.location.hash.slice(1)).get("access") ?? "";
    setAccess(token);
    void fetch("/api/public/customer-order", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enquiryId, access: token }), cache: "no-store", signal: controller.signal })
      .then(async response => { if (!response.ok) throw new Error(); return response.json(); })
      .then(value => setOrder(value))
      .catch(() => { if (!controller.signal.aborted) setMessage("This private link is invalid or expired. Ask the studio for a new link, or sign in to your account."); });
    return () => controller.abort();
  }, [enquiryId]);
  return <>{order ? <CustomerOrderSummary order={order} access={access} /> : <p role="status">{message}</p>}<p><a href="/account">My orders</a></p><button type="button" onClick={() => window.location.reload()}>Refresh status</button><p>Bookmark this private link or use the link in your email to return from another device.</p></>;
}
