import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ActivityCard } from "@/components/social/activity-card";
import { Page } from "@/components/ui/basics";
import { getActivities } from "@/lib/queries/activity";
import { getViewer, toFeedViewer } from "@/lib/session";

export const metadata: Metadata = { title: "Activity" };

export default async function ActivityPage({ params }: PageProps<"/activity/[id]">) {
  const { id } = await params;
  const activityId = Number(id);
  if (!Number.isInteger(activityId) || activityId <= 0) notFound();
  const viewer = await getViewer();
  const [item] = await getActivities({ kind: "single", activityId }, viewer?.id ?? null);
  if (!item) notFound();
  return (
    <Page narrow>
      <div className="mx-auto max-w-[700px]">
        <ActivityCard item={item} viewer={toFeedViewer(viewer)} defaultRepliesOpen />
      </div>
    </Page>
  );
}
