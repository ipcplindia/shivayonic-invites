import { CustomerOrder } from "@/features/public/customer-order";
export const metadata = { title: "Your commission", robots: { index: false, follow: false }, referrer: "no-referrer" as const };
export default async function OrderPage({ params }: { params: Promise<{ enquiryId: string }> }) {
  const { enquiryId } = await params;
  return <main style={{ maxWidth: 760, margin: "3rem auto", padding: "1.5rem" }}><h1>Your Shivayonic commission</h1><CustomerOrder enquiryId={enquiryId} /></main>;
}
