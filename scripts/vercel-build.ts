import { spawnSync } from "node:child_process";

import { previewMigrationEnvironment } from "./vercel-build-env";

const npm = process.platform === "win32" ? "npx.cmd" : "npx";

function run(args: string[], env = process.env) {
  const result = spawnSync(npm, args, { stdio: "inherit", env, shell: false });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run(["prisma", "generate"]);

if (process.env.VERCEL_ENV === "preview") {
  console.log("Applying Prisma migrations to Preview database");
  run(["prisma", "migrate", "deploy"], previewMigrationEnvironment(process.env));
  console.log("Preview migrations applied");
}

run(["next", "build"]);
