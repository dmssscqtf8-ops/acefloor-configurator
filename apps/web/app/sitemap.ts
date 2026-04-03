import type { MetadataRoute } from "next";
import {
  catalogProducts,
  getCatalogProductHref,
} from "../features/configurator/data/mock-catalog";
import { getSiteOriginOrLocal } from "../lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = getSiteOriginOrLocal().toString().replace(/\/$/, "");
  const lastModified = new Date();

  return [
    {
      url: `${origin}/`,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${origin}/produits`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...catalogProducts.map((product) => ({
      url: `${origin}${getCatalogProductHref(product)}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
