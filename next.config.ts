import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  outputFileTracingIncludes: {
    "/api/internal/website-publications-migration": [
      "./prisma/migrations/20260903000000_website_publications/migration.sql",
    ],
  },
};

export default nextConfig;
