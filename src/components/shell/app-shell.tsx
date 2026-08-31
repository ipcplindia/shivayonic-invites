"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import styles from "@/components/shell/shell.module.css";
import { Sidebar } from "@/components/shell/sidebar";
import { TopBar } from "@/components/shell/top-bar";
import { activeNavItem } from "@/features/admin/navigation";
import type { CurrentUserContext } from "@/shared/auth";

const NAV_ID = "command-center-nav";

/**
 * Owns the two pieces of shell state that genuinely need the client: the
 * current pathname and the mobile drawer. Everything below it stays pure.
 */
export function AppShell({
  context,
  children,
}: {
  context: CurrentUserContext;
  children: ReactNode;
}) {
  const pathname = usePathname() ?? "/admin";
  const [menuOpen, setMenuOpen] = useState(false);

  // A drawer that survives navigation would cover the page the operator asked for.
  useEffect(() => setMenuOpen(false), [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  const pageTitle = activeNavItem(pathname)?.title ?? "Overview";

  return (
    <div className={styles.shell}>
      <a href="#command-center-main" className="skipLink">
        Skip to content
      </a>

      <Sidebar
        context={context}
        pathname={pathname}
        open={menuOpen}
        navId={NAV_ID}
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
        />
        <main id="command-center-main" className={styles.content}>
          {children}
        </main>
      </div>
    </div>
  );
}
