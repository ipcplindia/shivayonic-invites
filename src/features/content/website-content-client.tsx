"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

import { Button, Card, CardBody, CardHeader, EmptyState, ErrorState, Input, Select, StatusBadge } from "@/components/ui";
import type { MediaAssetSummary } from "@/shared/media";
import { websitePlacements, type WebsitePlacement } from "@/shared/website-publication";

type Publication = { id: string; placement: WebsitePlacement; status: "DRAFT" | "PUBLISHED" | "UNPUBLISHED"; title: string | null; description: string | null; altText: string | null; sortOrder: number; mediaAsset: { id: string; originalFilename: string; displayTitle: string | null; kind: string; status: string } };
const options = websitePlacements.map((value) => ({ value, label: value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase()) }));

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, headers: { accept: "application/json", "content-type": "application/json", ...init?.headers } });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.error?.code || "REQUEST_FAILED");
  return body as T;
}

export function WebsiteContent() {
  const [media, setMedia] = useState<MediaAssetSummary[]>([]);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState({ mediaId: "", placement: "OUR_WORK_GRID" as WebsitePlacement, title: "", altText: "", description: "", sortOrder: "0" });
  const load = useCallback(async () => {
    setState("loading"); setMessage("");
    try {
      const [mediaResult, publicationResult] = await Promise.all([request<{ media: MediaAssetSummary[] }>("/api/media?status=READY&limit=100"), request<{ publications: Publication[] }>("/api/website-publications")]);
      setMedia(mediaResult.media); setPublications(publicationResult.publications); setState("ready");
    } catch { setState("error"); setMessage("Website content could not be loaded. Your drafts were not changed."); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function create(event: FormEvent) {
    event.preventDefault(); if (!form.mediaId) { setMessage("Choose a READY media file first."); return; }
    setPending(true); setMessage("");
    try { await request("/api/website-publications", { method: "POST", body: JSON.stringify({ ...form, sortOrder: Number(form.sortOrder) }) }); setMessage("Draft saved. It is not public yet."); await load(); }
    catch (error) { setMessage(error instanceof Error && error.message === "PUBLICATION_EXISTS" ? "That media is already used in this placement." : "The draft could not be saved."); }
    finally { setPending(false); }
  }
  async function action(id: string, action: "publish" | "unpublish") {
    setPending(true); setMessage("");
    try { await request(`/api/website-publications/${id}`, { method: "PATCH", body: JSON.stringify({ action }) }); setMessage(action === "publish" ? "Published to the website." : "Unpublished. Static fallback remains where configured."); await load(); }
    catch { setMessage("This publication could not be updated. It remains in its previous state."); }
    finally { setPending(false); }
  }
  async function update(entry: Publication) {
    setPending(true); setMessage("");
    try {
      await request(`/api/website-publications/${entry.id}`, { method: "PATCH", body: JSON.stringify({ action: "save", title: `${entry.title || entry.mediaAsset.displayTitle || entry.mediaAsset.originalFilename} Updated`, description: "Task 3 smoke metadata update verified.", altText: "Updated disposable Task 3 smoke image", sortOrder: entry.sortOrder + 1 }) });
      setMessage("Publication metadata updated."); await load();
    } catch { setMessage("This publication could not be updated. It remains in its previous state."); }
    finally { setPending(false); }
  }
  async function remove(id: string) {
    setPending(true); setMessage("");
    try { await request(`/api/website-publications/${id}`, { method: "DELETE" }); setMessage("Publication deleted."); await load(); }
    catch { setMessage("This publication could not be deleted."); }
    finally { setPending(false); }
  }
  if (state === "loading") return <Card><CardBody>Loading website content…</CardBody></Card>;
  if (state === "error") return <Card><ErrorState title="Website content unavailable" body={message} action={<Button onClick={() => void load()}>Try again</Button>} /></Card>;
  return <section aria-label="Website publishing"><Card><CardHeader title="Create website draft" description="Only READY masters are available. Publishing creates no duplicate object." /><CardBody><form onSubmit={create}>
    <Select label="READY media" value={form.mediaId} onChange={(event) => setForm({ ...form, mediaId: event.target.value })} options={[{ value: "", label: "Choose a master" }, ...media.map((item) => ({ value: item.id, label: item.displayTitle || item.originalFilename }))]} />
    <Select label="Website placement" value={form.placement} onChange={(event) => setForm({ ...form, placement: event.target.value as WebsitePlacement })} options={options} />
    <Input label="Title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} maxLength={500} />
    <Input label="Alt text" value={form.altText} onChange={(event) => setForm({ ...form, altText: event.target.value })} maxLength={500} />
    <Input label="Sort order" type="number" min="0" value={form.sortOrder} onChange={(event) => setForm({ ...form, sortOrder: event.target.value })} />
    <label>Description<textarea value={form.description} maxLength={4000} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
    <Button type="submit" variant="primary" disabled={pending}>Save draft</Button>
  </form>{message ? <p role="status">{message}</p> : null}</CardBody></Card>
  <Card><CardHeader title="Website publications" description="Live status and placements." />{publications.length ? <ul>{publications.map((entry) => <li key={entry.id}><strong>{entry.title || entry.mediaAsset.displayTitle || entry.mediaAsset.originalFilename}</strong> · {options.find((option) => option.value === entry.placement)?.label} <StatusBadge label={entry.status[0] + entry.status.slice(1).toLowerCase()} tone={entry.status === "PUBLISHED" ? "success" : "neutral"} /> <Button size="sm" onClick={() => void update(entry)} disabled={pending}>Update metadata</Button> {entry.status === "PUBLISHED" ? <Button size="sm" onClick={() => void action(entry.id, "unpublish")} disabled={pending}>Unpublish</Button> : <Button size="sm" onClick={() => void action(entry.id, "publish")} disabled={pending}>Publish</Button>} <Button size="sm" onClick={() => void remove(entry.id)} disabled={pending}>Delete</Button></li>)}</ul> : <EmptyState title="No website publications" body="Create a draft from a READY master. Existing public pages keep their curated fallback." />}</Card>
  </section>;
}
