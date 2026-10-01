import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CrewCard } from "@/components/media/people-cards";
import { Empty, SectionHeader } from "@/components/ui/basics";
import { getMediaPage } from "@/lib/queries/media-page";
import type { CrewMember } from "@/lib/tmdb";

const DEPARTMENT_ORDER = ["Directing", "Writing", "Production", "Sound", "Camera", "Editing", "Art", "Costume & Make-Up", "Visual Effects", "Crew", "Lighting"];

export async function generateMetadata({ params }: PageProps<"/[type]/[id]/crew">): Promise<Metadata> {
  const { type, id } = await params;
  const data = await getMediaPage(type, id);
  return data ? { title: `${data.details.title} · Crew` } : {};
}

export default async function CrewPage({ params }: PageProps<"/[type]/[id]/crew">) {
  const { type, id } = await params;
  const data = await getMediaPage(type, id);
  if (!data) notFound();
  const groups = new Map<string, CrewMember[]>();
  for (const c of data.details.crew) {
    const list = groups.get(c.department) ?? [];
    list.push(c);
    groups.set(c.department, list);
  }
  const departments = [...groups.keys()].sort(
    (a, b) => (DEPARTMENT_ORDER.indexOf(a) + 1 || 99) - (DEPARTMENT_ORDER.indexOf(b) + 1 || 99),
  );
  if (!departments.length) return <Empty>No crew information yet.</Empty>;
  return (
    <div className="space-y-10">
      {departments.map((dep) => (
        <section key={dep}>
          <SectionHeader title={dep} />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {groups.get(dep)!.map((c) => (
              <CrewCard key={c.id} member={c} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
