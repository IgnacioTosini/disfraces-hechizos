import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getSiteUrl();

  return [
    { url: baseUrl.toString(), changeFrequency: "weekly", priority: 1 },
    { url: new URL("catalogo", baseUrl).toString(), changeFrequency: "daily", priority: 0.9 },
  ];
}
