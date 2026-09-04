import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import "@/styles/control-centre.css";

import { AppShell } from "@/components/shell/app-shell";
import { getCurrentUserContext } from "@/auth/context";

/**
 * One authentication gate for the whole Command Center. The server context is
 * resolved here and handed down; no admin page re-fetches it.
 *
 * This is a UX gate, not the security boundary — every API route the interface
 * calls re-authorises the caller independently.
 *
 * The Tailwind stylesheet that drives the imported components is imported here
 * rather than in the root layout, so it is bundled for /admin alone and the
 * public site never loads it.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const requestHeaders = await headers();
  const isLogin = requestHeaders.get("x-shivayonic-admin-login") === "1";
  const context = await getCurrentUserContext().catch(() => null);
  if (isLogin) {
    if (context) redirect("/admin");
    return children;
  }
  if (!context) {
    const returnTo = requestHeaders.get("x-shivayonic-request-path") ?? "/admin";
    redirect(`/admin/login?reason=session&returnTo=${encodeURIComponent(returnTo)}`);
  }

  // The rail's expanded/collapsed preference is persisted by SidebarProvider in
  // this cookie. Reading it here means the first paint already matches what the
  // operator chose, rather than flashing open and then collapsing.
  const sidebarState = (await cookies()).get("sidebar_state")?.value;

  return (
    <AppShell context={context} defaultSidebarOpen={sidebarState !== "false"}>
      {children}
    </AppShell>
  );
}
