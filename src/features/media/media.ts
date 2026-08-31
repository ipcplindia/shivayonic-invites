import type { IconName } from "@/components/icon";
import type { StatusShape } from "@/components/ui";

/**
 * Frontend view of the Task 03 media contract.
 *
 * This mirrors `serializeMedia` in `src/core/media-api.ts` exactly — it is the
 * JSON that `GET /api/media` already returns. It is declared here rather than
 * imported so no UI module reaches into a backend-owned file; see the Task 01
 * report for the recommendation to promote this shape into `src/shared`.
 *
 * Deliberately absent, and never to be added: storageKey, filesystem paths,
 * bucket names, credentials.
 */
export type MediaAssetSummary = {
  id: string;
  projectId: string | null;
  kind: string;
  status: string;
  originalFilename: string;
  mimeType: string;
  /** Serialised from a bigint, so it arrives as a decimal string. */
  sizeBytes: string;
  width: number | null;
  height: number | null;
  durationMs: number | null;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
};

export type MediaListResponse = { media: MediaAssetSummary[] };

export const mediaStatusFilters = [
  { value: "", label: "All statuses" },
  { value: "PENDING_UPLOAD", label: "Awaiting upload" },
  { value: "UPLOADED", label: "Uploaded" },
  { value: "PROCESSING", label: "Processing" },
  { value: "READY", label: "Ready" },
  { value: "FAILED", label: "Failed" },
  { value: "ARCHIVED", label: "Archived" },
] as const;

type StatusPresentation = {
  label: string;
  tone: "neutral" | "signal" | "success" | "warning" | "danger";
  shape: StatusShape;
};

/** Tone and dot shape both change, so status never depends on colour alone. */
const statusPresentation: Record<string, StatusPresentation> = {
  PENDING_UPLOAD: { label: "Awaiting upload", tone: "warning", shape: "hollow" },
  UPLOADED: { label: "Uploaded", tone: "signal", shape: "solid" },
  PROCESSING: { label: "Processing", tone: "signal", shape: "hollow" },
  READY: { label: "Ready", tone: "success", shape: "solid" },
  FAILED: { label: "Failed", tone: "danger", shape: "square" },
  ARCHIVED: { label: "Archived", tone: "neutral", shape: "square" },
};

export function presentStatus(status: string): StatusPresentation {
  return statusPresentation[status] ?? { label: status, tone: "neutral", shape: "square" };
}

const kindIcons: Record<string, IconName> = {
  IMAGE: "image",
  VIDEO: "video",
  AUDIO: "audio",
};

export function kindIcon(kind: string): IconName {
  return kindIcons[kind] ?? "media";
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
