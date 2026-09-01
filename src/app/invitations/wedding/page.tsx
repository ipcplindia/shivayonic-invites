import { CategoryPage } from "@/features/public/category-page";
import { categoryConfigs } from "@/features/public/pages";

export const metadata = {
  title: { absolute: "Wedding Invitations | Shivayonic Invites" },
  description: "Cinematic wedding invitations, films and music for every function from Save the Date to Reception.",
  alternates: { canonical: "/invitations/wedding" },
  robots: { index: true, follow: true },
};

export default function Page() {
  return (
    <CategoryPage
      config={categoryConfigs.wedding}
      breadcrumb={[{ label: "Home", href: "/" }, { label: "Invitations", href: "/invitations" }, { label: "Wedding" }]}
    />
  );
}
