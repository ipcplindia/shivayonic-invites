import type { Metadata } from "next";
import { redirect } from "next/navigation";

import styles from "@/app/admin/admin.module.css";
import { getCurrentUserContext } from "@/auth/context";
import { Button, Card, EmptyState, PageHeader, SearchInput, Select } from "@/components/ui";
import { can } from "@/features/access";

export const metadata: Metadata = { title: "Projects" };

export default async function ProjectsPage() {
  const context = await getCurrentUserContext();
  if (!can(context, "PROJECT_READ")) redirect("/admin");

  const canWrite = can(context, "PROJECT_WRITE");

  return (
    <>
      <PageHeader
        title="Projects"
        lede="Every commission, from first brief to delivered invitation. A project groups the masters, the score and the publications that belong to one celebration."
      />

      <section aria-label="Projects">
        <div className={styles.toolbar}>
          <div className={styles.toolbarSearch}>
            <SearchInput
              label="Search projects"
              placeholder="Project search is not connected yet"
              disabled
              title="Search becomes available with the projects API."
            />
          </div>
          <Select
            label="Stage"
            hideLabel
            disabled
            title="Filtering becomes available with the projects API."
            options={[{ value: "", label: "All stages" }]}
          />
          <span className={styles.toolbarSpacer} />
          <Button
            variant="primary"
            icon="plus"
            disabled={!canWrite}
            aria-disabled
            title={
              canWrite
                ? "Project creation arrives with the projects API."
                : "Creating projects requires the PROJECT_WRITE permission."
            }
          >
            New project
          </Button>
        </div>

        <Card>
          <EmptyState
            icon="projects"
            title="Projects are not wired up yet"
            body="The read and write API for commissions has not shipped. When it does, projects appear here as a filterable list with their masters, scores and publication state."
          />
        </Card>
      </section>
    </>
  );
}
