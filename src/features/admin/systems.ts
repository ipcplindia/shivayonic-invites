import "server-only";

import type { IconName } from "@/components/icon";

/**
 * The single source of truth for "what is actually connected".
 *
 * Every connection state here is derived from something real — server
 * configuration, or the presence of an implemented capability in this codebase.
 * Nothing is asserted because it would look better on a dashboard, and no
 * secret or credential value is ever read into the returned shape.
 */

export type SystemState = "live" | "connected" | "available" | "configured" | "degraded" | "unconfigured";

export type SystemGroup = "platform" | "channel" | "advertising" | "finance" | "automation";

export type SystemStatus = {
  id: string;
  name: string;
  group: SystemGroup;
  icon: IconName;
  /** Who provides it. "—" when nothing is chosen yet. */
  provider: string;
  state: SystemState;
  /** What this system lets the business do today, stated honestly. */
  capability: string;
  /** Where the operator goes to use or configure it, when such a place exists. */
  href?: string;
};

export const systemStatePresentation: Record<
  SystemState,
  { label: string; tone: "success" | "signal" | "brass" | "warning" | "neutral"; shape: "solid" | "hollow" | "square" }
> = {
  live: { label: "Live", tone: "success", shape: "solid" },
  connected: { label: "Connected", tone: "success", shape: "solid" },
  available: { label: "Available", tone: "signal", shape: "hollow" },
  configured: { label: "Configured", tone: "signal", shape: "hollow" },
  degraded: { label: "Degraded", tone: "warning", shape: "hollow" },
  unconfigured: { label: "Not connected", tone: "neutral", shape: "square" },
};

/** True when a system can be used right now. */
export function isSystemConnected(status: SystemStatus) {
  return status.state === "live" || status.state === "connected" || status.state === "available" || status.state === "configured";
}

/**
 * Reads only non-secret shape from the environment: which storage driver is
 * selected, and whether a public URL is configured. Never the credentials.
 */
function storageStatus(): Pick<SystemStatus, "provider" | "state" | "capability"> {
  const driver = process.env.OBJECT_STORAGE_DRIVER ?? "local";
  if (driver === "s3") {
    const configured = Boolean(
      process.env.OBJECT_STORAGE_BUCKET &&
        process.env.OBJECT_STORAGE_ENDPOINT &&
        process.env.OBJECT_STORAGE_ACCESS_KEY_ID &&
        process.env.OBJECT_STORAGE_SECRET_ACCESS_KEY,
    );
    return configured
      ? {
          provider: "Backblaze B2 (S3 API)",
          state: "connected",
          capability: "Signed browser uploads and time-limited private downloads of master files.",
        }
      : {
          provider: "Backblaze B2 (S3 API)",
          state: "degraded",
          capability: "The S3 driver is selected but its bucket or credentials are incomplete.",
        };
  }
  return {
    provider: "Local disk",
    state: "degraded",
    capability: "Development storage on the server filesystem. Not suitable for production masters.",
  };
}

function emailStatus(): Pick<SystemStatus, "provider" | "state" | "capability"> {
  const configured = Boolean(process.env.RESEND_API_KEY && process.env.MAIL_FROM);
  return configured
    ? { provider: "Resend", state: "configured", capability: "Transactional delivery is configured; no key is exposed to this UI." }
    : { provider: "Resend", state: "unconfigured", capability: "Transactional delivery needs a server-side API key and verified sender." };
}

/**
 * `databaseReachable` is passed in by the caller, which has just run a real
 * query — this module does not open its own connection to guess.
 */
export function systemStatuses({ databaseReachable }: { databaseReachable: boolean }): SystemStatus[] {
  const storage = storageStatus();
  const email = emailStatus();
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL;

  return [
    {
      id: "website",
      name: "Website",
      group: "platform",
      icon: "publish",
      provider: siteUrl ? new URL(siteUrl).host : "—",
      state: siteUrl ? "live" : "unconfigured",
      capability: "The public Shivayonic site, served from this deployment.",
      href: "/admin/content",
    },
    {
      id: "database",
      name: "Database",
      group: "platform",
      icon: "archive",
      provider: "PostgreSQL",
      state: databaseReachable ? "connected" : "degraded",
      capability: "Media records, projects, publications, catalogue and audit history.",
    },
    {
      id: "storage",
      name: "Media storage",
      group: "platform",
      icon: "media",
      ...storage,
      href: "/admin/media",
    },
    {
      id: "auth",
      name: "Authentication & roles",
      group: "platform",
      icon: "lock",
      provider: "Better Auth",
      state: "live",
      capability: "Sessions, organization membership and per-permission authorisation.",
      href: "/admin/settings",
    },
    {
      id: "email",
      name: "Email",
      group: "platform",
      icon: "inbox",
      ...email,
    },
    {
      id: "website-publishing",
      name: "Website publishing",
      group: "channel",
      icon: "publish",
      provider: "Shivayonic",
      state: "available",
      capability: "Publish a READY master to a website placement without copying its bytes.",
      href: "/admin/content",
    },
    {
      id: "youtube",
      name: "YouTube",
      group: "channel",
      icon: "video",
      provider: "—",
      state: "unconfigured",
      capability: "Channel uploads, scheduling and performance. No channel is connected.",
    },
    {
      id: "instagram",
      name: "Instagram",
      group: "channel",
      icon: "image",
      provider: "—",
      state: "unconfigured",
      capability: "Reels, posts and scheduling. No account is connected.",
    },
    {
      id: "google-ads",
      name: "Google Ads",
      group: "advertising",
      icon: "activity",
      provider: "—",
      state: "unconfigured",
      capability: "Campaign spend and performance. No ad account is connected.",
    },
    {
      id: "meta-ads",
      name: "Meta Ads",
      group: "advertising",
      icon: "activity",
      provider: "—",
      state: "unconfigured",
      capability: "Campaign spend and performance. No ad account is connected.",
    },
    {
      id: "analytics",
      name: "Web analytics",
      group: "advertising",
      icon: "overview",
      provider: "—",
      state: "unconfigured",
      capability: "Traffic, sources and conversion. No analytics property is connected.",
    },
    {
      id: "finance",
      name: "Finance",
      group: "finance",
      icon: "archive",
      provider: "—",
      state: "unconfigured",
      capability: "Revenue, expenses, invoices and payouts. No finance source is configured.",
    },
    {
      id: "automation",
      name: "Automation runtime",
      group: "automation",
      icon: "refresh",
      provider: "—",
      state: "unconfigured",
      capability: "Background jobs, scheduled workflows and agent runs. No runtime is configured.",
    },
  ];
}
