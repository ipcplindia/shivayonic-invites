import { bootstrapOwner } from "@/auth/bootstrap-owner";
import { prisma } from "@/db/client";

async function main() {
  await bootstrapOwner();
  console.log("Bootstrap complete.");
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "Bootstrap failed.");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
