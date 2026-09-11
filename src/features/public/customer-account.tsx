"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
type Order = { id: string; designName: string | null; planKey: string; status: string };
export function CustomerAccount() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [verify, setVerify] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function request(input: Record<string, string>) {
    const response = await fetch("/api/public/customer-account", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input), cache: "no-store" });
    if (!response.ok) throw new Error();
    return response.json();
  }
  useEffect(() => {
    setVerify(new URLSearchParams(window.location.hash.slice(1)).has("verify"));
    void request({ action: "orders" }).then(data => setOrders(data.orders)).catch(() => {});
  }, []);
  async function act(input: Record<string, string>) {
    setBusy(true);
    try {
      const result = await request(input);
      if (input.action === "verify") { window.history.replaceState(null, "", "/account"); window.location.reload(); }
      else if (input.action === "request") setMessage("Check your email for a private sign-in link. If it does not arrive, contact the studio.");
      else if (input.action === "logout") window.location.reload();
      else if (typeof result.orderUrl === "string" && /^\/order\/[a-zA-Z0-9_-]+#access=[a-f0-9]{64}$/.test(result.orderUrl)) window.location.assign(result.orderUrl);
    } catch { setMessage("Access could not be completed. Request a fresh sign-in link and try again."); }
    finally { setBusy(false); }
  }
  return <>
    {verify ? <button disabled={busy} onClick={() => void act({ action: "verify", token: new URLSearchParams(window.location.hash.slice(1)).get("verify") ?? "" })}>Verify email and sign in</button> : null}
    {orders ? <><button disabled={busy} onClick={() => void act({ action: "logout" })}>Sign out</button>{orders.length ? orders.map(order => <article key={order.id}><h2>{order.designName || "Custom commission"}</h2><p>{order.planKey} · {order.status}</p><button disabled={busy} onClick={() => void act({ action: "open", enquiryId: order.id })}>View order</button></article>) : <p>No orders yet for your verified email.</p>}</> : <form onSubmit={event => { event.preventDefault(); const data = new FormData(event.currentTarget); void act({ action: "request", email: String(data.get("email")) }); }}><label>Email<input type="email" name="email" autoComplete="email" required maxLength={160} /></label><button disabled={busy}>Email sign-in link</button></form>}
    <p role="status">{message}</p><p><Link href="/">Back to website</Link></p>
  </>;
}
