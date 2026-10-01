"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

export function NavTabs({
  tabs,
  className,
  itemClassName,
}: {
  tabs: { href: string; label: string; exact?: boolean }[];
  className?: string;
  itemClassName?: string;
}) {
  const pathname = usePathname();
  return (
    <nav className={cn("scrollbar-none flex overflow-x-auto", className)}>
      {tabs.map((tab) => {
        const active = tab.exact ? pathname === tab.href : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "shrink-0 px-4 py-3.5 text-[14px] whitespace-nowrap transition hover:text-accent",
              active ? "text-accent" : "text-text",
              itemClassName,
            )}
            aria-current={active ? "page" : undefined}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
