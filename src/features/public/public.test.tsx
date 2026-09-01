import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SocialRibbon } from "@/features/public/marquee";
import { contact, socialWorks } from "@/features/public/data";

describe("canonical social works", () => {
  it("holds 13 matched works, each with one shared poster and both platform URLs", () => {
    expect(socialWorks).toHaveLength(13);
    for (const w of socialWorks) {
      expect(w.poster).toBe(`https://i.ytimg.com/vi/${w.youtubeId}/hqdefault.jpg`);
      expect(w.youtubeUrl).toContain("youtube.com/shorts/");
      expect(w.instagramUrl).toContain("instagram.com/shivayonic.invites/reel/");
    }
  });
});

describe("social ribbons", () => {
  it("scroll in opposite directions — YouTube left→right, Instagram right→left", () => {
    const yt = renderToStaticMarkup(
      <SocialRibbon works={socialWorks} platform="youtube" direction="ltr" />,
    );
    const ig = renderToStaticMarkup(
      <SocialRibbon works={socialWorks} platform="instagram" direction="rtl" />,
    );
    expect(yt).toContain("ribbonRTL");
    expect(ig).not.toContain("ribbonRTL");
  });

  it("uses the SAME poster in both rails, differing only by destination", () => {
    const yt = renderToStaticMarkup(
      <SocialRibbon works={socialWorks} platform="youtube" direction="ltr" />,
    );
    const ig = renderToStaticMarkup(
      <SocialRibbon works={socialWorks} platform="instagram" direction="rtl" />,
    );
    const poster = socialWorks[0].poster;
    expect(yt).toContain(poster);
    expect(ig).toContain(poster);
    expect(yt).toContain(socialWorks[0].youtubeUrl);
    expect(ig).toContain(socialWorks[0].instagramUrl);
  });

  it("duplicates the track for a seamless loop and hides the copy from AT", () => {
    const markup = renderToStaticMarkup(
      <SocialRibbon works={socialWorks} platform="youtube" direction="ltr" />,
    );
    // 13 works rendered twice = 26 cards; the second half is aria-hidden.
    expect(markup.match(/reelCard/g)?.length).toBe(26);
    expect(markup).toContain('aria-hidden="true"');
  });

  it("links out and loads no embed or player", () => {
    const markup = renderToStaticMarkup(
      <SocialRibbon works={socialWorks} platform="youtube" direction="ltr" />,
    );
    expect(markup).toContain('rel="noopener noreferrer"');
    expect(markup).not.toContain("<iframe");
    expect(markup).not.toContain("<video");
    expect(markup).not.toContain("autoplay");
  });
});

describe("public content honesty", () => {
  it("carries the exact configured social identifiers", () => {
    expect(contact.instagramHandle).toBe("@shivayonic.invites");
    expect(contact.youtubeChannel).toBe("Shivayonic Invites");
  });
});
