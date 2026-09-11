import { CustomerAccount } from "@/features/public/customer-account";
export const metadata = { title: "My orders", robots: { index: false, follow: false }, referrer: "no-referrer" as const };
export default function AccountPage() {
  return <main style={{ maxWidth: 760, margin: "3rem auto", padding: "1.5rem" }}><h1>My orders</h1><CustomerAccount /></main>;
}
