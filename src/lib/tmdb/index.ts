import "server-only";
import {
  genreMap,
  type MediaSummary,
  type MediaType,
  type Paged,
  yearOf,
} from "@/lib/media";
import { mockTmdb } from "./mock";
import type {
  TmdbAggregateCast,
  TmdbAggregateCrew,
  TmdbCollectionDetails,
  TmdbCrewCredit,
  TmdbMovieDetails,
  TmdbMovieListItem,
  TmdbMultiItem,
  TmdbPaged,
  TmdbPersonCredit,
  TmdbPersonDetails,
  TmdbPersonListItem,
  TmdbSeasonDetails,
  TmdbTvDetails,
  TmdbTvListItem,
  TmdbWatchProvider,
} from "./types";

const API = "https://api.themoviedb.org/3";

/** True when no TMDB credentials are configured and the built-in demo catalog is served. */
export function isDemoMode(): boolean {
  return !process.env.TMDB_API_KEY;
}

type Params = Record<string, string | number | boolean | undefined | null>;

class TmdbNotFound extends Error {}

/**
 * Low-level TMDB request. Accepts either a v4 "API Read Access Token" (JWT,
 * sent as a Bearer header) or a v3 API key (sent as `api_key`).
 */
async function tmdb<T>(path: string, params: Params = {}, revalidate = 3600): Promise<T> {
  const key = process.env.TMDB_API_KEY;
  const search = new URLSearchParams();
  search.set("language", "en-US");
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") search.set(k, String(v));
  }

  if (!key) {
    const data = mockTmdb(path, search);
    if (data === null) throw new TmdbNotFound(path);
    return data as T;
  }

  const headers: HeadersInit = { accept: "application/json" };
  if (key.startsWith("eyJ")) headers.Authorization = `Bearer ${key}`;
  else search.set("api_key", key);

  const res = await fetch(`${API}${path}?${search}`, { headers, next: { revalidate } });
  if (res.status === 404) throw new TmdbNotFound(path);
  if (!res.ok) throw new Error(`TMDB ${res.status} for ${path}`);
  return (await res.json()) as T;
}

async function orNull<T>(promise: Promise<T>): Promise<T | null> {
  try {
    return await promise;
  } catch (err) {
    if (err instanceof TmdbNotFound) return null;
    throw err;
  }
}

/* ------------------------------------------------------------------------- */
/*                               Normalization                               */
/* ------------------------------------------------------------------------- */

function voteToScore(avg: number | undefined, count: number | undefined): number | null {
  if (!avg || !count || count < 5) return null;
  return Math.round(avg * 10);
}

export function toSummary(item: TmdbMovieListItem | TmdbTvListItem, fallbackType?: MediaType): MediaSummary {
  const type: MediaType =
    item.media_type === "movie" || item.media_type === "tv"
      ? item.media_type
      : "title" in item
        ? "movie"
        : "name" in item
          ? "tv"
          : (fallbackType ?? "movie");
  const genres = genreMap(type);
  const date = type === "movie" ? (item as TmdbMovieListItem).release_date : (item as TmdbTvListItem).first_air_date;
  return {
    type,
    id: item.id,
    title: type === "movie" ? (item as TmdbMovieListItem).title : (item as TmdbTvListItem).name,
    originalTitle:
      (type === "movie" ? (item as TmdbMovieListItem).original_title : (item as TmdbTvListItem).original_name) ?? null,
    posterPath: item.poster_path ?? null,
    backdropPath: item.backdrop_path ?? null,
    date: date || null,
    year: yearOf(date),
    genres: (item.genre_ids ?? []).map((id) => genres[id]).filter(Boolean),
    overview: item.overview ?? "",
    score: voteToScore(item.vote_average, item.vote_count),
    voteCount: item.vote_count ?? 0,
    popularity: item.popularity ?? 0,
    originalLanguage: item.original_language ?? null,
  };
}

function toPaged<T extends TmdbMovieListItem | TmdbTvListItem>(data: TmdbPaged<T>, type?: MediaType): Paged<MediaSummary> {
  return {
    page: data.page,
    // TMDB refuses pages beyond 500.
    totalPages: Math.min(data.total_pages, 500),
    totalResults: data.total_results,
    results: data.results.map((r) => toSummary(r, type)),
  };
}

