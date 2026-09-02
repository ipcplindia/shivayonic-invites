import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { Buffer } from "node:buffer";

const algorithm = "aes-256-gcm";

/** Accepts a 32-byte raw UTF-8 key or a base64/base64url-encoded 32-byte key. */
export function tokenEncryptionKeyBytes(value: string) {
  const raw = Buffer.from(value, "utf8");
  if (raw.byteLength === 32) return raw;
  if (!/^[A-Za-z0-9+/_-]+={0,2}$/.test(value)) throw new Error("TOKEN_ENCRYPTION_KEY must encode exactly 32 bytes.");
  const decoded = Buffer.from(value, "base64");
  if (decoded.byteLength !== 32) throw new Error("TOKEN_ENCRYPTION_KEY must encode exactly 32 bytes.");
  return decoded;
}

export function encryptToken(plaintext: string, key: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv(algorithm, tokenEncryptionKeyBytes(key), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return `v1.${iv.toString("base64url")}.${cipher.getAuthTag().toString("base64url")}.${ciphertext.toString("base64url")}`;
}

export function decryptToken(envelope: string, key: string) {
  const [version, rawIv, rawTag, rawCiphertext, extra] = envelope.split(".");
  if (version !== "v1" || !rawIv || !rawTag || !rawCiphertext || extra) throw new Error("Invalid encrypted token.");
  try {
    const decipher = createDecipheriv(algorithm, tokenEncryptionKeyBytes(key), Buffer.from(rawIv, "base64url"));
    decipher.setAuthTag(Buffer.from(rawTag, "base64url"));
    return Buffer.concat([decipher.update(Buffer.from(rawCiphertext, "base64url")), decipher.final()]).toString("utf8");
  } catch {
    throw new Error("Invalid encrypted token.");
  }
}
