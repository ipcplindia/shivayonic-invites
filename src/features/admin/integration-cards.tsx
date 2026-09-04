"use client";

import {
  Activity,
  Archive,
  Image as ImageIcon,
  Layers,
  Lock,
  RefreshCw,
  Send,
  Video,
  type LucideIcon,
} from "lucide-react";

import { SpotlightCards, type SpotlightItem } from "@/components/kokonutui/spotlight-cards";
import type { IconName } from "@/components/icon";
import type { SystemState } from "@/features/admin/systems";

/**
 * The bridge between the server's honest system registry and KokonutUI's
 * spotlight cards.
 *
 * `SpotlightItem.icon` is a component reference, which cannot cross the
 * server/client boundary, so the page hands over plain data and the mapping to
 * a Lucide icon happens here.
 */

export type IntegrationCardData = {
  id: string;
  name: string;
  provider: string;
  capability: string;
  state: SystemState;
  stateLabel: string;
  icon: IconName;
  href?: string;
};

const icons: Partial<Record<IconName, LucideIcon>> = {
  publish: Send,
  archive: Archive,
  media: Layers,
  lock: Lock,
  video: Video,
  image: ImageIcon,
  activity: Activity,
  overview: Activity,
  refresh: RefreshCw,
};

/**
 * Colour follows the real connection state, and the state is also written out
 * as text on every card, so nothing here is carried by colour alone.
 */
const stateColor: Record<SystemState, string> = {
  live: "#7fa27b",
  connected: "#7fa27b",
  available: "#5f9890",
  configured: "#5f9890",
  degraded: "#cfa63c",
  unconfigured: "#85847b",
};

export function IntegrationCards({ systems }: { systems: IntegrationCardData[] }) {
  const items: SpotlightItem[] = systems.map((system) => ({
    icon: icons[system.icon] ?? Layers,
    title: system.name,
    description: system.capability,
    color: stateColor[system.state],
    status: system.stateLabel,
    href: system.href,
    meta: [{ label: "Provider", value: system.provider }],
  }));

  return <SpotlightCards items={items} />;
}
