"use client";

/**
 * @author: @dorianbaffier
 * @description: Bento Grid
 * @version: 1.0.0
 * @date: 2025-06-26
 * @license: MIT
 * @website: https://kokonutui.com
 * @github: https://github.com/kokonut-labs/kokonutui
 *
 * ---------------------------------------------------------------------------
 * SHIVAYONIC ADAPTATION
 *
 * Source: https://kokonutui.com/r/bento-grid.json.
 *
 * Kept from the original: the `BentoCard` shell with its pointer-tracked 3D
 * tilt (useMotionValue → useTransform → rotateX/rotateY), the hover lift, the
 * reveal-on-hover ArrowUpRight, and the `SpotlightFeature`,
 * `CounterAnimation`, `TimelineFeature` and `MetricsFeature` sub-components.
 *
 * Removed, because each one could only be filled with invented data:
 * `IconsFeature` (OpenAI/Anthropic/Gemini/Mistral/DeepSeek logos),
 * `TypingCodeFeature`, `ChartAnimation`, `AIInput_Voice`, and the entire
 * hardcoded marketing `itemsSample` array.
 *
 * Changed:
 *  - the grid is driven by an `items` prop instead of a module-level constant.
 *  - `BentoCard` renders an `<article>` when an item has no `href`, because
 *    several Control Centre cards contain their own links and nesting an
 *    anchor inside an anchor is invalid.
 *  - `MetricsFeature` gained an optional `display` field so the figure shown
 *    is the real count while the bar shows that count's real share.
 *  - the entrance animation moved onto each card; the container's variant
 *    propagation left every card at opacity 0 in this tree.
 *  - the card surface now carries the treatment KokonutUI's own
 *    spotlight-cards applies to its cards — a solid elevated gradient, an
 *    inset top highlight, an ambient accent glow that springs on hover, a
 *    tinted icon badge with an inset ring, and an accent rule along the base.
 *    The original's flat translucent gradient was built for a pure-black
 *    marketing page and read as no card at all over this canvas.
 * ---------------------------------------------------------------------------
 */

