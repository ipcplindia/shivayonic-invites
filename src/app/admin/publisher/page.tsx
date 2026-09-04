import { redirect } from "next/navigation";

import { getCurrentUserContext } from "@/auth/context";
import { PageHeader } from "@/components/ui";
import { can } from "@/features/access";
import { Publisher } from "@/features/content/publisher-client";

export default async function PublisherPage() {
  const context = await getCurrentUserContext();
  if (!can(context, "PUBLISH_CONTENT")) redirect("/admin");
  return <><PageHeader title="Publisher" lede="One master, independent destination state. Website is operational; social providers are intentionally disconnected." /><Publisher /></>;
}
