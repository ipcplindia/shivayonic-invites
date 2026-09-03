"use client";

import Link from "next/link";

import { Icon } from "@/components/icon";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui-kit/sidebar";
import { activeNavItem, visibleNavGroups } from "@/features/admin/navigation";
import type { CurrentUserContext } from "@/shared/auth";

/**
 * The Control Centre rail.
 *
 * The collapse mechanics, icon rail, cookie-persisted preference, Ctrl/Cmd-B
 * shortcut, rail drag-handle and mobile sheet all come from the shadcn
 * `sidebar` primitive in components/ui-kit. This file supplies only what is
 * ours: the permission-filtered groups, the active route, the business scope
 * and the account footer.
 */
export function ControlCentreSidebar({
  context,
  pathname,
}: {
  context: CurrentUserContext;
  pathname: string;
}) {
  const groups = visibleNavGroups(context);
  const active = activeNavItem(pathname);

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" tooltip="Shivayonic Command Center">
              <Link href="/admin">
                <span className="flex aspect-square size-8 flex-none items-center justify-center rounded-lg bg-primary/12 text-primary ring-1 ring-primary/30">
                  <BrandMark />
                </span>
                <span className="grid flex-1 text-left leading-tight">
                  <span className="truncate font-semibold tracking-[0.12em]">SHIVAYONIC</span>
                  <span className="truncate text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
                    Command Center
                  </span>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {groups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive = active?.href === item.href;
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.pending ? `${item.label} — not connected yet` : item.label}
                      >
                        <Link aria-current={isActive ? "page" : undefined} href={item.href}>
                          <Icon name={item.icon} size={16} />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                      {/*
                        The chip repeats what the tooltip says, so the state is
                        never carried by position or colour alone.
                      */}
                      {item.pending ? <SidebarMenuBadge>Soon</SidebarMenuBadge> : null}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              size="lg"
              tooltip={`Business scope: ${context.organization.name}`}
            >
              <Link href="/admin/settings">
                <span className="flex aspect-square size-8 flex-none items-center justify-center rounded-lg bg-sidebar-accent text-primary">
                  <Icon name="settings" size={16} />
                </span>
                <span className="grid flex-1 text-left leading-tight">
                  <span className="truncate text-[10px] text-muted-foreground uppercase tracking-[0.18em]">
                    Business scope
                  </span>
                  <span className="truncate font-semibold text-sm">
                    {context.organization.name}
                  </span>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}

/**
 * Brand mark: an aperture blade over a struck string. Cinema and music, drawn
 * once, in saffron.
 */
function BrandMark() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      focusable="false"
      height="18"
      stroke="currentColor"
      strokeLinejoin="round"
      strokeWidth="1.2"
      viewBox="0 0 26 26"
      width="18"
    >
      <path d="M13 2.4 22.4 13 13 23.6 3.6 13 13 2.4Z" />
      <path d="M13 7.6 18.4 13 13 18.4 7.6 13 13 7.6Z" opacity="0.55" />
      <path d="M13 2.4v21.2" opacity="0.5" strokeWidth="0.9" />
    </svg>
  );
}
