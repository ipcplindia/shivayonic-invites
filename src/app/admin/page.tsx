import Link from "next/link";
import type { Metadata } from "next";

import styles from "@/app/admin/admin.module.css";
import { getCurrentUserContext } from "@/auth/context";
import { Icon } from "@/components/icon";
import { Card, CardHeader, EmptyState, StatusBadge } from "@/components/ui";
import { quickActionsFor } from "@/features/admin/actions";
import { loadOverview } from "@/features/admin/overview";
import { isSystemConnected, systemStatuses, systemStatePresentation } from "@/features/admin/systems";
import type { CurrentUserContext } from "@/shared/auth";

export const metadata: Metadata = { title: "Command Center" };

/**
 * The Command Center: one operating view of Shivayonic and Bholenath
 * Productions.
 *
 * Every module on this page is one of three honest things — a real count from
 * real rows, a real action that works today, or a truthful statement that a
 * system is not connected and where to connect it. There are no trends,
 * projections, decorative charts or invented alerts anywhere on this surface.
 */
export default async function CommandCenterPage() {
  const context = await getCurrentUserContext();

  // The dashboard degrades to its honest empty shape rather than erroring out
  // if the database is briefly unreachable; the health panel then says so.
  const overview = await loadOverview(context.organization.id).catch(() => null);
  const systems = systemStatuses({ databaseReachable: overview !== null });

  return (
    <>
      <ExecutiveHeader context={context} />

      <section className={styles.metrics} aria-label="Operating metrics">
        <Metric label="Media" value={overview?.metrics.media} detail="Masters held" href="/admin/media" />
        <Metric
          label="Published"
          value={overview?.metrics.publications}
          detail="Live on the website"
          href="/admin/content"
        />
        <Metric label="Projects" value={overview?.metrics.projects} detail="Organization projects" />
        <Metric label="Catalogue" value={overview?.metrics.catalogue} detail="Public products" />
      </section>

      <div className={styles.bento}>
        <div className={styles.bentoMain}>
          <Card>
            <CardHeader
              title="Needs attention"
              description="Work the studio has actually left unfinished, counted from live records."
            />
            {overview && overview.attention.length > 0 ? (
              <ul className={styles.attentionList}>
                {overview.attention.map((entry) => (
                  <li key={entry.id}>
                    <Link href={entry.href} className={styles.attentionRow} data-tone={entry.tone}>
                      <span className={styles.attentionCount}>{entry.count}</span>
                      <span className={styles.attentionText}>
                        <span className={styles.attentionLabel}>{entry.label}</span>
                        <span className={styles.attentionDetail}>{entry.detail}</span>
                      </span>
                      <Icon name="chevronRight" size={15} className={styles.rowChevron} />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon="check"
                title={overview ? "All clear" : "Records unavailable"}
                body={
                  overview
                    ? "Nothing in the studio is failed, stalled or waiting to be published."
                    : "The record store could not be read, so no state is claimed here."
                }
              />
            )}
          </Card>

          <Card>
            <CardHeader
              title="Content pipeline"
              description="Where the masters of this organization currently sit, from arrival to public."
            />
            <ol className={styles.pipeline}>
              <PipelineStage label="Held" value={overview?.pipeline.held} detail="Masters in storage" />
              <PipelineStage label="Ready" value={overview?.pipeline.ready} detail="Processed and usable" />
              <PipelineStage label="Draft" value={overview?.pipeline.draft} detail="Prepared for the site" />
              <PipelineStage label="Published" value={overview?.pipeline.published} detail="Live on the website" />
              <PipelineStage label="YouTube" value={null} detail="Channel not connected" />
              <PipelineStage label="Instagram" value={null} detail="Account not connected" />
            </ol>
          </Card>

          <Card>
            <CardHeader
              title="Recent activity"
              description="The last changes to media, publications and projects in this organization."
            />
            {overview && overview.activity.length > 0 ? (
              <ul className={styles.activityList}>
                {overview.activity.map((entry) => (
                  <li key={entry.id}>
                    <Link href={entry.href} className={styles.activityRow}>
                      <Icon
                        name={
                          entry.kind === "media"
                            ? "media"
                            : entry.kind === "publication"
                              ? "publish"
                              : "projects"
                        }
                        size={16}
                        className={styles.rowChevron}
                      />
                      <span className={styles.activityText}>
                        <span className={styles.activityTitle}>{entry.title}</span>
                        <span className={styles.activityDetail}>{entry.detail}</span>
                      </span>
                      <time className={styles.activityTime} dateTime={entry.at.toISOString()}>
                        {formatDay(entry.at)}
                      </time>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon="activity"
                title="Nothing recorded yet"
                body="Uploads, publications and project changes appear here as they happen."
              />
            )}
          </Card>
        </div>

        <div className={styles.bentoSide}>
          <Card>
            <CardHeader title="Quick actions" />
            <div className={styles.quickActions}>
              {quickActionsFor(context).map((action) => (
                <Link key={action.label} href={action.href} className={styles.quickAction}>
                  <Icon name={action.icon} size={17} className={styles.quickActionIcon} />
                  <span className={styles.quickActionLabel}>{action.label}</span>
                  <span className={styles.quickActionHint}>{action.hint}</span>
                </Link>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader
              title="System health"
              description="What this deployment can actually do right now."
              action={
                <Link href="/admin/integrations" className={styles.cardLink}>
                  All systems
                </Link>
              }
            />
            <ul className={styles.statusList}>
              {systems
                .filter((system) => system.group === "platform" || system.group === "channel")
                .map((system) => {
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
              title="Operations timeline"
              description="Dated events from real records. Campaigns and scheduled posts join this once their channels are connected."
            />
            {overview && overview.timeline.length > 0 ? (
              <ol className={styles.timeline}>
                {overview.timeline.map((entry) => (
                  <li key={entry.id} className={styles.timelineRow}>
                    <time className={styles.timelineDate} dateTime={entry.at.toISOString()}>
                      {formatDay(entry.at)}
                    </time>
                    <span className={styles.timelineTitle}>{entry.title}</span>
                    <span className={styles.timelineMeta}>{entry.state}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <EmptyState
                icon="schedule"
                title="No dated events yet"
                body="The first website publication puts this timeline to work. No placeholder dates are shown."
              />
            )}
          </Card>
        </div>
      </div>

      <section aria-labelledby="performance-heading" className={styles.performance}>
        <h2 id="performance-heading" className={styles.performanceHeading}>
          Business performance
        </h2>
        <p className={styles.performanceLede}>
          These measures need an external source. Each panel says which one, so nothing here is
          estimated in the meantime.
        </p>
        <div className={styles.performanceGrid}>
          {systems
            .filter((system) => system.group !== "platform")
            .map((system) => {
              const presentation = systemStatePresentation[system.state];
              const connected = isSystemConnected(system);
              return (
                <Link
                  key={system.id}
                  href={connected && system.href ? system.href : "/admin/integrations"}
                  className={styles.panel}
                >
                  <span className={styles.panelTop}>
                    <Icon name={system.icon} size={17} className={styles.panelIcon} />
                    <span className={styles.panelName}>{system.name}</span>
                    <StatusBadge
                      label={presentation.label}
                      tone={presentation.tone}
                      shape={presentation.shape}
                    />
                  </span>
                  <span className={styles.panelBody}>{system.capability}</span>
                  <span className={styles.panelAction}>
                    {connected && system.href ? "Open" : "Configure in Integrations"}
                    <Icon name="chevronRight" size={14} />
                  </span>
                </Link>
              );
            })}
        </div>
      </section>
    </>
  );
}

/* ------------------------------------------------------------------ Header */

/**
 * The business scope is shown, not offered as a control: this deployment holds
 * a single organization and there is no server-side scope switching, so a
 * working selector would be a lie. The other divisions are named as what they
 * are — not yet separate scopes.
 */
function ExecutiveHeader({ context }: { context: CurrentUserContext }) {
  return (
    <header className={styles.exec}>
      <div className={styles.execText}>
        <p className={styles.execScope}>
          <span className={styles.execScopeCurrent}>{context.organization.name}</span>
          <Icon name="chevronRight" size={13} />
          <span>Command Center</span>
        </p>
        <h1 className={styles.execTitle}>Good to see you, {context.user.name.split(" ")[0]}</h1>
        <p className={styles.execLede}>
          A live operating view of Shivayonic and Bholenath Productions.
        </p>
      </div>
      <p className={styles.execNote}>
        <Icon name="lock" size={14} />
        <span>
          Bholenath Productions and Shivayonic Music are not separate data scopes yet. Every count on
          this page is for {context.organization.name}.
        </span>
      </p>
    </header>
  );
}

/* ------------------------------------------------------------------ Pieces */

function Metric({
  label,
  value,
  detail,
  href,
}: {
  label: string;
  value: number | null | undefined;
  detail: string;
  href?: string;
}) {
  const body = (
    <>
      <span className={styles.metricLabel}>{label}</span>
      <strong className={styles.metricValue}>{value ?? "—"}</strong>
      <span className={styles.metricDetail}>{detail}</span>
    </>
  );
  return href ? (
    <Link href={href} className={`${styles.metric} ${styles.metricLink}`}>
      {body}
    </Link>
  ) : (
    <article className={styles.metric}>{body}</article>
  );
}

function PipelineStage({
  label,
  value,
  detail,
}: {
  label: string;
  value: number | null | undefined;
  detail: string;
}) {
  return (
    <li className={styles.pipelineStage} data-empty={value == null ? "true" : "false"}>
      <span className={styles.pipelineValue}>{value ?? "—"}</span>
      <span className={styles.pipelineLabel}>{label}</span>
      <span className={styles.pipelineDetail}>{detail}</span>
    </li>
  );
}

/** Stable, locale-independent day formatting so server and client agree. */
function formatDay(value: Date) {
  return value.toISOString().slice(0, 10);
}
