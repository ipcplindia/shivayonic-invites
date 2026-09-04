import { NextRequest, NextResponse } from "next/server";

import { exceedsJsonLimit, isAllowedProductionHost, isCrossOriginMutation, isPublicSignupPath } from "@/auth/request-security";

export function middleware(request: NextRequest) {
  if (
    process.env.VERCEL_ENV === "production" &&
    !isAllowedProductionHost(request.headers.get("host"), [
      process.env.NEXT_PUBLIC_APP_URL,
      process.env.BETTER_AUTH_URL,
      process.env.VERCEL_URL,
      process.env.VERCEL_BRANCH_URL,
      process.env.VERCEL_PROJECT_PRODUCTION_URL,
    ])
  ) {
    return NextResponse.json({ error: { code: "MISDIRECTED_REQUEST" } }, { status: 421 });
  }

  if (request.nextUrl.pathname.startsWith("/api/")) {
    if (isPublicSignupPath(request.nextUrl.pathname)) {
      return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
    }
    if (isCrossOriginMutation(request)) {
      return NextResponse.json({ error: { code: "CROSS_ORIGIN_REQUEST_REJECTED" } }, { status: 403 });
    }
    if (exceedsJsonLimit(request.headers)) {
      return NextResponse.json({ error: { code: "PAYLOAD_TOO_LARGE" } }, { status: 413 });
    }
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete("x-shivayonic-admin-login");
  requestHeaders.delete("x-shivayonic-method");
  requestHeaders.delete("x-shivayonic-route");
  requestHeaders.delete("x-shivayonic-request-path");
  requestHeaders.set("x-shivayonic-method", request.method.toUpperCase());
  requestHeaders.set("x-shivayonic-route", request.nextUrl.pathname);
  requestHeaders.set("x-shivayonic-request-path", `${request.nextUrl.pathname}${request.nextUrl.search}`);
  if (request.nextUrl.pathname === "/admin/login") requestHeaders.set("x-shivayonic-admin-login", "1");

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  if (request.nextUrl.pathname.startsWith("/admin") || !request.nextUrl.pathname.startsWith("/api/public/")) {
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
  }
  return response;
}

export const config = { matcher: ["/admin/:path*", "/api/:path*"] };
