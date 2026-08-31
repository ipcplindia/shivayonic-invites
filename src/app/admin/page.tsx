import { redirect } from "next/navigation";
import { getCurrentUserContext } from "@/auth/context";

export default async function AdminPage() {
  const context = await getCurrentUserContext().catch(() => null);
  if (!context) redirect("/login?reason=session");

  return (
    <main>
      <h1>SHIVAYONIC COMMAND CENTER</h1>
      <p>Signed in as: {context.user.name}</p>
      <p>Role: {context.role}</p>
      <p>Organization: {context.organization.name}</p>
      <form method="post" action="/api/auth/logout">
        <button type="submit">Logout</button>
      </form>
    </main>
  );
}
