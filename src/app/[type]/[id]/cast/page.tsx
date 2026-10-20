import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CastCard } from "@/components/media/people-cards";
import { Empty, SectionHeader } from "@/components/ui/basics";
import { getMediaPage } from "@/lib/queries/media-page";

export async function generateMetadata({ params }: PageProps<"/[type]/[id]/cast">): Promise<Metadata> {
  const { type, id } = await params;
  if (type === "game" || type === "book" || type === "music") return {};
  const data = await getMediaPage(type, id);
  const label = type === "manga" ? "Characters" : "Cast";
  return data ? { title: `${data.details.title} · ${label}` } : {};
}

export default async function CastPage({ params }: PageProps<"/[type]/[id]/cast">) {
  const { type, id } = await params;
  if (type === "game" || type === "book" || type === "music") notFound();
  const data = await getMediaPage(type, id);
  if (!data) notFound();
  const cast = data.details.cast;
  const label = type === "manga" ? "Characters" : "Cast";
  return (
    <section>
      <SectionHeader title={`${label} (${cast.length})`} />
      {cast.length === 0 ? (
        <Empty>No {label.toLowerCase()} information yet.</Empty>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cast.map((c) => (
            <CastCard key={`${c.id}-${c.character}`} member={c} />
          ))}
        </div>
      )}
    </section>
  );
}
