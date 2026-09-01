"use client";

import { useCallback, useEffect, useState } from "react";

import { ConfirmDialog, Inspector } from "@/components/overlay";
import { Button, LinkButton, Skeleton, StatusBadge } from "@/components/ui";
import { can } from "@/features/access";
import {
  MediaApiError,
  archiveMedia,
  deleteMedia,
  fetchMediaDetail,
} from "@/features/media/media-api";
import styles from "@/features/media/media.module.css";
import {
  formatBytes,
  formatDate,
  formatDuration,
  isDownloadable,
  presentStatus,
  type MediaAsset,
} from "@/features/media/media";
import type { CurrentUserContext } from "@/shared/auth";
import type { MediaAssetDetail, MediaAssetSummary } from "@/shared/media";

type DetailState =
  | { phase: "loading" }
  | { phase: "error"; message: string; retryable: boolean }
  | { phase: "ready"; media: MediaAssetDetail };

export type MediaChange = { action: "archived" | "deleted"; media: MediaAssetSummary | null };

/**
 * Read-only inspector for one master, plus the two lifecycle actions the backend
 * exposes: archive, and owner-only permanent delete.
 *
 * Everything shown comes from `GET /api/media/:id`. Storage keys, bucket names,
 * filesystem paths and signed URLs are not in that payload and are never
 * reconstructed here.
 */
export function MediaInspector({
  context,
  summary,
  onClose,
  onChanged,
}: {
  context: CurrentUserContext;
  /** The row the operator clicked; shown while the detail request is in flight. */
  summary: MediaAssetSummary | null;
  onClose: () => void;
  onChanged: (change: MediaChange) => void;
}) {
  const open = summary !== null;
  const mediaId = summary?.id ?? null;

  const [state, setState] = useState<DetailState>({ phase: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [confirm, setConfirm] = useState<"archive" | "delete" | null>(null);
  const [pending, setPending] = useState(false);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    if (!mediaId) return;
    const controller = new AbortController();
    setState({ phase: "loading" });
    setActionError("");

    fetchMediaDetail(mediaId, controller.signal)
      .then((media) => setState({ phase: "ready", media }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        const known = error instanceof MediaApiError;
        setState({
          phase: "error",
          message: known ? error.message : "This master's details could not be loaded.",
          retryable: known ? error.retryable || error.status === 0 : true,
        });
      });

    return () => controller.abort();
  }, [attempt, mediaId]);

  const runAction = useCallback(
    async (action: "archive" | "delete") => {
      if (!mediaId) return;
      setPending(true);
      setActionError("");
      try {
        if (action === "archive") {
          const media = await archiveMedia(mediaId);
          onChanged({ action: "archived", media });
        } else {
          await deleteMedia(mediaId);
          onChanged({ action: "deleted", media: null });
        }
        setConfirm(null);
        onClose();
      } catch (error) {
        // The asset stays exactly as it was; the operator is told why.
        setConfirm(null);
        setActionError(
          error instanceof MediaApiError ? error.message : "That action could not be completed.",
        );
      } finally {
        setPending(false);
      }
    },
    [mediaId, onChanged, onClose],
  );

  // Detail is authoritative once it arrives; the row keeps the panel useful until then.
  const media: MediaAsset | null = state.phase === "ready" ? state.media : summary;
  const status = media ? presentStatus(media.status) : null;
  const canArchive = can(context, "MEDIA_WRITE") && media?.status !== "ARCHIVED";
  // The delete route requires an organization owner; the server re-checks it.
  const canDelete = context.role === "OWNER";

  return (
    <>
      <Inspector
        open={open}
        onClose={onClose}
        title={media?.originalFilename ?? "Master"}
        description={media ? `${titleCase(media.kind)} master` : undefined}
        footer={
          media ? (
            <>
              {isDownloadable(media) ? (
                <LinkButton
                  variant="primary"
                  icon="upload"
                  href={`/api/media/${media.id}/download`}
                  download={media.originalFilename}
                >
                  Download
                </LinkButton>
              ) : null}
              {canArchive ? (
                <Button icon="archive" onClick={() => setConfirm("archive")} disabled={pending}>
                  Archive
                </Button>
              ) : null}
              {canDelete ? (
                <Button
                  variant="danger"
                  icon="close"
                  onClick={() => setConfirm("delete")}
                  disabled={pending}
                >
                  Delete
                </Button>
              ) : null}
            </>
          ) : null
        }
      >
        {/* Feedback stays in the panel: a toast cannot rise above the top layer. */}
        {actionError ? (
          <p className={styles.inspectorAlert} role="alert">
            {actionError}
          </p>
        ) : null}

        {state.phase === "error" ? (
          <div className={styles.inspectorAlert} role="alert">
            <p>{state.message}</p>
            {state.retryable ? (
              <Button size="sm" icon="refresh" onClick={() => setAttempt((value) => value + 1)}>
                Try again
              </Button>
            ) : null}
          </div>
        ) : null}

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
            {media.archivedAt ? (
              <Field label="Archived" value={formatDate(media.archivedAt)} />
            ) : null}

            {isDetail(media) ? (
              <>
                <Field label="Project" value={projectLabel(media)} />
                <Field label="Uploaded by" value={media.creator.name ?? "Unknown"} />
              </>
            ) : state.phase === "loading" ? (
              <div className={styles.detailSkeleton} aria-busy="true">
                <Skeleton width="60%" height={12} />
                <Skeleton width="45%" height={12} />
              </div>
            ) : (
              <Field label="Project" value={projectLabel(media)} />
            )}

            {media.status === "FAILED" ? (
              <p className={styles.inspectorNote}>
                This master failed validation, so no file is stored for it. Upload the file again;
                an owner can delete this record.
              </p>
            ) : null}
            {media.status === "ARCHIVED" ? (
              <p className={styles.inspectorNote}>
                Archived masters are hidden from day-to-day work. The file is still stored.
              </p>
            ) : null}
          </>
        ) : null}
      </Inspector>

      {canArchive ? (
      <ConfirmDialog
        open={confirm === "archive"}
        onClose={() => setConfirm(null)}
        onConfirm={() => void runAction("archive")}
        title="Archive this master?"
        description={`“${media?.originalFilename ?? ""}” will be marked archived and hidden from the default view. The file stays in storage, and an owner can still delete it.`}
        confirmLabel="Archive"
        tone="primary"
        pending={pending}
      />
      ) : null}

      {canDelete ? (
      <ConfirmDialog
        open={confirm === "delete"}
        onClose={() => setConfirm(null)}
        onConfirm={() => void runAction("delete")}
        title="Delete this master permanently?"
        description={`“${media?.originalFilename ?? ""}” and its stored file will be removed for good. This cannot be undone.`}
        confirmLabel="Delete permanently"
        tone="danger"
        pending={pending}
      />
      ) : null}
    </>
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

