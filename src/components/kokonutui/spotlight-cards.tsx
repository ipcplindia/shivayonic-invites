"use client";

/**
 * @author dorianbaffier
 * @description Feature grid with aurora ambient, magnetic 3D tilt, and focus-dim siblings.
 * @version 2.0.0
 * @date 2025-02-20
 * @license MIT
 * @website https://kokonutui.com
 * @github https://github.com/kokonut-labs/kokonutui
 *
 * ---------------------------------------------------------------------------
 * SHIVAYONIC ADAPTATION
 *
 * Source: https://kokonutui.com/r/spotlight-cards.json.
 *
 * Kept: the whole interaction model — pointer-normalised magnetic tilt through
 * useMotionValue/useTransform/useSpring, the sprung hover glow, the shimmer
 * sweep, the focus-dim of unhovered siblings, the accent underline, and the
 * per-item accent tinting.
 *
 * Changed:
 *  - TILT_MAX lowered from 9° to 4° and the shimmer softened. These are
 *    operational cards, not a marketing page; the brief asks for the pattern
 *    with the flourish toned down.
 *  - the six `DEFAULT_ITEMS` marketing entries ("Instant", "Secure", "Global",
 *    "Developer first", "Scalable", "Serverless") are removed; `items` is now
 *    required, so nothing can render placeholder copy.
 *  - each item may carry a real status line and an href; a card with an href
 *    renders as a link, and one without stays inert rather than pretending to
 *    be actionable.
 *  - light-mode/indigo/zinc styling replaced with Control Centre tokens.
 * ---------------------------------------------------------------------------
 */

import type { LucideIcon } from "lucide-react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import Link from "next/link";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

const TILT_MAX = 4;
const TILT_SPRING = { stiffness: 300, damping: 28 } as const;
const GLOW_SPRING = { stiffness: 180, damping: 22 } as const;

export interface SpotlightItem {
  icon: LucideIcon;
  title: string;
  description: string;
  color: string;
  /** Real connection or capability state. Rendered verbatim. */
  status?: string;
  /** Only set when there is somewhere real to go. */
  href?: string;
  meta?: Array<{ label: string; value: string }>;
}

interface CardProps {
  item: SpotlightItem;
  dimmed: boolean;
  onHoverStart: () => void;
  onHoverEnd: () => void;
}

function SpotlightCard({ item, dimmed, onHoverStart, onHoverEnd }: CardProps) {
  const Icon = item.icon;
  const cardRef = useRef<HTMLDivElement>(null);

  const normX = useMotionValue(0.5);
  const normY = useMotionValue(0.5);

  const rawRotateX = useTransform(normY, [0, 1], [TILT_MAX, -TILT_MAX]);
  const rawRotateY = useTransform(normX, [0, 1], [-TILT_MAX, TILT_MAX]);

  const rotateX = useSpring(rawRotateX, TILT_SPRING);
  const rotateY = useSpring(rawRotateY, TILT_SPRING);
  const glowOpacity = useSpring(0, GLOW_SPRING);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) {
      return;
    }
    const rect = el.getBoundingClientRect();
    normX.set((e.clientX - rect.left) / rect.width);
    normY.set((e.clientY - rect.top) / rect.height);
  };

  const handleMouseEnter = () => {
    glowOpacity.set(1);
    onHoverStart();
  };

  const handleMouseLeave = () => {
    normX.set(0.5);
    normY.set(0.5);
    glowOpacity.set(0);
    onHoverEnd();
  };

  const inner = (
    <>
      {/* Static accent tint — always visible */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{
          background: `radial-gradient(ellipse at 20% 20%, ${item.color}14, transparent 65%)`,
        }}
      />

      {/* Hover glow layer */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{
          opacity: glowOpacity,
          background: `radial-gradient(ellipse at 20% 20%, ${item.color}26, transparent 65%)`,
        }}
      />

      {/* Shimmer sweep */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 w-[55%] -translate-x-full -skew-x-12 bg-gradient-to-r from-transparent via-white/3 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-[280%]"
      />

      {/* Icon badge */}
      <div
        className="relative z-10 flex h-10 w-10 items-center justify-center rounded-xl"
        style={{
          background: `${item.color}18`,
          boxShadow: `inset 0 0 0 1px ${item.color}30`,
        }}
      >
        <Icon size={17} strokeWidth={1.9} style={{ color: item.color }} />
      </div>

      {/* Text */}
      <div className="relative z-10 flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold text-[14px] text-foreground tracking-tight">
            {item.title}
          </h3>
          {item.status ? (
            <span
              className="rounded-full px-2 py-0.5 font-semibold text-[10px] uppercase tracking-[0.1em]"
              style={{
                color: item.color,
                background: `${item.color}1a`,
                boxShadow: `inset 0 0 0 1px ${item.color}33`,
              }}
            >
              {item.status}
            </span>
          ) : null}
        </div>
        <p className="text-[12.5px] text-muted-foreground leading-relaxed">{item.description}</p>
        {item.meta?.length ? (
          <dl className="mt-1 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-[11px]">
            {item.meta.map((entry) => (
              <div className="contents" key={entry.label}>
                <dt className="text-muted-foreground uppercase tracking-[0.08em]">
                  {entry.label}
                </dt>
                <dd className="truncate text-foreground/75">{entry.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>

      {/* Accent bottom line */}
      <div
        aria-hidden="true"
        className="absolute bottom-0 left-0 h-[2px] w-0 rounded-full transition-all duration-500 group-hover:w-full"
        style={{
          background: `linear-gradient(to right, ${item.color}80, transparent)`,
        }}
      />
    </>
  );

  return (
    <motion.div
      animate={{
        scale: dimmed ? 0.98 : 1,
        opacity: dimmed ? 0.62 : 1,
      }}
      className={cn(
        "group relative flex flex-col gap-5 overflow-hidden rounded-2xl border p-6",
        "border-border bg-card",
        "transition-[border-color] duration-300 hover:border-primary/30",
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      ref={cardRef}
      style={{
        rotateX,
        rotateY,
        transformPerspective: 900,
      }}
      transition={{ duration: 0.18, ease: "easeOut" }}
    >
      {item.href ? (
        <Link className="contents" href={item.href}>
          {inner}
        </Link>
      ) : (
        inner
      )}
    </motion.div>
  );
}

SpotlightCard.displayName = "SpotlightCard";

export function SpotlightCards({
  items,
  className,
}: {
  items: SpotlightItem[];
  className?: string;
}) {
  const [hoveredTitle, setHoveredTitle] = useState<string | null>(null);

  return (
    <div className={cn("relative grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {items.map((item) => (
        <SpotlightCard
          dimmed={hoveredTitle !== null && hoveredTitle !== item.title}
          item={item}
          key={item.title}
          onHoverEnd={() => setHoveredTitle(null)}
          onHoverStart={() => setHoveredTitle(item.title)}
        />
      ))}
    </div>
  );
}

export default SpotlightCards;
