import { redirect } from "next/navigation";

import { getCurrentUserContext } from "@/auth/context";
import { PageHeader } from "@/components/ui";
import { can } from "@/features/access";
import { WebsiteContent } from "@/features/content/website-content-client";

export default async function WebsiteContentPage() {
  const context = await getCurrentUserContext();
  if (!can(context, "PUBLISH_CONTENT")) redirect("/admin");
  return <><PageHeader title="Website Content" lede="Publish a READY studio master without copying its bytes. Drafts stay private until published." /><WebsiteContent /></>;
}
