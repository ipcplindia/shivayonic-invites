import Link from "next/link";
import type { Metadata } from "next";

import styles from "@/app/admin/admin.module.css";
import { getCurrentUserContext } from "@/auth/context";
import { Icon } from "@/components/icon";
import { BentoGrid, type BentoItem } from "@/components/kokonutui/bento-grid";
import { PageHeader } from "@/components/ui";
import { loadOverview } from "@/features/admin/overview";

export const metadata: Metadata = { title: "Tasks" };

/**
 * Tasks are derived, not stored.
 *
 * There is no task table, so nothing is persisted and nothing is invented: the
 * queue is computed from states that are genuinely unfinished right now — a
 * failed upload, an unconfirmed one, a publication still in draft. A task
 * disappears the moment the underlying record is resolved, which is the correct
 * behaviour for a derived queue. When agents can create work, their items join
 * this same list.
 */
export default async function TasksPage() {
  const context = await getCurrentUserContext();
  const overview = await loadOverview(context.organization.id).catch(() => null);
  const tasks = overview?.attention ?? [];

  const byTone = (tone: string) => tasks.filter((task) => task.tone === tone);
  const blocking = byTone("danger");
  const waiting = byTone("warning");
  const review = byTone("signal");

  const cards: BentoItem[] = [
    {
      id: "queue",
      title: "Open queue",
      description: `${tasks.length} item${tasks.length === 1 ? "" : "s"} need attention, grouped by how much they are holding up.`,
      className: "md:col-span-4",
      children:
        tasks.length > 0 ? (
          <div className={styles.taskGroups}>
            <TaskGroup
              detail="A record is broken and the work cannot proceed until it is fixed."
              items={blocking}
              title="Blocking"
            />
            <TaskGroup
              detail="Started but never finished."
              items={waiting}
              title="Unfinished"
            />
            <TaskGroup
              detail="Ready for a decision about whether it goes public."
              items={review}
              title="Awaiting a decision"
            />
          </div>
        ) : (
          <p className={styles.cardEmpty}>
            {overview
              ? "All clear. Nothing is failed, stalled or waiting to be published."
              : "The record store could not be read, so no queue is claimed here."}
          </p>
        ),
    },
    {
      id: "counts",
      title: "Queue at a glance",
      description: "Each figure is a live count, not a stored tally.",
      className: "md:col-span-2",
      feature: "metrics",
      metrics: [
        {
          label: "Blocking",
          value: percentage(blocking, tasks),
          display: String(sum(blocking)),
          color: "destructive" as const,
        },
        {
          label: "Unfinished",
          value: percentage(waiting, tasks),
          display: String(sum(waiting)),
          color: "warn" as const,
        },
        {
          label: "Awaiting a decision",
          value: percentage(review, tasks),
          display: String(sum(review)),
          color: "data" as const,
        },
      ],
      children: (
        <p className={styles.cardFootnote}>
          Bars show each group&rsquo;s share of everything currently outstanding.
        </p>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        lede="Everything in the studio that is waiting on a decision or an action, derived from live records."
        title="Tasks"
      />

      <p className={styles.moduleStatus}>
        <Icon name="lock" size={15} />
        <span>
          These tasks are computed from current records rather than stored, so none can be assigned,
          snoozed or dismissed yet. Each resolves by fixing the record it points at.
        </span>
      </p>

      <BentoGrid items={cards} />
    </>
  );
}

function TaskGroup({
  title,
  detail,
  items,
}: {
  title: string;
  detail: string;
  items: Array<{ id: string; label: string; detail: string; count: number; href: string; tone: string }>;
}) {
  if (items.length === 0) return null;
  return (
    <section className={styles.taskGroup}>
      <header className={styles.taskGroupHead}>
        <h3 className={styles.taskGroupTitle}>{title}</h3>
        <p className={styles.taskGroupDetail}>{detail}</p>
      </header>
      <ul className={styles.attentionList}>
        {items.map((task) => (
          <li key={task.id}>
            <Link className={styles.attentionRow} data-tone={task.tone} href={task.href}>
              <span className={styles.attentionCount}>{task.count}</span>
              <span className={styles.attentionText}>
                <span className={styles.attentionLabel}>{task.label}</span>
                <span className={styles.attentionDetail}>{task.detail}</span>
              </span>
              <span className={styles.taskAction}>
                Resolve
                <Icon name="chevronRight" size={14} />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function sum(items: Array<{ count: number }>) {
  return items.reduce((total, item) => total + item.count, 0);
}

function percentage(group: Array<{ count: number }>, all: Array<{ count: number }>) {
  const total = sum(all);
  return total > 0 ? Math.round((sum(group) / total) * 100) : 0;
}
