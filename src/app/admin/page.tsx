import Link from "next/link";
import type { Metadata } from "next";

import styles from "@/app/admin/admin.module.css";
import { getCurrentUserContext } from "@/auth/context";
import { Icon } from "@/components/icon";
import { BentoGrid, type BentoItem } from "@/components/kokonutui/bento-grid";
import { StatusBadge } from "@/components/ui";
import { quickActionsFor } from "@/features/admin/actions";
import { loadOverview } from "@/features/admin/overview";
import { isSystemConnected, systemStatuses, systemStatePresentation } from "@/features/admin/systems";
import type { CurrentUserContext } from "@/shared/auth";

export const metadata: Metadata = { title: "Command Center" };

/**
 * The Command Center: one operating view of Shivayonic and Bholenath
 * Productions.
 *
 * The layout is KokonutUI's bento grid; every value inside it is a real count
 * from real rows, a real action that works today, or a truthful statement that
 * a system is not connected. There are no trends, projections, decorative
 * charts or invented alerts anywhere on this surface.
 */
export default async function CommandCenterPage() {
  const context = await getCurrentUserContext();

  // The dashboard degrades to its honest empty shape rather than erroring out
  // if the database is briefly unreachable; the health card then says so.
  const overview = await loadOverview(context.organization.id).catch(() => null);
  const systems = systemStatuses({ databaseReachable: overview !== null });
  const platform = systems.filter((s) => s.group === "platform" || s.group === "channel");
  const external = systems.filter((s) => s.group !== "platform");

  const metrics: BentoItem[] = [
    {
      id: "metric-media",
      title: "Media",
      description: "Masters held",
      href: "/admin/media",
      feature: "counter",
      statistic: { end: overview?.metrics.media ?? 0 },
    },
    {
      id: "metric-published",
      title: "Published",
      description: "Live on the website",
      href: "/admin/content",
      feature: "counter",
      statistic: { end: overview?.metrics.publications ?? 0 },
    },
    {
      id: "metric-projects",
      title: "Projects",
      description: "Organization projects",
      feature: "counter",
      statistic: { end: overview?.metrics.projects ?? 0 },
    },
    {
      id: "metric-catalogue",
      title: "Catalogue",
      description: "Public products",
      feature: "counter",
      statistic: { end: overview?.metrics.catalogue ?? 0 },
    },
  ];

  const held = overview?.pipeline.held ?? 0;
  const share = (value: number) => (held > 0 ? Math.round((value / held) * 100) : 0);

  const modules: BentoItem[] = [
    {
      id: "attention",
      title: "Needs attention",
      description: "Work the studio has actually left unfinished, counted from live records.",
      className: "md:col-span-4",
      children:
        overview && overview.attention.length > 0 ? (
          <ul className={styles.attentionList}>
            {overview.attention.map((entry) => (
              <li key={entry.id}>
                <Link className={styles.attentionRow} data-tone={entry.tone} href={entry.href}>
                  <span className={styles.attentionCount}>{entry.count}</span>
                  <span className={styles.attentionText}>
                    <span className={styles.attentionLabel}>{entry.label}</span>
                    <span className={styles.attentionDetail}>{entry.detail}</span>
                  </span>
                  <Icon className={styles.rowChevron} name="chevronRight" size={15} />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.cardEmpty}>
            {overview
              ? "All clear. Nothing is failed, stalled or waiting to be published."
              : "The record store could not be read, so no state is claimed here."}
          </p>
        ),
    },
    {
      id: "health",
      title: "System health",
      description: "What this deployment can actually do right now.",
      className: "md:col-span-2",
      children: (
        <>
          <ul className={styles.statusList}>
            {platform.map((system) => {
              const presentation = systemStatePresentation[system.state];
              return (
                <li className={styles.statusRow} key={system.id}>
                  <span className={styles.statusName}>{system.name}</span>
                  <StatusBadge
                    label={presentation.label}
                    shape={presentation.shape}
                    tone={presentation.tone}
                  />
                </li>
              );
            })}
          </ul>
          <Link className={styles.cardLink} href="/admin/integrations">
            All systems
          </Link>
        </>
      ),
    },
    {
      id: "pipeline",
      title: "Content pipeline",
      description:
        "Where the masters of this organization sit today. Each bar is that stage's real share of everything held.",
      className: "md:col-span-3",
      feature: "metrics",
      metrics: [
        {
          label: "Held",
          value: 100,
          display: String(held),
          color: "data" as const,
        },
        {
          label: "Ready",
          value: share(overview?.pipeline.ready ?? 0),
          display: String(overview?.pipeline.ready ?? 0),
          color: "health" as const,
        },
        {
          label: "Draft",
          value: share(overview?.pipeline.draft ?? 0),
          display: String(overview?.pipeline.draft ?? 0),
          color: "warn" as const,
        },
        {
          label: "Published",
          value: share(overview?.pipeline.published ?? 0),
          display: String(overview?.pipeline.published ?? 0),
          color: "primary" as const,
        },
      ],
      children: (
        <p className={styles.cardFootnote}>
          YouTube and Instagram join this pipeline when their channels are connected.
        </p>
      ),
    },
    {
      id: "activity",
      title: "Recent activity",
      description: "The last changes to media, publications and projects.",
      className: "md:col-span-3",
      children:
        overview && overview.activity.length > 0 ? (
          <ul className={styles.activityList}>
            {overview.activity.slice(0, 6).map((entry) => (
              <li key={entry.id}>
                <Link className={styles.activityRow} href={entry.href}>
                  <Icon
                    className={styles.rowChevron}
                    name={
                      entry.kind === "media"
                        ? "media"
                        : entry.kind === "publication"
                          ? "publish"
                          : "projects"
                    }
                    size={16}
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
          <p className={styles.cardEmpty}>
            Uploads, publications and project changes appear here as they happen.
          </p>
        ),
    },
    {
      id: "quick-actions",
      title: "Quick actions",
      description: "Everything here works today.",
      className: "md:col-span-2",
      children: (
        <div className={styles.quickActions}>
          {quickActionsFor(context).map((action) => (
            <Link className={styles.quickAction} href={action.href} key={action.label}>
              <Icon className={styles.quickActionIcon} name={action.icon} size={17} />
              <span className={styles.quickActionLabel}>{action.label}</span>
              <span className={styles.quickActionHint}>{action.hint}</span>
            </Link>
          ))}
        </div>
      ),
    },
    {
      id: "timeline",
      title: "Operations timeline",
      description: "Dated events from real records.",
      className: "md:col-span-2",
      feature: overview && overview.timeline.length > 0 ? "timeline" : undefined,
      timeline: overview?.timeline.map((entry) => ({
        year: formatDay(entry.at),
        event: `${entry.title} — ${entry.state}`,
      })),
      children:
        overview && overview.timeline.length > 0 ? null : (
          <p className={styles.cardEmpty}>
            The first website publication puts this timeline to work. No placeholder dates are
            shown.
          </p>
        ),
    },
    {
      id: "scope",
      title: "Business scope",
      description: `Every count on this page is for ${context.organization.name}.`,
      className: "md:col-span-2",
      feature: "spotlight",
      spotlightItems: [context.organization.name],
      children: (
        <p className={styles.cardFootnote}>
          Bholenath Productions and Shivayonic Music are not separate data scopes yet, so no
          cross-business figure is shown.
        </p>
      ),
    },
  ];

  return (
    <>
      <ExecutiveHeader context={context} />

      <BentoGrid className="grid-cols-2 md:grid-cols-4" items={metrics} />

      <BentoGrid items={modules} />

      <section aria-labelledby="performance-heading" className={styles.performance}>
        <h2 className={styles.performanceHeading} id="performance-heading">
          Business performance
        </h2>
        <p className={styles.performanceLede}>
          These measures need an external source. Each panel says which one, so nothing here is
          estimated in the meantime.
        </p>
        <div className={styles.performanceGrid}>
          {external.map((system) => {
            const presentation = systemStatePresentation[system.state];
            const connected = isSystemConnected(system);
            return (
              <Link
                className={styles.panel}
                href={connected && system.href ? system.href : "/admin/integrations"}
                key={system.id}
              >
                <span className={styles.panelTop}>
                  <Icon className={styles.panelIcon} name={system.icon} size={17} />
                  <span className={styles.panelName}>{system.name}</span>
                  <StatusBadge
                    label={presentation.label}
                    shape={presentation.shape}
                    tone={presentation.tone}
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
    </header>
  );
}

/** Stable, locale-independent day formatting so server and client agree. */
function formatDay(value: Date) {
  return value.toISOString().slice(0, 10);
}
