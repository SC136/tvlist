import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CastCard } from "@/components/media/people-cards";
import { Empty, SectionHeader } from "@/components/ui/basics";
import { getMediaPage } from "@/lib/queries/media-page";

export async function generateMetadata({ params }: PageProps<"/[type]/[id]/cast">): Promise<Metadata> {
  const { type, id } = await params;
  const data = await getMediaPage(type, id);
  return data ? { title: `${data.details.title} · Cast` } : {};
}

export default async function CastPage({ params }: PageProps<"/[type]/[id]/cast">) {
  const { type, id } = await params;
  const data = await getMediaPage(type, id);
  if (!data) notFound();
  const cast = data.details.cast;
  return (
    <section>
      <SectionHeader title={`Cast (${cast.length})`} />
      {cast.length === 0 ? (
        <Empty>No cast information yet.</Empty>
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
