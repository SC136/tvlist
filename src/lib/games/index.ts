import "server-only";
import type { MediaDetails, MediaSummary, Paged } from "@/lib/media";
import { mockGames } from "./mock-games";

const RAWG_API = "https://api.rawg.io/api";

interface RawgGame {
  id: number;
  name: string;
  slug?: string;
  background_image?: string | null;
  released?: string | null;
  metacritic?: number | null;
  rating?: number | null;
  ratings_count?: number | null;
  added?: number | null;
  playtime?: number | null;
  description_raw?: string | null;
  description?: string | null;
  genres?: { id: number; name: string }[];
  platforms?: { platform: { id: number; name: string } }[];
  developers?: { id: number; name: string }[];
  publishers?: { id: number; name: string }[];
  website?: string | null;
  clip?: { clip?: string } | null;
  metacritic_url?: string | null;
  reddit_url?: string | null;
  esrb_rating?: { id: number; name: string; slug: string } | null;
}

function hasKey(): boolean {
  return Boolean(process.env.RAWG_API_KEY);
}

function cleanGameOverview(text?: string | null): string {
  if (!text) return "";
  return text
    .replace(/<[^>]*>/g, "")
    .replace(/^#{1,6}\s*([^\n\r]+)/gm, (_m, h) => `${h.trim()}:\n`)
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function toGameSummary(g: RawgGame): MediaSummary {
  const year = g.released ? Number(g.released.slice(0, 4)) : null;
  const score = g.metacritic ? g.metacritic : g.rating ? Math.round(g.rating * 20) : null;
  return {
    type: "game",
    id: g.id,
    title: g.name,
    originalTitle: null,
    posterPath: g.background_image || null,
    backdropPath: g.background_image || null,
    date: g.released || null,
    year: Number.isFinite(year) ? year : null,
    genres: (g.genres || []).map((gen) => gen.name),
    overview: cleanGameOverview(g.description_raw || g.description),
    score,
    voteCount: g.ratings_count || g.added || 0,
    popularity: g.added || 0,
    originalLanguage: "en",
  };
}

async function rawgFetch<T>(endpoint: string, params: Record<string, string | number> = {}): Promise<T> {
  const key = process.env.RAWG_API_KEY!;
  const sp = new URLSearchParams({ key });
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) sp.set(k, String(v));
  }
  const res = await fetch(`${RAWG_API}${endpoint}?${sp}`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(8000),
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`RAWG error: ${res.status}`);
  return res.json() as Promise<T>;
}

export async function getTrendingGames(page = 1): Promise<Paged<MediaSummary>> {
  if (!hasKey()) {
    return mockGames.getTrending(page);
  }
  try {
    const data = await rawgFetch<{ count: number; results: RawgGame[] }>("/games", {
      page,
      page_size: 20,
      ordering: "-added",
    });
    return {
      page,
      totalPages: Math.min(Math.ceil(data.count / 20), 500),
      totalResults: data.count,
      results: data.results.map(toGameSummary),
    };
  } catch (err) {
    console.warn("[rawg] getTrendingGames error, fallback to mock:", err instanceof Error ? err.message : err);
    return mockGames.getTrending(page);
  }
}

export async function getTopRatedGames(page = 1): Promise<Paged<MediaSummary>> {
  if (!hasKey()) {
    return mockGames.getTopRated(page);
  }
  try {
    const data = await rawgFetch<{ count: number; results: RawgGame[] }>("/games", {
      page,
      page_size: 20,
      ordering: "-metacritic",
    });
    return {
      page,
      totalPages: Math.min(Math.ceil(data.count / 20), 500),
      totalResults: data.count,
      results: data.results.map(toGameSummary),
    };
  } catch (err) {
    console.warn("[rawg] getTopRatedGames error, fallback to mock:", err instanceof Error ? err.message : err);
    return mockGames.getTopRated(page);
  }
}

