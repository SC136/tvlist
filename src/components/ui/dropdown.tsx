"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Click-to-open menu that closes on outside click / Escape. */
export function Dropdown({
  trigger,
  children,
  align = "right",
  className,
  panelClassName,
  hover = false,
}: {
  trigger: (open: boolean) => ReactNode;
  children: ReactNode | ((close: () => void) => ReactNode);
  align?: "left" | "right" | "center";
  className?: string;
  panelClassName?: string;
  hover?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div
      ref={root}
      className={cn("relative", className)}
      onMouseEnter={
        hover
          ? () => {
              if (timer.current) clearTimeout(timer.current);
              setOpen(true);
            }
          : undefined
      }
      onMouseLeave={
        hover
          ? () => {
              timer.current = setTimeout(() => setOpen(false), 150);
            }
          : undefined
      }
    >
      <div onClick={() => setOpen((o) => !o)}>{trigger(open)}</div>
      {open && (
        <div
          className={cn(
            "animate-pop absolute top-full z-50 mt-2 min-w-[180px] rounded-md bg-fg p-1.5 shadow-[var(--shadow-pop)]",
            align === "right" && "right-0",
            align === "left" && "left-0",
            align === "center" && "left-1/2 -translate-x-1/2",
            panelClassName,
          )}
        >
          {typeof children === "function" ? children(close) : children}
        </div>
      )}
    </div>
  );
}

export function DropdownItem({
  children,
  onClick,
  className,
  danger,
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 rounded px-3 py-2 text-left text-[13px] font-semibold transition hover:bg-fg-grey",
        danger ? "text-red" : "text-text hover:text-accent",
        className,
      )}
    >
      {children}
    </button>
  );
}
