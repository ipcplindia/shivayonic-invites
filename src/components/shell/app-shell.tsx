"use client";

import { useEffect, useState } from "react";
import { MotionConfig } from "motion/react";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { ControlCentreSidebar } from "@/components/shell/control-centre-sidebar";
import styles from "@/components/shell/shell.module.css";
import { TopBar } from "@/components/shell/top-bar";
import { ToastProvider } from "@/components/toast";
import { SidebarInset, SidebarProvider } from "@/components/ui-kit/sidebar";
import { CommandPalette } from "@/features/admin/command-palette";
import { activeNavItem } from "@/features/admin/navigation";
import type { CurrentUserContext } from "@/shared/auth";

/**
 * Owns the shell state that genuinely needs the client: current pathname and
 * the command bar.
 *
 * The rail's own state — expanded/collapsed, the cookie that remembers it, the
 * Ctrl/Cmd-B shortcut and the mobile sheet — belongs to `SidebarProvider`, so
 * none of it is reimplemented here.
 */
export function AppShell({
  context,
  defaultSidebarOpen = true,
  children,
}: {
  context: CurrentUserContext;
  defaultSidebarOpen?: boolean;
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname() ?? "/admin";
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const pageTitle = activeNavItem(pathname)?.title ?? "Overview";

  return (
    <ToastProvider>
      {/*
        `cc-scope dark` is the boundary of the imported component system: the
        Tailwind `dark:` variant and the reduced-motion guard both key off it,
        and nothing outside the Control Centre carries it.
      */}
      {/*
        The imported components animate with Motion, whose animations CSS cannot
        switch off. `reducedMotion="user"` makes every one of them honour the
        operator's system setting.
      */}
      <MotionConfig reducedMotion="user">
        <div className="cc-scope dark">
          <SidebarProvider defaultOpen={defaultSidebarOpen}>
            <a className="skipLink" href="#command-center-main">
              Skip to content
            </a>

            <ControlCentreSidebar context={context} pathname={pathname} />

            <SidebarInset className="min-w-0 bg-background">
              <TopBar
                context={context}
                onOpenCommandPalette={() => setPaletteOpen(true)}
                pageTitle={pageTitle}
              />
              <main className={styles.content} id="command-center-main">
                {children}
              </main>
            </SidebarInset>

            <CommandPalette
              context={context}
              onClose={() => setPaletteOpen(false)}
              onNavigate={(href) => router.push(href)}
              open={paletteOpen}
            />
          </SidebarProvider>
        </div>
      </MotionConfig>
    </ToastProvider>
  );
}
