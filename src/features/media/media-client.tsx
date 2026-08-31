"use client";

import { useCallback, useEffect, useState } from "react";

import { Icon } from "@/components/icon";
import {
  Button,
  Card,
  CardHeader,
  EmptyState,
  ErrorState,
  Select,
  SearchInput,
  Skeleton,
  StatusBadge,
} from "@/components/ui";
import styles from "@/features/media/media.module.css";
import {
  describeApiError,
  formatBytes,
  formatDate,
  formatDuration,
  kindIcon,
  mediaStatusFilters,
  presentStatus,
  type MediaAssetSummary,
  type MediaListResponse,
} from "@/features/media/media";

type LoadState =
  | { phase: "loading" }
  | { phase: "error"; message: string }
  | { phase: "ready"; media: MediaAssetSummary[] };

/**
 * Reads the existing `GET /api/media` route. Same-origin, so the session cookie
 * travels on its own and the frontend never touches auth internals.
 */
function useMediaList(status: string) {
  const [state, setState] = useState<LoadState>({ phase: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState({ phase: "loading" });

    const query = status ? `?status=${encodeURIComponent(status)}` : "";
    fetch(`/api/media${query}`, { signal: controller.signal, headers: { accept: "application/json" } })
      .then(async (response) => {
        const body = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(describeApiError(body?.error?.code, response.status));
        }
        setState({ phase: "ready", media: (body as MediaListResponse).media ?? [] });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        const message =
          error instanceof Error && error.message
            ? error.message
            : "The Command Center could not reach the media service.";
        setState({ phase: "error", message });
      });

    return () => controller.abort();
  }, [status, attempt]);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);
  return { state, retry };
}

/* --------------------------------------------------------------- Media card */

export function MediaCard({ media }: { media: MediaAssetSummary }) {
  const status = presentStatus(media.status);
  const duration = formatDuration(media.durationMs);
  const dimensions = media.width && media.height ? `${media.width}×${media.height}` : null;

  return (
    <article className={styles.mediaCard}>
      <div className={styles.mediaCardTop}>
        <span className={styles.kindGlyph}>
          <Icon name={kindIcon(media.kind)} size={18} />
        </span>
        <StatusBadge label={status.label} tone={status.tone} shape={status.shape} />
      </div>
      <h3 className={styles.mediaName}>{media.originalFilename}</h3>
      <dl className={styles.mediaMeta}>
        <div>
          <dt hidden>Size</dt>
          <dd className={styles.mediaMetaValue}>{formatBytes(media.sizeBytes)}</dd>
        </div>
        {dimensions ? (
          <div>
            <dt hidden>Dimensions</dt>
            <dd className={styles.mediaMetaValue}>{dimensions}</dd>
          </div>
        ) : null}
        {duration ? (
          <div>
            <dt hidden>Duration</dt>
            <dd className={styles.mediaMetaValue}>{duration}</dd>
          </div>
        ) : null}
        <div>
          <dt hidden>Added</dt>
          <dd>{formatDate(media.createdAt)}</dd>
        </div>
      </dl>
    </article>
  );
}

export function MediaCardSkeleton() {
  return (
    <div className={styles.skeletonCard} aria-hidden="true">
      <Skeleton width={34} height={34} radius="var(--radius-md)" />
      <Skeleton width="80%" height={13} />
      <Skeleton width="45%" height={11} />
    </div>
  );
}

/* ------------------------------------------------------------ Media library */

