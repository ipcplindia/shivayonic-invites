import Link from "next/link";
import type { Metadata } from "next";

import styles from "@/app/admin/admin.module.css";
import { getCurrentUserContext } from "@/auth/context";
import { Icon } from "@/components/icon";
import { Card, CardHeader, EmptyState, PageHeader } from "@/components/ui";
import { loadOverview } from "@/features/admin/overview";

export const metadata: Metadata = { title: "Tasks" };

/**
 * Tasks are derived, not stored.
 *
 * There is no task table, so nothing is persisted and nothing is invented: the
 * queue is computed from states that are genuinely unfinished right now — a
 * failed upload, an unconfirmed one, a publication still in draft. A task
 * disappears from this list the moment the underlying record is resolved, which
 * is the correct behaviour for a derived queue. When agents can create work,
 * their items join this same list.
 */
export default async function TasksPage() {
  const context = await getCurrentUserContext();
  const overview = await loadOverview(context.organization.id).catch(() => null);
  const tasks = overview?.attention ?? [];

  return (
    <>
      <PageHeader
        title="Tasks"
        lede="Everything in the studio that is waiting on a decision or an action, derived from live records."
      />

      <p className={styles.moduleStatus}>
        <Icon name="lock" size={15} />
        <span>
          These tasks are computed from current records rather than stored, so none can be assigned,
          snoozed or dismissed yet. Each resolves by fixing the record it points at.
        </span>
      </p>

      <Card>
        <CardHeader
          title="Open queue"
          description={`${tasks.length} item${tasks.length === 1 ? "" : "s"} need attention.`}
        />
        {tasks.length > 0 ? (
          <ul className={styles.attentionList}>
            {tasks.map((task) => (
              <li key={task.id}>
                <Link href={task.href} className={styles.attentionRow} data-tone={task.tone}>
                  <span className={styles.attentionCount}>{task.count}</span>
                  <span className={styles.attentionText}>
                    <span className={styles.attentionLabel}>{task.label}</span>
                    <span className={styles.attentionDetail}>{task.detail}</span>
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
                ? "Nothing is failed, stalled or waiting to be published."
                : "The record store could not be read, so no queue is claimed here."
            }
          />
        )}
      </Card>
    </>
  );
}
