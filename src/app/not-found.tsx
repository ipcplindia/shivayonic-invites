import Link from "next/link";

import { PageFrame } from "@/features/public/page-frame";
import { Band } from "@/features/public/sections";

export const metadata = {
  title: { absolute: "Page Not Found | Shivayonic Invites" },
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <PageFrame solidNav>
      <Band>
        <div className="notFound">
          <p className="eyebrow">404 · Page not found</p>
          <h1 className="sectionTitle">This celebration is elsewhere</h1>
          <p className="sectionLede">
            The page may have moved, but the invitations are still waiting for you.
          </p>
          <div className="ctaActions">
            <Link href="/" className="btn btnPrimary">Return home</Link>
            <Link href="/catalogue" className="btn btnGhost">Browse catalogue</Link>
          </div>
        </div>
      </Band>
    </PageFrame>
  );
}
