"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Icon } from "@/components/icon";
import { useToast } from "@/components/toast";
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
import { MediaInspector } from "@/features/media/media-inspector";
import styles from "@/features/media/media.module.css";
import {
  buildMediaListQuery,
  describeApiError,
  formatBytes,
  formatDate,
  formatDuration,
  kindIcon,
  mediaKindFilters,
  mediaKinds,
  mediaStatusFilters,
  mediaStatuses,
  mediaViewModes,
  MEDIA_PAGE_SIZE,
  MEDIA_QUERY_MAX_LENGTH,
  MEDIA_VIEW_STORAGE_KEY,
  parseOption,
  readViewPreference,
  presentStatus,
  type MediaAssetSummary,
  type MediaListResponse,
  type MediaPagination,
  type MediaViewMode,
} from "@/features/media/media";

type MediaFilters = { kind: string; status: string; q: string };

type LoadState =
  | { phase: "loading" }
  | { phase: "error"; message: string; retryable: boolean }
  | { phase: "ready"; media: MediaAssetSummary[]; pageInfo: MediaPagination };

/**
 * Reads `GET /api/media`. Same-origin, so the session cookie travels on its own
 * and the frontend never touches auth internals.
 *
 * Since the hardened media contract, kind, status and the filename query are all
 * applied by the server, and the response is a cursor page. This gate renders
 * the first page only; paging through `pageInfo.nextCursor` is Task 03.
 */
function useMediaList(filters: MediaFilters) {
  const [state, setState] = useState<LoadState>({ phase: "loading" });
  const [attempt, setAttempt] = useState(0);
  const { kind, status, q } = filters;

  useEffect(() => {
    const controller = new AbortController();
    setState({ phase: "loading" });

    const query = buildMediaListQuery({ kind, status, q });
    fetch(`/api/media?${query}`, {
      signal: controller.signal,
      headers: { accept: "application/json" },
    })
      .then(async (response) => {
        const body = await response.json().catch(() => null);
        if (!response.ok) {
          const code: string | undefined = body?.error?.code;
          const error = new Error(describeApiError(code, response.status));
          // A 401/403 will not resolve by pressing the button again.
          (error as Error & { retryable?: boolean }).retryable = response.status >= 500;
          throw error;
        }
        const payload = body as MediaListResponse;
        setState({
          phase: "ready",
          media: payload.media ?? [],
          pageInfo: payload.pageInfo ?? { nextCursor: null, hasMore: false },
        });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        const known = error instanceof Error && error.message;
        setState({
          phase: "error",
          message: known
            ? (error as Error).message
            : "The Command Center could not reach the media service.",
          retryable:
            !known || (error as Error & { retryable?: boolean }).retryable !== false,
        });
      });

    return () => controller.abort();
  }, [attempt, kind, q, status]);

  const reload = useCallback(() => setAttempt((value) => value + 1), []);
  return { state, reload };
}

/* --------------------------------------------------------------- Media card */

