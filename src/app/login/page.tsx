import { redirect } from "next/navigation";

import { safeAdminRedirect } from "@/auth/request-security";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ reason?: string; returnTo?: string }> }) {
  const params = await searchParams;
  const query = new URLSearchParams();
  if (params.reason) query.set("reason", "session");
  query.set("returnTo", safeAdminRedirect(params.returnTo));
  redirect(`/admin/login?${query}`);
}
