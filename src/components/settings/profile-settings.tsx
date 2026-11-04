"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import {
  AtSign,
  Bold,
  Check,
  Eye,
  Globe,

  Italic,
  Link2,
  Loader2,
  MapPin,
  Pencil,
  ShieldAlert,
  Sparkles,
  Upload,
} from "lucide-react";
import { changeUsername, updateProfile } from "@/actions/settings";
import { Avatar } from "@/components/ui/avatar";
import { RichText } from "@/components/social/rich-text";
import { cn } from "@/lib/cn";
import { getPalette, PALETTES } from "@/lib/palettes";
import { AVATAR_PRESETS, BANNER_PRESETS } from "@/lib/profile-presets";
import {
  DEFAULT_PROFILE_TABS,
  PROFILE_COLORS,
  profileAccentClass,
  type DefaultProfileTab,
  type ProfileColor,
} from "@/lib/validation";

export function ProfileSettings({
  user,
  uploadsEnabled,
}: {
  user: {
    username: string;
    displayUsername: string;
    about: string;
    image: string;
    bannerImage: string;
    profileColor: string;
    website?: string;
    location?: string;
    statusQuote?: string;
    defaultTab?: string;
  };
  uploadsEnabled: boolean;
}) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(user.displayUsername);
  const [about, setAbout] = useState(user.about);
  const [image, setImage] = useState(user.image);
  const [banner, setBanner] = useState(user.bannerImage);
  const [website, setWebsite] = useState(user.website ?? "");
  const [location, setLocation] = useState(user.location ?? "");
  const [statusQuote, setStatusQuote] = useState(user.statusQuote ?? "");
  const [defaultTab, setDefaultTab] = useState<DefaultProfileTab>(
    (DEFAULT_PROFILE_TABS.map((t) => t.value) as string[]).includes(user.defaultTab ?? "")
      ? (user.defaultTab as DefaultProfileTab)
      : "overview",
  );
  const [color, setColor] = useState<ProfileColor>(
    (PROFILE_COLORS as readonly string[]).includes(user.profileColor)
      ? (user.profileColor as ProfileColor)
      : "auto",
  );

  const [aboutTab, setAboutTab] = useState<"write" | "preview">("write");
  const [showBannerGallery, setShowBannerGallery] = useState(false);
  const [showAvatarGallery, setShowAvatarGallery] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  const [username, setUsername] = useState(user.username);
  const [userMsg, setUserMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const insertFormatting = (prefix: string, suffix = "") => {
    const el = textareaRef.current;
    if (!el) return;
    const startPos = el.selectionStart;
    const endPos = el.selectionEnd;
    const selected = about.slice(startPos, endPos);
    const replacement = `${prefix}${selected || "text"}${suffix}`;
    const next = about.slice(0, startPos) + replacement + about.slice(endPos);
    setAbout(next);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(
        startPos + prefix.length,
        startPos + prefix.length + (selected.length || 4),
      );
    }, 0);
  };

  const save = () =>
    start(async () => {
      setMsg(null);
      const res = await updateProfile({
        displayName,
        about,
        image,
        bannerImage: banner,
        profileColor: color,
        website: website.trim() || undefined,
        location: location.trim() || undefined,
        statusQuote: statusQuote.trim() || undefined,
        defaultTab,
      });
      setMsg(res.ok ? { ok: true, text: "Profile saved." } : { ok: false, text: res.error });
      if (res.ok) router.refresh();
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
      <section className="card space-y-6 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-[17px] font-bold text-bright">Profile Customization</h2>
          <span className="text-[12px] text-text-lighter">Live preview below</span>
        </div>

        {/* Live profile header preview */}
        <div className={cn("relative overflow-hidden rounded-xl bg-nav shadow-lg", profileAccentClass(color))}>
          <div className="relative h-[160px] md:h-[180px]">
            {banner ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={banner} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div
                className="h-full w-full"
                style={{
                  background:
                    "linear-gradient(135deg, rgb(var(--accent) / 0.55), rgb(var(--nav)) 60%)",
                }}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
            <div className="absolute right-4 bottom-4 left-4 flex flex-wrap items-end justify-between gap-3">
              <div className="flex min-w-0 items-end gap-3.5">
                <Avatar
                  src={image || null}
                  name={displayName || user.username}
                  size={72}
                  className="ring-2 ring-white/20 shadow-xl"
                />
                <div className="min-w-0 pb-1">
                  <h3 className="truncate text-[18px] font-bold text-white drop-shadow">
                    {displayName || user.username}
                  </h3>
                  {statusQuote && (
                    <p className="mt-0.5 line-clamp-1 text-[12px] font-medium text-white/90 drop-shadow">
                      “{statusQuote}”
                    </p>
                  )}
                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-white/70">
                    {location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {location}
                      </span>
                    )}
                    {location && website && <span>·</span>}
                    {website && (
                      <span className="flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        {website.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Display name */}
        <Field label="Display name" hint="Change letter capitalization only, e.g. “AnimeMaster”.">
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={20}
            className="input-grey"
          />
        </Field>

        {/* Status Quote / Headline */}
        <Field label="Profile Tagline / Quote" hint="A short personal motto or what you're currently watching/reading (up to 120 characters).">
          <input
            value={statusQuote}
            onChange={(e) => setStatusQuote(e.target.value)}
            maxLength={120}
            placeholder="e.g. Exploring classic sci-fi & climbing through FromSoft games."
            className="input-grey"
          />
        </Field>

        {/* Location & Website */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Location" hint="Shown on your profile header.">
            <div className="relative">
              <MapPin className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-text-lighter" />
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                maxLength={60}
                placeholder="e.g. Tokyo, Japan"
                className="input-grey pl-9"
              />
            </div>
          </Field>
          <Field label="Website / Social" hint="Personal portfolio or profile link.">
            <div className="relative">
              <Globe className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-text-lighter" />
              <input
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                maxLength={200}
                placeholder="https://…"
                className="input-grey pl-9"
              />
            </div>
          </Field>
        </div>

        {/* Banner with Preset Gallery */}
        <Field
          label="Profile Banner"
          hint="Wide images look best. Pick from our curated presets or paste a custom URL."
        >
          <div className="space-y-3">
            <ImageField
              value={banner}
              onChange={setBanner}
              kind="banner"
              uploadsEnabled={uploadsEnabled}
              extraActions={
                <button
                  type="button"
                  onClick={() => setShowBannerGallery(!showBannerGallery)}
                  className="btn btn-secondary shrink-0 text-[12px]"
                >
                  <Sparkles className="h-4 w-4 text-accent" /> Presets
                </button>
              }
            />

            {showBannerGallery && (
              <div className="rounded-lg border border-fg-grey-dark bg-fg p-3">
                <p className="mb-2 text-[12px] font-bold text-text-light uppercase tracking-wider">
                  Curated Banner Gallery
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {BANNER_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setBanner(p.url);
                        setShowBannerGallery(false);
                      }}
                      className="group relative aspect-[16/7] overflow-hidden rounded-md border border-white/10 text-left transition hover:ring-2 hover:ring-accent"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.url} alt={p.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent p-1.5 flex items-end">
                        <span className="text-[11px] font-semibold text-white drop-shadow truncate">
                          {p.name}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Field>

        {/* Avatar with Preset Gallery */}
        <Field
          label="Profile Avatar"
          hint="Square images work best. Pick a preset or enter a custom image URL."
        >
          <div className="space-y-3">
            <ImageField
              value={image}
              onChange={setImage}
              kind="avatar"
              uploadsEnabled={uploadsEnabled}
              extraActions={
                <button
                  type="button"
                  onClick={() => setShowAvatarGallery(!showAvatarGallery)}
                  className="btn btn-secondary shrink-0 text-[12px]"
                >
                  <Sparkles className="h-4 w-4 text-accent" /> Presets
                </button>
              }
            />

            {showAvatarGallery && (
              <div className="rounded-lg border border-fg-grey-dark bg-fg p-3">
                <p className="mb-2 text-[12px] font-bold text-text-light uppercase tracking-wider">
                  Curated Avatar Gallery
                </p>
                <div className="flex flex-wrap gap-2.5">
                  {AVATAR_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setImage(p.url);
                        setShowAvatarGallery(false);
                      }}
                      title={p.name}
                      className="group relative h-12 w-12 overflow-hidden rounded-full ring-2 ring-white/10 transition hover:ring-accent"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.url} alt={p.name} className="h-full w-full object-cover transition duration-200 group-hover:scale-110" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Field>

        {/* Profile Accent Colour */}
        <Field label="Profile Accent Colour" hint="Tints your profile page for visitors. “Match site” uses each visitor's active palette.">
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
                    active
                      ? "bg-fg-grey ring-2 ring-accent text-accent"
                      : "bg-fg-grey text-text hover:ring-2 hover:ring-text-lighter/40",
                  )}
                >
                  <span
                    aria-hidden
                    className="h-4 w-4 rounded-full ring-1 ring-black/20"
                    style={{
                      background: palette
                        ? palette.dark.accent
                        : "conic-gradient(" + PALETTES.map((p) => p.dark.accent).join(",") + ")",
                    }}
                  />
                  {palette ? palette.name : "Match site"}
                  {active && <Check className="h-3.5 w-3.5 text-accent" />}
                </button>
              );
            })}
          </div>
        </Field>

        {/* Default Landing Tab */}
        <Field
          label="Default Profile Landing Tab"
          hint="Choose which section opens first when someone visits your profile page."
        >
          <select
            value={defaultTab}
            onChange={(e) => setDefaultTab(e.target.value as DefaultProfileTab)}
            className="input-grey cursor-pointer sm:max-w-xs"
          >
            {DEFAULT_PROFILE_TABS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </Field>

        {/* Interactive About Editor with Markdown Toolbar & Live Preview */}
        <Field
          label="About Me (Bio)"
          hint="Supports rich formatting: bold, italic, links, @mentions and spoilers."
        >
          <div className="overflow-hidden rounded-lg border border-fg-grey-dark bg-fg-grey">
            {/* Editor Top Bar */}
            <div className="flex flex-wrap items-center justify-between border-b border-fg-grey-dark px-3 py-1.5">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setAboutTab("write")}
                  className={cn(
                    "flex items-center gap-1 rounded px-2.5 py-1 text-[12px] font-bold transition",
                    aboutTab === "write" ? "bg-accent text-on-accent" : "text-text-lighter hover:text-text",
                  )}
                >
                  <Pencil className="h-3 w-3" /> Write
                </button>
                <button
                  type="button"
                  onClick={() => setAboutTab("preview")}
                  className={cn(
                    "flex items-center gap-1 rounded px-2.5 py-1 text-[12px] font-bold transition",
                    aboutTab === "preview" ? "bg-accent text-on-accent" : "text-text-lighter hover:text-text",
                  )}
                >
                  <Eye className="h-3 w-3" /> Live Preview
                </button>
              </div>

              {aboutTab === "write" && (
                <div className="flex items-center gap-1 text-text-lighter">
                  <button
                    type="button"
                    onClick={() => insertFormatting("**", "**")}
                    className="rounded p-1 hover:bg-fg hover:text-text"
                    title="Bold"
                  >
                    <Bold className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting("_", "_")}
                    className="rounded p-1 hover:bg-fg hover:text-text"
                    title="Italic"
                  >
                    <Italic className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting("[title](https://", ")")}
                    className="rounded p-1 hover:bg-fg hover:text-text"
                    title="Insert Link"
                  >
                    <Link2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting("~!", "!~")}
                    className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-bold hover:bg-fg hover:text-text"
                    title="Spoiler tag (~!spoiler!~)"
                  >
                    <ShieldAlert className="h-3 w-3 text-accent" /> Spoiler
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting("@")}
                    className="rounded p-1 hover:bg-fg hover:text-text"
                    title="Mention a user"
                  >
                    <AtSign className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Editor Body */}
            {aboutTab === "write" ? (
              <textarea
                ref={textareaRef}
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                rows={7}
                maxLength={5000}
                placeholder="Share your favorite genres, directors, gaming setups, or top recommendations…"
                className="w-full bg-transparent p-3.5 text-[14px] leading-relaxed text-text outline-none resize-y"
              />
            ) : (
              <div className="min-h-[160px] p-4 bg-fg/40">
                {about.trim() ? (
                  <RichText text={about} />
                ) : (
                  <p className="text-[13px] text-text-lighter italic">
                    Nothing to preview yet. Switch back to Write and add some text!
                  </p>
                )}
              </div>
            )}

            <div className="flex justify-end border-t border-fg-grey-dark px-3 py-1 text-[11px] text-text-lighter">
              {about.length} / 5,000 characters
            </div>
          </div>
        </Field>

        <div className="flex items-center justify-end gap-3 pt-2">
          {msg && (
            <span className={cn("text-[13px] font-semibold", msg.ok ? "text-green" : "text-red")}>
              {msg.text}
            </span>
          )}
          <button type="button" onClick={save} disabled={pending} className="btn btn-primary px-7 py-2.5">
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Profile
          </button>
        </div>
      </section>

      {/* Account / Username Section */}
      <section className="card space-y-4 p-6">
        <h2 className="text-[16px] font-bold text-bright">Account Handle</h2>
        <p className="text-[13px] text-text-light">
          Your profile lives at <code className="font-semibold text-accent">/user/{user.username}</code>. Changing your handle will update your public URL.
        </p>
        <div className="flex gap-2 max-w-sm">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            maxLength={20}
            className="input-grey"
            aria-label="Username"
          />
          <button
            type="button"
            onClick={saveUsername}
            disabled={pending || username.toLowerCase() === user.username}
            className="btn btn-primary shrink-0"
          >
            Change
          </button>
        </div>
        {userMsg && (
          <p className={cn("text-[13px] font-semibold", userMsg.ok ? "text-green" : "text-red")}>
            {userMsg.text}
          </p>
        )}
      </section>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-1 text-[13px] font-semibold text-text-light">{label}</p>
      {hint && <p className="mb-2 text-[11px] text-text-lighter">{hint}</p>}
      {children}
    </div>
  );
}

function ImageField({
  value,
  onChange,
  kind,
  uploadsEnabled,
  extraActions,
}: {
  value: string;
  onChange: (v: string) => void;
  kind: "avatar" | "banner";
  uploadsEnabled: boolean;
  extraActions?: React.ReactNode;
}) {
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
      <div className="flex flex-wrap gap-2">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://…"
          className="input-grey flex-1 min-w-[200px]"
        />
        {extraActions}
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
            <button
              type="button"
              onClick={() => input.current?.click()}
              disabled={uploading}
              className="btn btn-secondary shrink-0 text-[12px]"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Upload
            </button>
          </>
        )}
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="btn btn-secondary shrink-0 text-[12px]"
          >
            Remove
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-[12px] text-red">{error}</p>}
    </div>
  );
}
