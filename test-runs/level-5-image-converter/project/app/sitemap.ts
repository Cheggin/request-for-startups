import type { MetadataRoute } from "next";
import { getAllConversionSlugs } from "@/lib/conversion-data";

const BASE_URL = "https://convertify.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${BASE_URL}/pricing`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/legal/terms`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/legal/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  const conversionRoutes: MetadataRoute.Sitemap = getAllConversionSlugs().map(
    (slug) => ({
      url: `${BASE_URL}/convert/${slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.9,
    })
  );

  return [...staticRoutes, ...conversionRoutes];
}
