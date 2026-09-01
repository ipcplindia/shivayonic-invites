import { describe, expect, it } from "vitest";
import { URLSearchParams } from "node:url";
import { maxMediaListLimit, pageMedia, parseMediaListRequest } from "./media-list";

describe("media list contract", () => {
  it("bounds filters and returns a cursor without duplication", () => {
    expect(parseMediaListRequest(new URLSearchParams("limit=2&kind=VIDEO&status=READY&q=master"))).toMatchObject({ limit: 2, kind: "VIDEO", status: "READY", q: "master" });
    expect(() => parseMediaListRequest(new URLSearchParams(`limit=${maxMediaListLimit + 1}`))).toThrow("INVALID_MEDIA_INPUT");
    expect(() => parseMediaListRequest(new URLSearchParams("kind=PDF"))).toThrow("INVALID_MEDIA_INPUT");
    const all = ["c", "b", "a"].map((id, index) => ({ id, createdAt: new Date(3 - index) }));
    const first = pageMedia(all, 2);
    expect(first.items.map((item) => item.id)).toEqual(["c", "b"]);
    expect(first.pageInfo).toMatchObject({ hasMore: true, nextCursor: expect.any(String) });
  });
});
