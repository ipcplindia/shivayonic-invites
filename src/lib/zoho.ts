import "server-only";

const TOKEN_URL = "https://accounts.zoho.in/oauth/v2/token";
const API_DOMAIN = "https://www.zohoapis.in";

export class ZohoError extends Error {
  constructor(public readonly code: "ZOHO_CONFIGURATION_INVALID" | "ZOHO_UNAVAILABLE" | "ZOHO_ORGANIZATION_MISMATCH") {
    super(code);
  }
}

function config() {
  const clientId = process.env.ZOHO_CLIENT_ID?.trim();
  const clientSecret = process.env.ZOHO_CLIENT_SECRET?.trim();
  const refreshToken = process.env.ZOHO_REFRESH_TOKEN?.trim();
  const organizationId = process.env.ZOHO_ORGANIZATION_ID?.trim();
  const domain = (process.env.ZOHO_API_DOMAIN ?? API_DOMAIN).replace(/\/$/, "");
  if (!clientId || !clientSecret || !refreshToken || !organizationId || !/^\d+$/.test(organizationId) || domain !== API_DOMAIN) {
    throw new ZohoError("ZOHO_CONFIGURATION_INVALID");
  }
  // ZOHO_REDIRECT_URI belongs to the initial authorization-code exchange;
  // Zoho does not require it for the refresh-token grant.
  return { clientId, clientSecret, refreshToken, organizationId, domain };
}

let cached: { token: string; expiresAt: number } | undefined;
let refreshing: Promise<string> | undefined;

async function refreshAccessToken(): Promise<string> {
  const settings = config();
  try {
    const response = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: settings.clientId,
        client_secret: settings.clientSecret,
        refresh_token: settings.refreshToken,
      }),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw new ZohoError("ZOHO_UNAVAILABLE");
    const data = await response.json();
    if (data.error || typeof data.access_token !== "string" || !data.access_token || typeof data.expires_in !== "number" || data.expires_in <= 0) {
      throw new ZohoError("ZOHO_UNAVAILABLE");
    }
    cached = { token: data.access_token, expiresAt: Date.now() + Math.max(0, data.expires_in - 60) * 1000 };
    return cached.token;
  } catch {
    // Never propagate upstream bodies, URLs, tokens, or fetch error causes.
    throw new ZohoError("ZOHO_UNAVAILABLE");
  }
}

export async function getZohoAccessToken(): Promise<string> {
  config();
  if (cached && Date.now() < cached.expiresAt) return cached.token;
  if (!refreshing) refreshing = refreshAccessToken().finally(() => { refreshing = undefined; });
  return refreshing;
}

/** Server-only JSON API client. Paths are relative to /books/v3. */
export async function zohoBooksFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const settings = config();
  const url = new URL(`${settings.domain}/books/v3${path}`);
  if (!path.startsWith("/") || path.startsWith("//") || url.origin !== API_DOMAIN || !url.pathname.startsWith("/books/v3/")) {
    throw new ZohoError("ZOHO_CONFIGURATION_INVALID");
  }
  url.searchParams.set("organization_id", settings.organizationId);
  const token = await getZohoAccessToken();
  try {
    const headers = new Headers(init.headers);
    headers.set("Authorization", `Zoho-oauthtoken ${token}`);
    headers.set("Accept", "application/json");
    if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
    const response = await fetch(url, {
      ...init, headers, cache: "no-store", redirect: "error",
      signal: init.signal ? AbortSignal.any([init.signal, AbortSignal.timeout(15_000)]) : AbortSignal.timeout(15_000),
    });
    if (response.status === 401 && cached?.token === token) cached = undefined;
    if (!response.ok) throw new ZohoError("ZOHO_UNAVAILABLE");
    const data = await response.json();
    if (data.code !== 0) throw new ZohoError("ZOHO_UNAVAILABLE");
    return data as T;
  } catch {
    throw new ZohoError("ZOHO_UNAVAILABLE");
  }
}

export async function verifyZohoOrganization(): Promise<void> {
  const { organizationId } = config();
  const data = await zohoBooksFetch<{ organization?: { organization_id?: string } }>(`/organizations/${organizationId}`);
  if (data.organization?.organization_id !== organizationId) throw new ZohoError("ZOHO_ORGANIZATION_MISMATCH");
}
