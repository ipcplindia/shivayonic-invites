import { PIcon } from "@/features/public/icons";
import type { SocialWork } from "@/features/public/data";

/**
 * Social ribbon of vertical Shorts/Reels poster cards.
 *
 * Pure CSS marquee: the track is duplicated once and translated -50% for a
 * seamless, no-JS loop; hover and keyboard focus pause it; reduced-motion and
 * touch fall back to a scroll/swipe row. Both rails share ONE canonical poster
 * per work (the Short thumbnail); only the platform badge, direction and
 * destination differ. No iframe, no embed, no autoplay — the poster opens the
 * real post on click.
 */
export function SocialRibbon({
  works,
  platform,
  direction,
  duration = 60,
}: {
  works: SocialWork[];
  platform: "youtube" | "instagram";
  direction: "ltr" | "rtl";
  duration?: number;
}) {
  const label = platform === "youtube" ? "Short" : "Reel";
  const loop = [...works, ...works];

  return (
    <div
      className="ribbon"
      style={{ ["--dur" as string]: `${duration}s` }}
      aria-label={`${platform === "youtube" ? "YouTube" : "Instagram"} showcase`}
    >
      <div className={direction === "ltr" ? "ribbonTrack ribbonRTL" : "ribbonTrack"}>
        {loop.map((work, i) => {
          const href = platform === "youtube" ? work.youtubeUrl : work.instagramUrl;
          const dup = i >= works.length;
          return (
            <a
              key={work.id + i}
              className="reelCard"
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-hidden={dup}
              tabIndex={dup ? -1 : undefined}
              aria-label={`${platform === "youtube" ? "Watch this Short on YouTube" : "View this Reel on Instagram"}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="reelPoster"
                src={work.poster}
                alt=""
                loading="lazy"
                decoding="async"
              />
              <span className="reelBadge">
                <PIcon name={platform} size={13} /> {label}
              </span>
              <span className="reelPlay">
                <PIcon name="play" size={18} />
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
