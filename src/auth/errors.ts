import { NextResponse } from "next/server";

export type AppErrorCode =
  | "AUTHENTICATION_REQUIRED"
  | "SESSION_EXPIRED"
  | "INVALID_CREDENTIALS"
  | "ORGANIZATION_MEMBERSHIP_REQUIRED"
  | "PERMISSION_DENIED"
  | "ROLE_NOT_ALLOWED"
  | "RATE_LIMITED";

export class AppAuthError extends Error {
  constructor(
    public readonly code: AppErrorCode,
    public readonly status: 401 | 403 | 429,
  ) {
    super(code);
  }
}

export function authErrorResponse(error: AppAuthError) {
  return NextResponse.json({ error: { code: error.code } }, { status: error.status });
}
