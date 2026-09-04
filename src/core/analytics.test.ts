import { describe, expect, it } from "vitest";

import { AnalyticsProviderNotConfiguredError, instagramAnalyticsProvider, youtubeAnalyticsProvider } from "@/core/analytics";
import { ProviderNotConfiguredError, instagramPublishingProvider, youtubePublishingProvider } from "@/core/publishing";

describe("disconnected social providers", () => {
  it("never reports Instagram or YouTube publishing as successful", async () => {
    await expect(instagramPublishingProvider.validateConnection()).rejects.toBeInstanceOf(ProviderNotConfiguredError);
    await expect(youtubePublishingProvider.validateConnection()).rejects.toBeInstanceOf(ProviderNotConfiguredError);
  });

  it("never fabricates external analytics", async () => {
    await expect(instagramAnalyticsProvider.syncAccountMetrics()).rejects.toBeInstanceOf(AnalyticsProviderNotConfiguredError);
    await expect(youtubeAnalyticsProvider.syncPublicationMetrics()).rejects.toBeInstanceOf(AnalyticsProviderNotConfiguredError);
  });
});