export function MediaCard({
  media,
  onOpen,
}: {
  media: MediaAssetSummary;
  onOpen?: (media: MediaAssetSummary) => void;
}) {
  const status = presentStatus(media.status);
  const duration = formatDuration(media.durationMs);
  const dimensions = media.width && media.height ? `${media.width}×${media.height}` : null;

  const body = (
    <>
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
    </>
  );

  if (!onOpen) {
    return <article className={styles.mediaCard}>{body}</article>;
  }

  return (
    <button
      type="button"
      className={styles.mediaCardButton}
      onClick={() => onOpen(media)}
      aria-haspopup="dialog"
    >
      {body}
    </button>
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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const notify = useToast();

  // Query string is the source of truth, so a filtered view is shareable and
  // survives back/forward. Unknown values are discarded, never trusted.
  const status = parseOption(searchParams.get("status"), mediaStatuses);
  const kind = parseOption(searchParams.get("kind"), mediaKinds);
  // The list route rejects a query longer than its own limit, so clamp here.
  const query = (searchParams.get("q") ?? "").slice(0, MEDIA_QUERY_MAX_LENGTH);
  const urlView = parseOption(searchParams.get("view"), mediaViewModes);

  const [storedView, setStoredView] = useState<MediaViewMode | "">("");
  useEffect(() => setStoredView(readViewPreference(window.localStorage)), []);
  const view: MediaViewMode = urlView || storedView || "grid";

  // The filename query now reaches the server, so the field is typed locally and
  // settles into the URL rather than issuing a request per keystroke.
  const [draftQuery, setDraftQuery] = useState(query);
  useEffect(() => setDraftQuery(query), [query]);
  const [selected, setSelected] = useState<MediaAssetSummary | null>(null);
  const filters = useMemo(() => ({ kind, status, q: query }), [kind, query, status]);
  const { state, reload } = useMediaList(filters);
  const refreshing = useRef(false);

  const setParams = useCallback(
    (changes: Record<string, string>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(changes)) {
        if (value) next.set(key, value);
        else next.delete(key);
      }
      const search = next.toString();
      router.replace(search ? `${pathname}?${search}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  // The debounce above needs the latest writer without re-arming on every render.
  const setParamsRef = useRef(setParams);
  setParamsRef.current = setParams;

  useEffect(() => {
    if (draftQuery === query) return;
    const timer = setTimeout(() => setParamsRef.current({ q: draftQuery }), 250);
    return () => clearTimeout(timer);
  }, [draftQuery, query]);

  function clearFilters() {
    setDraftQuery("");
    setParams({ q: "", kind: "", status: "" });
  }

  function chooseView(mode: MediaViewMode) {
    setStoredView(mode);
    try {
      // A layout preference only. Nothing about the user, their role or their data.
      window.localStorage.setItem(MEDIA_VIEW_STORAGE_KEY, mode);
    } catch {
      // Private browsing or blocked storage: the URL still carries the choice.
    }
    setParams({ view: mode });
  }

  function refresh() {
    refreshing.current = true;
    reload();
  }

  useEffect(() => {
    if (!refreshing.current) return;
    if (state.phase === "loading") return;
    refreshing.current = false;
    notify(
      state.phase === "ready" ? "success" : "error",
      state.phase === "ready"
        ? `Media list refreshed — ${state.media.length} master${state.media.length === 1 ? "" : "s"} loaded.`
        : state.message,
    );
  }, [notify, state]);

  const filtersActive = Boolean(status || kind || query);
  const visible = state.phase === "ready" ? state.media : [];

  return (
    <section aria-label="Media library">
      <div className={styles.toolbar}>
        <div className={styles.toolbarSearch}>
          <SearchInput
            label="Search masters by filename"
            placeholder="Search by filename"
            value={draftQuery}
            maxLength={MEDIA_QUERY_MAX_LENGTH}
            onChange={(event) => setDraftQuery(event.target.value)}
          />
        </div>
        <Select
          label="Format"
          hideLabel
          value={kind}
          onChange={(event) => setParams({ kind: event.target.value })}
          options={mediaKindFilters.map((option) => ({ ...option }))}
        />
        <Select
          label="Status"
          hideLabel
          value={status}
          onChange={(event) => setParams({ status: event.target.value })}
          options={mediaStatusFilters.map((option) => ({ ...option }))}
        />
        {filtersActive ? (
          <Button
            variant="ghost"
            icon="close"
            onClick={clearFilters}
          >
            Clear filters
          </Button>
        ) : null}

        <span className={styles.toolbarSpacer} />

        <div className={styles.viewToggle} role="group" aria-label="Layout">
          <button
            type="button"
            className={styles.viewOption}
            aria-pressed={view === "grid"}
            onClick={() => chooseView("grid")}
          >
            <Icon name="overview" size={14} />
            Grid
          </button>
          <button
            type="button"
            className={styles.viewOption}
            aria-pressed={view === "list"}
            onClick={() => chooseView("list")}
          >
            <Icon name="menu" size={14} />
            List
          </button>
        </div>
        <Button
          icon="refresh"
          onClick={refresh}
          disabled={state.phase === "loading"}
          aria-label="Refresh media list"
        >
          Refresh
        </Button>
        <Button
          variant="primary"
          icon="upload"
          disabled
          aria-disabled
          title={
            canUpload
              ? "Available once the upload workflow ships."
              : "Uploading requires the MEDIA_WRITE permission."
          }
        >
          Upload master
        </Button>
      </div>

      <p className={styles.toolbarNote}>
        {state.phase === "ready" && state.pageInfo.hasMore
          ? `Showing the first ${MEDIA_PAGE_SIZE} matching masters, newest first. More remain — paging through them arrives with the full Media Library.`
          : `Showing up to ${MEDIA_PAGE_SIZE} matching masters, newest first. Format, status and filename are all matched by the server.`}
      </p>

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
              state.retryable ? (
                <Button variant="secondary" icon="refresh" onClick={refresh}>
                  Try again
                </Button>
              ) : undefined
            }
          />
        </Card>
      ) : null}

      {state.phase === "ready" && visible.length === 0 ? (
        <Card>
          <EmptyState
            icon="media"
            title={filtersActive ? "Nothing matches these filters" : "No masters held yet"}
            body={
              filtersActive
                ? "No master in this organization matches these filters. Widen them to see the rest of the library."
                : "Master files uploaded to the studio appear here with their status, format and size."
            }
            action={
              filtersActive ? (
                <Button icon="close" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : undefined
            }
          />
        </Card>
      ) : null}

      {state.phase === "ready" && visible.length > 0 ? (
        view === "grid" ? (
          <div className={styles.grid}>
            {visible.map((media) => (
              <MediaCard key={media.id} media={media} onOpen={setSelected} />
            ))}
          </div>
        ) : (
          <Card>
            <ul className={styles.recentList}>
              {visible.map((media) => {
                const itemStatus = presentStatus(media.status);
                return (
                  <li key={media.id}>
                    <button
                      type="button"
                      className={styles.recentRowButton}
                      onClick={() => setSelected(media)}
                      aria-haspopup="dialog"
                    >
                      <Icon name={kindIcon(media.kind)} size={16} />
                      <span className={styles.recentName}>{media.originalFilename}</span>
                      <span className={styles.recentDate}>{formatBytes(media.sizeBytes)}</span>
                      <StatusBadge
                        label={itemStatus.label}
                        tone={itemStatus.tone}
                        shape={itemStatus.shape}
                      />
                      <span className={styles.recentDate}>{formatDate(media.createdAt)}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </Card>
        )
      ) : null}

      <MediaInspector media={selected} onClose={() => setSelected(null)} />
    </section>
  );
}

const emptyFilters: MediaFilters = { kind: "", status: "", q: "" };

/* ------------------------------------------------------------- Recent media */

export function RecentMedia() {
  const { state, reload } = useMediaList(emptyFilters);
  const recent = state.phase === "ready" ? state.media.slice(0, 5) : [];

  return (
    <Card>
      <CardHeader
        title="Recent media"
        description="The five most recent masters registered in this organization."
      />
      {state.phase === "loading" ? (
        <div className={styles.recentSkeleton} aria-busy="true">
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
            state.retryable ? (
              <Button variant="secondary" icon="refresh" onClick={reload}>
                Try again
              </Button>
            ) : undefined
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
