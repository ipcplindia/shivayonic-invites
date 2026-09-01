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
import { can } from "@/features/access";
import { MediaApiError, listMedia } from "@/features/media/media-api";
import { MediaInspector, type MediaChange } from "@/features/media/media-inspector";
import { UploadDialog } from "@/features/media/upload-dialog";
import styles from "@/features/media/media.module.css";
import {
  buildMediaListQuery,
  formatBytes,
  formatDate,
  formatDuration,
  kindIcon,
  mediaKindFilters,
  mediaKinds,
  mediaStatusFilters,
  mediaStatuses,
  mediaViewModes,
  mergeMediaPages,
  MEDIA_PAGE_SIZE,
  MEDIA_QUERY_MAX_LENGTH,
  MEDIA_VIEW_STORAGE_KEY,
  parseOption,
  readViewPreference,
  presentStatus,
  type MediaViewMode,
} from "@/features/media/media";
import type { CurrentUserContext } from "@/shared/auth";
import type { MediaAssetSummary, MediaPagination } from "@/shared/media";

type MediaFilters = { kind: string; status: string; q: string };

type LoadState =
  | { phase: "loading" }
  | { phase: "error"; message: string; retryable: boolean }
  | { phase: "ready"; media: MediaAssetSummary[]; pageInfo: MediaPagination };

const emptyFilters: MediaFilters = { kind: "", status: "", q: "" };

/**
 * Reads `GET /api/media`. Same-origin, so the session cookie travels on its own
 * and the frontend never touches auth internals.
 *
 * Kind, status and the filename query are all applied by the server, and the
 * response is a cursor page. Changing any filter starts a fresh first page;
 * `loadMore` appends the next one and never re-appends an id already held.
 */
function useMediaPages(filters: MediaFilters) {
  const [state, setState] = useState<LoadState>({ phase: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreError, setMoreError] = useState("");
  const { kind, status, q } = filters;

  useEffect(() => {
    const controller = new AbortController();
    setState({ phase: "loading" });
    setMoreError("");

    listMedia(buildMediaListQuery({ kind, status, q }), controller.signal)
      .then((payload) =>
        setState({
          phase: "ready",
          media: payload.media ?? [],
          pageInfo: payload.pageInfo ?? { nextCursor: null, hasMore: false },
        }),
      )
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        const known = error instanceof MediaApiError;
        setState({
          phase: "error",
          message: known ? error.message : "The media library could not be loaded.",
          retryable: known ? error.retryable || error.status === 0 : true,
        });
      });

    return () => controller.abort();
  }, [attempt, kind, q, status]);

  const loadMore = useCallback(async () => {
    if (state.phase !== "ready" || !state.pageInfo.nextCursor || loadingMore) return;
    setLoadingMore(true);
    setMoreError("");
    try {
      const payload = await listMedia(
        buildMediaListQuery({ kind, status, q, cursor: state.pageInfo.nextCursor }),
      );
      setState((current) => {
        if (current.phase !== "ready") return current;
        return {
          phase: "ready",
          media: mergeMediaPages(current.media, payload.media ?? []),
          pageInfo: payload.pageInfo ?? { nextCursor: null, hasMore: false },
        };
      });
    } catch (error) {
      // The pages already loaded stay exactly where they are.
      setMoreError(
        error instanceof MediaApiError ? error.message : "More results could not be loaded.",
      );
    } finally {
      setLoadingMore(false);
    }
  }, [kind, loadingMore, q, state, status]);

  const reload = useCallback(() => setAttempt((value) => value + 1), []);
  return { state, reload, loadMore, loadingMore, moreError };
}

/** Reads the saved view mode, tolerating a browser that refuses storage. */
function storeViewPreference(mode: MediaViewMode) {
  try {
    // A layout preference only. Nothing about the user, their role or their data.
    window.localStorage.setItem(MEDIA_VIEW_STORAGE_KEY, mode);
  } catch {
    // Private browsing or blocked storage: the URL still carries the choice.
  }
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
      <div className={styles.cardThumb} aria-hidden="true">
        <Icon name={kindIcon(media.kind)} size={26} />
      </div>
      <div className={styles.mediaCardTop}>
        <span className={styles.mediaKind}>{titleCase(media.kind)}</span>
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
      <Skeleton width="100%" height={92} radius="var(--radius-md)" />
      <Skeleton width="80%" height={13} />
      <Skeleton width="45%" height={11} />
    </div>
  );
}

/* ------------------------------------------------------------ Media library */

