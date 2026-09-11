"use client";
import { useRef, useState } from "react";
type Callback = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
type Options = { key: string; order_id: string; amount: number; currency: string; name: string; description: string; prefill: Record<string, string>; theme: { color: string }; handler: (value: Callback) => void; modal: { ondismiss: () => void } };
declare global { interface Window { Razorpay?: new (options: Options) => { open: () => void; on: (name: string, callback: () => void) => void }; } }
async function loadCheckout() {
  if (window.Razorpay) return;
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement("script"); script.src = "https://checkout.razorpay.com/v1/checkout.js"; script.async = true;
    script.onload = () => resolve(); script.onerror = () => { script.remove(); reject(new Error("Checkout could not load.")); };
    document.head.appendChild(script);
  });
}
export function PaymentCheckout({ paymentIntentId, paymentAccessToken }: { paymentIntentId: string; paymentAccessToken: string }) {
  const [message, setMessage] = useState("Your details are confirmed. Continue to secure payment.");
  const [busy, setBusy] = useState(false); const [paid, setPaid] = useState(false); const opening = useRef(false);
  async function request(path: string, extra = {}) {
    const response = await fetch(`/api/payments/razorpay/${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ paymentIntentId, paymentAccessToken, ...extra }), cache: "no-store" });
    if (!response.ok) throw new Error(response.status === 409 ? "Payment is being reconciled. Please contact the studio." : "Payment is unavailable. Please try again later.");
    return response.json();
  }
  async function checkStatus() {
    try { const value = await request("status"); if (value.status === "PAID") { setPaid(true); setMessage("Payment received."); } else setMessage("Payment verification is pending. Check again shortly."); }
    catch { setMessage("Could not check payment status. Please try again later."); }
  }
  async function open() {
    if (opening.current) return; opening.current = true; setBusy(true); setMessage("Opening checkout…");
    try {
      const config = await request("order"); await loadCheckout();
      if (!window.Razorpay) throw new Error("Checkout could not load.");
      const modal = new window.Razorpay({ key: config.key, order_id: config.razorpayOrderId, amount: config.amountMinor, currency: config.currency, name: "Shivayonic Invites", description: config.description, prefill: config.prefill, theme: { color: "#C99542" }, modal: { ondismiss: () => { setMessage("Checkout closed. You can safely retry."); setBusy(false); opening.current = false; } }, handler: async value => {
        setMessage("Verifying payment…");
        try { await request("verify", value); await checkStatus(); } catch { setMessage("Payment verification is pending. Contact the studio before paying again."); }
        finally { setBusy(false); opening.current = false; }
      } });
      modal.on("payment.failed", () => setMessage("Payment attempt failed. Retry within checkout or close it."));
      modal.open(); setMessage("Awaiting payment…");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Checkout unavailable."); setBusy(false); opening.current = false; }
  }
  return <div><p role="status" aria-live="polite">{message}</p>{!paid && <><button type="button" className="btn btnPrimary" disabled={busy} onClick={open}>Continue to Payment</button><button type="button" className="btn btnGhost" disabled={busy} onClick={checkStatus}>Check payment status</button></>}</div>;
}
