"use client";

import { useRef, useState, type DragEvent } from "react";

import { Icon } from "@/components/icon";
import { Dialog } from "@/components/overlay";
import { Button, StatusBadge } from "@/components/ui";
import { formatBytes } from "@/features/media/media";
import styles from "@/features/media/media.module.css";
import { mediaAcceptAttribute, mediaSizeGuidance } from "@/features/media/upload";
import type { UploadItem, UploadPhase } from "@/features/media/upload-queue";
import { useUploadQueue } from "@/features/media/upload-queue";

/**
 * Upload dialog.
 *
 * Files are picked with a real `<input type="file">`; the drop area is an extra,
 * never the only way in. Each file has its own lifecycle, so one rejection does
 * not disturb the others.
 *
 * Feedback stays inside this dialog rather than going to the toast region: a
 * native `<dialog>` sits in the browser's top layer, and no z-index can lift a
 * toast above it. The library toasts a single summary once the dialog closes.
 */
export function UploadDialog({
  open,
  onClose,
  onUploaded,
  onSettled,
}: {
  open: boolean;
  onClose: () => void;
  onUploaded: (readyCount: number) => void;
  onSettled: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const { items, enqueue, cancel, retry, reset, active } = useUploadQueue({ onSettled });

  const readyCount = items.filter((item) => item.phase === "ready").length;
  const failedCount = items.filter((item) => item.phase === "failed").length;

  function addFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    enqueue(Array.from(files));
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    addFiles(event.dataTransfer.files);
  }

  function close() {
    if (readyCount > 0) onUploaded(readyCount);
    reset();
    onClose();
  }

  return (
    <Dialog
      open={open}
      onClose={close}
      title="Upload master"
      description="Masters are stored privately. Nothing is published by uploading."
      dismissible={!active}
      footer={
        <>
          <p className={styles.uploadSummary} role="status" aria-live="polite">
            {uploadSummary(items, active)}
          </p>
          <Button variant={active ? "ghost" : "primary"} onClick={close} disabled={active}>
            {active ? "Uploading…" : readyCount > 0 || failedCount > 0 ? "Done" : "Close"}
          </Button>
        </>
      }
    >
      <div
        className={dragging ? `${styles.dropZone} ${styles.dropZoneActive}` : styles.dropZone}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <Icon name="upload" size={22} className={styles.dropIcon} />
        <p className={styles.dropTitle}>Drop masters here, or choose them</p>
        <Button icon="plus" onClick={() => inputRef.current?.click()}>
          Choose files
        </Button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={mediaAcceptAttribute}
          className={styles.fileInput}
          onChange={(event) => {
            addFiles(event.target.files);
            // Allow the same file to be picked again after a failure.
            event.target.value = "";
          }}
        />
        <ul className={styles.formatList}>
          {mediaSizeGuidance.map((guidance) => (
            <li key={guidance.label}>
              <strong>{guidance.label}</strong> {guidance.detail}
            </li>
          ))}
        </ul>
      </div>

      {items.length > 0 ? (
        <ul className={styles.uploadList}>
          {items.map((item) => (
            <UploadRow key={item.id} item={item} onCancel={cancel} onRetry={retry} />
          ))}
        </ul>
      ) : null}
    </Dialog>
  );
}

function UploadRow({
  item,
  onCancel,
  onRetry,
}: {
  item: UploadItem;
  onCancel: (id: string) => void;
  onRetry: (id: string) => void;
}) {
  const presentation = phasePresentation[item.phase];
  const inFlight = item.phase === "uploading";
  const percent = item.size > 0 ? Math.round((item.loaded / item.size) * 100) : 0;

  return (
    <li className={styles.uploadRow}>
      <div className={styles.uploadRowTop}>
        <span className={styles.uploadName}>{item.name}</span>
        <StatusBadge
          label={presentation.label}
          tone={presentation.tone}
          shape={presentation.shape}
        />
      </div>

      {inFlight ? (
        <>
          <progress
            className={styles.progress}
            value={item.loaded}
            max={item.size}
            aria-label={`Uploading ${item.name}`}
          />
          <p className={styles.uploadMeta}>
            {formatBytes(String(item.loaded))} of {formatBytes(String(item.size))} · {percent}%
          </p>
        </>
      ) : (
        <p className={styles.uploadMeta}>{formatBytes(String(item.size))}</p>
      )}

      {item.phase === "preparing" || item.phase === "validating" ? (
        <progress className={styles.progress} aria-label={`${presentation.label} ${item.name}`} />
      ) : null}

      {item.error ? <p className={styles.uploadError}>{item.error}</p> : null}

      {item.phase === "cancelled" && item.mediaId ? (
        <p className={styles.uploadMeta}>
          The part-uploaded record stays in the library as <strong>Failed</strong> until an
          owner removes it.
        </p>
      ) : null}

      <div className={styles.uploadRowActions}>
        {item.phase === "queued" || item.phase === "preparing" || item.phase === "uploading" ? (
          <Button size="sm" variant="ghost" icon="close" onClick={() => onCancel(item.id)}>
            Cancel
          </Button>
        ) : null}
        {item.phase === "failed" && item.retryable ? (
          <Button size="sm" icon="refresh" onClick={() => onRetry(item.id)}>
            Try again
          </Button>
        ) : null}
      </div>
    </li>
  );
}

const phasePresentation: Record<
  UploadPhase,
  { label: string; tone: "neutral" | "signal" | "success" | "warning" | "danger"; shape: "solid" | "hollow" | "square" }
> = {
  queued: { label: "Queued", tone: "neutral", shape: "hollow" },
  preparing: { label: "Preparing", tone: "signal", shape: "hollow" },
  uploading: { label: "Uploading", tone: "signal", shape: "solid" },
  validating: { label: "Validating", tone: "warning", shape: "hollow" },
  ready: { label: "Ready", tone: "success", shape: "solid" },
  failed: { label: "Failed", tone: "danger", shape: "square" },
  cancelled: { label: "Cancelled", tone: "neutral", shape: "square" },
};

/**
 * One sentence for assistive technology, updated on phase changes rather than
 * on every percentage tick.
 */
function uploadSummary(items: UploadItem[], active: boolean) {
  if (items.length === 0) return "No files chosen yet.";
  const ready = items.filter((item) => item.phase === "ready").length;
  const failed = items.filter((item) => item.phase === "failed").length;
  const cancelled = items.filter((item) => item.phase === "cancelled").length;

  if (active) {
    const done = ready + failed + cancelled;
    return `Uploading — ${done} of ${items.length} settled.`;
  }

  const parts = [];
  if (ready > 0) parts.push(`${ready} uploaded`);
  if (failed > 0) parts.push(`${failed} failed`);
  if (cancelled > 0) parts.push(`${cancelled} cancelled`);
  return parts.length > 0 ? `${parts.join(", ")}.` : "Ready when you are.";
}
