import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ThreadForm } from "@/components/forum/thread-form";
import { Page } from "@/components/ui/basics";
import { getViewer } from "@/lib/session";
import { getMediaDetails } from "@/lib/tmdb";
import { FORUM_CATEGORIES } from "@/lib/forum";
import { isMediaType } from "@/lib/media";
import type { ForumCategory } from "@/db/schema";

export const metadata: Metadata = { title: "New Thread" };

export default async function NewThreadPage({ searchParams }: PageProps<"/forum/new">) {
  const sp = await searchParams;
  const viewer = await getViewer();
  const qs = new URLSearchParams(Object.entries(sp).filter(([, v]) => typeof v === "string") as [string, string][]).toString();
  if (!viewer) redirect(`/login?next=${encodeURIComponent(`/forum/new${qs ? `?${qs}` : ""}`)}`);

  let media: { type: "movie" | "tv"; tmdbId: number; title: string } | null = null;
  const type = String(sp.type ?? "");
  const id = Number(sp.id);
  if (isMediaType(type) && Number.isInteger(id) && id > 0) {
    const details = await getMediaDetails(type, id);
    if (details) media = { type, tmdbId: id, title: details.title };
  }
  const category = (FORUM_CATEGORIES.find((c) => c.key === sp.category)?.key ??
    (media ? (media.type === "movie" ? "MOVIES" : "TV") : "GENERAL")) as ForumCategory;

  return (
    <Page narrow>
      <div className="mx-auto max-w-[760px]">
        <h1 className="mb-6 text-[22px] font-bold text-bright">New Thread</h1>
        <ThreadForm defaultCategory={category} media={media} />
      </div>
    </Page>
  );
}
