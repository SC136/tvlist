import { cn } from "@/lib/cn";

const FALLBACK_COLORS = ["#e5712f", "#8b7cf6", "#ec6fb0", "#14b8c4", "#ef5f7a", "#2fbf8a", "#7c8aa0"];

function colorFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return FALLBACK_COLORS[Math.abs(hash) % FALLBACK_COLORS.length];
}

export function Avatar({
  src,
  name,
  size = 40,
  className,
  rounded = "rounded",
}: {
  src?: string | null;
  name: string;
  size?: number;
  className?: string;
  rounded?: string;
}) {
  const style = { width: size, height: size };
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        referrerPolicy="no-referrer"
        className={cn("shrink-0 bg-fg-grey-dark object-cover", rounded, className)}
        style={style}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={cn("inline-flex shrink-0 items-center justify-center font-bold text-white select-none", rounded, className)}
      style={{ ...style, background: colorFor(name), fontSize: Math.max(10, size * 0.42) }}
    >
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}
