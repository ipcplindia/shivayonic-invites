import { describe, expect, it } from "vitest";

import { AppAuthError } from "@/auth/errors";
import { assertPublishableMedia, publicationCreateData } from "@/core/website-publication";
import { isPubliclyRenderable, publicPathsForPlacement, websitePublicationInputSchema, websitePublicationUpdateSchema } from "@/shared/website-publication";

describe("website publications", () => {
  const ready = { organizationId: "org_a", status: "READY", archivedAt: null };

  it("uses controlled placements and only revalidates their mapped public paths", () => {
    expect(websitePublicationInputSchema.safeParse({ mediaId: "ck1234567890123456789012345", placement: "OUR_WORK_GRID" }).success).toBe(true);
    expect(websitePublicationInputSchema.safeParse({ mediaId: "727c279e-0694-4dc2-9aa7-3c118da5f2f0", placement: "OUR_WORK_GRID" }).success).toBe(true);
    expect(websitePublicationInputSchema.safeParse({ mediaId: "ck1234567890123456789012345", placement: "/admin" }).success).toBe(false);
    expect(publicPathsForPlacement.OUR_WORK_GRID).toEqual(["/our-work"]);
  });

  it("rejects cross-organization, archived, and non-ready media before publication", () => {
    expect(() => assertPublishableMedia({ ...ready, organizationId: "org_b" }, "org_a")).toThrow(AppAuthError);
    expect(() => assertPublishableMedia({ ...ready, status: "PENDING_UPLOAD" }, "org_a")).toThrow("PUBLICATION_MEDIA_NOT_READY");
    expect(() => assertPublishableMedia({ ...ready, archivedAt: new Date() }, "org_a")).toThrow("PUBLICATION_MEDIA_NOT_READY");
  });

  it("never marks drafts, unpublished records, archived media, or non-ready media public", () => {
    expect(isPubliclyRenderable({ status: "PUBLISHED", mediaAsset: { status: "READY", archivedAt: null } })).toBe(true);
    expect(isPubliclyRenderable({ status: "DRAFT", mediaAsset: { status: "READY", archivedAt: null } })).toBe(false);
    expect(isPubliclyRenderable({ status: "UNPUBLISHED", mediaAsset: { status: "READY", archivedAt: null } })).toBe(false);
    expect(isPubliclyRenderable({ status: "PUBLISHED", mediaAsset: { status: "ARCHIVED", archivedAt: new Date() } })).toBe(false);
  });

  it("keeps organization and actor server-owned", () => {
    const data = publicationCreateData({ mediaId: "ck1234567890123456789012345", placement: "FILMS_FEATURED", title: undefined, description: undefined, altText: undefined, category: undefined, slug: undefined }, "owner_1");
    expect(data).toMatchObject({ createdByUserId: "owner_1", updatedByUserId: "owner_1" });
    expect(JSON.stringify(data)).not.toContain("organizationId");
  });

  it("allows publish and unpublish actions without resending placement metadata", () => {
    expect(websitePublicationUpdateSchema.safeParse({ action: "publish" }).success).toBe(true);
    expect(websitePublicationUpdateSchema.safeParse({ action: "unpublish" }).success).toBe(true);
  });
});
