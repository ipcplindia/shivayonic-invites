import { z } from "zod";

import { tokenEncryptionKeyBytes } from "@/core/token-encryption";

const serverSchema = z.object({
  DATABASE_URL: z.string().url().startsWith("postgres"),
  OBJECT_STORAGE_DRIVER: z.enum(["local", "s3"]).default("local"),
  LOCAL_MEDIA_STORAGE_PATH: z.string().min(1).default(".shivayonic-media"),
  OBJECT_STORAGE_ENDPOINT: z.string().url().optional(),
  OBJECT_STORAGE_BUCKET: z.string().min(1).optional(),
  OBJECT_STORAGE_ACCESS_KEY_ID: z.string().min(1).optional(),
  OBJECT_STORAGE_SECRET_ACCESS_KEY: z.string().min(1).optional(),
  OBJECT_STORAGE_REGION: z.string().min(1).default("us-east-1"),
  OBJECT_STORAGE_FORCE_PATH_STYLE: z.enum(["true", "false"]).default("true"),
  TOKEN_ENCRYPTION_KEY: z.string().superRefine((value, context) => {
    try { tokenEncryptionKeyBytes(value); } catch { context.addIssue({ code: "custom", message: "TOKEN_ENCRYPTION_KEY must encode exactly 32 bytes." }); }
  }),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url(),
  PUBLIC_ORGANIZATION_SLUG: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).default("shivayonic"),
  ADMIN_BOOTSTRAP_EMAIL: z.string().email().optional(),
  ADMIN_BOOTSTRAP_NAME: z.string().min(1).optional(),
  ADMIN_BOOTSTRAP_PASSWORD: z.string().min(12).max(128).optional(),
  ADMIN_BOOTSTRAP_ORG_NAME: z.string().min(1).optional(),
  ADMIN_BOOTSTRAP_ORG_SLUG: z.string().min(1).optional(),
}).superRefine((value, context) => {
  if (process.env.NODE_ENV === "production" && value.OBJECT_STORAGE_DRIVER !== "s3") {
    context.addIssue({ code: "custom", path: ["OBJECT_STORAGE_DRIVER"], message: "OBJECT_STORAGE_DRIVER must be s3 in production." });
  }
  if (value.OBJECT_STORAGE_DRIVER === "s3") {
    for (const key of ["OBJECT_STORAGE_ENDPOINT", "OBJECT_STORAGE_BUCKET", "OBJECT_STORAGE_ACCESS_KEY_ID", "OBJECT_STORAGE_SECRET_ACCESS_KEY"] as const) {
      if (!value[key]) context.addIssue({ code: "custom", path: [key], message: `${key} is required when OBJECT_STORAGE_DRIVER is s3.` });
    }
    if (process.env.NODE_ENV === "production" && value.OBJECT_STORAGE_ENDPOINT && new URL(value.OBJECT_STORAGE_ENDPOINT).protocol !== "https:") {
      context.addIssue({ code: "custom", path: ["OBJECT_STORAGE_ENDPOINT"], message: "OBJECT_STORAGE_ENDPOINT must use HTTPS in production." });
    }
  }
  if (process.env.NODE_ENV === "production") {
    for (const key of ["BETTER_AUTH_URL", "NEXT_PUBLIC_APP_URL"] as const) {
      const raw = key === "BETTER_AUTH_URL" ? value.BETTER_AUTH_URL : process.env.NEXT_PUBLIC_APP_URL;
      if (!raw || new URL(raw).protocol !== "https:") context.addIssue({ code: "custom", path: [key], message: `${key} must use HTTPS in production.` });
    }
  }
});

const clientSchema = z.object({ NEXT_PUBLIC_APP_URL: z.string().url() });

export function getServerConfig() {
  const result = serverSchema.safeParse(process.env);
  if (!result.success) throw new Error(`Invalid server configuration: ${result.error.message}`);
  return result.data;
}

export function getClientConfig() {
  const result = clientSchema.safeParse(process.env);
  if (!result.success) throw new Error(`Invalid client configuration: ${result.error.message}`);
  return result.data;
}
