"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Check, Loader2, Upload } from "lucide-react";
import { changeUsername, updateProfile } from "@/actions/settings";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/cn";
import { getPalette, PALETTES } from "@/lib/palettes";
import { PROFILE_COLORS, profileAccentClass, type ProfileColor } from "@/lib/validation";

export function ProfileSettings({
  user,
  uploadsEnabled,
}: {
  user: { username: string; displayUsername: string; about: string; image: string; bannerImage: string; profileColor: string };
  uploadsEnabled: boolean;
}) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(user.displayUsername);
  const [about, setAbout] = useState(user.about);
  const [image, setImage] = useState(user.image);
  const [banner, setBanner] = useState(user.bannerImage);
  const [color, setColor] = useState<ProfileColor>((PROFILE_COLORS as readonly string[]).includes(user.profileColor) ? (user.profileColor as ProfileColor) : "auto");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  const [username, setUsername] = useState(user.username);
  const [userMsg, setUserMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const save = () =>
    start(async () => {
      setMsg(null);
      const res = await updateProfile({ displayName, about, image, bannerImage: banner, profileColor: color });
      setMsg(res.ok ? { ok: true, text: "Profile saved." } : { ok: false, text: res.error });
    });

  const saveUsername = () =>
    start(async () => {
      setUserMsg(null);
      const res = await changeUsername(username);
      if (!res.ok) return setUserMsg({ ok: false, text: res.error });
      setUserMsg({ ok: true, text: "Username changed." });
      setDisplayName(username);
      router.refresh();
    });

  return (
    <div className="space-y-8">
      <section className="card space-y-5 p-6">
        <h2 className="text-[16px] font-bold text-bright">Profile</h2>

        <div className={cn("relative h-[120px] overflow-hidden rounded-lg bg-nav", profileAccentClass(color))}>
          {banner ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={banner} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <div className="h-full w-full" style={{ background: "linear-gradient(135deg, rgb(var(--accent) / 0.55), rgb(var(--nav)) 60%)" }} />
          )}
          <div className="absolute bottom-3 left-3 flex items-end gap-3">
            <Avatar src={image || null} name={displayName || user.username} size={64} />
            <span className="mb-1 text-[16px] font-bold text-white drop-shadow">{displayName || user.username}</span>
          </div>
        </div>

        <Field label="Display name" hint="Change the capitalisation of your username, e.g. “MovieFan”.">
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={20} className="input-grey" />
        </Field>

        <Field label="Avatar" hint="A square image works best.">
          <ImageField value={image} onChange={setImage} kind="avatar" uploadsEnabled={uploadsEnabled} />
        </Field>

        <Field label="Banner" hint="Wide images (1700×330) look best.">
          <ImageField value={banner} onChange={setBanner} kind="banner" uploadsEnabled={uploadsEnabled} />
        </Field>

        <Field label="Profile colour" hint="Tints your profile page for everyone. “Match site” uses each visitor's own palette.">
          <div className="flex flex-wrap gap-2">
            {PROFILE_COLORS.map((c) => {
              const palette = c === "auto" ? null : getPalette(c);
              const active = color === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  aria-pressed={active}
                  title={palette ? palette.name : "Match site"}
                  className={cn(
                    "flex h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-[12px] font-semibold transition",
                    active ? "bg-fg-grey ring-2 ring-accent" : "bg-fg-grey hover:ring-2 hover:ring-text-lighter/40",
                  )}
                >
                  <span
                    aria-hidden
                    className="h-4 w-4 rounded-full ring-1 ring-black/20"
                    style={{ background: palette ? palette.dark.accent : "conic-gradient(" + PALETTES.map((p) => p.dark.accent).join(",") + ")" }}
                  />
                  {palette ? palette.name : "Match site"}
                  {active && <Check className="h-3.5 w-3.5 text-accent" />}
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="About" hint="Supports **bold**, _italic_, links, @mentions and ~!spoilers!~">
          <textarea value={about} onChange={(e) => setAbout(e.target.value)} rows={6} maxLength={5000} className="input-grey resize-y" />
        </Field>

        <div className="flex items-center justify-end gap-3">
          {msg && <span className={cn("text-[13px] font-semibold", msg.ok ? "text-green" : "text-red")}>{msg.text}</span>}
          <button type="button" onClick={save} disabled={pending} className="btn btn-primary px-6">
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Profile
          </button>
        </div>
      </section>

      <section className="card space-y-4 p-6">
        <h2 className="text-[16px] font-bold text-bright">Username</h2>
        <p className="text-[13px] text-text-light">Your profile lives at /user/{user.username}. Changing it changes your profile URL.</p>
        <div className="flex gap-2">
          <input value={username} onChange={(e) => setUsername(e.target.value)} maxLength={20} className="input-grey" aria-label="Username" />
          <button type="button" onClick={saveUsername} disabled={pending || username.toLowerCase() === user.username} className="btn btn-primary shrink-0">
            Change
          </button>
        </div>
        {userMsg && <p className={cn("text-[13px] font-semibold", userMsg.ok ? "text-green" : "text-red")}>{userMsg.text}</p>}
      </section>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-[13px] font-semibold text-text-light">{label}</p>
      {hint && <p className="mb-2 text-[11px] text-text-lighter">{hint}</p>}
      {children}
    </div>
  );
}

function ImageField({ value, onChange, kind, uploadsEnabled }: { value: string; onChange: (v: string) => void; kind: "avatar" | "banner"; uploadsEnabled: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setError(null);
    setUploading(true);
    try {
      const body = new FormData();
      body.set("file", file);
      const res = await fetch(`/api/upload?kind=${kind}`, { method: "POST", body });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) setError(data.error ?? "Upload failed.");
      else onChange(data.url);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <div className="flex gap-2">
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder="https://…" className="input-grey" />
        {uploadsEnabled && (
          <>
            <input
              ref={input}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void upload(f);
                e.target.value = "";
              }}
            />
            <button type="button" onClick={() => input.current?.click()} disabled={uploading} className="btn btn-secondary shrink-0">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Upload
            </button>
          </>
        )}
        {value && (
          <button type="button" onClick={() => onChange("")} className="btn btn-secondary shrink-0">
            Remove
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-[12px] text-red">{error}</p>}
    </div>
  );
}
