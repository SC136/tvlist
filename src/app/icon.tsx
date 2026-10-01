import { ImageResponse } from "next/og";
import { LogoGlyph } from "@/components/layout/logo-glyph";
import { DEFAULT_PALETTE, getPalette, hslHex } from "@/lib/palettes";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

/** Browser-tab icon: the logo mark on a dark rounded tile, in the default palette. */
export default function Icon() {
  const palette = getPalette(DEFAULT_PALETTE);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: hslHex(palette.hue, palette.sat, 10),
          borderRadius: 14,
        }}
      >
        {LogoGlyph({ accent: palette.dark.accent, ink: palette.dark.on, size: 50 })}
      </div>
    ),
    { ...size },
  );
}