export function MediaLibrary({ context }: { context: CurrentUserContext }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const notify = useToast();
  const canUpload = can(context, "MEDIA_WRITE");

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

  const [draftQuery, setDraftQuery] = useState(query);
  const [selected, setSelected] = useState<MediaAssetSummary | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);

  const filters = useMemo(() => ({ kind, status, q: query }), [kind, query, status]);
  const { state, reload, loadMore, loadingMore, moreError } = useMediaPages(filters);
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

  // The debounce below needs the latest writer without re-arming on every render.
  const setParamsRef = useRef(setParams);
  setParamsRef.current = setParams;

  // The filename query reaches the server, so the field is typed locally and
  // settles into the URL rather than issuing a request per keystroke.
  useEffect(() => setDraftQuery(query), [query]);
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
    storeViewPreference(mode);
    setParams({ view: mode });
  }

  function refresh() {
    refreshing.current = true;
    reload();
  }

  useEffect(() => {
    if (!refreshing.current || state.phase === "loading") return;
    refreshing.current = false;
    if (state.phase === "error") notify("error", state.message);
  }, [notify, state]);

  function onMediaChanged(change: MediaChange) {
    notify(
      "success",
      change.action === "archived" ? "Master archived." : "Master deleted permanently.",
    );
    // One authoritative reconciliation: refetch rather than patch local state.
    reload();
  }

  const filtersActive = Boolean(status || kind || query);
  const media = state.phase === "ready" ? state.media : [];
  const hasMore = state.phase === "ready" && state.pageInfo.hasMore;

  return (
    <section aria-label="Media library">
      <div className={styles.toolbar}>
        <div className={styles.toolbarSearch}>
          <SearchInput
            label="Search filenames"
            placeholder="Search filenames"
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
          <Button variant="ghost" icon="close" onClick={clearFilters}>
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
        {canUpload ? (
          <Button variant="primary" icon="upload" onClick={() => setUploadOpen(true)}>
            Upload master
          </Button>
        ) : null}
      </div>

      {state.phase === "ready" && media.length > 0 ? (
        <p className={styles.toolbarNote} role="status">
          {`${media.length} master${media.length === 1 ? "" : "s"} shown, newest first.`}
          {hasMore ? " More are available." : ""}
        </p>
      ) : null}

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
            title="The media library could not be loaded"
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

      {state.phase === "ready" && media.length === 0 ? (
        <Card>
          <EmptyStateForContext
            canUpload={canUpload}
            query={query}
            filtersActive={filtersActive}
            onClear={clearFilters}
            onUpload={() => setUploadOpen(true)}
          />
        </Card>
      ) : null}

      {media.length > 0 ? (
        view === "grid" ? (
          <div className={styles.grid}>
            {media.map((item) => (
              <MediaCard key={item.id} media={item} onOpen={setSelected} />
            ))}
          </div>
        ) : (
          <Card>
            <ul className={styles.recentList}>
              {media.map((item) => {
                const itemStatus = presentStatus(item.status);
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={styles.recentRowButton}
                      onClick={() => setSelected(item)}
                      aria-haspopup="dialog"
                    >
                      <Icon name={kindIcon(item.kind)} size={16} />
                      <span className={styles.recentName}>{item.originalFilename}</span>
                      <span className={styles.recentDate}>{formatBytes(item.sizeBytes)}</span>
                      <StatusBadge
                        label={itemStatus.label}
                        tone={itemStatus.tone}
                        shape={itemStatus.shape}
                      />
                      <span className={styles.recentDate}>{formatDate(item.createdAt)}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </Card>
        )
      ) : null}

      {hasMore || moreError ? (
        <div className={styles.loadMore}>
          {moreError ? (
            <p className={styles.loadMoreError} role="alert">
              {moreError}
            </p>
          ) : null}
          {hasMore ? (
            <Button icon="chevronDown" onClick={() => void loadMore()} disabled={loadingMore}>
              {loadingMore ? "Loading…" : `Load ${MEDIA_PAGE_SIZE} more`}
            </Button>
          ) : null}
        </div>
      ) : null}

      <MediaInspector
        context={context}
        summary={selected}
        onClose={() => setSelected(null)}
        onChanged={onMediaChanged}
      />

      {canUpload ? (
        <UploadDialog
          open={uploadOpen}
          onClose={() => setUploadOpen(false)}
          onSettled={reload}
          onUploaded={(count) =>
            notify("success", `${count} master${count === 1 ? "" : "s"} uploaded.`)
          }
        />
      ) : null}
    </section>
  );
}

function EmptyStateForContext({
  canUpload,
  query,
  filtersActive,
  onClear,
  onUpload,
}: {
  canUpload: boolean;
  query: string;
  filtersActive: boolean;
  onClear: () => void;
  onUpload: () => void;
}) {
  if (query) {
    return (
      <EmptyState
        icon="search"
        title={`No filenames match “${query}”`}
        body="Filenames are matched across the whole library, so nothing here carries that text."
        action={
          <Button icon="close" onClick={onClear}>
            Clear search
          </Button>
        }
      />
    );
  }

  if (filtersActive) {
    return (
      <EmptyState
        icon="media"
        title="No masters match these filters"
        body="Nothing in this organization's library matches. Widen the filters to see the rest."
        action={
          <Button icon="close" onClick={onClear}>
            Clear filters
          </Button>
        }
      />
    );
  }

  return (
    <EmptyState
      icon="media"
      title="No masters yet"
      body={
        canUpload
          ? "Upload a film, an invitation or a score. Masters are stored privately — uploading publishes nothing."
          : "Films, invitations and scores appear here once someone with upload rights adds them."
      }
      action={
        canUpload ? (
          <Button variant="primary" icon="upload" onClick={onUpload}>
            Upload master
          </Button>
        ) : undefined
      }
    />
  );
}

/* ------------------------------------------------------------- Recent media */

export function RecentMedia() {
  const { state, reload } = useMediaPages(emptyFilters);
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
          {recent.map((item) => {
            const status = presentStatus(item.status);
            return (
              <li key={item.id} className={styles.recentRow}>
                <Icon name={kindIcon(item.kind)} size={16} />
                <span className={styles.recentName}>{item.originalFilename}</span>
                <StatusBadge label={status.label} tone={status.tone} shape={status.shape} />
                <span className={styles.recentDate}>{formatDate(item.createdAt)}</span>
              </li>
            );
          })}
        </ul>
      ) : null}
    </Card>
  );
}

function titleCase(value: string) {
  return value.charAt(0) + value.slice(1).toLowerCase();
}
