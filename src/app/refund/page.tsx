import { LegalPage, legalDocs } from "@/features/public/legal";

export const metadata = {
  title: { absolute: "Refund & Cancellation | Shivayonic Invites" },
  description: "Refund & Cancellation policy for Shivayonic Invites.",
  alternates: { canonical: "/refund" },
  robots: { index: true, follow: true },
};

export default function Page() {
  return <LegalPage doc={legalDocs["refund"]} />;
}
