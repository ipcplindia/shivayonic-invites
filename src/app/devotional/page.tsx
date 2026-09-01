import { CategoryPage } from "@/features/public/category-page";
import { categoryConfigs } from "@/features/public/pages";

export const metadata = {
  title: { absolute: "Devotional & Festival Invitations | Shivayonic Invites" },
  description: "Luminous invitations for festivals and pujas, rendered with reverence.",
  alternates: { canonical: "/devotional" },
  robots: { index: true, follow: true },
};

export default function Page() {
  return (
    <CategoryPage
      config={categoryConfigs.devotional}
      breadcrumb={[{ label: "Home", href: "/" }, { label: "Devotional" }]}
    />
  );
}
