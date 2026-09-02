import { describe, expect, it } from "vitest";

import { decryptToken, encryptToken, tokenEncryptionKeyBytes } from "./token-encryption";

const key = "0123456789abcdef0123456789abcdef";

describe("token encryption", () => {
  it("round-trips tokens with authenticated encryption", () => {
    const encrypted = encryptToken("future-oauth-token", key);
    expect(encrypted).not.toContain("future-oauth-token");
    expect(decryptToken(encrypted, key)).toBe("future-oauth-token");
  });

  it("rejects malformed keys and tampered ciphertext", () => {
    expect(() => tokenEncryptionKeyBytes("too-short")).toThrow(/32 bytes/);
    const encrypted = encryptToken("token", key);
    expect(() => decryptToken(`${encrypted}x`, key)).toThrow("Invalid encrypted token.");
  });
});
