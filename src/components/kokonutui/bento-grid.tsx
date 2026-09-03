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
 * Kept from the original, unchanged in behaviour: the `BentoCard` shell with its pointer-tracked
 * 3D tilt (useMotionValue → useTransform → rotateX/rotateY), the hover lift,
 * the reveal-on-hover ArrowUpRight, the layered gradient/backdrop treatment,
 * and the `SpotlightFeature`, `CounterAnimation`, `TimelineFeature` and
 * `MetricsFeature` sub-components.
 *
 * Removed, because each one could only be filled with invented data:
 * `IconsFeature` (OpenAI/Anthropic/Gemini/Mistral/DeepSeek logos),
 * `TypingCodeFeature`, `ChartAnimation`, `AIInput_Voice`, and the entire
 * hardcoded marketing `itemsSample` array. The seven vendor logo icon files
 * that shipped with the component were not copied into this repository.
 *
 * Changed:
 *  - the grid is driven by an `items` prop instead of a module-level constant.
 *  - `BentoCard` renders an `<article>` when an item has no `href`. The
 *    original always renders a `<Link>`; several Control Centre cards contain
 *    their own links (quick actions, attention rows), and nesting an anchor
 *    inside an anchor is invalid and unusable with a keyboard.
 *  - `MetricsFeature` gained an optional `display` field so the figure shown is
 *    the real count while the bar length shows that count's real share of the
 *    total. Without it the bar and the number cannot both be truthful.
 *  - the entrance animation moved from the container's `staggerContainer` /
 *    `fadeInUp` variants onto each card, because that propagation left every
 *    card at opacity 0 in this tree. The staggered fade-up is unchanged in
 *    appearance; it is simply driven per card. See BentoGrid below.
 *  - neutral/emerald demo colours replaced with Control Centre tokens.
 * ---------------------------------------------------------------------------
 */

import { ArrowUpRight, CheckCircle2 } from "lucide-react";
import { motion, useMotionValue, useTransform } from "motion/react";
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
  children?: ReactNode;
}

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
      <span className="font-bold text-3xl text-primary">
        {isWhole ? Math.round(count) : count.toFixed(1).replace(/\.0$/, "")}
      </span>
      <span className="font-medium text-foreground text-xl">{suffix}</span>
    </div>
  );
};

const TimelineFeature = ({
  timeline,
}: {
  timeline: Array<{ year: string; event: string }>;
}) => (
  <div className="relative mt-3">
    <div className="absolute top-0 bottom-0 left-[9px] w-[2px] bg-border" />
    {timeline.map((item, index) => (
      <motion.div
        animate={{ opacity: 1, x: 0 }}
        className="relative mb-3 flex gap-3"
        initial={{ opacity: 0, x: -10 }}
        key={`timeline-${item.year}-${item.event.toLowerCase().replace(/\s+/g, "-")}`}
        transition={{ delay: 0.08 * index }}
      >
        <div className="z-10 mt-0.5 h-5 w-5 flex-shrink-0 rounded-full border-2 border-primary/60 bg-surface-sunken" />
        <div className="min-w-0">
          <div className="font-medium text-foreground text-sm">{item.year}</div>
          <div className="truncate text-muted-foreground text-xs">{item.event}</div>
        </div>
      </motion.div>
    ))}
  </div>
);

const MetricsFeature = ({
  metrics,
}: {
  metrics: NonNullable<BentoItem["metrics"]>;
}) => {
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
          className="space-y-1"
          initial={{ opacity: 0, y: 10 }}
          key={`metric-${metric.label.toLowerCase().replace(/\s+/g, "-")}`}
          transition={{ delay: 0.15 * index }}
        >
          <div className="flex items-center justify-between text-sm">
            <div className="font-medium text-foreground/80">{metric.label}</div>
            <div className="font-semibold text-foreground/80">
              {metric.display ?? metric.value}
              {metric.suffix}
            </div>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken">
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

const CARD_CLASS =
  "group relative flex h-full flex-col gap-4 rounded-xl border border-hairline bg-gradient-to-b from-surface-panel/80 via-surface-panel/60 to-surface-panel/40 p-5 shadow-[0_4px_20px_rgb(0,0,0,0.2)] backdrop-blur-[4px] transition-all duration-500 ease-out hover:border-primary/30 hover:shadow-[0_8px_30px_rgb(0,0,0,0.3)]";

export const BentoCard = ({ item, index = 0 }: { item: BentoItem; index?: number }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [2, -2]);
  const rotateY = useTransform(x, [-100, 100], [-2, 2]);

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct * 100);
    y.set(yPct * 100);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  const body = (
    <div
      className="relative z-10 flex h-full flex-col gap-3"
      style={{ transform: "translateZ(20px)" }}
    >
      <div className="flex flex-1 flex-col space-y-2">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-semibold text-foreground text-lg tracking-tight">{item.title}</h3>
          {item.href ? (
            <div className="flex-none text-muted-foreground opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              <ArrowUpRight className="h-5 w-5" />
            </div>
          ) : null}
        </div>

        <p className="text-muted-foreground text-sm tracking-tight">{item.description}</p>

        {item.feature === "spotlight" && item.spotlightItems && (
          <SpotlightFeature items={item.spotlightItems} />
        )}

        {item.feature === "counter" && item.statistic && (
          <div className="mt-auto pt-3">
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
    </div>
  );

  /*
   * The original relies on variant propagation from the grid's
   * `staggerContainer`. In this tree that propagation does not reach the cards
   * — QA found every card sitting at opacity 0 while the container finished at
   * 1, which hides real operating figures. Each card therefore declares its own
   * entrance with an index-derived delay: the same staggered fade-up, but it
   * cannot silently fail to run.
   */
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className={cn("h-full", item.className)}
      initial={{ opacity: 0, y: 20 }}
      onHoverEnd={handleMouseLeave}
      onMouseMove={handleMouseMove}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      transition={{ duration: 0.4, ease: "easeOut", delay: Math.min(index, 8) * 0.06 }}
      whileHover={{ y: -5 }}
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
 */
export function BentoGrid({ items, className }: { items: BentoItem[]; className?: string }) {
  return (
    <div className={cn("grid grid-cols-1 gap-5 md:grid-cols-6", className)}>
      {items.map((item, index) => (
        <BentoCard index={index} item={item} key={item.id} />
      ))}
    </div>
  );
}

export default BentoGrid;
