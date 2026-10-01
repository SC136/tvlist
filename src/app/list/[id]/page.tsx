import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Lock } from "lucide-react";
import { CollectionHeaderActions } from "@/components/list/collection-header-actions";
import { CollectionItems } from "@/components/list/collection-items";
import { RichText } from "@/components/social/rich-text";
import { Avatar } from "@/components/ui/avatar";
import { Page, TimeAgo } from "@/components/ui/basics";
import { getViewer } from "@/lib/session";
import { getCollection } from "@/lib/queries/collections";

export async function generateMetadata({ params }: PageProps<"/list/[id]">): Promise<Metadata> {
  const { id } = await params;
  const viewer = await getViewer();
  const list = await getCollection(Number(id), viewer?.id ?? null);
  return list ? { title: list.title, description: list.description?.slice(0, 160) } : {};
}

export default async function ListPage({ params }: PageProps<"/list/[id]">) {
  const { id } = await params;
  const listId = Number(id);
  if (!Number.isInteger(listId)) notFound();
  const viewer = await getViewer();
  const list = await getCollection(listId, viewer?.id ?? null);
  if (!list) notFound();
  const isOwner = viewer?.id === list.userId;
  const name = list.user.displayUsername || list.user.username || list.user.name;

  return (
    <Page>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <Link href={`/user/${list.user.username}`} className="mb-3 flex items-center gap-2 text-[13px]">
            <Avatar src={list.user.image} name={name} size={26} rounded="rounded-full" />
            <span className="font-semibold text-accent">{name}</span>
            <span className="text-text-lighter">
              · updated <TimeAgo date={list.updatedAt} />
            </span>
          </Link>
          <h1 className="flex items-center gap-2 text-[24px] font-bold text-bright">
            {list.private && <Lock className="h-5 w-5 text-text-lighter" />}
            {list.title}
          </h1>
          <p className="mt-1 text-[13px] text-text-lighter">
            {list.items.length} titles{list.ranked ? " · ranked" : ""}
          </p>
          {list.description && <RichText text={list.description} className="mt-3" />}
        </div>
        <CollectionHeaderActions
          collection={{ id: list.id, title: list.title, description: list.description, ranked: list.ranked, private: list.private }}
          liked={list.liked}
          likes={list.likes}
          isOwner={isOwner}
          loggedIn={Boolean(viewer)}
        />
      </div>
      <CollectionItems
        collectionId={list.id}
        ranked={list.ranked}
        isOwner={isOwner}
        initial={list.items.map(({ item, media }) => ({
          mediaId: media.id,
          type: media.type,
          tmdbId: media.tmdbId,
          title: media.title,
          posterPath: media.posterPath,
          year: media.year,
          note: item.note,
        }))}
      />
    </Page>
  );
}
