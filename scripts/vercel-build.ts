import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { previewMigrationEnvironment } from "./vercel-build-env";

const npm = process.platform === "win32" ? "npx.cmd" : "npx";

function run(args: string[], env = process.env) {
  const result = spawnSync(npm, args, { stdio: "inherit", env, shell: process.platform === "win32" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run(["prisma", "generate"]);

if (process.env.VERCEL_ENV === "preview") {
  console.log("Applying Prisma migrations to Preview database");
  run(["prisma", "migrate", "deploy"], previewMigrationEnvironment(process.env));
  console.log("Preview migrations applied");
}

// One controlled production migration release. The marker is committed only
// for this deployment and removed immediately after its result is verified.
const productionMigrationMarker = path.join(process.cwd(), ".production-migration-once");
const productionMigration = "20260906000000_payment_security_foundation";
if (process.env.VERCEL_ENV === "production" && existsSync(productionMigrationMarker)) {
  if (readFileSync(productionMigrationMarker, "utf8").trim() !== productionMigration) {
    throw new Error("Invalid production migration marker");
  }
  console.log(`Applying controlled production migration: ${productionMigration}`);
  run(["prisma", "migrate", "deploy"]);
  console.log("Controlled production migration applied");
}

run(["next", "build"]);
