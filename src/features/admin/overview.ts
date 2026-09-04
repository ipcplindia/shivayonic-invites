import "server-only";

import { prisma } from "@/db/client";

/**
 * Every number the Command Center shows comes from this module, and every one
 * of them is a real count against real rows. Nothing is estimated, trended or
 * projected — where a source does not exist yet the value is simply absent and
 * the interface renders an em dash rather than inventing one.
 */

export type AttentionItem = {
  id: string;
  label: string;
  detail: string;
  count: number;
  href: string;
  tone: "danger" | "warning" | "signal";
};

export type ActivityItem = {
  id: string;
  kind: "media" | "publication" | "project";
  title: string;
  detail: string;
  at: Date;
  href: string;
};

export type OverviewData = {
  metrics: { media: number; projects: number; publications: number; catalogue: number };
  pipeline: { held: number; ready: number; draft: number; published: number };
  attention: AttentionItem[];
  activity: ActivityItem[];
  timeline: Array<{ id: string; title: string; at: Date; state: string }>;
};

export async function loadOverview(
  organizationId: string,
  access: { canPublishContent: boolean; canManageCatalogue: boolean },
): Promise<OverviewData> {
  const [mediaByStatus, publicationsByStatus, projects, catalogue, recentMedia, recentPublications, recentProjects] =
    await Promise.all([
      prisma.mediaAsset.groupBy({
        by: ["status"],
        where: { organizationId, archivedAt: null },
        _count: { _all: true },
      }),
      prisma.websitePublication.groupBy({
        by: ["status"],
        where: { organizationId },
        _count: { _all: true },
      }),
      prisma.project.count({ where: { organizationId } }),
      prisma.publicProduct.count({ where: { status: "PUBLISHED" } }),
      prisma.mediaAsset.findMany({
        where: { organizationId, archivedAt: null },
        orderBy: { createdAt: "desc" },
        take: 6,
        select: { id: true, displayTitle: true, originalFilename: true, kind: true, status: true, createdAt: true },
      }),
      prisma.websitePublication.findMany({
        where: { organizationId },
        orderBy: { updatedAt: "desc" },
        take: 6,
        select: { id: true, title: true, placement: true, status: true, updatedAt: true, publishedAt: true },
      }),
      prisma.project.findMany({
        where: { organizationId },
        orderBy: { updatedAt: "desc" },
        take: 4,
        select: { id: true, name: true, status: true, updatedAt: true },
      }),
    ]);

  const mediaCount = (status: string) =>
    mediaByStatus.find((row) => row.status === status)?._count._all ?? 0;
  const publicationCount = (status: string) =>
    access.canPublishContent ? publicationsByStatus.find((row) => row.status === status)?._count._all ?? 0 : 0;
  const visiblePublications = access.canPublishContent ? recentPublications : [];

  const mediaTotal = mediaByStatus.reduce((total, row) => total + row._count._all, 0);
  const published = publicationCount("PUBLISHED");

  const attention: AttentionItem[] = [
    {
      id: "media-failed",
      label: "Media uploads failed",
      detail: "The master never reached storage. Re-upload from the library.",
      count: mediaCount("FAILED"),
      href: "/admin/media?status=FAILED",
      tone: "danger" as const,
    },
    {
      id: "media-pending",
      label: "Uploads not finished",
      detail: "A record exists but its bytes were never confirmed.",
      count: mediaCount("PENDING_UPLOAD"),
      href: "/admin/media?status=PENDING_UPLOAD",
      tone: "warning" as const,
    },
    {
      id: "publication-draft",
      label: "Publications still in draft",
      detail: "Prepared for the website but not visible to the public yet.",
      count: publicationCount("DRAFT"),
      href: "/admin/content",
      tone: "signal" as const,
    },
  ].filter((entry) => entry.count > 0);

  const activity: ActivityItem[] = [
    ...recentMedia.map((asset) => ({
      id: `media:${asset.id}`,
      kind: "media" as const,
      title: asset.displayTitle ?? asset.originalFilename,
      detail: `${asset.kind.toLowerCase()} · ${asset.status.replace(/_/g, " ").toLowerCase()}`,
      at: asset.createdAt,
      href: "/admin/media",
    })),
    ...visiblePublications.map((publication) => ({
      id: `publication:${publication.id}`,
      kind: "publication" as const,
      title: publication.title ?? "Untitled publication",
      detail: `${publication.placement.replace(/_/g, " ").toLowerCase()} · ${publication.status.toLowerCase()}`,
      at: publication.updatedAt,
      href: "/admin/content",
    })),
    ...recentProjects.map((project) => ({
      id: `project:${project.id}`,
      kind: "project" as const,
      title: project.name,
      detail: project.status.toLowerCase(),
      at: project.updatedAt,
      href: "/admin/projects",
    })),
  ]
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, 8);

  const timeline = visiblePublications
    .filter((publication) => publication.publishedAt)
    .map((publication) => ({
      id: publication.id,
      title: publication.title ?? "Untitled publication",
      at: publication.publishedAt as Date,
      state: publication.placement.replace(/_/g, " ").toLowerCase(),
    }))
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, 5);

  return {
    metrics: { media: mediaTotal, projects, publications: published, catalogue: access.canManageCatalogue ? catalogue : 0 },
    pipeline: {
      held: mediaTotal,
      ready: mediaCount("READY"),
      draft: publicationCount("DRAFT"),
      published,
    },
    attention,
    activity,
    timeline,
  };
}
