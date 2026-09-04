import "server-only";

import type { ContentPlatform } from "@/shared/content";

export class AnalyticsProviderNotConfiguredError extends Error {
  code = "PROVIDER_NOT_CONFIGURED" as const;
}

export type AnalyticsProvider = {
  platform: ContentPlatform;
  syncPublicationMetrics(): Promise<never>;
  syncAccountMetrics(): Promise<never>;
};

export const instagramAnalyticsProvider: AnalyticsProvider = {
  platform: "INSTAGRAM",
  async syncPublicationMetrics() { throw new AnalyticsProviderNotConfiguredError("Instagram analytics is not connected."); },
  async syncAccountMetrics() { throw new AnalyticsProviderNotConfiguredError("Instagram analytics is not connected."); },
};

export const youtubeAnalyticsProvider: AnalyticsProvider = {
  platform: "YOUTUBE",
  async syncPublicationMetrics() { throw new AnalyticsProviderNotConfiguredError("YouTube analytics is not connected."); },
  async syncAccountMetrics() { throw new AnalyticsProviderNotConfiguredError("YouTube analytics is not connected."); },
};
