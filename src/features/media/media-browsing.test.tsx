import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { getPermissionsForRole } from "@/auth/permissions";
import { MediaCard } from "@/features/media/media-client";
import { MediaInspector } from "@/features/media/media-inspector";
import { UploadDialog } from "@/features/media/upload-dialog";
import {
  MEDIA_PAGE_SIZE,
  MEDIA_QUERY_MAX_LENGTH,
  MEDIA_VIEW_STORAGE_KEY,
  buildMediaListQuery,
  isDownloadable,
  mediaKinds,
  mediaStatuses,
  mediaViewModes,
  mergeMediaPages,
  parseOption,
  readViewPreference,
} from "@/features/media/media";
// The contract itself is imported from the shared module, not mirrored locally.
import type { MediaAssetDetail, MediaAssetSummary, MediaListResponse } from "@/shared/media";
import type { CurrentUserContext, MemberRole } from "@/shared/auth";

function contextFor(role: MemberRole): CurrentUserContext {
  return {
    user: { id: "user-1", name: "Aarav Mehta", email: "aarav@shivayonic.test" },
    organization: { id: "org-1", name: "Shivayonic Invites", slug: "shivayonic-invites" },
    role,
    permissions: getPermissionsForRole(role),
  };
}

const video: MediaAssetSummary = {
  id: "a4f1c2e0-0000-4000-8000-000000000000",
  projectId: null,
  kind: "VIDEO",
  status: "READY",
  originalFilename: "mehta-wedding-film-master.mp4",
  mimeType: "video/mp4",
  sizeBytes: "734003200",
  width: 3840,
  height: 2160,
  durationMs: 185000,
  createdAt: "2026-08-30T09:15:00.000Z",
  updatedAt: "2026-08-30T09:15:00.000Z",
  archivedAt: null,
};

const audio: MediaAssetSummary = {
  ...video,
  id: "b5",
  kind: "AUDIO",
  status: "PROCESSING",
  originalFilename: "sharma-invitation-song.wav",
  mimeType: "audio/wav",
  width: null,
  height: null,
};

const noop = () => {};

describe("URL and storage state", () => {
  it("accepts only known values from the query string", () => {
    expect(parseOption("grid", mediaViewModes)).toBe("grid");
    expect(parseOption("<script>", mediaViewModes)).toBe("");
    expect(parseOption("DOCUMENT", mediaKinds)).toBe("DOCUMENT");
    expect(parseOption("EVERYTHING", mediaKinds)).toBe("");
  });

  it("persists a layout preference and nothing else", () => {
    const store = new Map<string, string>([[MEDIA_VIEW_STORAGE_KEY, "list"]]);
    const storage = { getItem: (key: string) => store.get(key) ?? null };

    expect(MEDIA_VIEW_STORAGE_KEY).toBe("shivayonic.media.view");
    expect(readViewPreference(storage)).toBe("list");

    store.set(MEDIA_VIEW_STORAGE_KEY, "OWNER");
    expect(readViewPreference(storage)).toBe("");
  });

  it("falls back safely when the browser refuses storage", () => {
    const blocked = {
      getItem() {
        throw new Error("SecurityError");
      },
    };

    expect(readViewPreference(blocked)).toBe("");
    expect(readViewPreference(undefined)).toBe("");
  });
});

describe("server filter contract", () => {
  it("sends every filter to the list route, and asks for one page", () => {
    const query = new URLSearchParams(
      buildMediaListQuery({ kind: "VIDEO", status: "READY", q: "mehta" }),
    );

    expect(query.get("limit")).toBe(String(MEDIA_PAGE_SIZE));
    expect(query.get("kind")).toBe("VIDEO");
    expect(query.get("status")).toBe("READY");
    expect(query.get("q")).toBe("mehta");
  });

  it("omits empty filters rather than sending blanks the route would reject", () => {
    const query = new URLSearchParams(buildMediaListQuery({ kind: "", status: "", q: "   " }));
    expect([...query.keys()]).toEqual(["limit"]);
  });

  it("carries a cursor only when continuing a page", () => {
    expect(new URLSearchParams(buildMediaListQuery({ cursor: "abc" })).get("cursor")).toBe("abc");
    expect(new URLSearchParams(buildMediaListQuery({})).has("cursor")).toBe(false);
  });

  it("offers exactly the kinds and statuses the shared contract defines", () => {
    expect(mediaKinds).toEqual(["IMAGE", "VIDEO", "AUDIO", "DOCUMENT"]);
    expect(mediaStatuses).toContain("ARCHIVED");
    expect(MEDIA_QUERY_MAX_LENGTH).toBe(120);
  });
});

describe("cursor pagination", () => {
  it("appends the next page without re-adding an id already held", () => {
    const merged = mergeMediaPages([video, audio], [audio, { ...video, id: "c9" }]);

    expect(merged.map((item) => item.id)).toEqual([video.id, "b5", "c9"]);
  });

  it("keeps the loaded pages when the next page returns nothing", () => {
    expect(mergeMediaPages([video], [])).toEqual([video]);
  });

  it("understands the cursor page the list route returns", () => {
    // Typed against the shared contract: a shape change breaks this at compile time.
    const response: MediaListResponse = {
      media: [video],
      pageInfo: { nextCursor: "eyJpZCI6ImE0ZjEifQ", hasMore: true },
    };

    expect(response.pageInfo.hasMore).toBe(true);
    expect(response.pageInfo.nextCursor).toBeTypeOf("string");
  });
});

