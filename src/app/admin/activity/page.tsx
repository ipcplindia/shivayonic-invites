import type { Metadata } from "next";
import { redirect } from "next/navigation";

import styles from "@/app/admin/admin.module.css";
import { getCurrentUserContext } from "@/auth/context";
import { Card, CardHeader, EmptyState, PageHeader } from "@/components/ui";
import { can } from "@/features/access";

export const metadata: Metadata = { title: "Activity" };

export default async function ActivityPage() {
  const context = await getCurrentUserContext();
  if (!can(context, "AUDIT_READ")) redirect("/admin");

  return (
    <>
      <PageHeader
        title="Activity"
        lede="A record of who changed what inside this organization."
      />

      <Card>
        <CardHeader
          title="Audit record"
          description="Sign-ins, permission changes and media lifecycle events."
        />
        <EmptyState
          icon="activity"
          title="No read endpoint for the audit record yet"
          body="Audit events are already written server-side, but no API exposes them to the interface. Once a scoped read endpoint exists, this becomes a filterable record of actor, action and time."
        />
      </Card>

      <p className={styles.note}>
        The audit record is summarised for operators. Internal identifiers, storage keys and request
        internals are never shown here.
      </p>
    </>
  );
}
