import type { IconName } from "@/components/icon";
import { can } from "@/features/access";
import type { CurrentUserContext, Permission } from "@/shared/auth";

/**
 * The Control Centre information architecture.
 *
 * A destination appears here only if it does one of two things: run a real
 * feature, or render an honest module landing that says what is missing and
 * where to connect it. Business areas without a data source get one landing
 * each rather than a tree of empty subpages, so the rail never promises a
 * screen that turns out to be blank.
 *
 * `pending` marks a destination whose route, permission gate and layout exist
 * but whose backing capability has not shipped. It drives the "Soon" chip.
 */

export type NavItem = {
  href: string;
  label: string;
  icon: IconName;
  title: string;
  lede: string;
  permission?: Permission;
  pending?: boolean;
};

export type NavGroup = { label: string; items: NavItem[] };

const item = (
  href: string,
  label: string,
  icon: IconName,
  permission: Permission | undefined,
  lede: string,
  pending = false,
): NavItem => ({ href, label, icon, title: label, lede, permission, pending });

export const navGroups: NavGroup[] = [
  {
    label: "Command Center",
    items: [
      item("/admin", "Overview", "overview", undefined, "A live operating view of Shivayonic and Bholenath Productions."),
      item("/admin/tasks", "Tasks", "check", undefined, "Everything in the studio that is waiting on a decision or an action."),
      item("/admin/activity", "Activity", "activity", "AUDIT_READ", "A record of who changed what inside this organization.", true),
    ],
  },
  {
    label: "Content",
    items: [
      item("/admin/media", "Media Library", "media", "MEDIA_READ", "Private master files for the studio."),
      item("/admin/content", "Website Content", "publish", "PUBLISH_CONTENT", "Publish a ready master to a website placement."),
      item("/admin/projects", "Projects", "projects", "PROJECT_READ", "Every commission, from first brief to delivered invitation.", true),
      item("/admin/publish", "Publishing", "publish", "PUBLISH_CONTENT", "Delivery of finished masters to each connected channel.", true),
      item("/admin/schedule", "Schedule", "schedule", "PROJECT_WRITE", "Release windows for invitations that must land at a chosen hour.", true),
    ],
  },
  {
    label: "Catalogue",
    items: [
      item("/admin/catalogue", "Catalogue", "projects", "CATALOGUE_MANAGE", "Products, categories, visual styles and plans."),
      item("/admin/catalogue/products", "Products", "image", "CATALOGUE_MANAGE", "Individual catalogue products as the public site sees them.", true),
    ],
  },
  {
    label: "Business",
    items: [
      item("/admin/customers", "Customers", "user", "CUSTOMERS_VIEW", "Enquiries, form submissions, partners and customers."),
      item("/admin/orders", "Orders", "inbox", "ORDERS_MANAGE", "Every commission from placement through delivery."),
      item("/admin/finance", "Finance", "archive", "ANALYTICS_VIEW", "Revenue, cost and cash position across the divisions."),
    ],
  },
  {
    label: "Growth",
    items: [
      item("/admin/marketing", "Marketing", "activity", "ANALYTICS_VIEW", "Campaigns, advertising and the content calendar."),
      item("/admin/social", "Social", "video", "PUBLISH_CONTENT", "One master asset delivered to every channel."),
      item("/admin/analytics", "Analytics", "overview", "ANALYTICS_VIEW", "How the website, catalogue and content perform."),
    ],
  },
  {
    label: "Automation",
    items: [
      item("/admin/automation", "Agent Center", "refresh", "INTEGRATIONS_MANAGE", "Agents, workflows and background jobs."),
      item("/admin/integrations", "Integrations", "publish", "INTEGRATIONS_MANAGE", "Every system this business runs on, and its state."),
    ],
  },
  {
    label: "Security",
    items: [
      item("/admin/security/users", "Users & Roles", "user", "USERS_MANAGE", "People with access, and what each role may do.", true),
      item("/admin/security/sessions", "Sessions", "lock", "SECURITY_VIEW", "Active sessions and devices.", true),
      item("/admin/security/audit", "Audit Log", "activity", "AUDIT_READ", "The immutable record of privileged actions.", true),
      item("/admin/security/events", "Security Events", "alert", "SECURITY_VIEW", "Sign-in failures, lockouts and permission denials.", true),
    ],
  },
  {
    label: "Settings",
    items: [item("/admin/settings", "Settings", "settings", undefined, "Account and organization settings.")],
  },
];

export const allNavItems = navGroups.flatMap((group) => group.items);

export function visibleNavGroups(context: CurrentUserContext): NavGroup[] {
  return navGroups
    .map((group) => ({
      label: group.label,
      items: group.items.filter((entry) => !entry.permission || can(context, entry.permission)),
    }))
    .filter((group) => group.items.length > 0);
}

/** The deepest matching destination wins, so a nested route keeps its parent highlighted. */
export function activeNavItem(pathname: string): NavItem | undefined {
  return allNavItems
    .filter((entry) => pathname === entry.href || pathname.startsWith(`${entry.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0];
}

export function adminNavItem(pathname: string) {
  return allNavItems.find((entry) => entry.href === pathname);
}

export function canVisitAdminDestination(context: CurrentUserContext | null, destination: NavItem) {
  return Boolean(context && (!destination.permission || can(context, destination.permission)));
}
