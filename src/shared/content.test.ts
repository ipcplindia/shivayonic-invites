import { describe, expect, it } from "vitest";

import { destinationInputSchema } from "@/shared/content";

describe("unified content inputs", () => {
  it("accepts Website metadata and rejects fake provider shapes", () => {
    expect(destinationInputSchema.safeParse({ platform: "WEBSITE", enabled: true, metadata: { placement: "OUR_WORK_GRID", title: "Studio film" } }).success).toBe(true);
    expect(destinationInputSchema.safeParse({ platform: "INSTAGRAM", enabled: true, metadata: { placement: "OUR_WORK_GRID" } }).success).toBe(false);
  });

  it("keeps external provider metadata explicit", () => {
    expect(destinationInputSchema.safeParse({ platform: "YOUTUBE", metadata: { format: "VIDEO", privacy: "UNLISTED", madeForKids: false } }).success).toBe(true);
    expect(destinationInputSchema.safeParse({ platform: "YOUTUBE", metadata: { format: "VIDEO", privacy: "UNLISTED" } }).success).toBe(false);
  });
});
