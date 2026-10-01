"use client";

import { useState, type ReactNode } from "react";
import { EyeOff } from "lucide-react";

export function SpoilerGate({ children }: { children: ReactNode }) {
  const [shown, setShown] = useState(false);
  if (shown) return <>{children}</>;
  return (
    <div className="flex flex-col items-center gap-3 py-10 text-center">
      <EyeOff className="h-8 w-8 text-orange" />
      <p className="text-[14px] font-semibold text-bright">This review contains spoilers.</p>
      <button type="button" onClick={() => setShown(true)} className="btn btn-secondary">
        Show review
      </button>
    </div>
  );
}
