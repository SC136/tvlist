"use client";

import Link from "next/link";
import { Fragment, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Renders user text safely (no HTML): keeps line breaks, links URLs,
 * @mentions, and supports ~!spoiler!~ syntax and **bold** / _italic_.
 */
export function RichText({ text, className }: { text: string; className?: string }) {
  return <div className={cn("prose-user text-[14px] leading-relaxed", className)}>{renderSpoilers(text)}</div>;
}

function renderSpoilers(text: string): ReactNode[] {
  const parts = text.split(/(~![\s\S]+?!~)/g);
  return parts.map((part, i) =>
    part.startsWith("~!") && part.endsWith("!~") ? (
      <Spoiler key={i}>{renderInline(part.slice(2, -2))}</Spoiler>
    ) : (
      <Fragment key={i}>{renderInline(part)}</Fragment>
    ),
  );
}

const TOKEN = /(https?:\/\/[^\s<>"']+[^\s<>"'.,;:!?)\]])|(@[A-Za-z0-9_]{3,20})|(\*\*[^*\n]+\*\*)|(__[^_\n]+__)|(\b_[^_\n]+_\b)/g;

function renderInline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let key = 0;
  for (const m of text.matchAll(TOKEN)) {
    const idx = m.index ?? 0;
    if (idx > last) out.push(text.slice(last, idx));
    const [whole, url, mention, bold, bold2, italic] = m;
    if (url) {
      out.push(
        <a key={key++} href={url} target="_blank" rel="noopener noreferrer nofollow ugc" className="text-accent hover:underline">
          {url.length > 60 ? `${url.slice(0, 57)}…` : url}
        </a>,
      );
    } else if (mention) {
      out.push(
        <Link key={key++} href={`/user/${mention.slice(1).toLowerCase()}`} className="font-semibold text-accent hover:underline">
          {mention}
        </Link>,
      );
    } else if (bold || bold2) {
      out.push(<strong key={key++}>{whole.slice(2, -2)}</strong>);
    } else if (italic) {
      out.push(<em key={key++}>{whole.slice(1, -1)}</em>);
    }
    last = idx + whole.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function Spoiler({ children }: { children: ReactNode }) {
  const [shown, setShown] = useState(false);
  return shown ? (
    <span>{children}</span>
  ) : (
    <button type="button" onClick={() => setShown(true)} className="rounded bg-fg-grey-dark px-1.5 text-[12px] font-semibold text-text-lighter hover:text-accent">
      Spoiler, click to view
    </button>
  );
}
