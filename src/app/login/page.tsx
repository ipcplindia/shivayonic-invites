import { LoginForm } from "./login-form";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ reason?: string }> }) {
  const params = await searchParams;
  const sessionMessage = params.reason ? "Please sign in to continue." : undefined;
  return <LoginForm sessionMessage={sessionMessage} />;
}
