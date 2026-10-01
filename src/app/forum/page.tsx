import type { Metadata } from "next";
import Link from "next/link";
import { and, count, desc, eq, ilike, or, type SQL } from "drizzle-orm";
import { Eye, Lock, MessageSquare, Pin, Plus } from "lucide-react";
import { db, schema } from "@/db";
import type { ForumCategory } from "@/db/schema";
import { Avatar } from "@/components/ui/avatar";
import { Empty, Page, Pagination, TimeAgo } from "@/components/ui/basics";
import { ForumSearch } from "@/components/forum/forum-search";
import { categoryInfo, FORUM_CATEGORIES } from "@/lib/forum";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Forum" };

const PAGE = 25;

export default async function ForumIndex({ searchParams }: PageProps<"/forum">) {
  const sp = await searchParams;
  const category = FORUM_CATEGORIES.find((c) => c.key === sp.category)?.key as ForumCategory | undefined;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 100) : "";
  const page = Math.max(1, Number(sp.page) || 1);
  const escaped = q.replace(/[\\%_]/g, (c) => `\\${c}`);
  const conditions: (SQL | undefined)[] = [
    category ? eq(schema.forumThread.category, category) : undefined,
    q ? or(ilike(schema.forumThread.title, `%${escaped}%`), ilike(schema.forumThread.body, `%${escaped}%`)) : undefined,
  ];
  const where = and(...conditions);

  const [threads, [{ n }], counts] = await Promise.all([
    db.query.forumThread.findMany({
      where,
      orderBy: [desc(schema.forumThread.pinned), desc(schema.forumThread.lastReplyAt), desc(schema.forumThread.id)],
      limit: PAGE,
      offset: (page - 1) * PAGE,
      with: {
        user: { columns: { username: true, displayUsername: true, name: true, image: true } },
        lastReplyUser: { columns: { username: true, displayUsername: true, name: true, image: true } },
        media: { columns: { type: true, tmdbId: true, title: true } },
      },
    }),
    db.select({ n: count() }).from(schema.forumThread).where(where),
    db.select({ category: schema.forumThread.category, n: count() }).from(schema.forumThread).groupBy(schema.forumThread.category),
  ]);
  const countFor = (k: string) => counts.find((c) => c.category === k)?.n ?? 0;

  return (
    <Page>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-bright">Forum</h1>
          <p className="text-[13px] text-text-lighter">Discuss movies, shows, episodes and everything in between.</p>
        </div>
        <div className="flex items-center gap-2">
          <ForumSearch initial={q} category={category} />
          <Link href={`/forum/new${category ? `?category=${category}` : ""}`} className="btn btn-primary shrink-0">
            <Plus className="h-4 w-4" /> New Thread
          </Link>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[230px_1fr]">
        <aside>
          <nav className="flex flex-wrap gap-1 lg:block lg:space-y-0.5">
            <Link
              href="/forum"
              className={cn("flex items-center justify-between gap-3 rounded px-3 py-2 text-[13px] font-semibold", !category ? "bg-fg text-accent shadow-[var(--shadow-card)]" : "hover:text-accent")}
            >
              All Threads
            </Link>
            {FORUM_CATEGORIES.map((c) => (
              <Link
                key={c.key}
                href={`/forum?category=${c.key}`}
                className={cn(
                  "flex items-center justify-between gap-3 rounded px-3 py-2 text-[13px] font-semibold",
                  category === c.key ? "bg-fg text-accent shadow-[var(--shadow-card)]" : "hover:text-accent",
                )}
              >
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />
                  {c.label}
                </span>
                <span className="text-[11px] text-text-lighter">{countFor(c.key)}</span>
              </Link>
            ))}
          </nav>
        </aside>

        <div className="min-w-0">
          {category && <p className="mb-4 text-[13px] text-text-light">{categoryInfo(category).description}</p>}
          {threads.length === 0 ? (
            <Empty>{q ? "No threads match that search." : "No threads yet. Start the conversation!"}</Empty>
          ) : (
            <div className="space-y-3">
              {threads.map((t) => {
                const cat = categoryInfo(t.category);
                const author = t.user.displayUsername || t.user.username || t.user.name;
                const last = t.lastReplyUser ? t.lastReplyUser.displayUsername || t.lastReplyUser.username || t.lastReplyUser.name : null;
                return (
                  <div key={t.id} className="card flex items-center gap-4 p-4">
                    <Avatar src={t.user.image} name={author} size={40} className="hidden sm:inline-flex" />
                    <div className="min-w-0 flex-1">
                      <Link href={`/forum/thread/${t.id}`} className="flex items-center gap-2 text-[15px] font-semibold text-bright hover:text-accent">
                        {t.pinned && <Pin className="h-3.5 w-3.5 shrink-0 text-accent" aria-label="Pinned" />}
                        {t.locked && <Lock className="h-3.5 w-3.5 shrink-0 text-text-lighter" aria-label="Locked" />}
                        <span className="truncate">{t.title}</span>
                      </Link>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-text-lighter">
                        <span className="rounded-full px-2 py-px font-bold text-white" style={{ background: cat.color }}>
                          {cat.label}
                        </span>
                        {t.media && (
                          <Link href={`/${t.media.type}/${t.media.tmdbId}`} className="rounded-full bg-fg-grey px-2 py-px font-semibold hover:text-accent">
                            {t.media.title}
                          </Link>
                        )}
                        <span>
                          by{" "}
                          <Link href={`/user/${t.user.username}`} className="font-semibold text-text hover:text-accent">
                            {author}
                          </Link>
                        </span>
                      </div>
                    </div>
                    <div className="hidden shrink-0 items-center gap-4 text-[12px] text-text-lighter md:flex">
                      <span className="flex items-center gap-1" title="Replies">
                        <MessageSquare className="h-3.5 w-3.5" /> {t.replyCount}
                      </span>
                      <span className="flex items-center gap-1" title="Views">
                        <Eye className="h-3.5 w-3.5" /> {t.viewCount}
                      </span>
                    </div>
                    <div className="hidden w-36 shrink-0 text-right text-[11px] text-text-lighter sm:block">
                      {last && t.replyCount > 0 ? (
                        <>
                          <span className="font-semibold text-text">{last}</span> replied
                          <br />
                        </>
                      ) : null}
                      <TimeAgo date={t.lastReplyAt ?? t.createdAt} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <Pagination page={page} totalPages={Math.ceil((n ?? 0) / PAGE)} basePath="/forum" params={{ category, q: q || undefined }} />
        </div>
      </div>
    </Page>
  );
}
