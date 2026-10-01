import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { AccountSettings } from "@/components/settings/account-settings";
import { ImportExport } from "@/components/settings/import-export";
import { ListSettings } from "@/components/settings/list-settings";
import { ProfileSettings } from "@/components/settings/profile-settings";
import { PalettePicker } from "@/components/layout/palette-picker";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Page } from "@/components/ui/basics";
import { getViewer } from "@/lib/session";
import { cn } from "@/lib/cn";
import type { ScoreFormat } from "@/lib/format";

export const metadata: Metadata = { title: "Settings" };

const TABS = [
  { key: "profile", label: "Profile" },
  { key: "lists", label: "Lists" },
  { key: "site", label: "Site" },
  { key: "account", label: "Account" },
  { key: "import", label: "Import / Export" },
] as const;

export default async function SettingsPage({ searchParams }: PageProps<"/settings">) {
  const viewer = await getViewer();
  if (!viewer) redirect("/login?next=/settings");
  const sp = await searchParams;
  const tab = TABS.find((t) => t.key === sp.tab)?.key ?? "profile";
  const credential = await db.query.account.findFirst({
    where: and(eq(schema.account.userId, viewer.id), eq(schema.account.providerId, "credential")),
    columns: { id: true },
  });

  return (
    <Page narrow>
      <h1 className="mb-6 text-[22px] font-bold text-bright">Settings</h1>
      <div className="grid gap-8 md:grid-cols-[200px_1fr]">
        <nav className="flex flex-wrap gap-1 md:block md:space-y-0.5">
          {TABS.map((t) => (
            <Link
              key={t.key}
              href={t.key === "profile" ? "/settings" : `/settings?tab=${t.key}`}
              className={cn("block rounded px-3 py-2 text-[13px] font-semibold", tab === t.key ? "bg-fg text-accent shadow-[var(--shadow-card)]" : "hover:text-accent")}
            >
              {t.label}
            </Link>
          ))}
          <Link href={`/user/${viewer.username}`} className="mt-3 block px-3 py-2 text-[12px] font-semibold text-text-lighter hover:text-accent">
            View profile →
          </Link>
        </nav>
        <div className="min-w-0">
          {tab === "profile" && (
            <ProfileSettings
              uploadsEnabled={Boolean(process.env.BLOB_READ_WRITE_TOKEN)}
              user={{
                username: viewer.username ?? "",
                displayUsername: viewer.displayUsername ?? viewer.username ?? "",
                about: viewer.about ?? "",
                image: viewer.image ?? "",
                bannerImage: viewer.bannerImage ?? "",
                profileColor: viewer.profileColor,
              }}
            />
          )}
          {tab === "lists" && <ListSettings scoreFormat={viewer.scoreFormat as ScoreFormat} />}
          {tab === "site" && (
            <div className="space-y-8">
              <section className="card space-y-4 p-6">
                <h2 className="text-[16px] font-bold text-bright">Theme</h2>
                <p className="text-[13px] text-text-light">Light, dark, or follow your device. Saved on this browser.</p>
                <div className="inline-flex rounded-md bg-nav p-2">
                  <ThemeToggle />
                </div>
              </section>
              <section className="card space-y-4 p-6">
                <h2 className="text-[16px] font-bold text-bright">Colour Palette</h2>
                <p className="text-[13px] text-text-light">Pick the colours the whole site uses. Works in both light and dark mode. Saved on this browser.</p>
                <PalettePicker variant="cards" />
              </section>
            </div>
          )}
          {tab === "account" && <AccountSettings email={viewer.email} hasPassword={Boolean(credential)} />}
          {tab === "import" && <ImportExport />}
        </div>
      </div>
    </Page>
  );
}
