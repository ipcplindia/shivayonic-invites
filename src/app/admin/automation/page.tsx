import type { Metadata } from "next";
import { redirect } from "next/navigation";

import styles from "@/app/admin/admin.module.css";
import { getCurrentUserContext } from "@/auth/context";
import { Icon } from "@/components/icon";
import { Card, CardHeader, EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { can } from "@/features/access";
import { isSystemConnected, systemStatuses, systemStatePresentation } from "@/features/admin/systems";
import type { Permission } from "@/shared/auth";

export const metadata: Metadata = { title: "Agent Center" };

/**
 * The Agent Center foundation.
 *
 * There is no agent runtime, so this page runs nothing and claims nothing. What
 * it does is genuinely useful before agents exist: it states which data an
 * agent could read, which actions the platform can actually perform today, and
 * which permissions would have to be delegated for each. That inventory is what
 * makes the eventual runtime safe to switch on.
 */

/** Actions that exist as implemented, authorised server capabilities today. */
const capabilities: Array<{ name: string; detail: string; permission: Permission }> = [
  {
    name: "Register and upload a master",
    detail: "Create a media record and complete a signed direct-to-storage upload.",
    permission: "MEDIA_WRITE",
  },
  {
    name: "Read the media library",
    detail: "List and filter masters, and issue time-limited private download links.",
    permission: "MEDIA_READ",
  },
  {
    name: "Publish a master to the website",
    detail: "Create, update, publish or withdraw a website publication for a placement.",
    permission: "PUBLISH_CONTENT",
  },
  {
    name: "Read the public catalogue",
    detail: "Products, categories, styles and collections as the public site sees them.",
    permission: "CATALOGUE_MANAGE",
  },
];

/** Agent roles the architecture is being shaped for. No state is invented for them. */
const agentRoles = [
  { name: "Operations Agent", detail: "Watches for failed uploads, stalled publications and unfinished records." },
  { name: "Content Agent", detail: "Prepares titles, alt text and placements for masters awaiting publication." },
  { name: "Publishing Agent", detail: "Delivers approved masters to each connected channel and reports failures." },
  { name: "Marketing Agent", detail: "Reads campaign performance and proposes budget and creative changes." },
  { name: "Analytics Agent", detail: "Summarises website, catalogue and content performance." },
  { name: "Finance Agent", detail: "Reconciles revenue, expenses and campaign spend." },
];

export default async function AgentCenterPage() {
  const context = await getCurrentUserContext();
  if (!can(context, "INTEGRATIONS_MANAGE")) redirect("/admin");

  const systems = systemStatuses({ databaseReachable: true });
  const dataSources = systems.filter((system) => system.group !== "automation");
  const connectedSources = dataSources.filter(isSystemConnected).length;

  return (
    <>
      <PageHeader
        title="Agent Center"
        lede="What an agent could read, what it could do, and what has to be connected before either is possible."
      />

      <p className={styles.moduleStatus}>
        <Icon name="lock" size={15} />
        <span>
          Automation runtime: not configured. Nothing on this page executes, schedules or queues any
          work, and no agent holds any permission.
        </span>
      </p>

      <section className={styles.metrics} aria-label="Runtime state">
        <article className={styles.metric} data-empty="true">
          <span className={styles.metricLabel}>Runtime</span>
          <strong className={styles.metricValue}>—</strong>
          <span className={styles.metricDetail}>Not configured</span>
        </article>
        <article className={styles.metric}>
          <span className={styles.metricLabel}>Data sources</span>
          <strong className={styles.metricValue}>
            {connectedSources}/{dataSources.length}
          </strong>
          <span className={styles.metricDetail}>Connected today</span>
        </article>
        <article className={styles.metric}>
          <span className={styles.metricLabel}>Actions available</span>
          <strong className={styles.metricValue}>{capabilities.length}</strong>
          <span className={styles.metricDetail}>Implemented server capabilities</span>
        </article>
        <article className={styles.metric} data-empty="true">
          <span className={styles.metricLabel}>Runs</span>
          <strong className={styles.metricValue}>—</strong>
          <span className={styles.metricDetail}>No run history exists</span>
        </article>
      </section>

      <div className={styles.bento}>
        <div className={styles.bentoMain}>
          <Card>
            <CardHeader
              title="Actions an agent could take"
              description="Each already exists as an authorised server capability, and would be delegated under the permission shown."
            />
            <ul className={styles.statusList}>
              {capabilities.map((capability) => (
                <li key={capability.name} className={styles.statusRow}>
                  <span className={styles.statusName}>
                    {capability.name}
                    <span className={styles.statusDetail}>{capability.detail}</span>
                  </span>
                  <code className={styles.permissionCode}>{capability.permission}</code>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <CardHeader
              title="Suggestions"
              description="Recommendations an agent would raise for approval."
            />
            <EmptyState
              icon="alert"
              title="No suggestions"
              body="Suggestions will appear when data sources are connected and the automation runtime is configured. None are generated in the meantime."
            />
          </Card>

          <Card>
            <CardHeader
              title="Agent roles"
              description="The shape the runtime is being designed for. None of these exists yet, so none reports a state."
            />
            <ul className={styles.statusList}>
              {agentRoles.map((role) => (
                <li key={role.name} className={styles.statusRow}>
                  <span className={styles.statusName}>
                    {role.name}
                    <span className={styles.statusDetail}>{role.detail}</span>
                  </span>
                  <StatusBadge label="Not built" tone="neutral" shape="square" />
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <div className={styles.bentoSide}>
          <Card>
            <CardHeader
              title="Data an agent could read"
              description="Read access follows these systems. An unconnected system is simply unreadable."
            />
            <ul className={styles.statusList}>
              {dataSources.map((system) => {
                const presentation = systemStatePresentation[system.state];
                return (
                  <li key={system.id} className={styles.statusRow}>
                    <span className={styles.statusName}>{system.name}</span>
                    <StatusBadge
                      label={presentation.label}
                      tone={presentation.tone}
                      shape={presentation.shape}
                    />
                  </li>
                );
              })}
            </ul>
          </Card>

          <Card>
            <CardHeader
              title="Background jobs"
              description="Scheduled and queued work."
            />
            <EmptyState
              icon="refresh"
              title="No job runner"
              body="Workflows, schedules and run history become available once an automation runtime is configured for this deployment."
            />
          </Card>
        </div>
      </div>
    </>
  );
}
