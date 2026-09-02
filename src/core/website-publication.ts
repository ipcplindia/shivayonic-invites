import { AppAuthError } from "@/auth/errors";
import type { WebsitePublicationInput } from "@/shared/website-publication";

export function assertPublishableMedia(media: { organizationId: string; status: string; archivedAt: Date | null }, organizationId: string) {
  if (media.organizationId !== organizationId) throw new AppAuthError("ORGANIZATION_MEMBERSHIP_REQUIRED", 403);
  if (media.status !== "READY" || media.archivedAt) throw new Error("PUBLICATION_MEDIA_NOT_READY");
}

export function publicationCreateData(input: WebsitePublicationInput, actorUserId: string) {
  return { ...input, createdByUserId: actorUserId, updatedByUserId: actorUserId };
}
