import { CategoryPage } from "@/features/public/category-page";
import { categoryConfigs } from "@/features/public/pages";

export const metadata = {
  title: { absolute: "Corporate Invitations | Shivayonic Invites" },
  description: "Brand-aligned invitations and films for launches, conferences, annual days and awards.",
  alternates: { canonical: "/corporate" },
  robots: { index: true, follow: true },
};

export default function Page() {
  return (
    <CategoryPage
      config={categoryConfigs.corporate}
      breadcrumb={[{ label: "Home", href: "/" }, { label: "Corporate" }]}
    />
  );
}