/* ------------------------------------------------------------------------- */
/*                                   Lists                                   */
/* ------------------------------------------------------------------------- */

export async function getTrending(type: MediaType | "all", window: "day" | "week" = "week", page = 1) {
  const data = await tmdb<TmdbPaged<TmdbMovieListItem | TmdbTvListItem>>(`/trending/${type}/${window}`, { page }, 3600);
  return toPaged(data, type === "all" ? undefined : type);
}

export type CuratedList = "popular" | "top_rated" | "upcoming" | "now_playing" | "on_the_air" | "airing_today";

export async function getCuratedList(type: MediaType, list: CuratedList, page = 1) {
  const data = await tmdb<TmdbPaged<TmdbMovieListItem | TmdbTvListItem>>(`/${type}/${list}`, { page, region: list === "upcoming" || list === "now_playing" ? "US" : undefined }, 3600);
  return toPaged(data, type);
}

export type BrowseSort = "popularity" | "score" | "newest" | "oldest" | "title" | "votes" | "revenue";

export interface BrowseFilters {
  query?: string;
  genres?: number[];
  excludeGenres?: number[];
  year?: number;
  /** TMDB discover/tv with_type (0 Documentary, 1 News, 2 Miniseries, 3 Reality, 4 Scripted, 5 Talk Show, 6 Video) */
  tvType?: number;
  /** TMDB discover/tv with_status (0 Returning, 1 Planned, 2 In Production, 3 Ended, 4 Canceled, 5 Pilot) */
  tvStatus?: number;
  country?: string;
  language?: string;
  provider?: number;
  region?: string;
  minScore?: number;
  sort?: BrowseSort;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function discover(type: MediaType, filters: BrowseFilters, page = 1): Promise<Paged<MediaSummary>> {
  if (filters.query) {
    const data = await tmdb<TmdbPaged<TmdbMovieListItem | TmdbTvListItem>>(
      `/search/${type}`,
      {
        query: filters.query,
        page,
        include_adult: false,
        [type === "movie" ? "primary_release_year" : "first_air_date_year"]: filters.year,
      },
      600,
    );
    const paged = toPaged(data, type);
    // Search can't filter by genre server-side; narrow the page we got.
    if (filters.genres?.length) {
      const names = filters.genres.map((g) => genreMap(type)[g]);
      paged.results = paged.results.filter((r) => names.every((n) => r.genres.includes(n)));
    }
    return paged;
  }

  const sortField: Record<BrowseSort, string> = {
    popularity: "popularity.desc",
    score: "vote_average.desc",
    newest: type === "movie" ? "primary_release_date.desc" : "first_air_date.desc",
    oldest: type === "movie" ? "primary_release_date.asc" : "first_air_date.asc",
    title: type === "movie" ? "title.asc" : "name.asc",
    votes: "vote_count.desc",
    revenue: type === "movie" ? "revenue.desc" : "popularity.desc",
  };
  const sort = filters.sort ?? "popularity";
  const params: Params = {
    page,
    include_adult: false,
    sort_by: sortField[sort],
    with_genres: filters.genres?.join(","),
    without_genres: filters.excludeGenres?.join(","),
    with_origin_country: filters.country,
    with_original_language: filters.language,
    "vote_average.gte": filters.minScore ? filters.minScore / 10 : undefined,
    "vote_count.gte": sort === "score" ? (type === "movie" ? 300 : 150) : sort === "oldest" ? 10 : undefined,
  };
  if (filters.provider) {
    params.with_watch_providers = filters.provider;
    params.watch_region = filters.region ?? "US";
  }
  if (type === "movie") {
    params.primary_release_year = filters.year;
    if (sort === "newest") params["primary_release_date.lte"] = today();
  } else {
    params.first_air_date_year = filters.year;
    params.with_type = filters.tvType;
    params.with_status = filters.tvStatus;
    if (sort === "newest") params["first_air_date.lte"] = today();
  }
  const data = await tmdb<TmdbPaged<TmdbMovieListItem | TmdbTvListItem>>(`/discover/${type}`, params, 3600);
  return toPaged(data, type);
}

export interface PersonSummary {
  id: number;
  name: string;
  profilePath: string | null;
  department: string | null;
  knownFor: string[];
}

export async function searchAll(query: string) {
  const data = await tmdb<TmdbPaged<TmdbMultiItem>>("/search/multi", { query, include_adult: false }, 600);
  const media: MediaSummary[] = [];
  const people: PersonSummary[] = [];
  for (const item of data.results) {
    if (item.media_type === "person") {
      const p = item as TmdbPersonListItem;
      people.push({
        id: p.id,
        name: p.name,
        profilePath: p.profile_path,
        department: p.known_for_department ?? null,
        knownFor: (p.known_for ?? []).map((k) => ("title" in k ? k.title : k.name)).slice(0, 3),
      });
    } else if (item.media_type === "movie" || item.media_type === "tv") {
      media.push(toSummary(item as TmdbMovieListItem | TmdbTvListItem));
    }
  }
  return {
    movies: media.filter((m) => m.type === "movie"),
    tv: media.filter((m) => m.type === "tv"),
    people,
  };
}

export async function searchPeople(query: string, page = 1): Promise<Paged<PersonSummary>> {
  const data = await tmdb<TmdbPaged<TmdbPersonListItem>>("/search/person", { query, page, include_adult: false }, 600);
  return {
    page: data.page,
    totalPages: Math.min(data.total_pages, 500),
    totalResults: data.total_results,
    results: data.results.map((p) => ({
      id: p.id,
      name: p.name,
      profilePath: p.profile_path,
      department: p.known_for_department ?? null,
      knownFor: (p.known_for ?? []).map((k) => ("title" in k ? k.title : k.name)).slice(0, 3),
    })),
  };
}

export async function getPopularPeople(page = 1): Promise<Paged<PersonSummary>> {
  const data = await tmdb<TmdbPaged<TmdbPersonListItem>>("/person/popular", { page }, 3600 * 6);
  return {
    page: data.page,
    totalPages: Math.min(data.total_pages, 500),
    totalResults: data.total_results,
    results: data.results.map((p) => ({
      id: p.id,
      name: p.name,
      profilePath: p.profile_path,
      department: p.known_for_department ?? null,
      knownFor: (p.known_for ?? []).map((k) => ("title" in k ? k.title : k.name)).slice(0, 3),
    })),
  };
}

/* ------------------------------------------------------------------------- */
/*                                  Details                                  */
/* ------------------------------------------------------------------------- */

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profilePath: string | null;
  episodes: number | null;
}

