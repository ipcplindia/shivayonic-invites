import { redirect } from "next/navigation";

import { getCurrentUserContext } from "@/auth/context";
import { Card, CardHeader, EmptyState, PageHeader } from "@/components/ui";
import { prisma } from "@/db/client";
import { can } from "@/features/access";
import { PublisherJobs } from "@/features/content/publisher-jobs-client";

export default async function PublisherJobsPage() {
  const context = await getCurrentUserContext();
  if (!can(context, "PUBLISH_CONTENT")) redirect("/admin");
  const jobs = await prisma.publishJob.findMany({ where: { organizationId: context.organization.id }, include: { contentItem: { select: { title: true } }, createdBy: { select: { name: true, email: true } } }, orderBy: { createdAt: "desc" }, take: 100 });
  return <><PageHeader title="Publishing jobs" lede="Durable destination work. Scheduled jobs wait for a future serverless executor; no hidden worker runs today." />
    <Card><CardHeader title="Queue" description="Website jobs can complete now. Instagram and YouTube cannot enter the queue until connected." />
      {jobs.length ? <PublisherJobs jobs={jobs.map((job) => ({ ...job, scheduledFor: job.scheduledFor?.toISOString() ?? null }))} /> : <EmptyState icon="publish" title="No publishing jobs" body="Publish a Website destination to create the first truthful job record." />}
    </Card></>;
}
