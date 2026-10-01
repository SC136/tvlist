import type { Metadata } from "next";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { schema } from "@/db";
import { ReviewTile } from "@/components/review/review-card";
import { Empty, Page, Pagination } from "@/components/ui/basics";
import { countReviews, listReviews } from "@/lib/queries/reviews";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Reviews" };

const PAGE = 24;

export default async function ReviewsIndex({ searchParams }: PageProps<"/reviews">) {
  const sp = await searchParams;
  const order = sp.sort === "top" ? "top" : "recent";
  const type = sp.type === "movie" || sp.type === "tv" ? sp.type : null;
  const page = Math.max(1, Number(sp.page) || 1);
  const where = type ? eq(schema.media.type, type) : undefined;
  const [reviews, total] = await Promise.all([
    listReviews({ where, order, limit: PAGE, offset: (page - 1) * PAGE }),
    countReviews(where),
  ]);

  const link = (o: string, t: string | null) => {
    const q = new URLSearchParams();
    if (o !== "recent") q.set("sort", o);
    if (t) q.set("type", t);
    return q.size ? `/reviews?${q}` : "/reviews";
  };
  const pill = (active: boolean) =>
    cn("rounded px-3 py-1.5 text-[13px] font-semibold", active ? "bg-accent text-on-accent" : "bg-fg shadow-[var(--shadow-card)] hover:text-accent");

  return (
    <Page>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-bright">Reviews</h1>
          <p className="text-[13px] text-text-lighter">What the community thinks.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={link(order, null)} className={pill(!type)}>
            All
          </Link>
          <Link href={link(order, "movie")} className={pill(type === "movie")}>
            Movies
          </Link>
          <Link href={link(order, "tv")} className={pill(type === "tv")}>
            TV
          </Link>
          <span className="mx-1 w-px bg-fg-grey-dark" />
          <Link href={link("recent", type)} className={pill(order === "recent")}>
            Recent
          </Link>
          <Link href={link("top", type)} className={pill(order === "top")}>
            Top Rated
          </Link>
        </div>
      </div>
      {reviews.length === 0 ? (
        <Empty>No reviews yet. Open any movie or show and write the first one!</Empty>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {reviews.map((r) => (
            <ReviewTile key={r.id} review={r} />
          ))}
        </div>
      )}
      <Pagination page={page} totalPages={Math.ceil(total / PAGE)} basePath="/reviews" params={{ sort: order === "top" ? "top" : undefined, type: type ?? undefined }} />
    </Page>
  );
}
