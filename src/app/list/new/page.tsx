import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CollectionForm } from "@/components/list/collection-form";
import { Page } from "@/components/ui/basics";
import { getViewer } from "@/lib/session";

export const metadata: Metadata = { title: "New List" };

export default async function NewListPage() {
  if (!(await getViewer())) redirect("/login?next=/list/new");
  return (
    <Page narrow>
      <div className="mx-auto max-w-[640px]">
        <h1 className="mb-6 text-[22px] font-bold text-bright">New List</h1>
        <div className="card p-6">
          <CollectionForm />
        </div>
        <p className="mt-4 text-center text-[12px] text-text-lighter">You can add titles after creating the list, or from any movie or show page.</p>
      </div>
    </Page>
  );
}
