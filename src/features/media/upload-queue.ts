"use client";

import { useCallback, useRef, useState } from "react";

import { MediaApiError, completeMedia, createMedia } from "@/features/media/media-api";
import {
  UploadAbortedError,
  UploadTransportError,
  prevalidateFile,
  resolveUploadMimeType,
  uploadFileToTarget,
} from "@/features/media/upload";
import type { MediaAssetSummary } from "@/shared/media";

/** Lifecycle as the operator sees it, named after the server's own states. */
export type UploadPhase =
  | "queued"
  | "preparing"
  | "uploading"
  | "validating"
  | "ready"
  | "failed"
  | "cancelled";

export type UploadItem = {
  id: string;
  file: File;
  name: string;
  size: number;
  phase: UploadPhase;
  loaded: number;
  /** Set once the server has created the record, so a cancelled upload can be named. */
  mediaId?: string;
  media?: MediaAssetSummary;
  error?: string;
  /** Retrying a rejected file only makes sense when the file itself was fine. */
  retryable?: boolean;
};

/** Two at a time: enough to keep the pipe busy, far short of saturating it. */
const MAX_ACTIVE_UPLOADS = 2;

let sequence = 0;

export function useUploadQueue({ onSettled }: { onSettled?: () => void } = {}) {
  const [items, setItems] = useState<UploadItem[]>([]);
  const controllers = useRef(new Map<string, AbortController>());
  const running = useRef(new Set<string>());
  const queue = useRef<string[]>([]);
  const itemsRef = useRef<UploadItem[]>([]);
  itemsRef.current = items;
  // The worker starts the next item when it finishes; the scheduler is defined
  // below it, so it is reached through a ref rather than a forward reference.
  const pumpRef = useRef<() => void>(() => {});

  const patch = useCallback((id: string, changes: Partial<UploadItem>) => {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, ...changes } : item)),
    );
  }, []);

  const runItem = useCallback(
    async (id: string) => {
      const item = itemsRef.current.find((candidate) => candidate.id === id);
      if (!item) return;

      const controller = new AbortController();
      controllers.current.set(id, controller);
      patch(id, { phase: "preparing", loaded: 0, error: undefined });

      try {
        // 1. The server creates the record and decides where the bytes go.
        const created = await createMedia(
          {
            originalFilename: item.file.name,
            mimeType: resolveUploadMimeType(item.file),
            sizeBytes: item.file.size,
          },
          controller.signal,
        );
        patch(id, { mediaId: created.media.id, phase: "uploading" });

        // 2. The bytes travel to the target exactly as it was handed back.
        await uploadFileToTarget({
          target: created.upload,
          file: item.file,
          signal: controller.signal,
          onProgress: (loaded) => patch(id, { loaded }),
        });

        // 3. The server checks the stored object. READY is its answer, not ours.
        patch(id, { phase: "validating", loaded: item.file.size });
        const media = await completeMedia(created.media.id, controller.signal);
        patch(id, { phase: media.status === "READY" ? "ready" : "failed", media });
      } catch (error) {
        if (error instanceof UploadAbortedError || controller.signal.aborted) {
          patch(id, { phase: "cancelled" });
        } else if (error instanceof MediaApiError) {
          patch(id, { phase: "failed", error: error.message, retryable: error.retryable });
        } else if (error instanceof UploadTransportError) {
          patch(id, {
            phase: "failed",
            error:
              error.status === 0
                ? "The upload connection failed before the file finished."
                : "The server rejected the upload. The record was marked failed.",
            // The route marks a half-written asset FAILED, so the same file needs a fresh record.
            retryable: true,
          });
        } else {
          patch(id, { phase: "failed", error: "The upload could not be completed." });
        }
      } finally {
        controllers.current.delete(id);
        running.current.delete(id);
        onSettled?.();
        pumpRef.current();
      }
    },
    [onSettled, patch],
  );

  const pump = useCallback(() => {
    while (running.current.size < MAX_ACTIVE_UPLOADS && queue.current.length > 0) {
      const next = queue.current.shift();
      if (!next) return;
      running.current.add(next);
      void runItem(next);
    }
  }, [runItem]);
  pumpRef.current = pump;

  const enqueue = useCallback(
    (files: File[]) => {
      const accepted: UploadItem[] = [];
      const rejected: UploadItem[] = [];

      for (const file of files) {
        sequence += 1;
        const id = `upload-${sequence}`;
        const failure = prevalidateFile(file);
        const base = { id, file, name: file.name, size: file.size, loaded: 0 };
        if (failure) {
          // Rejected before any request: nothing exists server-side to clean up.
          rejected.push({ ...base, phase: "failed", error: failure.message, retryable: false });
        } else {
          accepted.push({ ...base, phase: "queued" });
        }
      }

      setItems((current) => [...current, ...rejected, ...accepted]);
      queue.current.push(...accepted.map((item) => item.id));
      // Let the state above land before the workers read itemsRef.
      setTimeout(pump, 0);
    },
    [pump],
  );

  const cancel = useCallback((id: string) => {
    controllers.current.get(id)?.abort();
    queue.current = queue.current.filter((queued) => queued !== id);
    setItems((current) =>
      current.map((item) =>
        item.id === id && (item.phase === "queued" || item.phase === "preparing" || item.phase === "uploading")
          ? { ...item, phase: "cancelled" }
          : item,
      ),
    );
  }, []);

  const retry = useCallback(
    (id: string) => {
      patch(id, { phase: "queued", loaded: 0, error: undefined, mediaId: undefined });
      queue.current.push(id);
      setTimeout(pump, 0);
    },
    [patch, pump],
  );

  const reset = useCallback(() => {
    for (const controller of controllers.current.values()) controller.abort();
    controllers.current.clear();
    running.current.clear();
    queue.current = [];
    setItems([]);
  }, []);

  const active = items.some((item) =>
    ["queued", "preparing", "uploading", "validating"].includes(item.phase),
  );

  return { items, enqueue, cancel, retry, reset, active };
}
