import type { Metadata } from "next";

import { LoginForm } from "@/app/login/login-form";
import { safeAdminRedirect } from "@/auth/request-security";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string; returnTo?: string }>;
}) {
  const params = await searchParams;
  return (
    <LoginForm
      returnTo={safeAdminRedirect(params.returnTo)}
      sessionMessage={params.reason ? "Please sign in to continue." : undefined}
    />
  );
}
