"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";

import styles from "@/components/shell/shell.module.css";
import { Sidebar } from "@/components/shell/sidebar";
import { TopBar } from "@/components/shell/top-bar";
import { ToastProvider } from "@/components/toast";
import { CommandPalette } from "@/features/admin/command-palette";
import { activeNavItem } from "@/features/admin/navigation";
import type { CurrentUserContext } from "@/shared/auth";

const NAV_ID = "command-center-nav";
const RAIL_STORAGE_KEY = "shivayonic:rail-collapsed";

/**
 * Owns the shell state that genuinely needs the client: current pathname, the
 * mobile drawer, and the command palette. Everything below it stays pure.
 */
export function AppShell({
  context,
  children,
}: {
  context: CurrentUserContext;
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname() ?? "/admin";
  const [menuOpen, setMenuOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // The rail preference is read after mount, so the server markup stays stable
  // and the operator's choice survives navigation and reloads.
  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(RAIL_STORAGE_KEY) === "true");
    } catch {
      // Storage can be unavailable (private mode, blocked cookies). The rail
      // simply starts expanded.
    }
  }, []);

  function toggleCollapsed() {
    setCollapsed((value) => {
      const next = !value;
      try {
        window.localStorage.setItem(RAIL_STORAGE_KEY, String(next));
      } catch {
        // Preference is not persisted; the current session still honours it.
      }
      return next;
    });
  }

  // A drawer that survives navigation would cover the page the operator asked for.
  useEffect(() => setMenuOpen(false), [pathname]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && menuOpen) {
        setMenuOpen(false);
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  // The page behind the mobile drawer must not scroll under it.
  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = previous;
    };
  }, [menuOpen]);

  const pageTitle = activeNavItem(pathname)?.title ?? "Overview";

  return (
    <ToastProvider>
      <div className={styles.shell} data-collapsed={collapsed ? "true" : "false"}>
        <a href="#command-center-main" className="skipLink">
          Skip to content
        </a>

        <Sidebar
          context={context}
          pathname={pathname}
          open={menuOpen}
          navId={NAV_ID}
          collapsed={collapsed}
          onToggleCollapse={toggleCollapsed}
          onNavigate={() => setMenuOpen(false)}
        />

        {menuOpen ? (
          <button
            type="button"
            className={styles.backdrop}
            aria-label="Close navigation"
            onClick={() => setMenuOpen(false)}
          />
        ) : null}

        <div className={styles.main}>
          <TopBar
            context={context}
            pageTitle={pageTitle}
            navId={NAV_ID}
            menuOpen={menuOpen}
            onToggleMenu={() => setMenuOpen((open) => !open)}
            onOpenCommandPalette={() => setPaletteOpen(true)}
          />
          <main id="command-center-main" className={styles.content}>
            {children}
          </main>
        </div>

        <CommandPalette
          context={context}
          open={paletteOpen}
          onClose={() => setPaletteOpen(false)}
          onNavigate={(href) => router.push(href)}
        />
      </div>
    </ToastProvider>
  );
}
