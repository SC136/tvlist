import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { ReviewEditor } from "@/components/review/review-editor";
import { Cover } from "@/components/ui/cover";
import { Page } from "@/components/ui/basics";
import { getViewer } from "@/lib/session";
import { findMedia } from "@/lib/queries/media";
import { getMediaDetails } from "@/lib/tmdb";
import { isMediaType } from "@/lib/media";

export const metadata: Metadata = { title: "Write a Review" };

export default async function NewReviewPage({ searchParams }: PageProps<"/review/new">) {
  const sp = await searchParams;
  const type = String(sp.type ?? "");
  const id = Number(sp.id);
  if (!isMediaType(type) || !Number.isInteger(id) || id <= 0) notFound();
  const viewer = await getViewer();
  if (!viewer) redirect(`/login?next=${encodeURIComponent(`/review/new?type=${type}&id=${id}`)}`);

  const details = await getMediaDetails(type, id);
  if (!details) notFound();
  const row = await findMedia(type, id);
  const existing = row
    ? await db.query.review.findFirst({ where: and(eq(schema.review.userId, viewer.id), eq(schema.review.mediaId, row.id)) })
    : null;

  return (
    <Page narrow>
      <div className="mb-8 flex items-center gap-4">
        <Cover path={details.posterPath} alt="" size="w154" className="h-[96px] w-[66px] shrink-0 rounded shadow-[var(--shadow-card)]" />
        <div>
          <p className="text-[12px] font-bold tracking-wide text-text-lighter uppercase">{existing ? "Edit your review" : "Write a review"}</p>
          <h1 className="text-[20px] font-bold text-bright">
            <Link href={`/${type}/${id}`} className="hover:text-accent">
              {details.title}
            </Link>
          </h1>
          {details.year && <p className="text-[13px] text-text-lighter">{details.year}</p>}
        </div>
      </div>
      <ReviewEditor
        media={{ type, tmdbId: id, title: details.title }}
        existing={
          existing
            ? { id: existing.id, summary: existing.summary, body: existing.body, score: existing.score, containsSpoilers: existing.containsSpoilers }
            : null
        }
      />
    </Page>
  );
}
