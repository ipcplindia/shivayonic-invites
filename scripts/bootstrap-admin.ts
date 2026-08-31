import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { getServerConfig } from "@/config/env";
import { prisma } from "@/db/client";

async function main() {
  const config = getServerConfig();
  const email = config.ADMIN_BOOTSTRAP_EMAIL;
  const name = config.ADMIN_BOOTSTRAP_NAME;
  const password = config.ADMIN_BOOTSTRAP_PASSWORD;
  const organizationName = config.ADMIN_BOOTSTRAP_ORG_NAME ?? "Shivayonic";
  const organizationSlug = config.ADMIN_BOOTSTRAP_ORG_SLUG ?? "shivayonic";

  if (!email || !name || !password) {
    throw new Error("ADMIN_BOOTSTRAP_EMAIL, ADMIN_BOOTSTRAP_NAME, and ADMIN_BOOTSTRAP_PASSWORD are required.");
  }

  const auth = betterAuth({
    appName: "shivayonic-core",
    secret: config.BETTER_AUTH_SECRET,
    baseURL: config.BETTER_AUTH_URL,
    trustedOrigins: [config.BETTER_AUTH_URL],
    database: prismaAdapter(prisma, { provider: "postgresql" }),
    emailAndPassword: {
      enabled: true,
      disableSignUp: false,
      minPasswordLength: 12,
      maxPasswordLength: 128,
      requireEmailVerification: false,
    },
  });
  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    const result = await auth.api.signUpEmail({ body: { email, name, password } });
    user = await prisma.user.findUnique({ where: { id: result.user.id } });
  }

  if (!user) throw new Error("Bootstrap user could not be created.");

  const organization = await prisma.organization.upsert({
    where: { slug: organizationSlug },
    update: { name: organizationName },
    create: { name: organizationName, slug: organizationSlug },
  });

  await prisma.organizationMember.upsert({
    where: { userId_organizationId: { userId: user.id, organizationId: organization.id } },
    update: { role: "OWNER" },
    create: { userId: user.id, organizationId: organization.id, role: "OWNER" },
  });

  await prisma.auditLog.create({
    data: {
      action: "ADMIN_BOOTSTRAPPED",
      organizationId: organization.id,
      actorUserId: user.id,
      entityType: "OrganizationMember",
      entityId: user.id,
      metadata: { organizationSlug, email },
    },
  });

  console.log(`Bootstrap complete for ${email} in organization ${organizationSlug}.`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "Bootstrap failed.");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
