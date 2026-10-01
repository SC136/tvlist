/* Client-safe media helpers and normalized types shared by server and client code. */

export type MediaType = "movie" | "tv";

export const MEDIA_TYPES: MediaType[] = ["movie", "tv"];

export function isMediaType(value: unknown): value is MediaType {
  return value === "movie" || value === "tv";
}

export const MEDIA_LABEL: Record<MediaType, { one: string; many: string; list: string }> = {
  movie: { one: "Movie", many: "Movies", list: "Movie List" },
  tv: { one: "TV Show", many: "TV Shows", list: "TV List" },
};

/** A title as it appears in grids, search results and recommendations. */
export interface MediaSummary {
  type: MediaType;
  id: number;
  title: string;
  originalTitle: string | null;
  posterPath: string | null;
  backdropPath: string | null;
  date: string | null;
  year: number | null;
  genres: string[];
  overview: string;
  /** 0–100, derived from TMDB's vote average. Null when too few votes. */
  score: number | null;
  voteCount: number;
  popularity: number;
  originalLanguage: string | null;
}

export interface Paged<T> {
  page: number;
  totalPages: number;
  totalResults: number;
  results: T[];
}

/* ------------------------------- Images ---------------------------------- */

export type PosterSize = "w92" | "w154" | "w185" | "w342" | "w500" | "w780" | "original";
export type BackdropSize = "w300" | "w780" | "w1280" | "original";
export type ProfileSize = "w45" | "w185" | "h632" | "original";
export type LogoSize = "w45" | "w92" | "w154" | "w185";

export function tmdbImage(
  path: string | null | undefined,
  size: PosterSize | BackdropSize | ProfileSize | LogoSize | "w300" = "w342",
): string | null {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

/* ------------------------------- Genres ---------------------------------- */

// TMDB genre ids are stable; hardcoding saves a request per render.
export const MOVIE_GENRES: Record<number, string> = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Science Fiction",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
};

export const TV_GENRES: Record<number, string> = {
  10759: "Action & Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  10762: "Kids",
  9648: "Mystery",
  10763: "News",
  10764: "Reality",
  10765: "Sci-Fi & Fantasy",
  10766: "Soap",
  10767: "Talk",
  10768: "War & Politics",
  37: "Western",
};

export function genreMap(type: MediaType): Record<number, string> {
  return type === "movie" ? MOVIE_GENRES : TV_GENRES;
}

export function genreIdByName(type: MediaType, name: string): number | undefined {
  const entry = Object.entries(genreMap(type)).find(([, n]) => n.toLowerCase() === name.toLowerCase());
  return entry ? Number(entry[0]) : undefined;
}

/* ------------------------------ Providers -------------------------------- */

export const WATCH_PROVIDERS: { id: number; name: string }[] = [
  { id: 8, name: "Netflix" },
  { id: 9, name: "Prime Video" },
  { id: 337, name: "Disney+" },
  { id: 1899, name: "Max" },
  { id: 15, name: "Hulu" },
  { id: 350, name: "Apple TV+" },
  { id: 531, name: "Paramount+" },
  { id: 386, name: "Peacock" },
  { id: 283, name: "Crunchyroll" },
  { id: 11, name: "MUBI" },
];

/* ------------------------------- Countries ------------------------------- */

export const COUNTRIES: Record<string, string> = {
  US: "United States",
  GB: "United Kingdom",
  CA: "Canada",
  AU: "Australia",
  IN: "India",
  JP: "Japan",
  KR: "South Korea",
  CN: "China",
  FR: "France",
  DE: "Germany",
  ES: "Spain",
  IT: "Italy",
  MX: "Mexico",
  BR: "Brazil",
  SE: "Sweden",
  DK: "Denmark",
  NO: "Norway",
  TR: "Turkey",
  NZ: "New Zealand",
  IE: "Ireland",
  HK: "Hong Kong",
  TW: "Taiwan",
  AR: "Argentina",
  BE: "Belgium",
  NL: "Netherlands",
  PL: "Poland",
  RU: "Russia",
  TH: "Thailand",
  ZA: "South Africa",
  NG: "Nigeria",
};

export function countryName(code: string | null | undefined): string | null {
  if (!code) return null;
  return COUNTRIES[code] ?? code;
}

export const LANGUAGES: Record<string, string> = {
  en: "English",
  ja: "Japanese",
  ko: "Korean",
  hi: "Hindi",
  es: "Spanish",
  fr: "French",
  de: "German",
  it: "Italian",
  zh: "Mandarin",
  cn: "Cantonese",
  pt: "Portuguese",
  ta: "Tamil",
  te: "Telugu",
  ml: "Malayalam",
  sv: "Swedish",
  da: "Danish",
  no: "Norwegian",
  tr: "Turkish",
  ru: "Russian",
  th: "Thai",
  pl: "Polish",
  nl: "Dutch",
};

export function languageName(code: string | null | undefined): string | null {
  if (!code) return null;
  return LANGUAGES[code] ?? code.toUpperCase();
}

/* -------------------------------- URLs ----------------------------------- */

export function slugify(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function mediaHref(type: MediaType, id: number, tab?: string): string {
  return tab ? `/${type}/${id}/${tab}` : `/${type}/${id}`;
}

export function personHref(id: number): string {
  return `/person/${id}`;
}

export function yearOf(date: string | null | undefined): number | null {
  if (!date) return null;
  const y = Number(date.slice(0, 4));
  return Number.isFinite(y) && y > 0 ? y : null;
}
