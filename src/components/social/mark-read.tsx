"use client";

import { useEffect, useRef, useTransition } from "react";
import { markAllNotificationsRead } from "@/actions/notifications";

/** Marks notifications read once the page has been seen. */
export function MarkRead({ hasUnread }: { hasUnread: boolean }) {
  const done = useRef(false);
  const [, start] = useTransition();
  useEffect(() => {
    if (!hasUnread || done.current) return;
    done.current = true;
    start(async () => void (await markAllNotificationsRead()));
  }, [hasUnread]);
  return null;
}
