import type { IconName } from "@/components/icon";
import { can } from "@/features/access";
import type { CurrentUserContext, Permission } from "@/shared/auth";

export type NavItem = {
  href: string;
  label: string;
  icon: IconName;
  /** Page title used by the top command bar and the document title. */
  title: string;
  lede: string;
  /** Omitted means every authenticated member may open the section. */
  permission?: Permission;
  /** Sections whose backend capability is not live yet are labelled, not hidden. */
  pending?: boolean;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export const navGroups: NavGroup[] = [
  {
    label: "Operate",
    items: [
      {
        href: "/admin",
        label: "Overview",
        icon: "overview",
        title: "Overview",
        lede: "The state of the studio: what came in, what is being cut, what is waiting to go out.",
      },
      {
        href: "/admin/projects",
        label: "Projects",
        icon: "projects",
        title: "Projects",
        lede: "Every commission, from first brief to delivered invitation.",
        permission: "PROJECT_READ",
      },
      {
        href: "/admin/media",
        label: "Media Library",
        icon: "media",
        title: "Media Library",
        lede: "Master files for every film, invitation and score held in the studio.",
        permission: "MEDIA_READ",
      },
    ],
  },
  {
    label: "Distribute",
    items: [
      {
        href: "/admin/publish",
        label: "Publish",
        icon: "publish",
        title: "Publish",
        lede: "Send a finished master to the website and to connected channels.",
        permission: "PROJECT_WRITE",
        pending: true,
      },
      {
        href: "/admin/schedule",
        label: "Schedule",
        icon: "schedule",
        title: "Schedule",
        lede: "Release windows, queued publications and the jobs behind them.",
        permission: "PROJECT_WRITE",
        pending: true,
      },
    ],
  },
  {
    label: "Govern",
    items: [
      {
        href: "/admin/activity",
        label: "Activity",
        icon: "activity",
        title: "Activity",
        lede: "A record of who changed what inside this organization.",
        permission: "AUDIT_READ",
      },
      {
        href: "/admin/settings",
        label: "Settings",
        icon: "settings",
        title: "Settings",
        lede: "Your account, the organization, and the people who work in it.",
      },
    ],
  },
];

export const allNavItems = navGroups.flatMap((group) => group.items);

export function visibleNavGroups(context: CurrentUserContext): NavGroup[] {
  return navGroups
    .map((group) => ({
      label: group.label,
      items: group.items.filter((item) => !item.permission || can(context, item.permission)),
    }))
    .filter((group) => group.items.length > 0);
}

/** Longest matching prefix wins, so `/admin/media/123` still highlights Media. */
export function activeNavItem(pathname: string): NavItem | undefined {
  return allNavItems
    .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0];
}