export interface CrewMember {
  id: number;
  name: string;
  jobs: string[];
  department: string;
  profilePath: string | null;
  episodes: number | null;
}

export interface Provider {
  id: number;
  name: string;
  logoPath: string | null;
}

export interface SeasonSummary {
  number: number;
  name: string;
  episodes: number;
  airDate: string | null;
  posterPath: string | null;
  overview: string;
}

export interface EpisodeRef {
  season: number;
  episode: number;
  name: string;
  airDate: string | null;
}

export interface MediaDetails extends MediaSummary {
  tagline: string | null;
  format: string;
  status: string;
  rawStatus: string | null;
  endDate: string | null;
  runtime: number | null;
  episodes: number | null;
  seasons: number | null;
  seasonList: SeasonSummary[];
  studios: string[];
  networks: Provider[];
  countries: string[];
  languages: string[];
  certification: string | null;
  budget: number | null;
  revenue: number | null;
  homepage: string | null;
  nextEpisode: EpisodeRef | null;
  lastEpisode: EpisodeRef | null;
  creators: { id: number; name: string; profilePath: string | null }[];
  cast: CastMember[];
  crew: CrewMember[];
  videos: { key: string; name: string; type: string }[];
  trailer: { key: string; name: string } | null;
  recommendations: MediaSummary[];
  similar: MediaSummary[];
  collection: { id: number; name: string; posterPath: string | null } | null;
  keywords: string[];
  externalIds: { imdb: string | null; tvdb: number | null; wikidata: string | null; instagram: string | null; twitter: string | null; facebook: string | null };
  watch: { region: string; link: string | null; stream: Provider[]; rent: Provider[]; buy: Provider[]; free: Provider[] } | null;
}

