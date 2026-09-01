import { PIcon } from "@/features/public/icons";
import type { SocialItem } from "@/features/public/data";

/**
 * Social ribbon. Pure CSS: the track is duplicated once and translated -50%, so
 * the loop is seamless with no JS and no snap. Hover and keyboard focus pause it
 * (`animation-play-state` in CSS); reduced-motion and touch fall back to a
 * normal scrollable/swipeable row. No video loads — these are poster links that
 * open the real post only on click.
 */
export function SocialRibbon({
  items,
  platform,
  direction,
  duration = 46,
}: {
  items: SocialItem[];
  platform: "youtube" | "instagram";
  direction: "ltr" | "rtl";
  duration?: number;
}) {
  const cardClass = platform === "youtube" ? "mediaCard mediaCardYt" : "mediaCard mediaCardIg";
  const tone = platform === "youtube" ? "tone-rose" : "tone-teal";
  // Duplicated so the -50% keyframe lands exactly on a copy boundary.
  const loop = [...items, ...items];

  return (
    <div
      className="ribbon"
      style={{ ["--dur" as string]: `${duration}s` }}
      aria-label={`${platform === "youtube" ? "YouTube" : "Instagram"} showcase`}
    >
      {/* The base keyframe translates left (visual right→left). Reversing it makes
          the track travel left→right, so `ltr` = reverse. */}
      <div className={direction === "ltr" ? "ribbonTrack ribbonRTL" : "ribbonTrack"}>
        {loop.map((item, i) => (
          <a
            key={item.id + i}
            className={cardClass}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-hidden={i >= items.length}
            tabIndex={i >= items.length ? -1 : undefined}
          >
            <div className={`mediaThumb ${tone}`}>
              <span className="mediaBadge">
                <PIcon name={platform} size={13} /> {platform === "youtube" ? "YouTube" : "Reel"}
              </span>
              <span className="mediaPlay">
                <PIcon name="play" size={20} />
              </span>
              {platform === "youtube" ? <span className="mediaDur">1:20</span> : null}
            </div>
            <div className="mediaBody">
              <p className="mediaTitle">{item.title}</p>
              <p className="mediaMeta">
                {item.occasion} · {item.style}
              </p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
