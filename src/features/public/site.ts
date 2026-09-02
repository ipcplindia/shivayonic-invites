/** Canonical public site origin, used for metadata, sitemap and robots. */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://shivayonic.com";
