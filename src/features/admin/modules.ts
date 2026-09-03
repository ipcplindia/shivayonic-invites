import type { IconName } from "@/components/icon";
import type { Permission } from "@/shared/auth";

/**
 * Module landings.
 *
 * A business area that has no data source yet gets exactly one honest landing
 * page — not a tree of empty subpages. The landing states what the area will
 * hold, which measures it will carry, which systems have to be connected first,
 * and where to go to connect them. Every measure renders as an em dash until a
 * real source exists, so nothing on screen can be mistaken for a number.
 */

export type ModuleDefinition = {
  href: string;
  title: string;
  lede: string;
  icon: IconName;
  permission?: Permission;
  /** Short statement of why the workspace is inactive. */
  status: string;
  /** Measures this module will carry. Values stay unavailable until a source is connected. */
  measures: string[];
  /** System ids from `systemStatuses` whose connection unlocks this module. */
  requires: string[];
  /** The views this module will grow, listed so the shape is legible without dead routes. */
  views: string[];
  /** What could supply the data, so the next decision is obvious. */
  sources: string[];
};

export const adminModules: ModuleDefinition[] = [
  {
    href: "/admin/marketing",
    title: "Marketing",
    lede: "Campaigns, advertising and the calendar that drives demand for Shivayonic and Bholenath Productions.",
    icon: "activity",
    permission: "ANALYTICS_VIEW",
    status: "No campaign or ad account is connected.",
    measures: ["Active campaigns", "Ad spend", "Impressions", "Cost per enquiry"],
    requires: ["google-ads", "meta-ads", "youtube", "instagram"],
    views: ["Overview", "Campaigns", "Ads", "Reels and Shorts", "Content calendar"],
    sources: ["Google Ads account", "Meta Ads account", "YouTube channel", "Instagram account"],
  },
  {
    href: "/admin/social",
    title: "Social",
    lede: "One master asset, delivered to every channel — website, YouTube, Instagram — from a single publishing queue.",
    icon: "publish",
    permission: "PUBLISH_CONTENT",
    status: "The website channel is available. No external channel is connected.",
    measures: ["Scheduled posts", "Published this month", "Failed deliveries", "Channel reach"],
    requires: ["website-publishing", "youtube", "instagram"],
    views: ["Master content", "YouTube", "Instagram", "Schedule", "Publishing history"],
    sources: ["YouTube channel (OAuth)", "Instagram professional account (OAuth)"],
  },
  {
    href: "/admin/finance",
    title: "Finance",
    lede: "Revenue, cost and cash position across the Shivayonic and Bholenath divisions.",
    icon: "archive",
    permission: "ANALYTICS_VIEW",
    status: "No finance source is connected.",
    measures: ["Revenue", "Expenses", "Campaign spend", "Outstanding"],
    requires: ["finance"],
    views: ["Overview", "Revenue", "Expenses", "Invoices", "Payouts", "Reconciliation"],
    sources: ["Manual entry", "Accounting platform", "Bank statement import"],
  },
  {
    href: "/admin/analytics",
    title: "Analytics",
    lede: "How the website, the catalogue and the content actually perform.",
    icon: "overview",
    permission: "ANALYTICS_VIEW",
    status: "No analytics property is connected.",
    measures: ["Sessions", "Catalogue views", "Enquiry rate", "Content watch time"],
    requires: ["analytics", "youtube", "instagram"],
    views: ["Business", "Website", "Catalogue", "Leads", "Campaigns", "Content"],
    sources: ["Web analytics property", "YouTube Data API", "Instagram Graph API"],
  },
  {
    href: "/admin/customers",
    title: "Customers",
    lede: "Enquiries, form submissions, partners and the people behind every commission.",
    icon: "user",
    permission: "CUSTOMERS_VIEW",
    status: "No customer record store is connected.",
    measures: ["Open enquiries", "New this week", "Partners", "Customers"],
    requires: [],
    views: ["Enquiries", "Form submissions", "Partners", "Customers"],
    sources: ["Website contact and customise forms", "Imported customer records"],
  },
  {
    href: "/admin/orders",
    title: "Orders",
    lede: "Every commission from placement through delivery.",
    icon: "projects",
    permission: "ORDERS_MANAGE",
    status: "No order store is connected.",
    measures: ["New", "In progress", "Awaiting client", "Completed"],
    requires: [],
    views: ["All orders", "New", "In progress", "Awaiting client", "Completed", "Cancelled"],
    sources: ["Website checkout", "Manual order entry"],
  },
  {
    href: "/admin/catalogue",
    title: "Catalogue",
    lede: "Products, categories, visual styles and plans as the public site sees them.",
    icon: "projects",
    permission: "CATALOGUE_MANAGE",
    status: "Catalogue records are readable through the public API. Editing is not connected yet.",
    measures: ["Products", "Categories", "Styles", "Plans"],
    requires: ["database"],
    views: ["Products", "Categories", "Styles", "Plans"],
    sources: ["Catalogue write API"],
  },
];

export function adminModule(href: string) {
  return adminModules.find((entry) => entry.href === href);
}