function isDetail(media: MediaAsset): media is MediaAssetDetail {
  return "creator" in media;
}

/** Detail carries the project name; a summary row only knows that one exists. */
function projectLabel(media: MediaAsset) {
  if (isDetail(media) && media.project) return media.project.name;
  return media.projectId ? "Linked" : "Not linked to a project";
}

/**
 * Preview is served by the authorised download route asked for inline, so the
 * browser streams it with Range support instead of downloading the whole master.
 * Nothing loads until the operator asks, nothing autoplays, and no URL is stored.
 */
function MediaPreview({ media }: { media: MediaAsset }) {
  const [state, setState] = useState<"idle" | "loading" | "ready" | "failed">("idle");

  useEffect(() => setState("idle"), [media.id]);

  if (!isDownloadable(media)) {
    return <p className={styles.previewPlaceholder}>A preview appears once this master is ready.</p>;
  }

  if (media.kind === "DOCUMENT") {
    return (
      <p className={styles.previewPlaceholder}>
        Documents are not previewed in the browser. Download it to open it.
      </p>
    );
  }

  if (state === "idle") {
    return (
      <div className={styles.previewPlaceholder}>
        <Button icon={previewIcon(media.kind)} onClick={() => setState("loading")}>
          Load preview
        </Button>
        <span>Streams from the studio; the whole master is never downloaded to play it.</span>
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

function previewIcon(kind: string) {
  if (kind === "AUDIO") return "audio" as const;
  if (kind === "IMAGE") return "image" as const;
  return "video" as const;
}

function titleCase(value: string) {
  return value.charAt(0) + value.slice(1).toLowerCase();
}
