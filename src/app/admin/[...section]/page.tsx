import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import styles from "@/app/admin/admin.module.css";
import { getCurrentUserContext } from "@/auth/context";
import { Icon } from "@/components/icon";
import { Card, CardHeader, EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { adminModule, type ModuleDefinition } from "@/features/admin/modules";
import { adminNavItem, canVisitAdminDestination } from "@/features/admin/navigation";
import { systemStatuses, systemStatePresentation } from "@/features/admin/systems";

/**
 * One server-rendered page serves every destination that has no bespoke
 * feature yet — so a business area costs a row of data rather than a tree of
 * blank files. Permission checks stay authoritative here.
 *
 * A destination registered in `adminModules` renders the full module landing:
 * the measures it will carry, the systems that must be connected first, and a
 * real link to where that connection is made. Anything else renders the plain
 * honest empty state.
 */
export default async function AdminModulePage({ params }: { params: Promise<{ section: string[] }> }) {
  const { section } = await params;
  const href = `/admin/${section.join("/")}`;
  const destination = adminNavItem(href);
  if (!destination) notFound();

  const context = await getCurrentUserContext();
  if (!canVisitAdminDestination(context, destination)) redirect("/admin");

  const landing = adminModule(href);
  if (!landing) {
    return (
      <>
        <PageHeader title={destination.title} lede={destination.lede} />
        <Card>
          <EmptyState
            icon={destination.icon}
            title="Not connected yet"
            body="This area has its route, navigation, loading boundary and server-side permission gate. Its data source has not shipped, so no numbers or actions are invented here."
          />
        </Card>
      </>
    );
  }

  return <ModuleLanding landing={landing} />;
}

function ModuleLanding({ landing }: { landing: ModuleDefinition }) {
  // The database is reachable: this request already resolved a user context
  // through it, so claiming otherwise here would be the inaccurate answer.
  const systems = systemStatuses({ databaseReachable: true });
  const required = landing.requires
    .map((id) => systems.find((system) => system.id === id))
    .filter((system): system is NonNullable<typeof system> => Boolean(system));

  return (
    <>
      <PageHeader title={landing.title} lede={landing.lede} />

      <p className={styles.moduleStatus}>
        <Icon name="lock" size={15} />
        <span>{landing.status}</span>
      </p>

      <section className={styles.metrics} aria-label={`${landing.title} measures`}>
        {landing.measures.map((measure) => (
          <article key={measure} className={styles.metric} data-empty="true">
            <span className={styles.metricLabel}>{measure}</span>
            <strong className={styles.metricValue}>—</strong>
            <span className={styles.metricDetail}>Awaiting a source</span>
          </article>
        ))}
      </section>

      <div className={styles.bento}>
        <div className={styles.bentoMain}>
          {required.length > 0 ? (
            <Card>
              <CardHeader
                title="Systems this workspace needs"
                description="The workspace activates as these connect. Their state is read from this deployment, not assumed."
              />
              <ul className={styles.statusList}>
                {required.map((system) => {
                  const presentation = systemStatePresentation[system.state];
                  return (
                    <li key={system.id} className={styles.statusRow}>
                      <span className={styles.statusName}>
                        {system.name}
                        <span className={styles.statusDetail}>{system.capability}</span>
                      </span>
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
          ) : null}

          <Card>
            <CardHeader
              title="Views this workspace will carry"
              description="Listed rather than linked, because a link to an empty screen is worse than none."
            />
            <ul className={styles.chipList}>
              {landing.views.map((view) => (
                <li key={view} className={styles.chip}>
                  {view}
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <div className={styles.bentoSide}>
          <Card>
            <CardHeader
              title="Possible sources"
              description="Any one of these can activate the workspace."
            />
            <ul className={styles.sourceList}>
              {landing.sources.map((source) => (
                <li key={source} className={styles.sourceRow}>
                  <Icon name="plus" size={14} className={styles.rowChevron} />
                  <span>{source}</span>
                </li>
              ))}
            </ul>
            <div className={styles.quickActions}>
              <Link href="/admin/integrations" className={styles.quickAction}>
                <Icon name="publish" size={17} className={styles.quickActionIcon} />
                <span className={styles.quickActionLabel}>Open Integrations</span>
                <Icon name="chevronRight" size={14} className={styles.quickActionIcon} />
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
