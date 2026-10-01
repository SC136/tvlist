import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { MessagesSquare } from "lucide-react";
import { db, schema } from "@/db";
import { ActivityFeed } from "@/components/social/activity-feed";
import { SectionHeader, TimeAgo } from "@/components/ui/basics";
import { getMediaPage } from "@/lib/queries/media-page";
import { getActivities } from "@/lib/queries/activity";
import { toFeedViewer } from "@/lib/session";

export async function generateMetadata({ params }: PageProps<"/[type]/[id]/social">): Promise<Metadata> {
  const { type, id } = await params;
  const data = await getMediaPage(type, id);
  return data ? { title: `${data.details.title} · Social` } : {};
}

export default async function MediaSocialPage({ params }: PageProps<"/[type]/[id]/social">) {
  const { type, id } = await params;
  const data = await getMediaPage(type, id);
  if (!data) notFound();
  const { row, viewer, details } = data;

  const [activities, threads] = row
    ? await Promise.all([
        getActivities({ kind: "media", mediaId: row.id }, viewer?.id ?? null),
        db.query.forumThread.findMany({
          where: eq(schema.forumThread.mediaId, row.id),
          orderBy: desc(schema.forumThread.lastReplyAt),
          limit: 5,
          with: { user: { columns: { username: true, displayUsername: true } } },
        }),
      ])
    : [[], []];

  return (
    <div className="space-y-10">
      <section>
        <div className="mb-3 flex items-end justify-between">
          <SectionHeader title="Forum Threads" className="mb-0" />
          <Link href={`/forum/new?type=${type}&id=${id}`} className="text-[12px] font-semibold text-text-lighter hover:text-accent">
            Start a thread
          </Link>
        </div>
        {threads.length === 0 ? (
          <p className="card p-5 text-[13px] text-text-lighter">No discussions about {details.title} yet.</p>
        ) : (
          <div className="card divide-y divide-fg-grey-dark">
            {threads.map((t) => (
              <Link key={t.id} href={`/forum/thread/${t.id}`} className="flex items-center gap-3 px-4 py-3 transition hover:bg-fg-grey">
                <MessagesSquare className="h-4 w-4 shrink-0 text-text-lighter" />
                <span className="min-w-0 flex-1 truncate text-[14px] font-semibold text-bright">{t.title}</span>
                <span className="shrink-0 text-[12px] text-text-lighter">
                  {t.replyCount} replies · <TimeAgo date={t.lastReplyAt ?? t.createdAt} />
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionHeader title="Recent Activity" />
        {row ? (
          <ActivityFeed initial={activities} scope={{ kind: "media", mediaId: row.id }} viewer={toFeedViewer(viewer)} emptyText="No activity for this title yet." />
        ) : (
          <p className="card p-5 text-[13px] text-text-lighter">No activity for this title yet.</p>
        )}
      </section>
    </div>
  );
}