function movieFormat(d: TmdbMovieDetails): string {
  const genres = d.genres.map((g) => g.name);
  if (d.runtime && d.runtime > 0 && d.runtime < 40) return "Short";
  if (genres.includes("TV Movie")) return "TV Movie";
  if (genres.includes("Documentary")) return "Documentary";
  return "Movie";
}

function tvFormat(d: TmdbTvDetails): string {
  switch (d.type) {
    case "Miniseries":
      return "Miniseries";
    case "Documentary":
      return "Docuseries";
    case "Reality":
      return "Reality";
    case "Talk Show":
      return "Talk Show";
    case "News":
      return "News";
    case "Video":
      return "Web Series";
    default:
      return "TV";
  }
}

function movieStatus(status: string | undefined): string {
  switch (status) {
    case "Released":
      return "Released";
    case "Canceled":
      return "Cancelled";
    case "Rumored":
      return "Rumored";
    case "In Production":
    case "Post Production":
      return "In Production";
    default:
      return "Upcoming";
  }
}

function tvStatus(d: TmdbTvDetails): string {
  switch (d.status) {
    case "Returning Series":
      return d.next_episode_to_air ? "Airing" : "Returning";
    case "Ended":
      return "Finished";
    case "Canceled":
      return "Cancelled";
    case "In Production":
      return "In Production";
    case "Planned":
      return "Upcoming";
    case "Pilot":
      return "Pilot";
    default:
      return d.status ?? "Unknown";
  }
}

function providers(list: TmdbWatchProvider[] | undefined): Provider[] {
  return (list ?? [])
    .slice()
    .sort((a, b) => (a.display_priority ?? 99) - (b.display_priority ?? 99))
    .map((p) => ({ id: p.provider_id, name: p.provider_name, logoPath: p.logo_path }));
}

function groupCrew(crew: TmdbCrewCredit[]): CrewMember[] {
  const byId = new Map<number, CrewMember>();
  for (const c of crew) {
    const existing = byId.get(c.id);
    if (existing) {
      if (!existing.jobs.includes(c.job)) existing.jobs.push(c.job);
    } else {
      byId.set(c.id, { id: c.id, name: c.name, jobs: [c.job], department: c.department, profilePath: c.profile_path, episodes: null });
    }
  }
  return [...byId.values()];
}

const CREW_PRIORITY = ["Director", "Screenplay", "Writer", "Novel", "Story", "Creator", "Producer", "Executive Producer", "Original Music Composer", "Director of Photography", "Editor"];

function crewRank(member: CrewMember): number {
  const ranks = member.jobs.map((j) => {
    const i = CREW_PRIORITY.indexOf(j);
    return i === -1 ? 99 : i;
  });
  return Math.min(...ranks);
}

const APPEND_MOVIE = "credits,videos,recommendations,similar,release_dates,keywords,external_ids,watch/providers";
const APPEND_TV = "aggregate_credits,videos,recommendations,similar,content_ratings,keywords,external_ids,watch/providers";

export async function getMediaDetails(type: MediaType, id: number, region = "US"): Promise<MediaDetails | null> {
  if (!Number.isInteger(id) || id <= 0) return null;
  return type === "movie" ? getMovie(id, region) : getTv(id, region);
}

function pickVideos(results: { key: string; name: string; site: string; type: string; official?: boolean }[] | undefined) {
  const yt = (results ?? []).filter((v) => v.site === "YouTube");
  const trailer =
    yt.find((v) => v.type === "Trailer" && v.official) ?? yt.find((v) => v.type === "Trailer") ?? yt.find((v) => v.type === "Teaser") ?? null;
  return {
    videos: yt.slice(0, 12).map((v) => ({ key: v.key, name: v.name, type: v.type })),
    trailer: trailer ? { key: trailer.key, name: trailer.name } : null,
  };
}

