import { LegalPage, legalDocs } from "@/features/public/legal";

export const metadata = {
  title: { absolute: "Privacy | Shivayonic Invites" },
  description: "Privacy policy for Shivayonic Invites.",
  alternates: { canonical: "/privacy" },
  robots: { index: true, follow: true },
};

export default function Page() {
  return <LegalPage doc={legalDocs["privacy"]} />;
}
