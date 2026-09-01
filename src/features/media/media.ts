import type { IconName } from "@/components/icon";
import type { StatusShape } from "@/components/ui";
import type {
  MediaAssetDetail,
  MediaAssetSummary,
  MediaKind,
  MediaStatus,
} from "@/shared/media";

/**
 * Presentation helpers for the media contract.
 *
 * The contract itself lives in `src/shared/media.ts` and is the authority for
 * both sides. The frontend no longer mirrors it; it re-exports the application
 * facing types so UI modules have one import to reach for.
 *
 * Storage keys, filesystem paths, bucket names and credentials are absent from
 * that contract and are never reconstructed here.
 */
export type {
  MediaAssetDetail,
  MediaAssetSummary,
  MediaKind,
  MediaListResponse,
  MediaPagination,
  MediaStatus,
} from "@/shared/media";

/** Either shape renders in the same places; detail is a superset of summary. */
export type MediaAsset = MediaAssetSummary | MediaAssetDetail;

const statusLabels: Record<MediaStatus, string> = {
  PENDING_UPLOAD: "Awaiting upload",
  UPLOADED: "Uploaded",
  PROCESSING: "Processing",
  READY: "Ready",
  FAILED: "Failed",
  ARCHIVED: "Archived",
};

const kindLabels: Record<MediaKind, string> = {
  IMAGE: "Images",
  VIDEO: "Video",
  AUDIO: "Audio",
  DOCUMENT: "Documents",
};

/** Both filters are applied by the server; these lists only drive the controls. */
export const mediaStatuses = Object.keys(statusLabels) as MediaStatus[];
export const mediaKinds = Object.keys(kindLabels) as MediaKind[];

export const mediaStatusFilters = [
  { value: "", label: "All statuses" },
  ...mediaStatuses.map((status) => ({ value: status, label: statusLabels[status] })),
];

export const mediaKindFilters = [
  { value: "", label: "All formats" },
  ...mediaKinds.map((kind) => ({ value: kind, label: kindLabels[kind] })),
];

export const mediaViewModes = ["grid", "list"] as const;
export type MediaViewMode = (typeof mediaViewModes)[number];

/** The server caps a page at 100; this is the page size the library asks for. */
export const MEDIA_PAGE_SIZE = 50;

/** Longest filename query the list route accepts before it rejects the request. */
export const MEDIA_QUERY_MAX_LENGTH = 120;

/** Narrows an untrusted query-string or localStorage value onto a known option. */
export function parseOption<T extends string>(
  value: string | null | undefined,
  allowed: readonly T[],
): T | "" {
  return value && (allowed as readonly string[]).includes(value) ? (value as T) : "";
}

/**
 * The download route rejects anything that is not READY, so a master is only
 * openable — and only previewable — once it has finished processing.
 */
export function isDownloadable(media: MediaAsset) {
  return media.status === "READY";
}

/**
 * The only thing the Media Library persists locally: which layout the operator
 * prefers. No identity, no role, no permissions, no media access URL.
 */
export const MEDIA_VIEW_STORAGE_KEY = "shivayonic.media.view";

type ReadableStorage = { getItem(key: string): string | null };

export function readViewPreference(storage: ReadableStorage | undefined): MediaViewMode | "" {
  try {
    return parseOption(storage?.getItem(MEDIA_VIEW_STORAGE_KEY), mediaViewModes);
  } catch {
    // Private browsing, or a browser configured to block site data.
    return "";
  }
}

/** Builds the list query from the contract's own request shape. */
export function buildMediaListQuery(filters: {
  kind?: string;
  status?: string;
  q?: string;
  cursor?: string;
}) {
  const params = new URLSearchParams({ limit: String(MEDIA_PAGE_SIZE) });
  for (const key of ["kind", "status", "q", "cursor"] as const) {
    const value = filters[key]?.trim();
    if (value) params.set(key, value);
  }
  return params.toString();
}

type StatusPresentation = {
  label: string;
  tone: "neutral" | "signal" | "success" | "warning" | "danger";
  shape: StatusShape;
};

/** Tone and dot shape both change, so status never depends on colour alone. */
const statusPresentation: Record<MediaStatus, StatusPresentation> = {
  PENDING_UPLOAD: { label: "Awaiting upload", tone: "warning", shape: "hollow" },
  UPLOADED: { label: "Uploaded", tone: "signal", shape: "solid" },
  PROCESSING: { label: "Processing", tone: "signal", shape: "hollow" },
  READY: { label: "Ready", tone: "success", shape: "solid" },
  FAILED: { label: "Failed", tone: "danger", shape: "square" },
  ARCHIVED: { label: "Archived", tone: "neutral", shape: "square" },
};

export function presentStatus(status: MediaStatus | string): StatusPresentation {
  return statusPresentation[status as MediaStatus] ?? { label: status, tone: "neutral", shape: "square" };
}

const kindIcons: Record<string, IconName> = {
  IMAGE: "image",
  VIDEO: "video",
  AUDIO: "audio",
};

export function kindIcon(kind: MediaKind | string): IconName {
  return kindIcons[kind as MediaKind] ?? "media";
}

export function formatBytes(sizeBytes: string) {
  const bytes = Number(sizeBytes);
  if (!Number.isFinite(bytes) || bytes <= 0) return "—";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;
  return `${value.toFixed(value >= 100 || exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

export function formatDuration(durationMs: number | null) {
  if (!durationMs || durationMs <= 0) return null;
  const totalSeconds = Math.round(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function formatDate(isoDate: string) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

/**
 * Maps the backend error envelope (`{ error: { code } }`) onto operator-facing
 * copy. Server messages and traces are never rendered.
 */
export function describeApiError(code: string | undefined, status: number) {
  switch (code) {
    case "AUTHENTICATION_REQUIRED":
    case "SESSION_EXPIRED":
      return "Your session has expired. Sign in again to continue.";
    case "PERMISSION_DENIED":
    case "ROLE_NOT_ALLOWED":
      return "Your role does not include access to this data.";
    case "ORGANIZATION_MEMBERSHIP_REQUIRED":
      return "This account is not a member of an organization yet.";
    case "MEDIA_STORAGE_UNAVAILABLE":
      return "Media storage is not responding. The masters are safe; try again shortly.";
    default:
      return status >= 500
        ? "The Command Center could not reach the service. Try again shortly."
        : "That request could not be completed.";
  }
}
