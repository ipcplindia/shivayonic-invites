import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SocialRibbon } from "@/features/public/marquee";
import { contact, instagramItems, youtubeItems } from "@/features/public/data";

describe("social ribbons", () => {
  it("scroll in opposite directions — YouTube left→right, Instagram right→left", () => {
    const yt = renderToStaticMarkup(
      <SocialRibbon items={youtubeItems} platform="youtube" direction="ltr" />,
    );
    const ig = renderToStaticMarkup(
      <SocialRibbon items={instagramItems} platform="instagram" direction="rtl" />,
    );

    // ltr = reversed base keyframe (travels right); rtl = default (travels left).
    expect(yt).toContain("ribbonRTL");
    expect(ig).not.toContain("ribbonRTL");
  });

  it("duplicates the track for a seamless loop and hides the copy from AT", () => {
    const markup = renderToStaticMarkup(
      <SocialRibbon items={youtubeItems} platform="youtube" direction="ltr" />,
    );
    // Each of 6 items rendered twice = 12 cards; the second half is aria-hidden.
    expect(markup.match(/mediaCardYt/g)?.length).toBe(12);
    expect(markup).toContain('aria-hidden="true"');
  });

  it("links to the configured external post and loads no embed", () => {
    const markup = renderToStaticMarkup(
      <SocialRibbon items={youtubeItems} platform="youtube" direction="ltr" />,
    );

    expect(markup).toContain(`href="${contact.youtubeChannelUrl}"`);
    expect(markup).toContain('rel="noopener noreferrer"');
    expect(markup).not.toContain("<iframe");
    expect(markup).not.toContain("<video");
  });
});

describe("public content honesty", () => {
  it("carries the exact configured social identifiers", () => {
    expect(contact.instagramHandle).toBe("@shivayonic.invites");
    expect(contact.youtubeChannel).toBe("Shivayonic Invites");
  });

  it("invents no ratings, client counts or testimonials", () => {
    const blob = JSON.stringify({ youtubeItems, instagramItems });
    expect(blob).not.toMatch(/\b\d[\d,]*\s*(clients|weddings|reviews|ratings|stars|happy)\b/i);
  });
});
