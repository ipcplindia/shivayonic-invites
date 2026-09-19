"use client";

import { useState } from "react";
import { Button, Input } from "@/components/ui";

export function OrderApproval({ enquiryId }: { enquiryId: string }) {
  const [state, setState] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [amountRupees, setAmountRupees] = useState("");
  async function approve() {
    const match = amountRupees.trim().match(/^(\d+)(?:\.(\d{1,2}))?$/);
    if (!match || BigInt(match[1]) <= 0n) { setState("error"); return; }
    const paise = BigInt(match[1]) * 100n + BigInt((match[2] ?? "").padEnd(2, "0") || "0");
    setState("saving");
    const response = await fetch(`/api/payment-enquiries/${enquiryId}/approve`, {
      method: "POST", headers: { "Content-Type": "application/json", "x-shivayonic-method": "POST", "x-shivayonic-route": "payment-approval" }, body: JSON.stringify({ amountMinor: paise.toString() }),
    });
    setState(response.ok ? "done" : "error");
    if (response.ok) window.location.reload();
  }
  if (state === "done") return <p role="status">Payment approved.</p>;
  return <div><Input label="Approved amount (₹)" value={amountRupees} onChange={(event) => setAmountRupees(event.target.value)} inputMode="decimal" placeholder="200" hint="OWNER-approved amount; ₹200 is available for the controlled smoke test." /><Button variant="ghost" onClick={() => setAmountRupees("200")} disabled={state === "saving"}>Use ₹200 smoke amount</Button> <Button variant="primary" disabled={state === "saving" || !amountRupees.trim()} onClick={approve}>Approve payment</Button>{state === "error" ? <p role="alert">Enter a valid positive amount or approval could not be completed.</p> : null}</div>;
}
