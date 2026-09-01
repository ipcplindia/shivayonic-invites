import { LegalPage, legalDocs } from "@/features/public/legal";

export const metadata = {
  title: { absolute: "Content & IP | Shivayonic Invites" },
  description: "Content & IP policy for Shivayonic Invites.",
  alternates: { canonical: "/content-ip" },
  robots: { index: true, follow: true },
};

export default function Page() {
  return <LegalPage doc={legalDocs["content-ip"]} />;
}
