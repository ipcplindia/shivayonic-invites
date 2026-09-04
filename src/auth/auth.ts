import "server-only";

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/db/client";
import { getClientConfig, getServerConfig } from "@/config/env";
import { betterAuthRateLimitStorage } from "@/auth/rate-limit";

export function createAuth(options: { allowBootstrapSignUp?: boolean } = {}) {
  const config = getServerConfig();
  const clientConfig = getClientConfig();

  return betterAuth({
    appName: "shivayonic-core",
    secret: config.BETTER_AUTH_SECRET,
    baseURL: config.BETTER_AUTH_URL,
    trustedOrigins: [config.BETTER_AUTH_URL, clientConfig.NEXT_PUBLIC_APP_URL],
    database: prismaAdapter(prisma, { provider: "postgresql" }),
    emailAndPassword: {
      enabled: true,
      disableSignUp: !options.allowBootstrapSignUp,
      minPasswordLength: 12,
      maxPasswordLength: 128,
      requireEmailVerification: false,
    },
    session: {
      expiresIn: 60 * 60 * 8,
      updateAge: 60 * 30,
    },
    rateLimit: {
      enabled: true,
      customStorage: betterAuthRateLimitStorage,
      window: 60,
      max: 20,
      customRules: {
        "/sign-in/email": { window: 60, max: 5 },
        "/sign-up/email": { window: 60 * 60, max: 1 },
      },
    },
    advanced: {
      useSecureCookies: process.env.NODE_ENV === "production",
      cookiePrefix: "shivayonic",
      ipAddress: {
        // Vercel overwrites this header at the public origin, preventing spoofing.
        ipAddressHeaders: ["x-forwarded-for"],
      },
    },
  });
}

export const auth = createAuth();
