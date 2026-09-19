"use client";

import { useState } from "react";
import { Button } from "@/components/ui";

export function OrderApproval({ enquiryId }: { enquiryId: string }) {
  const [state, setState] = useState<"idle" | "saving" | "done" | "error">("idle");
  async function approve() {
    setState("saving");
    const response = await fetch(`/api/payment-enquiries/${enquiryId}/approve`, {
      method: "POST", headers: { "Content-Type": "application/json", "x-shivayonic-method": "POST", "x-shivayonic-route": "payment-approval" }, body: "{}",
    });
    setState(response.ok ? "done" : "error");
    if (response.ok) window.location.reload();
  }
  if (state === "done") return <p role="status">Payment approved.</p>;
  return <div><Button variant="primary" disabled={state === "saving"} onClick={approve}>Approve payment</Button>{state === "error" ? <p role="alert">Approval could not be completed.</p> : null}</div>;
}
