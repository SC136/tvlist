import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getViewer } from "@/lib/session";

const TYPES: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/gif": "gif" };
const LIMITS = { avatar: 2 * 1024 * 1024, banner: 5 * 1024 * 1024 } as const;

/** Optional image uploads (avatars/banners) via Vercel Blob when BLOB_READ_WRITE_TOKEN is set. */
export async function POST(request: Request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: "Uploads aren't enabled on this site. Paste an image URL instead." }, { status: 501 });
  }
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "Please log in first." }, { status: 401 });

  const kind = new URL(request.url).searchParams.get("kind") === "banner" ? "banner" : "avatar";
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file received." }, { status: 400 });
  const ext = TYPES[file.type];
  if (!ext) return NextResponse.json({ error: "Use a PNG, JPEG, WebP or GIF image." }, { status: 400 });
  if (file.size > LIMITS[kind]) {
    return NextResponse.json({ error: `Images must be under ${LIMITS[kind] / 1024 / 1024} MB.` }, { status: 400 });
  }
  const blob = await put(`${kind}s/${viewer.id}-${Date.now()}.${ext}`, file, {
    access: "public",
    contentType: file.type,
    addRandomSuffix: true,
  });
  return NextResponse.json({ url: blob.url });
}
