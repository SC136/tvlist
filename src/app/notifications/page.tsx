import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { and, count, desc, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import type { NotificationType } from "@/db/schema";
import { MarkRead } from "@/components/social/mark-read";
import { Avatar } from "@/components/ui/avatar";
import { Cover } from "@/components/ui/cover";
import { Empty, Page, Pagination, TimeAgo } from "@/components/ui/basics";
import { getViewer } from "@/lib/session";
import type { MediaType } from "@/lib/media";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Notifications" };

const FILTERS: { key: string; label: string; types?: NotificationType[] }[] = [
  { key: "all", label: "All" },
  { key: "airing", label: "Airing", types: ["AIRING"] },
  { key: "activity", label: "Activity", types: ["ACTIVITY_LIKE", "ACTIVITY_REPLY", "ACTIVITY_MESSAGE", "ACTIVITY_MENTION", "REPLY_LIKE"] },
  { key: "forum", label: "Forum", types: ["THREAD_REPLY", "THREAD_COMMENT_LIKE"] },
  { key: "follows", label: "Follows", types: ["FOLLOWING"] },
  { key: "lists", label: "Lists", types: ["COLLECTION_LIKE"] },
];

const PAGE = 30;

export default async function NotificationsPage({ searchParams }: PageProps<"/notifications">) {
  const viewer = await getViewer();
  if (!viewer) redirect("/login?next=/notifications");
  const sp = await searchParams;
  const filter = FILTERS.find((f) => f.key === sp.filter) ?? FILTERS[0];
  const page = Math.max(1, Number(sp.page) || 1);
  const where = and(eq(schema.notification.userId, viewer.id), filter.types ? inArray(schema.notification.type, filter.types) : undefined);

  const [items, [{ n }]] = await Promise.all([
    db.query.notification.findMany({
      where,
      orderBy: desc(schema.notification.id),
      limit: PAGE,
      offset: (page - 1) * PAGE,
      with: {
        actor: { columns: { username: true, displayUsername: true, name: true, image: true } },
        media: { columns: { type: true, tmdbId: true, title: true, posterPath: true } },
        thread: { columns: { id: true, title: true } },
        collection: { columns: { id: true, title: true } },
      },
    }),
    db.select({ n: count() }).from(schema.notification).where(where),
  ]);
  const hasUnread = items.some((i) => !i.read);

  return (
    <Page narrow>
      <MarkRead hasUnread={hasUnread} />
      <div className="mx-auto max-w-[760px]">
        <h1 className="mb-5 text-[22px] font-bold text-bright">Notifications</h1>
        <div className="mb-6 flex flex-wrap gap-1">
          {FILTERS.map((f) => (
            <Link
              key={f.key}
              href={f.key === "all" ? "/notifications" : `/notifications?filter=${f.key}`}
              className={cn("rounded px-3 py-1.5 text-[13px] font-semibold", filter.key === f.key ? "bg-accent text-on-accent" : "bg-fg shadow-[var(--shadow-card)] hover:text-accent")}
            >
              {f.label}
            </Link>
          ))}
        </div>
        {items.length === 0 ? (
          <Empty>You&apos;re all caught up.</Empty>
        ) : (
          <div className="space-y-2.5">
            {items.map((item) => {
              const actorName = item.actor ? item.actor.displayUsername || item.actor.username || item.actor.name : "";
              const { text, href } = describe(item.type, actorName, item);
              return (
                <Link
                  key={item.id}
                  href={href}
                  className={cn("card flex items-center gap-3 p-2.5 pr-4 transition hover:bg-fg-grey", !item.read && "ring-1 ring-accent/40")}
                >
                  {item.type === "AIRING" && item.media ? (
                    <Cover path={item.media.posterPath} alt="" size="w92" className="h-[56px] w-[40px] shrink-0 rounded-sm" />
                  ) : item.actor ? (
                    <Avatar src={item.actor.image} name={actorName} size={44} />
                  ) : null}
                  <p className="min-w-0 flex-1 text-[13px]">{text}</p>
                  <span className="shrink-0 text-[11px] text-text-lighter">
                    <TimeAgo date={item.createdAt} />
                  </span>
                  {!item.read && <span className="h-2 w-2 shrink-0 rounded-full bg-accent" aria-label="Unread" />}
                </Link>
              );
            })}
          </div>
        )}
        <Pagination page={page} totalPages={Math.ceil((n ?? 0) / PAGE)} basePath="/notifications" params={{ filter: filter.key === "all" ? undefined : filter.key }} />
      </div>
    </Page>
  );
}

function describe(
  type: NotificationType,
  actor: string,
  item: {
    activityId: number | null;
    context: string | null;
    media: { type: MediaType; tmdbId: number; title: string } | null;
    thread: { id: number; title: string } | null;
    collection: { id: number; title: string } | null;
    actor: { username: string | null } | null;
  },
): { text: React.ReactNode; href: string } {
  const who = <strong className="text-accent">{actor}</strong>;
  const activity = item.activityId ? `/activity/${item.activityId}` : "/";
  switch (type) {
    case "FOLLOWING":
      return { text: <>{who} started following you.</>, href: `/user/${item.actor?.username ?? ""}` };
    case "ACTIVITY_LIKE":
      return { text: <>{who} liked your activity.</>, href: activity };
    case "ACTIVITY_REPLY":
      return { text: <>{who} replied to activity you&apos;re part of.</>, href: activity };
    case "ACTIVITY_MESSAGE":
      return { text: <>{who} sent you a message.</>, href: activity };
    case "ACTIVITY_MENTION":
      return { text: <>{who} mentioned you.</>, href: item.thread ? `/forum/thread/${item.thread.id}` : activity };
    case "REPLY_LIKE":
      return { text: <>{who} liked your reply.</>, href: activity };
    case "THREAD_REPLY":
      return {
        text: (
          <>
            {who} replied in <strong>{item.thread?.title ?? "a thread"}</strong>.
          </>
        ),
        href: item.thread ? `/forum/thread/${item.thread.id}` : "/forum",
      };
    case "THREAD_COMMENT_LIKE":
      return {
        text: (
          <>
            {who} liked your comment in <strong>{item.thread?.title ?? "a thread"}</strong>.
          </>
        ),
        href: item.thread ? `/forum/thread/${item.thread.id}` : "/forum",
      };
    case "COLLECTION_LIKE":
      return {
        text: (
          <>
            {who} liked your list <strong>{item.collection?.title ?? ""}</strong>.
          </>
        ),
        href: item.collection ? `/list/${item.collection.id}` : "/lists",
      };
    case "AIRING":
      return {
        text: (
          <>
            Episode {item.context} of <strong className="text-accent">{item.media?.title}</strong> aired.
          </>
        ),
        href: item.media ? `/${item.media.type}/${item.media.tmdbId}` : "/",
      };
  }
}
