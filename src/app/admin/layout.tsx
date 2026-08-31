import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { AppShell } from "@/components/shell/app-shell";
import { getCurrentUserContext } from "@/auth/context";

/**
 * One authentication gate for the whole Command Center. The server context is
 * resolved here and handed down; no admin page re-fetches it.
 *
 * This is a UX gate, not the security boundary — every API route the interface
 * calls re-authorises the caller independently.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const context = await getCurrentUserContext().catch(() => null);
  if (!context) redirect("/login?reason=session");

  return <AppShell context={context}>{children}</AppShell>;
}
