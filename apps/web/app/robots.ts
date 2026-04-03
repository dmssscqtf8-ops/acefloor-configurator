import type { MetadataRoute } from "next";
import { getSiteOriginOrLocal } from "../lib/site";

export default function robots(): MetadataRoute.Robots {
  const origin = getSiteOriginOrLocal().toString().replace(/\/$/, "");

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
      },
    ],
    host: origin,
    sitemap: `${origin}/sitemap.xml`,
  };
}
