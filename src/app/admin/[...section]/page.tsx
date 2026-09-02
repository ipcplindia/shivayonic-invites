import { notFound, redirect } from "next/navigation";

import { getCurrentUserContext } from "@/auth/context";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import { adminNavItem, canVisitAdminDestination } from "@/features/admin/navigation";

/**
 * One server-rendered placeholder handles every Task 2 destination that does
 * not have a live feature yet. Permission checks stay authoritative here.
 */
export default async function AdminPlaceholderPage({ params }: { params: Promise<{ section: string[] }> }) {
  const { section } = await params;
  const destination = adminNavItem(`/admin/${section.join("/")}`);
  if (!destination) notFound();

  const context = await getCurrentUserContext();
  if (!canVisitAdminDestination(context, destination)) redirect("/admin");

  return (
    <>
      <PageHeader title={destination.title} lede={destination.lede} />
      <Card>
        <EmptyState
          icon={destination.icon}
          title="Not connected yet"
          body="This operational area has its route, navigation, loading boundary and server-side permission gate. Its data source has not shipped, so no numbers or actions are invented here."
        />
      </Card>
    </>
  );
}
