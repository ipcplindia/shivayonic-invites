import type { IconName } from "@/components/icon";
import { can } from "@/features/access";
import type { CurrentUserContext, Permission } from "@/shared/auth";

export type NavItem = { href: string; label: string; icon: IconName; title: string; lede: string; permission?: Permission; pending?: boolean };
export type NavGroup = { label: string; items: NavItem[] };
const pending = true;
const item = (href: string, label: string, icon: IconName, permission?: Permission, lede = `${label} is not connected yet.`): NavItem => ({ href, label, icon, title: label, lede, permission, pending });

export const navGroups: NavGroup[] = [
  { label: "Overview", items: [{ href: "/admin", label: "Overview", icon: "overview", title: "Overview", lede: "The current operational state of the studio." }] },
  { label: "Content", items: [
    { href: "/admin/media", label: "Media Library", icon: "media", title: "Media Library", lede: "Private master files for the studio.", permission: "MEDIA_READ" },
    item("/admin/content", "Website Content", "projects", "CONTENT_MANAGE"), item("/admin/our-work", "Our Work", "image", "CONTENT_MANAGE"), item("/admin/films", "Films", "video", "CONTENT_MANAGE"), item("/admin/music", "Music", "audio", "CONTENT_MANAGE"),
  ] },
  { label: "Catalogue", items: [item("/admin/catalogue/products", "Products", "projects", "CATALOGUE_MANAGE"), item("/admin/catalogue/categories", "Categories", "schedule", "CATALOGUE_MANAGE"), item("/admin/catalogue/styles", "Styles", "image", "CATALOGUE_MANAGE"), item("/admin/catalogue/plans", "Plans", "publish", "CATALOGUE_MANAGE")] },
  { label: "Customers", items: [item("/admin/customers/enquiries", "Enquiries", "inbox", "CUSTOMERS_VIEW"), item("/admin/customers/forms", "Form Submissions", "inbox", "CUSTOMERS_VIEW"), item("/admin/customers/partners", "Partners", "user", "CUSTOMERS_VIEW"), item("/admin/customers", "Customers", "user", "CUSTOMERS_VIEW")] },
  { label: "Orders", items: [item("/admin/orders", "All Orders", "projects", "ORDERS_MANAGE"), item("/admin/orders/new", "New", "plus", "ORDERS_MANAGE"), item("/admin/orders/in-progress", "In Progress", "schedule", "ORDERS_MANAGE"), item("/admin/orders/awaiting-client", "Awaiting Client", "alert", "ORDERS_MANAGE"), item("/admin/orders/completed", "Completed", "check", "ORDERS_MANAGE"), item("/admin/orders/cancelled", "Cancelled", "close", "ORDERS_MANAGE")] },
  { label: "Social Studio", items: [item("/admin/social", "Social Studio", "publish", "PUBLISH_CONTENT"), item("/admin/social/master-content", "Master Content", "media", "PUBLISH_CONTENT"), item("/admin/social/youtube", "YouTube", "video", "PUBLISH_CONTENT"), item("/admin/social/instagram", "Instagram", "image", "PUBLISH_CONTENT"), item("/admin/social/schedule", "Schedule", "schedule", "PUBLISH_CONTENT"), item("/admin/social/history", "Publishing History", "activity", "PUBLISH_CONTENT")] },
  { label: "Analytics", items: [item("/admin/analytics", "Business Overview", "overview", "ANALYTICS_VIEW"), item("/admin/analytics/website", "Website", "activity", "ANALYTICS_VIEW"), item("/admin/analytics/products", "Products", "projects", "ANALYTICS_VIEW"), item("/admin/analytics/forms", "Forms / Leads", "inbox", "ANALYTICS_VIEW"), item("/admin/analytics/youtube", "YouTube", "video", "ANALYTICS_VIEW"), item("/admin/analytics/instagram", "Instagram", "image", "ANALYTICS_VIEW")] },
  { label: "Security", items: [item("/admin/security/users", "Users & Roles", "user", "USERS_MANAGE"), item("/admin/security/sessions", "Sessions", "lock", "SECURITY_VIEW"), item("/admin/security/audit", "Audit Log", "activity", "AUDIT_READ"), item("/admin/security/integrations", "Integrations", "publish", "INTEGRATIONS_MANAGE"), item("/admin/security/events", "Security Events", "alert", "SECURITY_VIEW")] },
  { label: "Settings", items: [{ href: "/admin/settings", label: "Settings", icon: "settings", title: "Settings", lede: "Account and organization settings." }] },
];

export const allNavItems = navGroups.flatMap((group) => group.items);
export function visibleNavGroups(context: CurrentUserContext): NavGroup[] { return navGroups.map((group) => ({ label: group.label, items: group.items.filter((entry) => !entry.permission || can(context, entry.permission)) })).filter((group) => group.items.length > 0); }
export function activeNavItem(pathname: string): NavItem | undefined { return allNavItems.filter((entry) => pathname === entry.href || pathname.startsWith(`${entry.href}/`)).sort((a, b) => b.href.length - a.href.length)[0]; }
export function adminNavItem(pathname: string) { return allNavItems.find((entry) => entry.href === pathname); }
export function canVisitAdminDestination(context: CurrentUserContext | null, destination: NavItem) { return Boolean(context && (!destination.permission || can(context, destination.permission))); }