export function MediaLibrary({ canUpload }: { canUpload: boolean }) {
  const [status, setStatus] = useState("");
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const { state, retry } = useMediaList(status);

  const visible =
    state.phase === "ready"
      ? state.media.filter((item) =>
          item.originalFilename.toLowerCase().includes(query.trim().toLowerCase()),
        )
      : [];

  return (
    <section aria-label="Media library">
      <div className={styles.toolbar}>
        <div className={styles.toolbarSearch}>
          <SearchInput
            label="Filter loaded media by filename"
            placeholder="Filter by filename"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <Select
          label="Status"
          hideLabel
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          options={mediaStatusFilters.map((option) => ({ ...option }))}
        />
        <span className={styles.toolbarSpacer} />
        <div className={styles.viewToggle} role="group" aria-label="Layout">
          <button
            type="button"
            className={styles.viewOption}
            aria-pressed={view === "grid"}
            onClick={() => setView("grid")}
          >
            <Icon name="overview" size={14} />
            Grid
          </button>
          <button
            type="button"
            className={styles.viewOption}
            aria-pressed={view === "list"}
            onClick={() => setView("list")}
          >
            <Icon name="menu" size={14} />
            List
          </button>
        </div>
        <Button
          variant="primary"
          icon="upload"
          disabled={!canUpload}
          aria-disabled
          title={
            canUpload
              ? "The upload workflow arrives in the next frontend task."
              : "Uploading requires the MEDIA_WRITE permission."
          }
        >
          Upload master
        </Button>
      </div>

      {state.phase === "loading" ? (
        <div className={styles.grid} aria-busy="true" aria-live="polite">
          {Array.from({ length: 6 }, (_, index) => (
            <MediaCardSkeleton key={index} />
          ))}
        </div>
      ) : null}

      {state.phase === "error" ? (
        <Card>
          <ErrorState
            title="Media could not be loaded"
            body={state.message}
            action={
              <Button variant="secondary" icon="refresh" onClick={retry}>
                Try again
              </Button>
            }
          />
        </Card>
      ) : null}

      {state.phase === "ready" && visible.length === 0 ? (
        <Card>
          <EmptyState
            icon="media"
            title={query || status ? "Nothing matches that filter" : "No masters held yet"}
            body={
              query || status
                ? "Clear the filename filter or choose a different status to see the rest of the library."
                : "Master files uploaded to the studio appear here with their status, format and size."
            }
          />
        </Card>
      ) : null}

      {state.phase === "ready" && visible.length > 0 ? (
        view === "grid" ? (
          <div className={styles.grid}>
            {visible.map((media) => (
              <MediaCard key={media.id} media={media} />
            ))}
          </div>
        ) : (
          <Card>
            <ul className={styles.recentList}>
              {visible.map((media) => {
                const status = presentStatus(media.status);
                return (
                  <li key={media.id} className={styles.recentRow}>
                    <Icon name={kindIcon(media.kind)} size={16} />
                    <span className={styles.recentName}>{media.originalFilename}</span>
                    <span className={styles.recentDate}>{formatBytes(media.sizeBytes)}</span>
                    <StatusBadge label={status.label} tone={status.tone} shape={status.shape} />
                    <span className={styles.recentDate}>{formatDate(media.createdAt)}</span>
                  </li>
                );
              })}
            </ul>
          </Card>
        )
      ) : null}
    </section>
  );
}

/* ------------------------------------------------------------- Recent media */

export function RecentMedia() {
  const { state, retry } = useMediaList("");
  const recent = state.phase === "ready" ? state.media.slice(0, 5) : [];

  return (
    <Card>
      <CardHeader
        title="Recent media"
        description="The five most recent masters registered in this organization."
      />
      {state.phase === "loading" ? (
        <div style={{ padding: "var(--space-5)", display: "grid", gap: "var(--space-3)" }} aria-busy="true">
          <Skeleton width="70%" />
          <Skeleton width="55%" />
          <Skeleton width="62%" />
        </div>
      ) : null}

      {state.phase === "error" ? (
        <ErrorState
          title="Media unavailable"
          body={state.message}
          action={
            <Button variant="secondary" icon="refresh" onClick={retry}>
              Try again
            </Button>
          }
        />
      ) : null}

      {state.phase === "ready" && recent.length === 0 ? (
        <EmptyState
          icon="media"
          title="No masters yet"
          body="Once a film, invitation or score is uploaded, the newest arrivals are listed here."
        />
      ) : null}

      {recent.length > 0 ? (
        <ul className={styles.recentList}>
          {recent.map((media) => {
            const status = presentStatus(media.status);
            return (
              <li key={media.id} className={styles.recentRow}>
                <Icon name={kindIcon(media.kind)} size={16} />
                <span className={styles.recentName}>{media.originalFilename}</span>
                <StatusBadge label={status.label} tone={status.tone} shape={status.shape} />
                <span className={styles.recentDate}>{formatDate(media.createdAt)}</span>
              </li>
            );
          })}
        </ul>
      ) : null}
    </Card>
  );
}
