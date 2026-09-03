import type { IconName } from "@/components/icon";
import { can } from "@/features/access";
import type { CurrentUserContext } from "@/shared/auth";

export type QuickAction = { href: string; label: string; icon: IconName; hint: string };

/**
 * The actions an operator can actually complete today, in one list shared by
 * the dashboard and the command bar so the two can never disagree.
 *
 * Every entry is permission-filtered and lands on a working screen. Actions
 * that need a capability this deployment does not have — new campaign, create
 * invoice, run agent — are deliberately absent rather than present and dead.
 */
export function quickActionsFor(context: CurrentUserContext): QuickAction[] {
  const actions: QuickAction[] = [];

  if (can(context, "MEDIA_WRITE")) {
    actions.push({ href: "/admin/media", label: "Upload a master", icon: "upload", hint: "Media" });
  }
  if (can(context, "MEDIA_READ")) {
    actions.push({ href: "/admin/media", label: "Open the Media Library", icon: "media", hint: "Media" });
  }
  if (can(context, "PUBLISH_CONTENT")) {
    actions.push({ href: "/admin/content", label: "Manage website content", icon: "publish", hint: "Website" });
  }
  if (can(context, "CATALOGUE_MANAGE")) {
    actions.push({ href: "/admin/catalogue", label: "Open the catalogue", icon: "projects", hint: "Catalogue" });
  }
  if (can(context, "PROJECT_READ")) {
    actions.push({ href: "/admin/projects", label: "Review projects", icon: "projects", hint: "Projects" });
  }

  actions.push({ href: "/admin/tasks", label: "Review open tasks", icon: "check", hint: "Tasks" });
  actions.push({ href: "/admin/settings", label: "Account and organization", icon: "settings", hint: "Settings" });

  return actions;
}
