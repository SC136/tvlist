import Link from "next/link";
import { Page } from "@/components/ui/basics";

export default function NotFound() {
  return (
    <Page className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="text-[64px] font-extrabold text-accent">404</p>
      <h1 className="mt-2 text-[20px] font-bold text-bright">This page went missing.</h1>
      <p className="mt-2 text-[14px] text-text-lighter">Maybe it was cut in the edit. Let&apos;s get you back to something good.</p>
      <div className="mt-6 flex gap-3">
        <Link href="/" className="btn btn-primary">
          Home
        </Link>
        <Link href="/search/movie" className="btn btn-secondary bg-fg shadow-[var(--shadow-card)]">
          Browse
        </Link>
      </div>
    </Page>
  );
}
