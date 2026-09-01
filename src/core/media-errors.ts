import { NextResponse } from "next/server";

export type MediaErrorCode =
  | "INVALID_MEDIA_INPUT"
  | "MEDIA_NOT_FOUND"
  | "MEDIA_STATE_INVALID"
  | "MEDIA_TYPE_NOT_ALLOWED"
  | "MEDIA_SIZE_INVALID"
  | "MEDIA_OBJECT_INVALID"
  | "MEDIA_STORAGE_UNAVAILABLE"
  | "RANGE_NOT_SATISFIABLE";

export class MediaError extends Error {
  constructor(public readonly code: MediaErrorCode, public readonly status: 400 | 404 | 409 | 413 | 415 | 416 | 422 | 503) {
    super(code);
  }
}

export function mediaErrorResponse(error: MediaError) {
  return NextResponse.json({ error: { code: error.code } }, { status: error.status });
}
