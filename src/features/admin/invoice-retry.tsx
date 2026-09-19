"use client";

import { useState } from "react";
import { Button } from "@/components/ui";

export function InvoiceRetry({ paymentIntentId }: { paymentIntentId: string }) {
  const [state, setState] = useState<"idle" | "saving" | "error">("idle");
  async function retry() {
    setState("saving");
    try {
      const response = await fetch(`/api/payments/${paymentIntentId}/invoice/retry`, { method: "POST", headers: { "x-shivayonic-method": "POST", "x-shivayonic-route": "invoice-retry" } });
      if (!response.ok) throw new Error();
      window.location.reload();
    } catch { setState("error"); }
  }
  return <div><Button variant="secondary" disabled={state === "saving"} onClick={retry}>Retry invoice</Button>{state === "error" ? <p role="alert">Invoice retry could not be started.</p> : null}</div>;
}
