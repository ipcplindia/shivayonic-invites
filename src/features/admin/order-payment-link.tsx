"use client";
import { useState } from "react";
import { Button } from "@/components/ui";
export function OrderPaymentLink({ enquiryId }: { enquiryId: string }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [testUrl, setTestUrl] = useState<string | null>(null);
  async function resend() {
    setBusy(true); setTestUrl(null);
    try {
      const response = await fetch(`/api/payment-enquiries/${enquiryId}/link`, { method: "POST" });
      if (!response.ok) throw new Error();
      const result = await response.json();
      setMessage(result.delivered ? "Payment link emailed. Previous link revoked." : "Link renewed, but email was not delivered. Check mail configuration before resending.");
      if (result.testUrl) setTestUrl(result.testUrl);
    } catch { setMessage("Link could not be renewed. Refresh the order and try again."); }
    finally { setBusy(false); }
  }
  return <div><Button disabled={busy} onClick={resend}>Resend payment link</Button><p role="status">{message}</p>{testUrl ? <><a href={testUrl} referrerPolicy="no-referrer">TEST MODE — Open payment link</a><Button onClick={() => { void navigator.clipboard.writeText(testUrl).then(() => setMessage("Test link copied."), () => setMessage("Use Open payment link instead.")); }}>Copy test payment link</Button></> : null}</div>;
}
