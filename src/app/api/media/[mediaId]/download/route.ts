import { NextResponse } from "next/server";

import { MediaError } from "@/core/media-errors";
import { mediaRouteError, requireAuthorizedMedia } from "@/core/media-api";
import { safeDownloadFilename } from "@/core/media";
import { getObjectStorage } from "@/core/storage-provider";

type RouteContext = { params: Promise<{ mediaId: string }> };

export async function GET(request: Request, route: RouteContext) {
  try {
    const { mediaId } = await route.params;
    const { media } = await requireAuthorizedMedia(request, mediaId, "MEDIA_READ");
    if (media.status !== "READY") throw new MediaError("MEDIA_STATE_INVALID", 409);
    const storage = getObjectStorage();
    const target = await storage.createDownloadTarget({ storageKey: media.storageKey });
    if (target) return NextResponse.redirect(target.url, 307);
    const object = await storage.getObject({ storageKey: media.storageKey });
    return new NextResponse(object.body, {
      headers: {
        "content-type": media.mimeType,
        "content-length": String(object.sizeBytes ?? media.sizeBytes),
        "content-disposition": `attachment; filename="${safeDownloadFilename(media.originalFilename)}"`,
        "cache-control": "private, no-store",
      },
    });
  } catch (error) {
    return mediaRouteError(error);
  }
}
