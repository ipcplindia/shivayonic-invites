import { describe, expect, it } from "vitest";

import { exceedsJsonLimit, isAllowedProductionHost, isCrossOriginMutation, isPublicSignupPath, safeAdminRedirect } from "@/auth/request-security";

describe("admin redirect safety", () => {
  it.each([
    "https://evil.example/admin",
    "//evil.example/admin",
    "javascript:alert(1)",
    "data:text/html,bad",
    "/admin\\evil.example",
    "/%252f%252fevil.example",
    "/catalogue",
  ])("rejects %s", (value) => expect(safeAdminRedirect(value)).toBe("/admin"));

  it("accepts only an internal admin destination", () => {
    expect(safeAdminRedirect("/admin/media?status=READY")).toBe("/admin/media?status=READY");
  });
});

describe("request boundary", () => {
  it("rejects cross-origin mutations but permits same-origin requests and reads", () => {
    const headers = new Headers({ origin: "https://evil.example", "sec-fetch-site": "cross-site" });
    expect(isCrossOriginMutation({ method: "POST", headers, url: "https://www.shivayonic.com/api/media" })).toBe(true);
    headers.set("origin", "https://www.shivayonic.com");
    expect(isCrossOriginMutation({ method: "POST", headers, url: "https://www.shivayonic.com/api/media" })).toBe(false);
    expect(isCrossOriginMutation({ method: "GET", headers, url: "https://www.shivayonic.com/api/media" })).toBe(false);
  });

  it("blocks public signup paths", () => {
    expect(isPublicSignupPath("/api/auth/sign-up/email")).toBe(true);
    expect(isPublicSignupPath("/api/auth/sign-in/email")).toBe(false);
  });

  it("rejects oversized JSON by declared byte length", () => {
    expect(exceedsJsonLimit(new Headers({ "content-type": "application/json", "content-length": "65537" }))).toBe(true);
    expect(exceedsJsonLimit(new Headers({ "content-type": "application/json", "content-length": "1024" }))).toBe(false);
  });

  it("allows only canonical or Vercel-provided production hosts", () => {
    expect(isAllowedProductionHost("www.shivayonic.com", [])).toBe(true);
    expect(isAllowedProductionHost("deploy-shivayonic.vercel.app", ["deploy-shivayonic.vercel.app"])).toBe(true);
    expect(isAllowedProductionHost("127.0.0.1:3000", [])).toBe(false);
    expect(isAllowedProductionHost("evil.example", [])).toBe(false);
  });
});
