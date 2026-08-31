import Link from "next/link";
import type { Metadata } from "next";

import styles from "@/app/admin/admin.module.css";
import { getCurrentUserContext } from "@/auth/context";
import { Icon, type IconName } from "@/components/icon";
import {
  BrassRule,
  Card,
  CardHeader,
  EmptyState,
  PageHeader,
  StatusBadge,
} from "@/components/ui";
import { can } from "@/features/access";
import { RecentMedia } from "@/features/media/media-client";

export const metadata: Metadata = { title: "Overview" };

/**
 * The overview reports what the platform can actually do today. No invented
 * counts, no placeholder analytics — capability state and real recent media.
 */
export default async function OverviewPage() {
  const context = await getCurrentUserContext();

  const quickActions: Array<{ href: string; label: string; icon: IconName; hint: string }> = [
    ...(can(context, "MEDIA_READ")
      ? [
          {
            href: "/admin/media",
            label: "Open the Media Library",
            icon: "media" as IconName,
            hint: "Masters",
          },
        ]
      : []),
    ...(can(context, "PROJECT_READ")
      ? [
          {
            href: "/admin/projects",
            label: "Review projects",
            icon: "projects" as IconName,
            hint: "Commissions",
          },
        ]
      : []),
    {
      href: "/admin/settings",
      label: "Account and organization",
      icon: "settings" as IconName,
      hint: "Settings",
    },
  ];

  return (
    <>
      <PageHeader
        title={`Good to see you, ${context.user.name.split(" ")[0]}`}
        lede={`${context.organization.name} — the state of the studio: what is held, what is ready, and what is still waiting on an integration.`}
      />

      <div className={styles.columns}>
        <div className={styles.stack}>
          <RecentMedia />

          <Card>
            <CardHeader
              title="Publishing activity"
              description="Deliveries to the website and connected channels."
            />
            <EmptyState
              icon="publish"
              title="No publications yet"
              body="Publishing providers are not connected. Once a channel is live, every delivery and retry is recorded here."
            />
          </Card>
        </div>

        <div className={styles.stack}>
          <Card>
            <CardHeader title="Platform status" description="What is live in this deployment." />
            <ul className={styles.statusList}>
              <StatusRow name="Authentication and roles" state="live" />
              <StatusRow name="Master media storage" state="live" />
              <StatusRow name="Project records" state="partial" />
              <StatusRow name="Publishing providers" state="planned" />
              <StatusRow name="Release scheduling" state="planned" />
            </ul>
          </Card>

          <Card>
            <CardHeader title="Quick actions" />
            <div className={styles.quickActions}>
              {quickActions.map((action) => (
                <Link key={action.href} href={action.href} className={styles.quickAction}>
                  <Icon name={action.icon} size={18} className={styles.quickActionIcon} />
                  <span className={styles.quickActionLabel}>{action.label}</span>
                  <Icon name="chevronRight" size={14} className={styles.quickActionIcon} />
                </Link>
              ))}
            </div>
            <BrassRule />
          </Card>
        </div>
      </div>
    </>
  );
}

function StatusRow({ name, state }: { name: string; state: "live" | "partial" | "planned" }) {
  const presentation = {
    live: { label: "Live", tone: "success" as const, shape: "solid" as const },
    partial: { label: "Foundation", tone: "signal" as const, shape: "hollow" as const },
    planned: { label: "Not connected", tone: "neutral" as const, shape: "square" as const },
  }[state];

  return (
    <li className={styles.statusRow}>
      <span className={styles.statusName}>{name}</span>
      <StatusBadge label={presentation.label} tone={presentation.tone} shape={presentation.shape} />
    </li>
  );
}
