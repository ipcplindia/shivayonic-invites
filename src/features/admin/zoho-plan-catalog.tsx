"use client";

import { useState } from "react";

import { Button } from "@/components/ui";

type Result = { items: Array<{ key: string; itemId: string; rate: number }>; template: { id: string }; businessUnit: { tagId: string; tagOptionId: string } };

/** Available only to the Preview OWNER; the server endpoint remains Preview and Vercel-host restricted. */
export function ZohoPlanCatalogAction() {
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);
  async function configure() {
    setSaving(true); setError(false);
    try {
      const response = await fetch("/api/integrations/zoho/plan-catalog", { method: "POST", headers: { "x-shivayonic-method": "POST", "x-shivayonic-route": "zoho-plan-catalog" } });
      if (!response.ok) throw new Error();
      setResult(await response.json() as Result);
    } catch { setError(true); } finally { setSaving(false); }
  }
  if (result) return <p role="status">Zoho plan items configured: {result.items.map(item => `${item.key} ${item.itemId}`).join(", ")}. Template {result.template.id}; Business Unit {result.businessUnit.tagId}/{result.businessUnit.tagOptionId}.</p>;
  return <div><Button disabled={saving} onClick={configure}>Configure Zoho plan items</Button>{error ? <p role="alert">Zoho plan configuration could not be completed.</p> : null}</div>;
}
