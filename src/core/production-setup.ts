import "server-only";

import { Buffer } from "node:buffer";
import { timingSafeEqual } from "node:crypto";
import { GetBucketCorsCommand, PutBucketCorsCommand, S3Client } from "@aws-sdk/client-s3";

import { bootstrapOwner } from "@/auth/bootstrap-owner";
import { getServerConfig } from "@/config/env";

type Runtime = { NODE_ENV?: string; VERCEL_ENV?: string; PRODUCTION_SETUP_TOKEN?: string };
type SetupResult = { owner: boolean; organization: boolean; cors: boolean; changed: boolean };

export function matchesBearerToken(request: Request, expected: string) {
  const authorization = request.headers.get("authorization") ?? "";
  const provided = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  const actualBytes = Buffer.from(provided);
  const expectedBytes = Buffer.from(expected);
  return actualBytes.length === expectedBytes.length && timingSafeEqual(actualBytes, expectedBytes);
}

export async function executeProductionSetup(): Promise<SetupResult> {
  const bootstrap = await bootstrapOwner();
  const config = getServerConfig();
  const client = new S3Client({
    endpoint: config.OBJECT_STORAGE_ENDPOINT,
    region: config.OBJECT_STORAGE_REGION,
    forcePathStyle: config.OBJECT_STORAGE_FORCE_PATH_STYLE === "true",
    credentials: {
      accessKeyId: config.OBJECT_STORAGE_ACCESS_KEY_ID!,
      secretAccessKey: config.OBJECT_STORAGE_SECRET_ACCESS_KEY!,
    },
  });
  const bucket = config.OBJECT_STORAGE_BUCKET!;
  const origins = [
    "https://shivayonic-invites-bice.vercel.app",
    "https://shivayonic.com",
    "https://www.shivayonic.com",
  ];
  await client.send(new PutBucketCorsCommand({
    Bucket: bucket,
    CORSConfiguration: {
      CORSRules: [{
        AllowedOrigins: origins,
        AllowedMethods: ["PUT", "GET", "HEAD"],
        AllowedHeaders: ["*"],
        ExposeHeaders: ["ETag", "Content-Length", "Content-Range", "Accept-Ranges"],
        MaxAgeSeconds: 3600,
      }],
    },
  }));
  const cors = await client.send(new GetBucketCorsCommand({ Bucket: bucket }));
  const configured = cors.CORSRules?.some((rule) =>
    origins.every((origin) => rule.AllowedOrigins?.includes(origin))
      && ["PUT", "GET", "HEAD"].every((method) => rule.AllowedMethods?.includes(method)),
  ) ?? false;
  return {
    owner: bootstrap.owner,
    organization: bootstrap.organization,
    cors: configured,
    changed: bootstrap.userCreated || bootstrap.organizationCreated || bootstrap.membershipChanged,
  };
}

export async function handleProductionSetup(
  request: Request,
  runtime: Runtime = process.env,
  execute: () => Promise<SetupResult> = executeProductionSetup,
) {
  if (runtime.NODE_ENV !== "production" || runtime.VERCEL_ENV !== "production" || !runtime.PRODUCTION_SETUP_TOKEN) {
    return Response.json({ ok: false }, { status: 404 });
  }
  if (!matchesBearerToken(request, runtime.PRODUCTION_SETUP_TOKEN)) {
    return Response.json({ ok: false }, { status: 401 });
  }
  try {
    const result = await execute();
    return Response.json({ ok: result.owner && result.organization && result.cors, ...result });
  } catch {
    return Response.json({ ok: false, owner: false, organization: false, cors: false, changed: false }, { status: 500 });
  }
}
