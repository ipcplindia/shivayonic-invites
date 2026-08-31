import "server-only";

import { resolve } from "node:path";
import { S3Client } from "@aws-sdk/client-s3";

import { getServerConfig } from "@/config/env";
import { LocalObjectStorage, type ObjectStorage, S3ObjectStorage } from "@/core/storage";

let storage: ObjectStorage | undefined;

export function getObjectStorage(): ObjectStorage {
  if (storage) return storage;
  const config = getServerConfig();
  storage = config.OBJECT_STORAGE_DRIVER === "local"
    ? new LocalObjectStorage(resolve(process.cwd(), config.LOCAL_MEDIA_STORAGE_PATH))
    : new S3ObjectStorage(
        new S3Client({
          endpoint: config.OBJECT_STORAGE_ENDPOINT,
          region: config.OBJECT_STORAGE_REGION,
          forcePathStyle: config.OBJECT_STORAGE_FORCE_PATH_STYLE === "true",
          credentials: { accessKeyId: config.OBJECT_STORAGE_ACCESS_KEY_ID!, secretAccessKey: config.OBJECT_STORAGE_SECRET_ACCESS_KEY! },
        }),
        config.OBJECT_STORAGE_BUCKET!,
      );
  return storage!;
}
