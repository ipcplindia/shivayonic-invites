import type { MetadataRoute } from "next";

import { SITE_URL } from "@/features/public/site";
import { featuredProducts } from "@/features/public/data";
import { weddingEventSlugs } from "@/features/public/pages";

/**
 * Public sitemap. Static marketing routes, the wedding function pages, and the
 * featured sample designs. Live catalogue products can be appended here once the
 * catalogue is populated.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const staticPaths = [
    "",
    "/invitations",
    "/invitations/wedding",
    "/celebrations",
    "/devotional",
    "/corporate",
    "/styles",
    "/music",
    "/films",
    "/our-work",
    "/how-it-works",
    "/about",
    "/contact",
    "/faq",
    "/catalogue",
    "/plans",
    "/sell",
    "/privacy",
    "/terms",
    "/refund",
    "/content-ip",
  ];

  const weddingPaths = weddingEventSlugs.map((s) => `/invitations/wedding/${s}`);
  const productPaths = featuredProducts.map((p) => `/product/${p.slug}`);

  return [...staticPaths, ...weddingPaths, ...productPaths].map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.7,
  }));
}
