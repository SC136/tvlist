import "server-only";
import type { MediaDetails, MediaSummary, Paged } from "@/lib/media";

const ITUNES_API = "https://itunes.apple.com";

interface ItunesAlbum {
  collectionId: number;
  collectionName: string;
  artistName: string;
  artistId?: number;
  artworkUrl100?: string;
  releaseDate?: string;
  trackCount?: number;
  primaryGenreName?: string;
  copyright?: string;
  collectionViewUrl?: string;
  country?: string;
}

interface ItunesTrack {
  trackId: number;
  trackName: string;
  trackNumber: number;
  trackTimeMillis?: number;
  previewUrl?: string;
}

function albumCover(url?: string | null): string | null {
  if (!url) return null;
  return url.replace(/100x100bb/, "600x600bb");
}

function toMusicSummary(a: ItunesAlbum): MediaSummary {
  const yearMatch = a.releaseDate?.match(/^(\d{4})/);
  const year = yearMatch ? Number(yearMatch[1]) : null;
  const genres = a.primaryGenreName ? [a.primaryGenreName] : [];
  const cover = albumCover(a.artworkUrl100);
  return {
    type: "music",
    id: a.collectionId,
    title: a.collectionName,
    originalTitle: `by ${a.artistName}`,
    posterPath: cover,
    backdropPath: cover,
    date: a.releaseDate ? a.releaseDate.slice(0, 10) : null,
    year,
    genres,
    overview: `${a.collectionName} is an album by ${a.artistName}${year ? `, released in ${year}` : ""}.${a.trackCount ? ` Features ${a.trackCount} tracks.` : ""}`,
    score: null,
    voteCount: (a.trackCount || 10) * 50,
    popularity: (a.trackCount || 10) * 50,
    originalLanguage: "en",
  };
}

export async function searchMusic(query: string, page = 1): Promise<Paged<MediaSummary>> {
  if (!query?.trim()) return getTrendingMusic(page);
  const limit = 20;
  const offset = (page - 1) * limit;
  try {
    const res = await fetch(`${ITUNES_API}/search?term=${encodeURIComponent(query)}&entity=album&limit=${limit}&offset=${offset}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error(`iTunes error: ${res.status}`);
    const data = (await res.json()) as { resultCount: number; results: ItunesAlbum[] };
    return {
      page,
      totalPages: Math.min(Math.ceil((data.resultCount || 0) / limit), 500),
      totalResults: data.resultCount || 0,
      results: (data.results || []).map(toMusicSummary),
    };
  } catch (err) {
    console.warn("[music] searchMusic error:", err instanceof Error ? err.message : err);
    return { page, totalPages: 1, totalResults: 0, results: [] };
  }
}

export async function getTrendingMusic(page = 1): Promise<Paged<MediaSummary>> {
  try {
    const res = await fetch(`${ITUNES_API}/us/rss/topalbums/limit=25/json`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
      next: { revalidate: 7200 },
    });
    if (!res.ok) throw new Error(`iTunes RSS error: ${res.status}`);
    const data = (await res.json()) as {
      feed?: {
        entry?: {
          id?: { attributes?: { "im:id"?: string } };
          "im:name"?: { label?: string };
          "im:artist"?: { label?: string };
          "im:image"?: { label?: string }[];
          "im:itemCount"?: { label?: string };
          "im:releaseDate"?: { label?: string; attributes?: { label?: string } };
          category?: { attributes?: { label?: string } };
        }[];
      };
    };

    const entries = data.feed?.entry || [];
    const results: MediaSummary[] = entries.map((e) => {
      const id = Number(e.id?.attributes?.["im:id"]) || 0;
      const title = e["im:name"]?.label || "Untitled Album";
      const artist = e["im:artist"]?.label || "Unknown Artist";
      const img = e["im:image"]?.[2]?.label || e["im:image"]?.[0]?.label || null;
      const cover = img ? img.replace(/\/\d+x\d+bb/, "/600x600bb") : null;
      const rel = e["im:releaseDate"]?.label || "";
      const year = rel.match(/\b(\d{4})\b/)?.[1] ? Number(rel.match(/\b(\d{4})\b/)![1]) : null;
      const genre = e.category?.attributes?.label;

      return {
        type: "music",
        id,
        title,
        originalTitle: `by ${artist}`,
        posterPath: cover,
        backdropPath: cover,
        date: rel ? rel.slice(0, 10) : null,
        year,
        genres: genre ? [genre] : [],
        overview: `${title} by ${artist}.`,
        score: null,
        voteCount: 500,
        popularity: 500,
        originalLanguage: "en",
      };
    });

    return {
      page: 1,
      totalPages: 1,
      totalResults: results.length,
      results: results.filter((r) => r.id > 0),
    };
  } catch (err) {
    console.warn("[music] getTrendingMusic error:", err instanceof Error ? err.message : err);
    return { page: 1, totalPages: 1, totalResults: 0, results: [] };
  }
}

export async function getTopRatedMusic(page = 1): Promise<Paged<MediaSummary>> {
  return searchMusic("greatest hits", page);
}

export async function getMusicDetails(id: number): Promise<MediaDetails | null> {
  try {
    const res = await fetch(`${ITUNES_API}/lookup?id=${id}&entity=song`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      resultCount: number;
      results: (ItunesAlbum | ItunesTrack)[];
    };
    if (!data.resultCount || !data.results.length) return null;

    const album = data.results[0] as ItunesAlbum;
    const summary = toMusicSummary(album);
    const trackEntries = data.results.slice(1) as ItunesTrack[];

    const tracks = trackEntries.map((t) => ({
      number: t.trackNumber,
      name: t.trackName,
      duration: t.trackTimeMillis ? Math.round(t.trackTimeMillis / 1000) : 0,
      previewUrl: t.previewUrl || null,
    }));

    const totalSeconds = tracks.reduce((sum, t) => sum + t.duration, 0);
    const totalMinutes = totalSeconds > 0 ? Math.round(totalSeconds / 60) : null;

    return {
      ...summary,
      tagline: album.artistName ? `Album by ${album.artistName}` : null,
      format: "Album",
      status: "Released",
      rawStatus: "Released",
      endDate: null,
      runtime: totalMinutes,
      episodes: tracks.length || album.trackCount || 1,
      seasons: null,
      seasonList: [],
      studios: album.copyright ? [album.copyright.replace(/^℗\s*\d*\s*/, "").trim()] : [],
      networks: [],
      countries: album.country ? [album.country] : [],
      languages: ["English"],
      certification: null,
      budget: null,
      revenue: null,
      homepage: album.collectionViewUrl || null,
      nextEpisode: null,
      lastEpisode: null,
      creators: [{ id: album.artistId || 1, name: album.artistName, profilePath: null }],
      cast: [],
      crew: [],
      videos: [],
      trailer: null,
      recommendations: [],
      similar: [],
      collection: null,
      keywords: summary.genres,
      tracks,
      externalIds: {
        imdb: null,
        tvdb: null,
        wikidata: null,
        instagram: null,
        twitter: null,
        facebook: null,
        appleMusic: album.collectionViewUrl || null,
      },
      watch: null,
    };
  } catch (err) {
    console.warn(`[music] getMusicDetails(${id}) error:`, err instanceof Error ? err.message : err);
    return null;
  }
}
