import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { PenLine } from "lucide-react";
import { schema } from "@/db";
import { ReviewCard } from "@/components/review/review-card";
import { Empty, SectionHeader } from "@/components/ui/basics";
import { getMediaPage } from "@/lib/queries/media-page";
import { listReviews } from "@/lib/queries/reviews";

export async function generateMetadata({ params }: PageProps<"/[type]/[id]/reviews">): Promise<Metadata> {
  const { type, id } = await params;
  const data = await getMediaPage(type, id);
  return data ? { title: `${data.details.title} · Reviews` } : {};
}

export default async function MediaReviewsPage({ params }: PageProps<"/[type]/[id]/reviews">) {
  const { type, id } = await params;
  const data = await getMediaPage(type, id);
  if (!data) notFound();
  const reviews = data.row ? await listReviews({ where: eq(schema.review.mediaId, data.row.id), limit: 50, order: "top" }) : [];
  const mine = data.viewer ? reviews.find((r) => r.user.id === data.viewer!.id) : undefined;

  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-4">
        <SectionHeader title={`Reviews (${reviews.length})`} className="mb-0" />
        <Link href={`/review/new?type=${type}&id=${id}`} className="btn btn-primary">
          <PenLine className="h-4 w-4" /> {mine ? "Edit Your Review" : "Write Review"}
        </Link>
      </div>
      {reviews.length === 0 ? (
        <Empty>No reviews yet. Share what you thought!</Empty>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {reviews.map((r) => (
            <ReviewCard key={r.id} review={r} />
          ))}
        </div>
      )}
    </section>
  );
}
