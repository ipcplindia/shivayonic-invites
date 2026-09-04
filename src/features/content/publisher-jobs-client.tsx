"use client";

import { useMemo, useState } from "react";

import { DataTable, SearchInput, Select, StatusBadge } from "@/components/ui";

type Job = { id: string; provider: string; status: string; attempt: number; scheduledFor: string | null; contentItem: { title: string }; createdBy: { name: string | null; email: string } };

export function PublisherJobs({ jobs }: { jobs: Job[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [provider, setProvider] = useState("ALL");
  const rows = useMemo(() => jobs.filter((job) =>
    (status === "ALL" || job.status === status) &&
    (provider === "ALL" || job.provider === provider) &&
    job.contentItem.title.toLowerCase().includes(query.trim().toLowerCase()),
  ), [jobs, provider, query, status]);
  return <>
    <SearchInput label="Search publishing jobs" placeholder="Search content" value={query} onChange={(event) => setQuery(event.target.value)} />
    <Select label="Status" value={status} onChange={(event) => setStatus(event.target.value)} options={["ALL", "QUEUED", "PROCESSING", "PUBLISHED", "FAILED", "CANCELLED"].map((value) => ({ value, label: value }))} />
    <Select label="Provider" value={provider} onChange={(event) => setProvider(event.target.value)} options={["ALL", "WEBSITE", "INSTAGRAM", "YOUTUBE"].map((value) => ({ value, label: value }))} />
    <DataTable caption="Publishing jobs" rows={rows} rowKey={(job) => job.id} columns={[
      { key: "content", header: "Content", render: (job) => job.contentItem.title },
      { key: "platform", header: "Platform", render: (job) => job.provider },
      { key: "status", header: "Status", render: (job) => <StatusBadge label={job.status} tone={job.status === "PUBLISHED" ? "success" : job.status === "FAILED" ? "danger" : "warning"} /> },
      { key: "attempt", header: "Attempts", numeric: true, render: (job) => String(job.attempt) },
      { key: "scheduled", header: "Scheduled", render: (job) => job.scheduledFor?.slice(0, 16) ?? "Now" },
      { key: "owner", header: "Owner", render: (job) => job.createdBy.name || job.createdBy.email },
    ]} />
  </>;
}
