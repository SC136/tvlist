import { ImageResponse } from "next/og";
import { LogoGlyph } from "@/components/layout/logo-glyph";
import { DEFAULT_PALETTE, getPalette, hslHex } from "@/lib/palettes";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Home-screen icon. Full-bleed square: iOS applies its own rounded corners. */
export default function AppleIcon() {
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
        }}
      >
        {LogoGlyph({ accent: palette.dark.accent, ink: palette.dark.on, size: 132 })}
      </div>
    ),
    { ...size },
  );
}
