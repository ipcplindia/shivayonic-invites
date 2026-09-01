"use client";

import { useState } from "react";

import { Inspector } from "@/components/overlay";
import { Button, LinkButton, StatusBadge } from "@/components/ui";
import styles from "@/features/media/media.module.css";
import {
  formatBytes,
  formatDate,
  formatDuration,
  isDownloadable,
  presentStatus,
  type MediaAsset,
} from "@/features/media/media";

/**
 * Read-only inspector for one master.
 *
 * Everything shown comes from the fields `GET /api/media` already returns. The
 * storage key, the bucket, the local path and every other storage internal stay
 * server-side — they are not part of the payload and are never reconstructed.
 */
export function MediaInspector({
  media,
  onClose,
}: {
  media: MediaAsset | null;
  onClose: () => void;
}) {
  const open = media !== null;
  const status = media ? presentStatus(media.status) : null;
  const downloadable = media ? isDownloadable(media) : false;
  const href = media ? `/api/media/${media.id}/download` : "#";

  return (
    <Inspector
      open={open}
      onClose={onClose}
      title={media?.originalFilename ?? "Master"}
      description={media ? `${titleCase(media.kind)} master` : undefined}
      footer={
        media ? (
          downloadable ? (
            <LinkButton
              variant="primary"
              icon="upload"
              href={href}
              download={media.originalFilename}
            >
              Download master
            </LinkButton>
          ) : (
            <p className={styles.inspectorNote}>
              Downloading opens once this master reaches <strong>Ready</strong>.
            </p>
          )
        ) : null
      }
    >
      {media && status ? (
        <>
          <MediaPreview media={media} />

          <div className={styles.fieldRow}>
            <span className={styles.fieldLabel}>Status</span>
            <StatusBadge label={status.label} tone={status.tone} shape={status.shape} />
          </div>
          <Field label="Format" value={media.mimeType} mono />
          <Field label="Size" value={formatBytes(media.sizeBytes)} mono />
          {media.width && media.height ? (
            <Field label="Dimensions" value={`${media.width}×${media.height}`} mono />
          ) : null}
          {formatDuration(media.durationMs) ? (
            <Field label="Duration" value={formatDuration(media.durationMs) as string} mono />
          ) : null}
          <Field label="Added" value={formatDate(media.createdAt)} />
          <Field label="Last updated" value={formatDate(media.updatedAt)} />
          {media.archivedAt ? <Field label="Archived" value={formatDate(media.archivedAt)} /> : null}
          <Field label="Project" value={projectLabel(media)} />
          {"creator" in media && media.creator ? (
            <Field label="Uploaded by" value={media.creator.name ?? "Unknown"} />
          ) : null}
        </>
      ) : null}
    </Inspector>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className={styles.fieldRow}>
      <span className={styles.fieldLabel}>{label}</span>
      <span className={mono ? styles.fieldValueMono : styles.fieldValue}>{value}</span>
    </div>
  );
}

/**
 * Preview is served by the same authorised download route the operator would
 * use directly — cookies travel with it, the server re-checks MEDIA_READ, and
 * no URL is stored anywhere. Nothing plays until the operator asks it to.
 */
function MediaPreview({ media }: { media: MediaAsset }) {
  const [state, setState] = useState<"idle" | "loading" | "ready" | "failed">("idle");

  if (!isDownloadable(media)) {
    return (
      <p className={styles.previewPlaceholder}>
        A preview appears once this master finishes processing.
      </p>
    );
  }

  if (state === "idle") {
    return (
      <div className={styles.previewPlaceholder}>
        <Button icon="video" onClick={() => setState("loading")}>
          Load preview
        </Button>
      </div>
    );
  }

  if (state === "failed") {
    return (
      <div className={styles.previewPlaceholder}>
        <p>This master could not be loaded for preview. Downloading may still work.</p>
        <Button icon="refresh" size="sm" onClick={() => setState("loading")}>
          Try again
        </Button>
      </div>
    );
  }

  // The authorised route, asked for inline so it streams with Range support
  // instead of being offered as an attachment. No storage URL is constructed,
  // and nothing about it is persisted.
  const src = `/api/media/${media.id}/download?disposition=inline`;
  const onLoad = () => setState("ready");
  const onError = () => setState("failed");

  return (
    <div className={styles.preview} aria-busy={state === "loading"}>
      {state === "loading" ? <p className={styles.previewLoading}>Loading preview…</p> : null}
      {media.kind === "IMAGE" ? (
        // eslint-disable-next-line @next/next/no-img-element -- authorised API route, not an optimisable asset
        <img
          src={src}
          alt={`Preview of ${media.originalFilename}`}
          className={styles.previewMedia}
          onLoad={onLoad}
          onError={onError}
        />
      ) : null}
      {media.kind === "VIDEO" ? (
        <video
          src={src}
          controls
          preload="metadata"
          className={styles.previewMedia}
          onLoadedMetadata={onLoad}
          onError={onError}
        />
      ) : null}
      {media.kind === "AUDIO" ? (
        <audio
          src={src}
          controls
          preload="metadata"
          className={styles.previewAudio}
          onLoadedMetadata={onLoad}
          onError={onError}
        />
      ) : null}
    </div>
  );
}

/** Detail carries the project name; a summary row only knows that one exists. */
function projectLabel(media: MediaAsset) {
  if ("project" in media && media.project) return media.project.name;
  return media.projectId ? "Linked" : "Not linked to a project";
}

function titleCase(value: string) {
  return value.charAt(0) + value.slice(1).toLowerCase();
}
