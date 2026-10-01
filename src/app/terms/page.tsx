import type { Metadata } from "next";
import { Page } from "@/components/ui/basics";

export const metadata: Metadata = { title: "Terms & Privacy" };

export default function TermsPage() {
  return (
    <Page narrow>
      <article className="card mx-auto max-w-[760px] space-y-4 p-8 text-[14px] leading-relaxed">
        <h1 className="text-[24px] font-bold text-bright">Terms &amp; Privacy</h1>
        <p className="text-[12px] text-text-lighter">
          This is a starting template. Have it reviewed and adapted for your jurisdiction before running a public service.
        </p>

        <h2 className="pt-2 text-[16px] font-bold text-bright">Using tvlist</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Be respectful. No harassment, hate speech, spam, or illegal content.</li>
          <li>Mark spoilers in reviews, posts and comments.</li>
          <li>You own what you write; you give tvlist permission to display it on the site.</li>
          <li>Moderators may remove content or accounts that break these rules.</li>
        </ul>

        <h2 className="pt-2 text-[16px] font-bold text-bright">What we store</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Your account: username, email, and a securely hashed password (or your social sign-in identity).</li>
          <li>What you add: list entries, diary entries, reviews, lists, posts, likes and follows.</li>
          <li>Session data (IP address and browser) to keep you signed in and protect your account.</li>
        </ul>
        <p>
          Public content (non-private list entries, activity, reviews, lists and forum posts) is visible to everyone. Private list entries,
          private lists and private messages are visible only to you (and the recipient, for messages).
        </p>

        <h2 className="pt-2 text-[16px] font-bold text-bright">Your control</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Export all of your data any time from Settings → Import / Export.</li>
          <li>Delete your account from Settings → Account. This permanently removes your data.</li>
        </ul>

        <h2 className="pt-2 text-[16px] font-bold text-bright">Third parties</h2>
        <p>
          Title data and images are loaded from TMDB. Trailers load from YouTube only when you press play. We don&apos;t sell your data or
          use advertising trackers.
        </p>
      </article>
    </Page>
  );
}
