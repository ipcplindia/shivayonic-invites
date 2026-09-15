import "server-only";

export class ZohoError extends Error {
  constructor(readonly code: "ZOHO_CONFIGURATION_INVALID" | "ZOHO_UNAVAILABLE" | "ZOHO_ORGANIZATION_MISMATCH") { super(code); }
}

type ZohoSettings = { clientId: string; clientSecret: string; refreshToken: string; organizationId: string; accountsBase: string; booksBase: string };

function httpsBase(value: string | undefined) {
  try { const url = new URL(value ?? ""); return url.protocol === "https:" ? url.toString().replace(/\/$/, "") : null; } catch { return null; }
}

function config(): ZohoSettings {
  const clientId = process.env.ZOHO_CLIENT_ID?.trim();
  const clientSecret = process.env.ZOHO_CLIENT_SECRET?.trim();
  const refreshToken = process.env.ZOHO_REFRESH_TOKEN?.trim();
  const organizationId = process.env.ZOHO_ORGANIZATION_ID?.trim();
  const accountsBase = httpsBase(process.env.ZOHO_ACCOUNTS_BASE_URL);
  const booksBase = httpsBase(process.env.ZOHO_BOOKS_BASE_URL);
  if (!clientId || !clientSecret || !refreshToken || !organizationId || !/^\d+$/.test(organizationId) || !accountsBase || !booksBase) throw new ZohoError("ZOHO_CONFIGURATION_INVALID");
  return { clientId, clientSecret, refreshToken, organizationId, accountsBase, booksBase };
}

let cached: { token: string; expiresAt: number } | undefined;
let refreshing: Promise<string> | undefined;

async function refreshAccessToken(): Promise<string> {
  const settings = config();
  try {
    const response = await fetch(`${settings.accountsBase}/oauth/v2/token`, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "refresh_token", client_id: settings.clientId, client_secret: settings.clientSecret, refresh_token: settings.refreshToken }), cache: "no-store", redirect: "error", signal: AbortSignal.timeout(15_000) });
    const data = await response.json().catch(() => null) as { access_token?: unknown; expires_in?: unknown } | null;
    if (!response.ok || typeof data?.access_token !== "string" || !data.access_token || typeof data.expires_in !== "number" || data.expires_in <= 0) throw new ZohoError("ZOHO_UNAVAILABLE");
    cached = { token: data.access_token, expiresAt: Date.now() + Math.max(0, data.expires_in - 60) * 1000 };
    return cached.token;
  } catch (error) { if (error instanceof ZohoError) throw error; throw new ZohoError("ZOHO_UNAVAILABLE"); }
}

export async function getZohoAccessToken() {
  config();
  if (cached && Date.now() < cached.expiresAt) return cached.token;
  if (!refreshing) refreshing = refreshAccessToken().finally(() => { refreshing = undefined; });
  return refreshing;
}

/** Server-only Books client. Only relative paths are accepted and organization scope is always attached. */
export async function zohoBooksFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const settings = config();
  if (!path.startsWith("/") || path.startsWith("//")) throw new ZohoError("ZOHO_CONFIGURATION_INVALID");
  const base = new URL(`${settings.booksBase}/`);
  const url = new URL(path.slice(1), base);
  if (url.origin !== base.origin || !url.pathname.startsWith(base.pathname)) throw new ZohoError("ZOHO_CONFIGURATION_INVALID");
  url.searchParams.set("organization_id", settings.organizationId);
  const token = await getZohoAccessToken();
  try {
    const headers = new Headers(init.headers);
    headers.set("Authorization", `Zoho-oauthtoken ${token}`); headers.set("Accept", "application/json");
    if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
    const response = await fetch(url, { ...init, headers, cache: "no-store", redirect: "error", signal: init.signal ? AbortSignal.any([init.signal, AbortSignal.timeout(15_000)]) : AbortSignal.timeout(15_000) });
    const data = await response.json().catch(() => null) as { code?: unknown } | null;
    if (response.status === 401 && cached?.token === token) cached = undefined;
    if (!response.ok || !data || (typeof data.code === "number" && data.code !== 0)) throw new ZohoError("ZOHO_UNAVAILABLE");
    return data as T;
  } catch (error) { if (error instanceof ZohoError) throw error; throw new ZohoError("ZOHO_UNAVAILABLE"); }
}

export async function verifyZohoOrganization() {
  const { organizationId } = config();
  const data = await zohoBooksFetch<{ organization?: { organization_id?: string } }>(`/organizations/${organizationId}`);
  if (data.organization?.organization_id !== organizationId) throw new ZohoError("ZOHO_ORGANIZATION_MISMATCH");
}
