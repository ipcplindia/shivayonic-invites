import type { NextConfig } from "next";

// Next's development server compiles with eval (HMR and React Refresh). Without
// this the dev bundle throws EvalError before hydration, so every client
// component on the site is inert — forms accept keystrokes that go nowhere.
// Production builds contain no eval, so the allowance never reaches the live site.
const devScriptSrc = process.env.NODE_ENV === "production" ? "" : " 'unsafe-eval'";

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  `script-src 'self' 'unsafe-inline'${devScriptSrc} https://www.googletagmanager.com https://connect.facebook.net`,
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  // i.ytimg.com serves the poster frame for every published film. Without it the
  // film tiles render as empty boxes.
  "img-src 'self' data: blob: https://i.ytimg.com https://*.backblazeb2.com https://www.facebook.com",
  "media-src 'self' blob: https://*.backblazeb2.com",
  "connect-src 'self' https://*.backblazeb2.com https://www.google-analytics.com https://region1.google-analytics.com https://www.facebook.com",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  ...(process.env.VERCEL_ENV === "production"
    ? [{ key: "Strict-Transport-Security", value: "max-age=31536000" }]
    : []),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/admin/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }] },
    ];
  },
};

export default nextConfig;