describe("MediaCard", () => {
  it("becomes a button that opens a dialog once it is openable", () => {
    const plain = renderToStaticMarkup(<MediaCard media={video} />);
    const openable = renderToStaticMarkup(<MediaCard media={video} onOpen={noop} />);

    expect(plain).toMatch(/^<article/);
    expect(openable).toMatch(/^<button/);
    expect(openable).toContain('aria-haspopup="dialog"');
  });

  it("shows kind, status and technical metadata without streaming anything", () => {
    const markup = renderToStaticMarkup(<MediaCard media={video} />);

    expect(markup).toContain("Video");
    expect(markup).toContain("Ready");
    expect(markup).toContain("700 MB");
    expect(markup).toContain("3840×2160");
    // A grid of cards must never mount media elements.
    expect(markup).not.toContain("<video");
    expect(markup).not.toContain("<img");
  });
});

describe("MediaInspector", () => {
  const owner = contextFor("OWNER");

  function render(media: MediaAssetSummary | null, context = owner) {
    return renderToStaticMarkup(
      <MediaInspector context={context} summary={media} onClose={noop} onChanged={noop} />,
    );
  }

  it("shows operator-facing metadata for the selected master", () => {
    const markup = render(video);

    expect(markup).toContain("mehta-wedding-film-master.mp4");
    expect(markup).toContain("video/mp4");
    expect(markup).toContain("700 MB");
    expect(markup).toContain("3:05");
  });

  it("offers download through the authorised route, never a storage URL", () => {
    const markup = render(video);

    expect(markup).toContain(`href="/api/media/${video.id}/download"`);
    expect(markup).not.toContain("http");
    expect(markup).not.toContain("organizations/");
    expect(markup).not.toContain("s3");
  });

  it("withholds download and preview until the master is ready", () => {
    expect(isDownloadable(audio)).toBe(false);

    const markup = render(audio);

    expect(markup).not.toContain("/download");
    expect(markup).toContain("once this master is ready");
  });

  it("does not autoplay, and loads no media until asked", () => {
    const markup = render(video);

    expect(markup).toContain("Load preview");
    expect(markup).not.toContain("<video");
    expect(markup).not.toContain("autoplay");
  });

  it("never renders storage internals, even if the payload carries them", () => {
    const contaminated = {
      ...video,
      storageKey: "organizations/org-1/media/a4f1/secret.mp4",
    } as MediaAssetSummary;

    const markup = render(contaminated);

    expect(markup).not.toContain("storageKey");
    expect(markup).not.toContain("secret.mp4");
  });

  it("prefers the detail contract's project name and uploader when present", () => {
    const detail: MediaAssetDetail = {
      ...video,
      projectId: "p1",
      project: { id: "p1", name: "Mehta Wedding" },
      creator: { id: "u1", name: "Aarav Mehta" },
    };

    const markup = renderToStaticMarkup(
      <MediaInspector context={owner} summary={detail} onClose={noop} onChanged={noop} />,
    );

    expect(markup).toContain("Mehta Wedding");
    expect(markup).toContain("Uploaded by");
    expect(markup).not.toContain("u1");
  });

  it("offers archive to a MEDIA_WRITE holder and delete only to an owner", () => {
    const asOwner = render(video);
    const asStaff = render(video, contextFor("STAFF"));
    const asAdmin = render(video, contextFor("ADMIN"));

    expect(asOwner).toContain(">Archive<");
    expect(asOwner).toContain(">Delete<");
    // Staff and admin may archive; neither may delete, and neither is offered the
    // confirmation dialog for it.
    expect(asStaff).toContain(">Archive<");
    expect(asStaff).not.toContain(">Delete<");
    expect(asStaff).not.toContain("Delete this master permanently?");
    expect(asAdmin).not.toContain(">Delete<");
  });

  it("does not offer archive on an already archived master", () => {
    const markup = render({ ...video, status: "ARCHIVED" });

    expect(markup).not.toContain(">Archive<");
    expect(markup).toContain("Archived masters are hidden");
  });

  it("puts both destructive actions behind a confirmation naming the file", () => {
    const markup = render(video);

    expect(markup).toContain("Archive this master?");
    expect(markup).toContain("Delete this master permanently?");
    expect(markup).toContain("cannot be undone");
    expect(markup).toContain(video.originalFilename);
    // Confirmations are dialogs, and a closed dialog is not open.
    expect(markup).not.toContain("<dialog open");
  });

  it("explains a failed master without exposing probe output", () => {
    const markup = render({ ...video, status: "FAILED" });

    expect(markup).toContain("failed validation");
    expect(markup).not.toContain("ffprobe");
    expect(markup).not.toContain("stderr");
  });

  it("renders nothing selectable when no master is open", () => {
    const markup = render(null);

    expect(markup).not.toContain("<dialog open");
    expect(markup).not.toContain("mehta-wedding-film-master.mp4");
  });
});

describe("UploadDialog", () => {
  function render() {
    return renderToStaticMarkup(
      <UploadDialog open={false} onClose={noop} onUploaded={noop} onSettled={noop} />,
    );
  }

  it("offers a real file input as well as the drop area", () => {
    const markup = render();

    expect(markup).toContain('type="file"');
    expect(markup).toContain("multiple");
    expect(markup).toContain("Choose files");
    expect(markup).toContain("Drop masters here");
  });

  it("advertises only the formats the server accepts", () => {
    const markup = render();

    expect(markup).toContain("video/mp4");
    expect(markup).toContain(".mov");
    expect(markup).not.toContain("application/pdf");
    expect(markup).toContain("up to 2 GB");
  });

  it("carries an accessible status region for upload progression", () => {
    const markup = render();

    expect(markup).toContain('role="status"');
    expect(markup).toContain('aria-live="polite"');
    expect(markup).toContain("No files chosen yet.");
  });

  it("says plainly that uploading publishes nothing", () => {
    expect(render()).toContain("Nothing is published by uploading");
  });
});
