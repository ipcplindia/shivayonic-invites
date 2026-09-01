import { NextResponse } from "next/server";

import { MediaError } from "@/core/media-errors";
import { mediaRouteError, requireAuthorizedMedia } from "@/core/media-api";
import { parseByteRange, safeDownloadFilename } from "@/core/media";
import { getObjectStorage } from "@/core/storage-provider";

type RouteContext = { params: Promise<{ mediaId: string }> };

export async function GET(request: Request, route: RouteContext) {
  try {
    const { mediaId } = await route.params;
    const { media } = await requireAuthorizedMedia(request, mediaId, "MEDIA_READ");
    if (media.status !== "READY") throw new MediaError("MEDIA_STATE_INVALID", 409);
    const storage = getObjectStorage();
    const disposition = new URL(request.url).searchParams.get("disposition") === "inline" ? "inline" : "attachment";
    const filename = safeDownloadFilename(media.originalFilename);
    const target = await storage.createDownloadTarget({ storageKey: media.storageKey, disposition, filename });
    if (target) return NextResponse.redirect(target.url, 307);
    const head = await storage.headObject({ storageKey: media.storageKey });
    if (!head) throw new MediaError("MEDIA_NOT_FOUND", 404);
    const range = parseByteRange(request.headers.get("range"), head.sizeBytes);
    if (range === undefined) {
      return new NextResponse(null, { status: 416, headers: { "accept-ranges": "bytes", "content-range": `bytes */${head.sizeBytes}`, "cache-control": "private, no-store" } });
    }
    const object = await storage.getObject({ storageKey: media.storageKey, range: range ?? undefined });
    return new NextResponse(object.body, {
      status: range ? 206 : 200,
      headers: {
        "content-type": media.mimeType,
        "content-length": String(object.sizeBytes),
        "content-disposition": `${disposition}; filename="${filename}"`,
        "accept-ranges": "bytes",
        ...(range ? { "content-range": `bytes ${range.start}-${range.end}/${object.totalSize}` } : {}),
        "cache-control": "private, no-store",
      },
    });
  } catch (error) {
    return mediaRouteError(error);
  }
}
