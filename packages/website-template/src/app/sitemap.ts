import type { MetadataRoute } from "next";
import { getAllSlugs } from "@/data/startup-types";
import { getAllComparisonSlugs } from "@/lib/comparison-data";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://startupmachine.dev";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${BASE_URL}/alternatives`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/grade`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
  ];

  const startupTypeRoutes: MetadataRoute.Sitemap = getAllSlugs().map(
    (slug) => ({
      url: `${BASE_URL}/for/${slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })
  );

  const comparisonRoutes: MetadataRoute.Sitemap = getAllComparisonSlugs().map(
    (slug) => ({
      url: `${BASE_URL}/compare/${slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.85,
    })
  );

  return [...staticRoutes, ...startupTypeRoutes, ...comparisonRoutes];
}
