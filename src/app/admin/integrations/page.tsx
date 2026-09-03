import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import styles from "@/app/admin/admin.module.css";
import { getCurrentUserContext } from "@/auth/context";
import { Icon } from "@/components/icon";
import { Card, CardHeader, PageHeader, StatusBadge } from "@/components/ui";
import { can } from "@/features/access";
import { isSystemConnected, systemStatuses, type SystemGroup } from "@/features/admin/systems";
import { systemStatePresentation } from "@/features/admin/systems";

export const metadata: Metadata = { title: "Integrations" };

const groupCopy: Record<SystemGroup, { title: string; description: string }> = {
  platform: {
    title: "Platform",
    description: "The systems this deployment runs on. Their state is read from the running server.",
  },
  channel: {
    title: "Publishing channels",
    description: "Where a finished master can be delivered.",
  },
  advertising: {
    title: "Advertising and analytics",
    description: "Sources for campaign spend, reach and website performance.",
  },
  finance: { title: "Finance", description: "Sources for revenue, cost and cash position." },
  automation: {
    title: "Automation",
    description: "The runtime that would execute workflows, background jobs and agent runs.",
  },
};

const groupOrder: SystemGroup[] = ["platform", "channel", "advertising", "finance", "automation"];

/**
 * The Integrations Centre is useful on day one: it is the honest inventory of
 * every system the business depends on, what each one currently does, and
 * whether it is actually connected.
 *
 * Credentials are held server-side and are never read into this page — not even
 * to say whether a particular key exists. A system reports connected only when
 * its capability genuinely works in this deployment.
 */
export default async function IntegrationsPage() {
  const context = await getCurrentUserContext();
  if (!can(context, "INTEGRATIONS_MANAGE")) redirect("/admin");

  // Resolving the user context above required a database round trip.
  const systems = systemStatuses({ databaseReachable: true });
  const connected = systems.filter(isSystemConnected).length;

  return (
    <>
      <PageHeader
        title="Integrations"
        lede={`Every system this business runs on. ${connected} of ${systems.length} are connected today.`}
      />

      <p className={styles.moduleStatus}>
        <Icon name="lock" size={15} />
        <span>
          Credentials are held on the server and are never displayed here. External providers are
          connected by configuring the deployment, not from this screen.
        </span>
      </p>

      {groupOrder.map((group) => {
        const members = systems.filter((system) => system.group === group);
        if (members.length === 0) return null;
        return (
          <Card key={group}>
            <CardHeader title={groupCopy[group].title} description={groupCopy[group].description} />
            <ul className={styles.integrationGrid}>
              {members.map((system) => {
                const presentation = systemStatePresentation[system.state];
                const usable = isSystemConnected(system) && system.href;
                return (
                  <li key={system.id} className={styles.integration}>
                    <span className={styles.panelTop}>
                      <Icon name={system.icon} size={17} className={styles.panelIcon} />
                      <span className={styles.panelName}>{system.name}</span>
                      <StatusBadge
                        label={presentation.label}
                        tone={presentation.tone}
                        shape={presentation.shape}
                      />
                    </span>
                    <dl className={styles.integrationMeta}>
                      <dt>Provider</dt>
                      <dd>{system.provider}</dd>
                      <dt>Capability</dt>
                      <dd>{system.capability}</dd>
                    </dl>
                    {usable ? (
                      <Link href={system.href as string} className={styles.panelAction}>
                        Open
                        <Icon name="chevronRight" size={14} />
                      </Link>
                    ) : (
                      <span className={styles.integrationNote}>
                        Connect by configuring this deployment. No setup flow exists here yet.
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </Card>
        );
      })}
    </>
  );
}