import {
  Activity,
  Archive,
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  Clapperboard,
  Layers,
  ListChecks,
  Radio,
  ShoppingBag,
  Sparkles,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface BentoItem {
  id: string;
  title: string;
  description: string;
  href?: string;
  className?: string;
  feature?: "spotlight" | "counter" | "timeline" | "metrics";
  spotlightItems?: string[];
  timeline?: Array<{ year: string; event: string }>;
  metrics?: Array<{
    label: string;
    value: number;
    display?: string;
    suffix?: string;
    color?: "health" | "data" | "primary" | "warn" | "destructive";
  }>;
  statistic?: { start?: number; end?: number; suffix?: string };
  /** Accent colour, as spotlight-cards uses: tints the glow, badge and rule. */
  accent?: string;
  /**
   * Icon for the accent badge, named rather than passed as a component: the
   * dashboard is a server component, and a Lucide component reference is not a
   * plain object, so React refuses to serialise it across the boundary.
   */
  icon?: BentoIconName;
  children?: ReactNode;
}

export type BentoIconName = keyof typeof bentoIcons;

const bentoIcons = {
  activity: Activity,
  archive: Archive,
  calendar: CalendarClock,
  check: CheckCircle2,
  film: Clapperboard,
  layers: Layers,
  list: ListChecks,
  radio: Radio,
  shop: ShoppingBag,
  sparkles: Sparkles,
  zap: Zap,
} satisfies Record<string, LucideIcon>;

const SpotlightFeature = ({ items }: { items: string[] }) => (
  <ul className="mt-2 space-y-1.5">
    {items.map((item, index) => (
      <motion.li
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-2"
        initial={{ opacity: 0, x: -10 }}
        key={`spotlight-${item.toLowerCase().replace(/\s+/g, "-")}`}
        transition={{ delay: 0.1 * index }}
      >
        <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-health" />
        <span className="text-foreground/80 text-sm">{item}</span>
      </motion.li>
    ))}
  </ul>
);

const CounterAnimation = ({
  start,
  end,
  suffix = "",
}: {
  start: number;
  end: number;
  suffix?: string;
}) => {
  const [count, setCount] = useState(start);

  useEffect(() => {
    const duration = 2000;
    const frameRate = 1000 / 60;
    const totalFrames = Math.round(duration / frameRate);

    let currentFrame = 0;
    const counter = setInterval(() => {
      currentFrame++;
      const progress = currentFrame / totalFrames;
      const easedProgress = 1 - (1 - progress) ** 3;
      const current = start + (end - start) * easedProgress;

      setCount(Math.min(current, end));

      if (currentFrame === totalFrames) {
        clearInterval(counter);
      }
    }, frameRate);

    return () => clearInterval(counter);
  }, [start, end]);

  /*
   * The original always formats to one decimal place. Every figure this
   * dashboard counts is a whole number of records, and a frame reading
   * "37.3 masters held" is simply untrue, so an integer target is rounded at
   * every frame. A fractional target still shows its decimal.
   */
  const isWhole = Number.isInteger(start) && Number.isInteger(end);

  return (
    <div className="flex items-baseline gap-1">
      <span className="font-semibold text-4xl text-foreground tracking-tight tabular-nums">
        {isWhole ? Math.round(count) : count.toFixed(1).replace(/\.0$/, "")}
      </span>
      <span className="font-medium text-lg text-muted-foreground">{suffix}</span>
    </div>
  );
};

const TimelineFeature = ({ timeline }: { timeline: Array<{ year: string; event: string }> }) => (
  <div className="relative mt-3">
    <div className="absolute top-1 bottom-1 left-[7px] w-px bg-border" />
    {timeline.map((item, index) => (
      <motion.div
        animate={{ opacity: 1, x: 0 }}
        className="relative mb-3 flex gap-3"
        initial={{ opacity: 0, x: -10 }}
        key={`timeline-${item.year}-${item.event.toLowerCase().replace(/\s+/g, "-")}`}
        transition={{ delay: 0.08 * index }}
      >
        <span className="z-10 mt-1 h-[15px] w-[15px] flex-shrink-0 rounded-full border-2 border-primary/70 bg-surface-sunken" />
        <div className="min-w-0">
          <div className="font-medium font-mono text-[11px] text-primary/90">{item.year}</div>
          <div className="truncate text-muted-foreground text-xs">{item.event}</div>
        </div>
      </motion.div>
    ))}
  </div>
);

const MetricsFeature = ({ metrics }: { metrics: NonNullable<BentoItem["metrics"]> }) => {
  const getColorClass = (color: string | undefined) => {
    const colors = {
      health: "bg-health",
      data: "bg-data",
      primary: "bg-primary",
      warn: "bg-warn",
      destructive: "bg-destructive",
    };
    return colors[color as keyof typeof colors] || colors.data;
  };

  return (
    <div className="mt-3 space-y-3">
      {metrics.map((metric, index) => (
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="space-y-1.5"
          initial={{ opacity: 0, y: 10 }}
          key={`metric-${metric.label.toLowerCase().replace(/\s+/g, "-")}`}
          transition={{ delay: 0.15 * index }}
        >
          <div className="flex items-center justify-between text-[12.5px]">
            <div className="font-medium text-foreground/85">{metric.label}</div>
            <div className="font-semibold text-foreground tabular-nums">
              {metric.display ?? metric.value}
              {metric.suffix}
            </div>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken ring-1 ring-border/60 ring-inset">
            <motion.div
              animate={{ width: `${Math.min(100, metric.value)}%` }}
              className={`h-full rounded-full ${getColorClass(metric.color)}`}
              initial={{ width: 0 }}
              transition={{ duration: 1.2, ease: "easeOut", delay: 0.15 * index }}
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
};

const DEFAULT_ACCENT = "#d99b45";

/*
 * The card surface. Nothing here carries data — it is all surface: a solid
 * elevated gradient, a hairline, an inset top highlight, an ambient accent
 * glow that springs up on hover, and an accent rule that draws along the base.
 */
const CARD_CLASS =
  "group relative flex h-full flex-col overflow-hidden rounded-xl border border-border bg-gradient-to-b from-surface-raised via-card to-card p-5 shadow-[inset_0_1px_0_0_rgba(245,241,232,0.06),0_6px_24px_rgba(8,9,8,0.35)] transition-all duration-500 ease-out hover:border-primary/40 hover:shadow-[inset_0_1px_0_0_rgba(245,241,232,0.1),0_10px_34px_rgba(8,9,8,0.45)]";

export const BentoCard = ({ item, index = 0 }: { item: BentoItem; index?: number }) => {
  const accent = item.accent ?? DEFAULT_ACCENT;
  const Icon = item.icon ? bentoIcons[item.icon] : undefined;

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [2, -2]);
  const rotateY = useTransform(x, [-100, 100], [-2, 2]);
  const glow = useSpring(0, { stiffness: 180, damping: 22 });

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    x.set(((event.clientX - rect.left) / rect.width - 0.5) * 100);
    y.set(((event.clientY - rect.top) / rect.height - 0.5) * 100);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
    glow.set(0);
  }

  const tint = `radial-gradient(120% 80% at 12% 0%, ${accent}1f, transparent 62%)`;
  const tintStrong = `radial-gradient(120% 80% at 12% 0%, ${accent}33, transparent 62%)`;

  const body = (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: tint }}
      />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ opacity: glow, background: tintStrong }}
      />

      <div
        className="relative z-10 flex h-full flex-col gap-3"
        style={{ transform: "translateZ(20px)" }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            {Icon ? (
              <span
                className="flex h-9 w-9 flex-none items-center justify-center rounded-lg"
                style={{ background: `${accent}1c`, boxShadow: `inset 0 0 0 1px ${accent}3d` }}
              >
                <Icon size={17} strokeWidth={1.9} style={{ color: accent }} />
              </span>
            ) : null}
            <h3 className="truncate font-semibold text-[15px] text-foreground tracking-tight">
              {item.title}
            </h3>
          </div>
          {item.href ? (
            <ArrowUpRight className="h-4 w-4 flex-none text-muted-foreground opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
          ) : null}
        </div>

        <p className="text-[12.5px] text-muted-foreground leading-relaxed">{item.description}</p>

        {item.feature === "spotlight" && item.spotlightItems && (
          <SpotlightFeature items={item.spotlightItems} />
        )}

        {item.feature === "counter" && item.statistic && (
          <div className="mt-auto pt-2">
            <CounterAnimation
              end={item.statistic.end ?? 0}
              start={item.statistic.start ?? 0}
              suffix={item.statistic.suffix}
            />
          </div>
        )}

        {item.feature === "timeline" && item.timeline && (
          <TimelineFeature timeline={item.timeline} />
        )}

        {item.feature === "metrics" && item.metrics && <MetricsFeature metrics={item.metrics} />}

        {item.children}
      </div>

      <div
        aria-hidden="true"
        className="absolute bottom-0 left-0 h-[2px] w-0 transition-all duration-500 group-hover:w-full"
        style={{ background: `linear-gradient(to right, ${accent}99, transparent)` }}
      />
    </>
  );

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      /*
       * No `h-full`: with `items-start` on the grid a card hugs its content
       * instead of being stretched to the height of the tallest card in its
       * row. Sparse real data was leaving large empty voids inside cards.
       */
      className={cn(item.className)}
      initial={{ opacity: 0, y: 20 }}
      onHoverEnd={handleMouseLeave}
      onHoverStart={() => glow.set(1)}
      onMouseMove={handleMouseMove}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      transition={{ duration: 0.4, ease: "easeOut", delay: Math.min(index, 8) * 0.06 }}
      whileHover={{ y: -4 }}
    >
      {item.href ? (
        <Link
          aria-label={`${item.title} — ${item.description}`}
          className={CARD_CLASS}
          href={item.href}
        >
          {body}
        </Link>
      ) : (
        <article className={CARD_CLASS}>{body}</article>
      )}
    </motion.div>
  );
};

/**
 * The original reveals on scroll (`whileInView` with `viewport: { once: true }`).
 * On a dashboard that is the wrong trade: cards below the fold — and, as
 * observed during QA, every card inside a grid taller than the viewport — can
 * sit at opacity 0 with their figures unreadable. The stagger is kept, but it
 * runs on mount, so no operating figure can ever be invisible.
 *
 * `auto-rows-min` with `items-start` stops a short card being stretched to the
 * height of the tallest in its row, which was leaving large voids inside cards.
 */
export function BentoGrid({ items, className }: { items: BentoItem[]; className?: string }) {
  return (
    <div
      className={cn("grid auto-rows-min grid-cols-1 items-start gap-4 md:grid-cols-6", className)}
    >
      {items.map((item, index) => (
        <BentoCard index={index} item={item} key={item.id} />
      ))}
    </div>
  );
}

export default BentoGrid;
