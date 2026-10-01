import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Tag } from "@/components/ui/basics";
import { airingIn, formatDate, formatMoney, formatNumber, formatRuntime } from "@/lib/format";
import { countryName, languageName, tmdbImage } from "@/lib/media";
import type { getMediaPage } from "@/lib/queries/media-page";

type Data = NonNullable<Awaited<ReturnType<typeof getMediaPage>>>;

export function MediaSidebar({ data }: { data: Data }) {
  const { details: d, favourites } = data;
  const next = d.nextEpisode;
  const rows: [string, React.ReactNode][] = [];

  if (next?.airDate) {
    const when = airingIn(next.airDate);
    rows.push(["Airing", `S${next.season} Ep ${next.episode}: ${when ?? formatDate(next.airDate)}`]);
  }
  rows.push(["Format", d.format]);
  if (d.type === "tv") {
    if (d.episodes) rows.push(["Episodes", d.episodes]);
    if (d.seasons) rows.push(["Seasons", d.seasons]);
    if (d.runtime) rows.push(["Episode Duration", formatRuntime(d.runtime)]);
  } else if (d.runtime) {
    rows.push(["Runtime", formatRuntime(d.runtime)]);
  }
  rows.push(["Status", d.status]);
  if (d.date) rows.push([d.type === "tv" ? "Start Date" : "Release Date", formatDate(d.date)]);
  if (d.endDate) rows.push(["End Date", formatDate(d.endDate)]);
  if (d.score !== null) rows.push(["Average Score", `${d.score}%`]);
  if (d.voteCount) rows.push(["Votes", formatNumber(d.voteCount)]);
  if (favourites) rows.push(["Favorites", formatNumber(favourites)]);
  if (d.certification) rows.push(["Rating", d.certification]);
  if (d.networks.length) {
    rows.push([
      d.networks.length > 1 ? "Networks" : "Network",
      <span key="n" className="block">
        {d.networks.map((n) => (
          <span key={n.id} className="block text-accent">
            {n.name}
          </span>
        ))}
      </span>,
    ]);
  }
  if (d.studios.length) {
    rows.push([
      "Studios",
      <span key="s" className="block">
        {d.studios.slice(0, 5).map((s) => (
          <span key={s} className="block">
            {s}
          </span>
        ))}
      </span>,
    ]);
  }
  if (d.creators.length) {
    rows.push([
      d.type === "movie" ? "Director" : "Created By",
      <span key="c" className="block">
        {d.creators.map((c) => (
          <Link key={c.id} href={`/person/${c.id}`} className="block text-accent hover:underline">
            {c.name}
          </Link>
        ))}
      </span>,
    ]);
  }
  if (d.countries.length) rows.push(["Country", d.countries.map((c) => countryName(c)).join(", ")]);
  if (d.originalLanguage) rows.push(["Language", languageName(d.originalLanguage)]);
  if (d.budget) rows.push(["Budget", formatMoney(d.budget)]);
  if (d.revenue) rows.push(["Box Office", formatMoney(d.revenue)]);
  if (d.genres.length) {
    rows.push([
      "Genres",
      <span key="g" className="block">
        {d.genres.map((g) => (
          <Link key={g} href={`/search/${d.type}?genres=${encodeURIComponent(g)}`} className="block hover:text-accent">
            {g}
          </Link>
        ))}
      </span>,
    ]);
  }
  if (d.originalTitle && d.originalTitle !== d.title) rows.push(["Original Title", d.originalTitle]);

  const links: { href: string; label: string }[] = [];
  if (d.homepage) links.push({ href: d.homepage, label: "Official Site" });
  if (d.externalIds.imdb) links.push({ href: `https://www.imdb.com/title/${d.externalIds.imdb}/`, label: "IMDb" });
  links.push({ href: `https://www.themoviedb.org/${d.type}/${d.id}`, label: "TMDB" });
  if (d.externalIds.wikidata) links.push({ href: `https://www.wikidata.org/wiki/${d.externalIds.wikidata}`, label: "Wikidata" });
  if (d.externalIds.instagram) links.push({ href: `https://www.instagram.com/${d.externalIds.instagram}/`, label: "Instagram" });
  if (d.externalIds.twitter) links.push({ href: `https://x.com/${d.externalIds.twitter}`, label: "X / Twitter" });

  const stream = d.watch ? [...d.watch.stream, ...d.watch.free] : [];

  return (
    <aside className="space-y-6">
      <div className="card grid grid-cols-2 gap-x-4 gap-y-3.5 p-4 sm:grid-cols-3 md:block md:space-y-3.5 md:p-5">
        {rows.map(([label, value]) => (
          <div key={label} className="text-[13px]">
            <p className="font-semibold text-bright">{label}</p>
            <div className="mt-0.5 leading-relaxed text-text-light">{value}</div>
          </div>
        ))}
      </div>

      {stream.length > 0 && (
        <div>
          <h3 className="section-title">Where to Watch</h3>
          <div className="card space-y-2 p-3">
            {stream.slice(0, 6).map((p) => (
              <a
                key={p.id}
                href={d.watch?.link ?? `https://www.themoviedb.org/${d.type}/${d.id}/watch`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded p-1 text-[13px] font-semibold transition hover:bg-fg-grey hover:text-accent"
              >
                {p.logoPath && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={tmdbImage(p.logoPath, "w45")!} alt="" className="h-7 w-7 rounded" loading="lazy" />
                )}
                {p.name}
              </a>
            ))}
            <p className="px-1 pt-1 text-[10px] text-text-lighter">Availability for {d.watch?.region} via JustWatch</p>
          </div>
        </div>
      )}

      {d.keywords.length > 0 && (
        <div>
          <h3 className="section-title">Tags</h3>
          <div className="flex flex-wrap gap-1.5">
            {d.keywords.slice(0, 20).map((k) => (
              <Tag key={k}>{k}</Tag>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="section-title">External Links</h3>
        <div className="flex flex-wrap gap-2 md:grid md:gap-2">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="card flex items-center justify-between gap-2 px-3 py-2 text-[13px] font-semibold transition hover:text-accent"
            >
              {l.label}
              <ExternalLink className="h-3.5 w-3.5 text-text-lighter" />
            </a>
          ))}
        </div>
      </div>
    </aside>
  );
}