async function getMovie(id: number, region: string): Promise<MediaDetails | null> {
  const d = await orNull(tmdb<TmdbMovieDetails>(`/movie/${id}`, { append_to_response: APPEND_MOVIE }, 3600 * 6));
  if (!d) return null;
  const summary = toSummary({ ...d, media_type: "movie", genre_ids: d.genres.map((g) => g.id) });
  const certification =
    d.release_dates?.results
      .find((r) => r.iso_3166_1 === region)
      ?.release_dates.find((r) => r.certification)?.certification ??
    d.release_dates?.results.find((r) => r.iso_3166_1 === "US")?.release_dates.find((r) => r.certification)?.certification ??
    null;
  const crew = groupCrew(d.credits?.crew ?? []).sort((a, b) => crewRank(a) - crewRank(b));
  const watchRegion = d["watch/providers"]?.results?.[region] ?? d["watch/providers"]?.results?.US;
  return {
    ...summary,
    tagline: d.tagline || null,
    format: movieFormat(d),
    status: movieStatus(d.status),
    rawStatus: d.status ?? null,
    endDate: null,
    runtime: d.runtime || null,
    episodes: 1,
    seasons: null,
    seasonList: [],
    studios: (d.production_companies ?? []).map((c) => c.name),
    networks: [],
    countries: (d.production_countries ?? []).map((c) => c.iso_3166_1),
    languages: (d.spoken_languages ?? []).map((l) => l.english_name),
    certification,
    budget: d.budget || null,
    revenue: d.revenue || null,
    homepage: d.homepage || null,
    nextEpisode: null,
    lastEpisode: null,
    creators: crew.filter((c) => c.jobs.includes("Director")).map((c) => ({ id: c.id, name: c.name, profilePath: c.profilePath })),
    cast: (d.credits?.cast ?? [])
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((c) => ({ id: c.id, name: c.name, character: c.character ?? "", profilePath: c.profile_path, episodes: null })),
    crew,
    ...pickVideos(d.videos?.results),
    recommendations: (d.recommendations?.results ?? []).map((r) => toSummary(r, "movie")),
    similar: (d.similar?.results ?? []).map((r) => toSummary(r, "movie")),
    collection: d.belongs_to_collection
      ? { id: d.belongs_to_collection.id, name: d.belongs_to_collection.name, posterPath: d.belongs_to_collection.poster_path }
      : null,
    keywords: (d.keywords?.keywords ?? []).map((k) => k.name),
    externalIds: {
      imdb: d.external_ids?.imdb_id ?? d.imdb_id ?? null,
      tvdb: null,
      wikidata: d.external_ids?.wikidata_id ?? null,
      instagram: d.external_ids?.instagram_id ?? null,
      twitter: d.external_ids?.twitter_id ?? null,
      facebook: d.external_ids?.facebook_id ?? null,
    },
    watch: watchRegion
      ? {
          region,
          link: watchRegion.link ?? null,
          stream: providers(watchRegion.flatrate),
          rent: providers(watchRegion.rent),
          buy: providers(watchRegion.buy),
          free: providers([...(watchRegion.free ?? []), ...(watchRegion.ads ?? [])]),
        }
      : null,
  };
}

function episodeRef(e: TmdbTvDetails["next_episode_to_air"]): EpisodeRef | null {
  if (!e) return null;
  return { season: e.season_number, episode: e.episode_number, name: e.name, airDate: e.air_date };
}

