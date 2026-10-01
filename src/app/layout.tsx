import type { Metadata, Viewport } from "next";
import { Overpass } from "next/font/google";
import { and, count, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getViewer } from "@/lib/session";
import { isDemoMode } from "@/lib/tmdb";
import { PALETTES, paletteBackground, paletteCss } from "@/lib/palettes";
import { SiteNav } from "@/components/layout/site-nav";
import { ScrollReset } from "@/components/layout/scroll-reset";
import { SiteFooter } from "@/components/layout/site-footer";
import "./globals.css";

const overpass = Overpass({
  variable: "--font-overpass",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

const SITE_URL = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "tvlist · Track, discover and share movies & TV",
    template: "%s · tvlist",
  },
  description:
    "Track the movies and TV shows you watch, rate and review them, keep a diary, make lists, and follow friends — all in one place.",
  applicationName: "tvlist",
  openGraph: { siteName: "tvlist", type: "website" },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: paletteBackground(PALETTES[0], "light") },
    { media: "(prefers-color-scheme: dark)", color: paletteBackground(PALETTES[0], "dark") },
  ],
};

// Runs before first paint so the stored theme and palette never flash.
const themeScript = `(function(){var d=document.documentElement;try{var t=localStorage.getItem("theme")||"system";var k=t==="dark"||(t==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);d.dataset.theme=k?"dark":"light";var p=localStorage.getItem("palette");if(p&&/^[a-z]{3,20}$/.test(p))d.dataset.palette=p;}catch(e){d.dataset.theme="light";}})();`;

const PALETTE_STYLES = paletteCss();

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const viewer = await getViewer();
  let unread = 0;
  if (viewer) {
    const [row] = await db
      .select({ n: count() })
      .from(schema.notification)
      .where(and(eq(schema.notification.userId, viewer.id), eq(schema.notification.read, false)));
    unread = row?.n ?? 0;
  }

  return (
    <html lang="en" className={overpass.variable} data-theme="light" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <style dangerouslySetInnerHTML={{ __html: PALETTE_STYLES }} />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-screen flex-col">
        <SiteNav
          viewer={
            viewer
              ? {
                  username: viewer.username ?? "",
                  name: viewer.displayUsername || viewer.username || viewer.name,
                  image: viewer.image,
                  unread,
                }
              : null
          }
        />
        {isDemoMode() && (
          <div className="bg-orange/15 px-4 pt-[76px] pb-2 text-center text-[13px] text-bright">
            Demo mode: showing a small built-in catalog. Add <code className="font-semibold">TMDB_API_KEY</code> to load
            the full TMDB database.
          </div>
        )}
        <main className="flex-1">{children}</main>
        <SiteFooter />
        {/* After the page content on purpose: its layout effect must run after Next's own scroll handling. */}
        <ScrollReset />
      </body>
    </html>
  );
}
