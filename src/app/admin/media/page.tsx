import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getCurrentUserContext } from "@/auth/context";
import { PageHeader } from "@/components/ui";
import { can } from "@/features/access";
import { MediaLibrary } from "@/features/media/media-client";

export const metadata: Metadata = { title: "Media Library" };

export default async function MediaPage() {
  const context = await getCurrentUserContext();
  // Navigation already hides this section without MEDIA_READ; a typed URL
  // should land somewhere sensible rather than on an interface that cannot load.
  if (!can(context, "MEDIA_READ")) redirect("/admin");

  return (
    <>
      <PageHeader
        title="Media Library"
        lede="Master files for every film, invitation and score held in the studio. Metadata only — the files themselves are served through signed, authenticated access."
      />
      <MediaLibrary canUpload={can(context, "MEDIA_WRITE")} />
    </>
  );
}
