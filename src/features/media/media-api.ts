import type {
  ArchiveMediaResponse,
  CreateMediaRequest,
  CreateMediaResponse,
  CompleteMediaResponse,
  MediaAssetDetail,
  MediaListResponse,
} from "@/shared/media";

/**
 * Every call the Media Library makes, in one place.
 *
 * All of them are same-origin requests to the application's own routes, so the
 * session cookie travels on its own; the frontend never handles a token, and it
 * never talks to object storage directly.
 */

export class MediaApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly retryable = false,
  ) {
    super(message);
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { accept: "application/json", ...init?.headers },
  }).catch(() => null);

  if (!response) {
    throw new MediaApiError(
      "The Command Center could not reach the media service.",
      0,
      undefined,
      true,
    );
  }

  if (response.status === 204) return undefined as T;

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const code: string | undefined = body?.error?.code;
    throw new MediaApiError(
      describeMediaError(code, response.status),
      response.status,
      code,
      // Only a server-side fault is worth pressing the same button again for.
      response.status >= 500 || response.status === 0,
    );
  }
  return body as T;
}

export function listMedia(query: string, signal?: AbortSignal) {
  return request<MediaListResponse>(`/api/media?${query}`, { signal });
}

export function fetchMediaDetail(mediaId: string, signal?: AbortSignal) {
  return request<{ media: MediaAssetDetail }>(`/api/media/${mediaId}`, { signal }).then(
    (body) => body.media,
  );
}

/**
 * Only the four fields the create schema accepts are sent. The organization, the
 * uploader, the storage key and the lifecycle status are all server-owned and
 * are never supplied by this client.
 */
export function createMedia(input: CreateMediaRequest, signal?: AbortSignal) {
  return request<CreateMediaResponse>("/api/media", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      originalFilename: input.originalFilename,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      ...(input.projectId ? { projectId: input.projectId } : {}),
    }),
    signal,
  });
}

/** The server validates the stored object here; READY comes from its answer. */
export function completeMedia(mediaId: string, signal?: AbortSignal) {
  return request<CompleteMediaResponse>(`/api/media/${mediaId}/confirm`, {
    method: "POST",
    signal,
  }).then((body) => body.media);
}

export function archiveMedia(mediaId: string) {
  return request<ArchiveMediaResponse>(`/api/media/${mediaId}?mode=archive`, {
    method: "DELETE",
  }).then((body) => body.media);
}

/** Permanent, and the server permits it for an organization owner only. */
export function deleteMedia(mediaId: string) {
  return request<void>(`/api/media/${mediaId}?mode=delete`, { method: "DELETE" });
}

/**
 * Maps the backend error envelope onto operator-facing language. Server
 * messages, stack traces and storage details are never rendered.
 */
export function describeMediaError(code: string | undefined, status: number) {
  switch (code) {
    case "AUTHENTICATION_REQUIRED":
    case "SESSION_EXPIRED":
      return "Your session has expired. Sign in again to continue.";
    case "PERMISSION_DENIED":
      return "Your role does not include this action.";
    case "ROLE_NOT_ALLOWED":
      return "Only an organization owner can do this.";
    case "ORGANIZATION_MEMBERSHIP_REQUIRED":
      return "This account is not a member of an organization yet.";
    case "MEDIA_NOT_FOUND":
      return "That master is no longer in this organization's library.";
    case "MEDIA_STATE_INVALID":
      return "That master is not in a state where this is allowed. Refresh to see where it stands.";
    case "MEDIA_TYPE_NOT_ALLOWED":
      return "The studio does not accept that format.";
    case "MEDIA_SIZE_INVALID":
      return "The file size did not match what was declared, so the upload was rejected.";
    case "MEDIA_OBJECT_INVALID":
      return "The stored file did not match what was expected. Upload it again.";
    case "MEDIA_STORAGE_UNAVAILABLE":
      return "Media storage is not responding. The masters are safe; try again shortly.";
    case "INVALID_MEDIA_INPUT":
      return "That request was not accepted. Adjust the filters or the file and try again.";
    default:
      return status >= 500
        ? "The Command Center could not reach the service. Try again shortly."
        : "That request could not be completed.";
  }
}
