import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";
import { Page } from "@/components/ui/basics";
import { enabledSocialProviders } from "@/lib/auth";
import { getViewer } from "@/lib/session";

export const metadata: Metadata = { title: "Login" };

export default async function LoginPage() {
  if (await getViewer()) redirect("/");
  return (
    <Page className="flex min-h-[70vh] items-center">
      <Suspense>
        <AuthForm mode="login" providers={enabledSocialProviders} />
      </Suspense>
    </Page>
  );
}
