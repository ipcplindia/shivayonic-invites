import type { MediaKind } from "@/shared/media";

/**
 * Upload rules, mirrored from the server's own allowlist in `src/core/media.ts`.
 *
 * They are declared here rather than imported because that module pulls in
 * `next/server` through `MediaError`, which cannot cross into a client bundle.
 * These values exist only to give the operator an accurate accept list and an
 * early, friendly rejection — the server re-validates MIME type and size on
 * create and again on upload, and its answer is the one that counts.
 *
 * Promotion of this table into `src/shared` is recorded as a contract request.
 */
export const mediaUploadRules = {
  "image/jpeg": { kind: "IMAGE", maxBytes: 25 * 1024 * 1024, extensions: [".jpg", ".jpeg"] },
  "image/png": { kind: "IMAGE", maxBytes: 25 * 1024 * 1024, extensions: [".png"] },
  "image/webp": { kind: "IMAGE", maxBytes: 25 * 1024 * 1024, extensions: [".webp"] },
  "video/mp4": { kind: "VIDEO", maxBytes: 2 * 1024 * 1024 * 1024, extensions: [".mp4"] },
  "video/webm": { kind: "VIDEO", maxBytes: 2 * 1024 * 1024 * 1024, extensions: [".webm"] },
  "video/quicktime": { kind: "VIDEO", maxBytes: 2 * 1024 * 1024 * 1024, extensions: [".mov"] },
  "audio/mpeg": { kind: "AUDIO", maxBytes: 250 * 1024 * 1024, extensions: [".mp3"] },
  "audio/wav": { kind: "AUDIO", maxBytes: 250 * 1024 * 1024, extensions: [".wav"] },
  "audio/ogg": { kind: "AUDIO", maxBytes: 250 * 1024 * 1024, extensions: [".ogg"] },
} as const satisfies Record<string, { kind: MediaKind; maxBytes: number; extensions: string[] }>;

export type UploadableMimeType = keyof typeof mediaUploadRules;

/** `accept` for the file input: MIME types and extensions, since browsers differ. */
export const mediaAcceptAttribute = Object.entries(mediaUploadRules)
  .flatMap(([mimeType, rule]) => [mimeType, ...rule.extensions])
  .join(",");

/** Largest file the server will take, per family. Used for the guidance line. */
export const mediaSizeGuidance = [
  { label: "Video", detail: "MP4, WebM, MOV — up to 2 GB" },
  { label: "Audio", detail: "MP3, WAV, OGG — up to 250 MB" },
  { label: "Images", detail: "JPEG, PNG, WebP — up to 25 MB" },
];

export type PrevalidationFailure =
  | { code: "EMPTY_FILE"; message: string }
  | { code: "UNSUPPORTED_TYPE"; message: string }
  | { code: "TOO_LARGE"; message: string };

type PickedFile = { name: string; size: number; type: string };

/**
 * Resolves the MIME type the server will be told about.
 *
 * The browser's own `file.type` is trusted first; extension is only a fallback
 * for the cases where a browser reports an empty type. Extension-only guessing
 * is never used to *reject* a file, because that is exactly the brittle logic
 * that turns a valid master into a false negative.
 */
export function resolveUploadMimeType(file: PickedFile): string {
  const reported = file.type.split(";", 1)[0].trim().toLowerCase();
  if (reported && reported in mediaUploadRules) return reported;
  if (reported) return reported;

  const lowerName = file.name.toLowerCase();
  const matched = Object.entries(mediaUploadRules).find(([, rule]) =>
    rule.extensions.some((extension) => lowerName.endsWith(extension)),
  );
  return matched ? matched[0] : "";
}

/**
 * Frontend prevalidation. UX only: it saves the operator a round trip on the
 * obvious cases. Every one of these checks is repeated server-side.
 */
export function prevalidateFile(file: PickedFile): PrevalidationFailure | null {
  if (!file.name.trim() || file.size <= 0) {
    return { code: "EMPTY_FILE", message: "This file is empty, so there is nothing to upload." };
  }

  const mimeType = resolveUploadMimeType(file);
  const rule = mediaUploadRules[mimeType as UploadableMimeType];
  if (!rule) {
    return {
      code: "UNSUPPORTED_TYPE",
      message: "The studio accepts MP4, WebM, MOV, MP3, WAV, OGG, JPEG, PNG and WebP masters.",
    };
  }

  if (file.size > rule.maxBytes) {
    return {
      code: "TOO_LARGE",
      message: `This file is larger than the ${formatLimit(rule.maxBytes)} limit for ${rule.kind.toLowerCase()} masters.`,
    };
  }

  return null;
}

function formatLimit(bytes: number) {
  const gb = bytes / 1024 ** 3;
  return gb >= 1 ? `${gb} GB` : `${Math.round(bytes / 1024 ** 2)} MB`;
}

/* ------------------------------------------------------------------ Transport */

export type UploadTarget = {
  url: string;
  method?: string;
  headers?: Record<string, string>;
};

export class UploadTransportError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
  }
}

export class UploadAbortedError extends Error {}

/**
 * Sends the file to the target the create response handed back — the local
 * authorised route in development, a signed target in production. The URL,
 * method and headers are used exactly as returned; nothing about the storage
 * provider is assumed and no bucket URL is ever constructed here.
 *
 * XMLHttpRequest rather than fetch: it is the only transport that reports real
 * uploaded bytes, which is what makes the progress bar honest.
 */
export function uploadFileToTarget({
  target,
  file,
  onProgress,
  signal,
}: {
  target: UploadTarget;
  file: Blob;
  onProgress?: (loaded: number, total: number) => void;
  signal?: AbortSignal;
}): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new UploadAbortedError("Upload cancelled."));
      return;
    }

    const request = new XMLHttpRequest();
    request.open(target.method ?? "PUT", target.url, true);
    for (const [header, value] of Object.entries(target.headers ?? {})) {
      request.setRequestHeader(header, value);
    }

    const onAbort = () => request.abort();
    signal?.addEventListener("abort", onAbort);

    const cleanUp = () => signal?.removeEventListener("abort", onAbort);

    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(event.loaded, event.total);
    };

    request.onload = () => {
      cleanUp();
      if (request.status >= 200 && request.status < 300) {
        resolve();
        return;
      }
      let code: string | undefined;
      try {
        code = JSON.parse(request.responseText)?.error?.code;
      } catch {
        // A signed storage target answers with XML or nothing; there is no code.
      }
      reject(new UploadTransportError("Upload rejected.", request.status, code));
    };

    request.onerror = () => {
      cleanUp();
      reject(new UploadTransportError("The upload connection failed.", 0));
    };

    request.onabort = () => {
      cleanUp();
      reject(new UploadAbortedError("Upload cancelled."));
    };

    request.send(file);
  });
}
