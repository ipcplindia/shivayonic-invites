"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

import { Badge, Button, Card, CardBody, CardHeader, EmptyState, ErrorState, Input, Select, StatusBadge } from "@/components/ui";
import type { MediaAssetSummary } from "@/shared/media";

type Item = { id: string; title: string; contentType: string; status: string; masterMediaId: string | null; destinations: Array<{ id: string; platform: string; status: string }> };
const placementOptions = ["HOMEPAGE_FEATURED", "OUR_WORK_GRID", "FILMS_FEATURED", "MUSIC_SHOWCASE"].map((value) => ({ value, label: value.replaceAll("_", " ") }));

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, headers: { accept: "application/json", "content-type": "application/json", ...init?.headers } });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.error?.code || "REQUEST_FAILED");
  return body as T;
}

export function Publisher() {
  const [media, setMedia] = useState<MediaAssetSummary[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [selected, setSelected] = useState("");
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ title: "", mediaId: "", contentType: "VIDEO", placement: "OUR_WORK_GRID", description: "" });

  const load = useCallback(async () => {
    setState("loading");
    try {
      const [mediaResponse, contentResponse] = await Promise.all([
        request<{ media: MediaAssetSummary[] }>("/api/media?status=READY&limit=100"),
        request<{ items: Item[] }>("/api/content-items"),
      ]);
      setMedia(mediaResponse.media); setItems(contentResponse.items); setState("ready");
    } catch { setState("error"); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function create(event: FormEvent) {
    event.preventDefault();
    if (!form.title || !form.mediaId) { setMessage("Title and READY master are required."); return; }
    setPending(true); setMessage("");
    try {
      const response = await request<{ item: Item }>("/api/content-items", { method: "POST", body: JSON.stringify({ title: form.title, contentType: form.contentType, masterMediaId: form.mediaId }) });
      setSelected(response.item.id); setMessage("Draft created. Save a Website destination to publish it."); await load();
    } catch { setMessage("Draft could not be created."); }
    finally { setPending(false); }
  }

  async function saveWebsite() {
    if (!selected) return;
    setPending(true); setMessage("");
    try {
      await request(`/api/content-items/${selected}/destinations/WEBSITE`, { method: "PUT", body: JSON.stringify({ platform: "WEBSITE", enabled: true, metadata: { title: form.title, description: form.description || undefined, placement: form.placement } }) });
      setMessage("Website destination ready. Instagram and YouTube remain disconnected."); await load();
    } catch { setMessage("Website destination could not be saved."); }
    finally { setPending(false); }
  }

  async function publishWebsite() {
    if (!selected) return;
    setPending(true); setMessage("");
    try {
      await request(`/api/content-items/${selected}/publish/WEBSITE`, { method: "POST", body: JSON.stringify({ idempotencyKey: globalThis.crypto.randomUUID() }) });
      setMessage("Published to the website. No social provider was called."); await load();
    } catch (error) { setMessage(error instanceof Error && error.message === "INTEGRATION_REQUIRED" ? "This provider is not connected." : "Website publish could not be completed."); }
    finally { setPending(false); }
  }

  if (state === "loading") return <Card><CardBody>Loading publishing workspace…</CardBody></Card>;
  if (state === "error") return <Card><ErrorState title="Publisher unavailable" body="Nothing was changed." action={<Button onClick={() => void load()}>Retry</Button>} /></Card>;
  const current = items.find((item) => item.id === selected);

  return <section aria-label="Unified publisher">
    <Card>
      <CardHeader title="New content item" description="One master references private B2 media. Only Website is connected." />
      <CardBody><form onSubmit={create}>
        <Input label="Title" value={form.title} maxLength={500} onChange={(event) => setForm({ ...form, title: event.target.value })} />
        <Select label="Master asset" value={form.mediaId} onChange={(event) => setForm({ ...form, mediaId: event.target.value })} options={[{ value: "", label: "Choose READY media" }, ...media.map((asset) => ({ value: asset.id, label: asset.displayTitle || asset.originalFilename }))]} />
        <Select label="Content type" value={form.contentType} onChange={(event) => setForm({ ...form, contentType: event.target.value })} options={["VIDEO", "IMAGE", "CAROUSEL", "ARTICLE", "CAMPAIGN_ASSET"].map((value) => ({ value, label: value.replaceAll("_", " ") }))} />
        <Button type="submit" variant="primary" disabled={pending}>Save draft</Button>
      </form></CardBody>
    </Card>

    <Card>
      <CardHeader title="Destinations" description="Each destination retains its own metadata and result." />
      <CardBody>
        <Select label="Content item" value={selected} onChange={(event) => setSelected(event.target.value)} options={[{ value: "", label: "Choose a draft" }, ...items.map((item) => ({ value: item.id, label: item.title }))]} />
        {current ? <>
          <section><h3>Website <StatusBadge label="Available" tone="success" /></h3>
            <Select label="Placement" value={form.placement} onChange={(event) => setForm({ ...form, placement: event.target.value })} options={placementOptions} />
            <Input label="Website description" value={form.description} maxLength={4000} onChange={(event) => setForm({ ...form, description: event.target.value })} />
            <Button onClick={() => void saveWebsite()} disabled={pending}>Save Website destination</Button>
            <Button variant="primary" onClick={() => void publishWebsite()} disabled={pending || !current.destinations.some((destination) => destination.platform === "WEBSITE")}>Publish now</Button>
          </section>
          <section><h3>Instagram <Badge>Not connected</Badge></h3><p>Reel, post, story, caption, cover and AI disclosure are reserved until Meta OAuth is configured. Publishing is blocked.</p></section>
          <section><h3>YouTube <Badge>Not connected</Badge></h3><p>Video/Short, privacy, tags, made-for-kids and disclosure are reserved until Google OAuth is configured. Publishing is blocked.</p></section>
        </> : <EmptyState title="Choose a content item" body="Create a draft from READY media, then choose its Website destination." />}
        {message ? <p role="status">{message}</p> : null}
      </CardBody>
    </Card>
  </section>;
}
