import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/settings", "/notifications", "/review/new", "/forum/new", "/list/new"] }],
    sitemap: `${base}/sitemap.xml`,
  };
}
