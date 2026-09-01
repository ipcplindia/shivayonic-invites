import { CategoryPage } from "@/features/public/category-page";
import { categoryConfigs } from "@/features/public/pages";

export const metadata = {
  title: { absolute: "Celebration Invitations | Shivayonic Invites" },
  description: "Invitations for birthdays, anniversaries and family milestones, crafted with warmth.",
  alternates: { canonical: "/celebrations" },
  robots: { index: true, follow: true },
};

export default function Page() {
  return (
    <CategoryPage
      config={categoryConfigs.celebrations}
      breadcrumb={[{ label: "Home", href: "/" }, { label: "Celebrations" }]}
    />
  );
}