export async function getNewGames(page = 1): Promise<Paged<MediaSummary>> {
  if (!hasKey()) {
    return mockGames.getNew(page);
  }
  try {
    const today = new Date().toISOString().slice(0, 10);
    const sixMonthsAgo = new Date(Date.now() - 180 * 86_400_000).toISOString().slice(0, 10);
    const data = await rawgFetch<{ count: number; results: RawgGame[] }>("/games", {
      page,
      page_size: 20,
      dates: `${sixMonthsAgo},${today}`,
      ordering: "-added",
    });
    return {
      page,
      totalPages: Math.min(Math.ceil(data.count / 20), 500),
      totalResults: data.count,
      results: data.results.map(toGameSummary),
    };
  } catch (err) {
    console.warn("[rawg] getNewGames error, fallback to mock:", err instanceof Error ? err.message : err);
    return mockGames.getNew(page);
  }
}

export async function searchGames(query: string, page = 1): Promise<Paged<MediaSummary>> {
  if (!hasKey()) {
    return mockGames.search(query, page);
  }
  try {
    const data = await rawgFetch<{ count: number; results: RawgGame[] }>("/games", {
      search: query,
      page,
      page_size: 20,
    });
    return {
      page,
      totalPages: Math.min(Math.ceil(data.count / 20), 500),
      totalResults: data.count,
      results: data.results.map(toGameSummary),
    };
  } catch (err) {
    console.warn("[rawg] searchGames error, fallback to mock:", err instanceof Error ? err.message : err);
    return mockGames.search(query, page);
  }
}

export async function getGameDetails(id: number): Promise<MediaDetails | null> {
  if (!hasKey()) {
    return mockGames.getDetails(id);
  }
  try {
    const [g, screenshotsData, seriesData] = await Promise.all([
      rawgFetch<RawgGame>(`/games/${id}`),
      rawgFetch<{ results: { id: number; image: string }[] }>(`/games/${id}/screenshots`).catch(() => ({ results: [] })),
      rawgFetch<{ results: RawgGame[] }>(`/games/${id}/game-series`).catch(() => ({ results: [] })),
    ]);
    const summary = toGameSummary(g);
    const platforms = (g.platforms || []).map((p) => p.platform.name);
    const devs = (g.developers || []).map((d) => d.name);
    const pubs = (g.publishers || []).map((p) => p.name);
    const studios = [...new Set([...devs, ...pubs])];
    const screenshots = (screenshotsData.results || []).map((s) => s.image).filter(Boolean);

    let recs = (seriesData.results || []).slice(0, 10).map(toGameSummary);
    if (!recs.length && g.genres?.[0]?.id) {
      try {
        const genreFallback = await rawgFetch<{ results: RawgGame[] }>("/games", {
          genres: g.genres[0].id,
          page_size: 10,
          ordering: "-added",
        });
        recs = (genreFallback.results || []).filter((r) => r.id !== g.id).slice(0, 10).map(toGameSummary);
      } catch {
        // Ignored
      }
    }

    return {
      ...summary,
      tagline: platforms.length ? platforms.slice(0, 4).join(" · ") : null,
      format: "Video Game",
      status: "Released",
      rawStatus: "Released",
      endDate: null,
      runtime: g.playtime ? g.playtime * 60 : null,
      episodes: 1,
      seasons: null,
      seasonList: [],
      studios,
      networks: [],
      countries: [],
      languages: ["English"],
      certification: g.esrb_rating?.name ?? null,
      budget: null,
      revenue: null,
      homepage: g.website || null,
      nextEpisode: null,
      lastEpisode: null,
      creators: [],
      cast: [],
      crew: [],
      videos: [],
      trailer: null,
      recommendations: recs,
      similar: [],
      collection: null,
      keywords: summary.genres,
      platforms,
      screenshots,
      developers: devs,
      publishers: pubs,
      externalIds: {
        imdb: null,
        tvdb: null,
        wikidata: null,
        instagram: null,
        twitter: null,
        facebook: null,
        rawg: `https://rawg.io/games/${g.id}`,
        metacritic: g.metacritic_url || null,
        reddit: g.reddit_url || null,
      },
      watch: null,
    };
  } catch (err) {
    console.warn("Failed to fetch game details from RAWG, attempting demo fallback:", err);
    return mockGames.getDetails(id);
  }
}
