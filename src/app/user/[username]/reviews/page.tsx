import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { schema } from "@/db";
import { ReviewTile } from "@/components/review/review-card";
import { Empty } from "@/components/ui/basics";
import { getProfile } from "@/lib/queries/profile";
import { listReviews } from "@/lib/queries/reviews";

export async function generateMetadata({ params }: PageProps<"/user/[username]/reviews">): Promise<Metadata> {
  const { username } = await params;
  const profile = await getProfile(username);
  return profile ? { title: `${profile.name}'s Reviews` } : {};
}

export default async function UserReviewsPage({ params }: PageProps<"/user/[username]/reviews">) {
  const { username } = await params;
  const profile = await getProfile(username);
  if (!profile) notFound();
  const reviews = await listReviews({ where: eq(schema.review.userId, profile.user.id), limit: 100 });
  if (!reviews.length) return <Empty>{profile.isSelf ? "You haven't written any reviews yet. Open a title and choose Reviews → Write Review." : "No reviews yet."}</Empty>;
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {reviews.map((r) => (
        <ReviewTile key={r.id} review={r} />
      ))}
    </div>
  );
}
