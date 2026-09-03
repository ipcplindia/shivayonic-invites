import type { Metadata } from "next";
import { redirect } from "next/navigation";

import styles from "@/app/admin/admin.module.css";
import { getCurrentUserContext } from "@/auth/context";
import { Icon } from "@/components/icon";
import { Card, CardHeader, PageHeader } from "@/components/ui";
import { can } from "@/features/access";
import { IntegrationCards } from "@/features/admin/integration-cards";
import {
  isSystemConnected,
  systemStatuses,
  systemStatePresentation,
  type SystemGroup,
} from "@/features/admin/systems";

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
 * its capability genuinely works in this deployment, and a card offers a link
 * only where there is a real destination behind it.
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
        lede={`Every system this business runs on. ${connected} of ${systems.length} are connected today.`}
        title="Integrations"
      />

      <p className={styles.moduleStatus}>
        <Icon name="lock" size={15} />
        <span>
          Credentials are held on the server and are never displayed here. External providers are
          connected by configuring the deployment, not from this screen, so no card offers a setup
          button that would do nothing.
        </span>
      </p>

      {groupOrder.map((group) => {
        const members = systems.filter((system) => system.group === group);
        if (members.length === 0) return null;
        return (
          <Card key={group}>
            <CardHeader description={groupCopy[group].description} title={groupCopy[group].title} />
            <div className={styles.spotlightWrap}>
              <IntegrationCards
                systems={members.map((system) => ({
                  id: system.id,
                  name: system.name,
                  provider: system.provider,
                  capability: system.capability,
                  state: system.state,
                  stateLabel: systemStatePresentation[system.state].label,
                  icon: system.icon,
                  href: isSystemConnected(system) ? system.href : undefined,
                }))}
              />
            </div>
          </Card>
        );
      })}
    </>
  );
}