async function getTv(id: number, region: string): Promise<MediaDetails | null> {
  const d = await orNull(tmdb<TmdbTvDetails>(`/tv/${id}`, { append_to_response: APPEND_TV }, 3600 * 3));
  if (!d) return null;
  const summary = toSummary({ ...d, media_type: "tv", genre_ids: d.genres.map((g) => g.id) });
  const certification =
    d.content_ratings?.results.find((r) => r.iso_3166_1 === region)?.rating ??
    d.content_ratings?.results.find((r) => r.iso_3166_1 === "US")?.rating ??
    null;
  const cast = (d.aggregate_credits?.cast ?? [])
    .sort((a: TmdbAggregateCast, b: TmdbAggregateCast) => (a.order ?? 0) - (b.order ?? 0))
    .map((c) => ({
      id: c.id,
      name: c.name,
      character: c.roles.map((r) => r.character).filter(Boolean).join(" / "),
      profilePath: c.profile_path,
      episodes: c.total_episode_count,
    }));
  const crew = (d.aggregate_credits?.crew ?? [])
    .map((c: TmdbAggregateCrew) => ({
      id: c.id,
      name: c.name,
      jobs: c.jobs.map((j) => j.job),
      department: c.department,
      profilePath: c.profile_path,
      episodes: c.total_episode_count,
    }))
    .sort((a, b) => crewRank(a) - crewRank(b) || (b.episodes ?? 0) - (a.episodes ?? 0));
  const watchRegion = d["watch/providers"]?.results?.[region] ?? d["watch/providers"]?.results?.US;
  const runtime = d.episode_run_time?.[0] ?? d.last_episode_to_air?.runtime ?? d.next_episode_to_air?.runtime ?? null;
  return {
    ...summary,
    tagline: d.tagline || null,
    format: tvFormat(d),
    status: tvStatus(d),
    rawStatus: d.status ?? null,
    endDate: d.status === "Ended" || d.status === "Canceled" ? (d.last_air_date ?? null) : null,
    runtime,
    episodes: d.number_of_episodes ?? null,
    seasons: d.number_of_seasons ?? null,
    seasonList: (d.seasons ?? []).map((s) => ({
      number: s.season_number,
      name: s.name,
      episodes: s.episode_count,
      airDate: s.air_date,
      posterPath: s.poster_path,
      overview: s.overview ?? "",
    })),
    studios: (d.production_companies ?? []).map((c) => c.name),
    networks: (d.networks ?? []).map((n) => ({ id: n.id, name: n.name, logoPath: n.logo_path })),
    countries: d.origin_country ?? [],
    languages: (d.spoken_languages ?? []).map((l) => l.english_name),
    certification,
    budget: null,
    revenue: null,
    homepage: d.homepage || null,
    nextEpisode: episodeRef(d.next_episode_to_air),
    lastEpisode: episodeRef(d.last_episode_to_air),
    creators: (d.created_by ?? []).map((c) => ({ id: c.id, name: c.name, profilePath: c.profile_path })),
    cast,
    crew,
    ...pickVideos(d.videos?.results),
    recommendations: (d.recommendations?.results ?? []).map((r) => toSummary(r, "tv")),
    similar: (d.similar?.results ?? []).map((r) => toSummary(r, "tv")),
    collection: null,
    keywords: (d.keywords?.results ?? []).map((k) => k.name),
    externalIds: {
      imdb: d.external_ids?.imdb_id ?? null,
      tvdb: d.external_ids?.tvdb_id ?? null,
      wikidata: d.external_ids?.wikidata_id ?? null,
      instagram: d.external_ids?.instagram_id ?? null,
      twitter: d.external_ids?.twitter_id ?? null,
      facebook: d.external_ids?.facebook_id ?? null,
    },
    watch: watchRegion
      ? {
          region,
          link: watchRegion.link ?? null,
          stream: providers(watchRegion.flatrate),
          rent: providers(watchRegion.rent),
          buy: providers(watchRegion.buy),
          free: providers([...(watchRegion.free ?? []), ...(watchRegion.ads ?? [])]),
        }
      : null,
  };
}

export interface SeasonDetails {
  number: number;
  name: string;
  overview: string;
  airDate: string | null;
  posterPath: string | null;
  episodes: {
    number: number;
    name: string;
    overview: string;
    airDate: string | null;
    runtime: number | null;
    stillPath: string | null;
    score: number | null;
  }[];
}

export async function getSeason(tvId: number, season: number): Promise<SeasonDetails | null> {
  if (!Number.isInteger(tvId) || !Number.isInteger(season) || season < 0) return null;
  const d = await orNull(tmdb<TmdbSeasonDetails>(`/tv/${tvId}/season/${season}`, {}, 3600 * 3));
  if (!d) return null;
  return {
    number: d.season_number,
    name: d.name,
    overview: d.overview,
    airDate: d.air_date,
    posterPath: d.poster_path,
    episodes: d.episodes.map((e) => ({
      number: e.episode_number,
      name: e.name,
      overview: e.overview ?? "",
      airDate: e.air_date,
      runtime: e.runtime ?? null,
      stillPath: e.still_path ?? null,
      score: e.vote_average ? Math.round(e.vote_average * 10) : null,
    })),
  };
}

