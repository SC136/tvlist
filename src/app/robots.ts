import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/settings", "/notifications", "/review/new", "/forum/new", "/list/new"] }],
    sitemap: `${base}/sitemap.xml`,
  };
}
