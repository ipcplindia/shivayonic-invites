export const publicationPlatforms = ["WEBSITE", "YOUTUBE", "INSTAGRAM"] as const;
export type PublicationPlatform = (typeof publicationPlatforms)[number];
export type PublicationState = "DRAFT" | "UPLOADING" | "PROCESSING" | "READY" | "QUEUED" | "PUBLISHING" | "PUBLISHED" | "PARTIALLY_PUBLISHED" | "FAILED" | "CANCELLED";
