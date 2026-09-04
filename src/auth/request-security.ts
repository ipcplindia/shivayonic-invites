const ADMIN_ROOT = "/admin";

export function safeAdminRedirect(value: string | null | undefined) {
  if (!value || value.includes("\\") || Array.from(value).some((character) => {
    const code = character.charCodeAt(0);
    return code <= 31 || code === 127;
  })) return ADMIN_ROOT;
  try {
    let decoded = value;
    for (let pass = 0; pass < 2; pass += 1) decoded = decodeURIComponent(decoded);
    if (!decoded.startsWith(`${ADMIN_ROOT}/`) && decoded !== ADMIN_ROOT) return ADMIN_ROOT;
    if (decoded.startsWith("//")) return ADMIN_ROOT;
    const url = new URL(decoded, "https://admin.invalid");
    if (url.origin !== "https://admin.invalid") return ADMIN_ROOT;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return ADMIN_ROOT;
  }
}

export function isCrossOriginMutation(request: { method: string; headers: Headers; url: string }) {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method.toUpperCase())) return false;
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  if (!origin) return fetchSite === "cross-site";
  try {
    return new URL(origin).origin !== new URL(request.url).origin;
  } catch {
    return true;
  }
}

export function exceedsJsonLimit(headers: Headers, maxBytes = 64 * 1024) {
  const type = headers.get("content-type")?.toLowerCase() ?? "";
  const length = Number(headers.get("content-length"));
  return type.includes("application/json") && Number.isFinite(length) && length > maxBytes;
}

export function isPublicSignupPath(pathname: string) {
  return pathname === "/api/auth/sign-up" || pathname.startsWith("/api/auth/sign-up/");
}

export function isAllowedProductionHost(host: string | null, values: Array<string | undefined>) {
  const allowed = new Set(["shivayonic.com", "www.shivayonic.com"]);
  for (const value of values) {
    if (!value) continue;
    try {
      allowed.add(new URL(value.includes("://") ? value : `https://${value}`).hostname.toLowerCase());
    } catch {
      // Invalid deployment configuration cannot expand the allowlist.
    }
  }
  const hostname = host?.split(":")[0]?.toLowerCase();
  return Boolean(hostname && allowed.has(hostname));
}
