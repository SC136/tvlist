import Link from "next/link";
import { PersonImage } from "@/components/ui/cover";
import { Empty, Pagination, SectionHeader } from "@/components/ui/basics";
import { getPopularPeople, searchPeople } from "@/lib/tmdb";
import { PeopleSearchBox } from "./people-search-box";

export async function PeopleBrowse({ search, page }: { search?: string; page: number }) {
  const data = search ? await searchPeople(search.slice(0, 100), page) : await getPopularPeople(page);
  return (
    <>
      <h1 className="sr-only">Browse people</h1>
      <PeopleSearchBox initial={search ?? ""} />
      <SectionHeader title={search ? `Results for “${search}”` : "Popular People"} />
      {data.results.length === 0 ? (
        <Empty>No people found.</Empty>
      ) : (
        <div className="grid grid-cols-3 gap-x-4 gap-y-6 sm:grid-cols-4 md:grid-cols-5 md:gap-x-6 lg:grid-cols-6 xl:gap-x-8">
          {data.results.map((p) => (
            <Link key={p.id} href={`/person/${p.id}`} className="group">
              <PersonImage path={p.profilePath} alt={p.name} className="cover-ratio w-full rounded-[4px] shadow-[var(--shadow-card)]" />
              <p className="mt-2 truncate text-[14px] font-semibold transition group-hover:text-accent">{p.name}</p>
              <p className="truncate text-[12px] text-text-lighter">{p.department}</p>
            </Link>
          ))}
        </div>
      )}
      <Pagination page={page} totalPages={data.totalPages} basePath="/search/people" params={{ search }} />
    </>
  );
}
