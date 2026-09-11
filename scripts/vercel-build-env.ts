import { getDatabaseUrl } from "@/config/env";

export function previewMigrationEnvironment(env: Record<string, string | undefined>): Record<string, string | undefined> {
  if (env.VERCEL_ENV !== "preview") return { ...env };
  return { ...env, DATABASE_URL: getDatabaseUrl(env) };
}
