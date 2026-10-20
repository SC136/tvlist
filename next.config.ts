import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "image.tmdb.org" },
      { protocol: "https", hostname: "s4.anilist.co" },
      { protocol: "https", hostname: "media.rawg.io" },
      { protocol: "https", hostname: "shared.cloudflare.steamstatic.com" },
      { protocol: "https", hostname: "covers.openlibrary.org" },
      { protocol: "https", hostname: "*.mzstatic.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  async rewrites() {
    return [
      {
        // Proxy TMDB images through Next.js to bypass ISP DNS/CDN blocks
        source: "/img/tmdb/:path*",
        destination: "https://image.tmdb.org/t/p/:path*",
      },
      {
        // Proxy RAWG game images
        source: "/img/rawg/:path*",
        destination: "https://media.rawg.io/media/:path*",
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/img/:proxy*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
