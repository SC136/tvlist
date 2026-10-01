import type { Metadata } from "next";
import Link from "next/link";
import { count, eq } from "drizzle-orm";
import { Plus } from "lucide-react";
import { db, schema } from "@/db";
import { CollectionCard } from "@/components/list/collection-card";
import { Empty, Page, Pagination } from "@/components/ui/basics";
import { listCollections } from "@/lib/queries/collections";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Lists" };

const PAGE = 24;

export default async function ListsIndex({ searchParams }: PageProps<"/lists">) {
  const sp = await searchParams;
  const order = sp.sort === "popular" ? "popular" : "recent";
  const page = Math.max(1, Number(sp.page) || 1);
  const where = eq(schema.collection.private, false);
  const [lists, [{ n }]] = await Promise.all([
    listCollections({ where, order, limit: PAGE, offset: (page - 1) * PAGE }),
    db.select({ n: count() }).from(schema.collection).where(where),
  ]);

  return (
    <Page>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-bright">Lists</h1>
          <p className="text-[13px] text-text-lighter">Collections curated by the community.</p>
        </div>
        <div className="flex items-center gap-2">
          {(["recent", "popular"] as const).map((o) => (
            <Link
              key={o}
              href={o === "recent" ? "/lists" : "/lists?sort=popular"}
              className={cn("rounded px-3 py-1.5 text-[13px] font-semibold capitalize", order === o ? "bg-accent text-on-accent" : "bg-fg shadow-[var(--shadow-card)] hover:text-accent")}
            >
              {o}
            </Link>
          ))}
          <Link href="/list/new" className="btn btn-primary">
            <Plus className="h-4 w-4" /> New List
          </Link>
        </div>
      </div>
      {lists.length === 0 ? (
        <Empty>No public lists yet. Be the first to make one!</Empty>
      ) : (
        <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {lists.map((l) => (
            <CollectionCard key={l.id} list={l} />
          ))}
        </div>
      )}
      <Pagination page={page} totalPages={Math.ceil((n ?? 0) / PAGE)} basePath="/lists" params={{ sort: order === "popular" ? "popular" : undefined }} />
    </Page>
  );
}