export async function getCollectionParts(id: number): Promise<{ name: string; parts: MediaSummary[] } | null> {
  const d = await orNull(tmdb<TmdbCollectionDetails>(`/collection/${id}`, {}, 3600 * 24));
  if (!d) return null;
  return {
    name: d.name,
    parts: d.parts
      .map((p) => toSummary(p, "movie"))
      .sort((a, b) => (a.date ?? "9999").localeCompare(b.date ?? "9999")),
  };
}

export interface PersonCredit extends MediaSummary {
  role: string;
  department: string;
  episodes: number | null;
}

export interface PersonDetails {
  id: number;
  name: string;
  biography: string;
  birthday: string | null;
  deathday: string | null;
  placeOfBirth: string | null;
  profilePath: string | null;
  department: string | null;
  alsoKnownAs: string[];
  gender: string | null;
  homepage: string | null;
  imdb: string | null;
  instagram: string | null;
  cast: PersonCredit[];
  crew: PersonCredit[];
}

function creditToSummary(c: TmdbPersonCredit): MediaSummary {
  return toSummary(
    c.media_type === "movie"
      ? { media_type: "movie", id: c.id, title: c.title ?? "", poster_path: c.poster_path, backdrop_path: c.backdrop_path ?? null, release_date: c.release_date, genre_ids: c.genre_ids, vote_average: c.vote_average, vote_count: c.vote_count, popularity: c.popularity, overview: c.overview }
      : { media_type: "tv", id: c.id, name: c.name ?? "", poster_path: c.poster_path, backdrop_path: c.backdrop_path ?? null, first_air_date: c.first_air_date, genre_ids: c.genre_ids, vote_average: c.vote_average, vote_count: c.vote_count, popularity: c.popularity, overview: c.overview },
  );
}

export async function getPerson(id: number): Promise<PersonDetails | null> {
  if (!Number.isInteger(id) || id <= 0) return null;
  const d = await orNull(
    tmdb<TmdbPersonDetails>(`/person/${id}`, { append_to_response: "combined_credits,external_ids" }, 3600 * 12),
  );
  if (!d) return null;

  const merge = (credits: TmdbPersonCredit[], roleOf: (c: TmdbPersonCredit) => string): PersonCredit[] => {
    const byKey = new Map<string, PersonCredit>();
    for (const c of credits) {
      const key = `${c.media_type}:${c.id}`;
      const role = roleOf(c);
      const existing = byKey.get(key);
      if (existing) {
        if (role && !existing.role.split(" / ").includes(role)) existing.role = `${existing.role} / ${role}`;
        continue;
      }
      byKey.set(key, {
        ...creditToSummary(c),
        role,
        department: c.department ?? "Acting",
        episodes: c.episode_count ?? null,
      });
    }
    return [...byKey.values()].sort((a, b) => (b.date ?? "0").localeCompare(a.date ?? "0"));
  };

  return {
    id: d.id,
    name: d.name,
    biography: d.biography,
    birthday: d.birthday,
    deathday: d.deathday,
    placeOfBirth: d.place_of_birth,
    profilePath: d.profile_path,
    department: d.known_for_department ?? null,
    alsoKnownAs: d.also_known_as ?? [],
    gender: d.gender === 1 ? "Female" : d.gender === 2 ? "Male" : d.gender === 3 ? "Non-binary" : null,
    homepage: d.homepage ?? null,
    imdb: d.external_ids?.imdb_id ?? null,
    instagram: d.external_ids?.instagram_id ?? null,
    cast: merge(d.combined_credits?.cast ?? [], (c) => c.character ?? ""),
    crew: merge(d.combined_credits?.crew ?? [], (c) => c.job ?? ""),
  };
}
