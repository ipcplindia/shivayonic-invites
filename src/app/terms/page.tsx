import { LegalPage, legalDocs } from "@/features/public/legal";

export const metadata = {
  title: { absolute: "Terms | Shivayonic Invites" },
  description: "Terms policy for Shivayonic Invites.",
  alternates: { canonical: "/terms" },
  robots: { index: true, follow: true },
};

export default function Page() {
  return <LegalPage doc={legalDocs["terms"]} />;
}
