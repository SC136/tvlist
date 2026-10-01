"use client";

import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef } from "react";

/** "/tv/123/cast" -> "tv/123", "/user/bob/diary" -> "user/bob": the title or profile a page belongs to. */
const section = (path: string) => path.split("/").filter(Boolean).slice(0, 2).join("/");

/**
 * After a navigation Next.js scrolls to the top of the *page* segment, which skips
 * any banner/header rendered by a layout above it (media pages, profiles). That left
 * pages opening about 800px down. When the destination is a different title or
 * profile, reset to the top of the document instead.
 *
 * Left alone on purpose:
 *  - back/forward, where the browser restores the previous position
 *  - moving between tabs of the same title/profile, where scrolling to the tab content is right
 *
 * Render this AFTER the page content in the root layout so its layout effect runs
 * after Next's own scroll handling and wins.
 */
export function ScrollReset() {
  const pathname = usePathname();
  const previous = useRef(pathname);
  const historyNavigation = useRef(false);

  useEffect(() => {
    const markHistory = () => {
      historyNavigation.current = true;
    };
    // Any fresh user action means the next navigation is a forward one, not a back/forward step.
    const clearHistory = () => {
      historyNavigation.current = false;
    };
    window.addEventListener("popstate", markHistory);
    window.addEventListener("pointerdown", clearHistory, true);
    window.addEventListener("keydown", clearHistory, true);
    return () => {
      window.removeEventListener("popstate", markHistory);
      window.removeEventListener("pointerdown", clearHistory, true);
      window.removeEventListener("keydown", clearHistory, true);
    };
  }, []);

  useLayoutEffect(() => {
    if (previous.current === pathname) return;
    const changedSection = section(previous.current) !== section(pathname);
    previous.current = pathname;
    if (historyNavigation.current) {
      historyNavigation.current = false;
      return;
    }
    if (changedSection) window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return null;
}
