import "server-only";
import type { MediaDetails, MediaSummary, Paged } from "@/lib/media";

const OL_API = "https://openlibrary.org";

interface OpenLibraryDoc {
  key: string;
  title: string;
  author_name?: string[];
  first_publish_year?: number;
  cover_i?: number;
  subject?: string[];
  ratings_average?: number;
  ratings_count?: number;
}

interface OpenLibraryWork {
  key: string;
  title: string;
  description?: string | { value: string };
  authors?: { author: { key: string } }[];
  covers?: number[];
  subjects?: string[];
  first_publish_date?: string;
}

function extractId(key: string): number {
  const num = key.replace(/\D/g, "");
  return parseInt(num, 10) || 0;
}

function coverUrl(coverId?: number | null): string | null {
  return coverId ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg` : null;
}

function docToSummary(doc: OpenLibraryDoc): MediaSummary {
  const id = extractId(doc.key);
  const authors = doc.author_name || [];
  const genres = (doc.subject || []).slice(0, 4);
  const score = doc.ratings_average ? Math.round(doc.ratings_average * 20) : null;
  return {
    type: "book",
    id,
    title: doc.title,
    originalTitle: authors.length ? `by ${authors.join(", ")}` : null,
    posterPath: coverUrl(doc.cover_i),
    backdropPath: coverUrl(doc.cover_i),
    date: doc.first_publish_year ? `${doc.first_publish_year}-01-01` : null,
    year: doc.first_publish_year || null,
    genres,
    overview: authors.length ? `A book by ${authors.join(", ")}.` : "",
    score,
    voteCount: doc.ratings_count || 0,
    popularity: (doc.ratings_count || 1) * 10,
    originalLanguage: "en",
  };
}

export async function searchBooks(query: string, page = 1): Promise<Paged<MediaSummary>> {
  if (!query?.trim()) return getTrendingBooks(page);
  const limit = 20;
  const offset = (page - 1) * limit;
  try {
    const res = await fetch(`${OL_API}/search.json?q=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error(`Open Library error: ${res.status}`);
    const data = (await res.json()) as { numFound: number; docs: OpenLibraryDoc[] };
    const valid = (data.docs || []).filter((d) => d.key && extractId(d.key) > 0);
    return {
      page,
      totalPages: Math.min(Math.ceil((data.numFound || 0) / limit), 500),
      totalResults: data.numFound || 0,
      results: valid.map(docToSummary),
    };
  } catch (err) {
    console.warn("[books] searchBooks error:", err instanceof Error ? err.message : err);
    return { page, totalPages: 1, totalResults: 0, results: [] };
  }
}

export async function getTrendingBooks(page = 1): Promise<Paged<MediaSummary>> {
  try {
    const res = await fetch(`${OL_API}/trending/weekly.json?limit=24`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
      next: { revalidate: 7200 },
    });
    if (!res.ok) throw new Error(`Open Library error: ${res.status}`);
    const data = (await res.json()) as { works: (OpenLibraryDoc & { author_name?: string[] })[] };
    const works = (data.works || []).filter((w) => w.key && extractId(w.key) > 0);
    return {
      page: 1,
      totalPages: 1,
      totalResults: works.length,
      results: works.map(docToSummary),
    };
  } catch (err) {
    console.warn("[books] getTrendingBooks error:", err instanceof Error ? err.message : err);
    return { page: 1, totalPages: 1, totalResults: 0, results: [] };
  }
}

export async function getTopRatedBooks(page = 1): Promise<Paged<MediaSummary>> {
  return getBooksBySubject("classics", page);
}

export async function getBooksBySubject(subject: string, page = 1): Promise<Paged<MediaSummary>> {
  const limit = 20;
  const offset = (page - 1) * limit;
  try {
    const res = await fetch(`${OL_API}/subjects/${encodeURIComponent(subject)}.json?limit=${limit}&offset=${offset}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
      next: { revalidate: 7200 },
    });
    if (!res.ok) throw new Error(`Open Library error: ${res.status}`);
    const data = (await res.json()) as {
      work_count: number;
      works: {
        key: string;
        title: string;
        authors?: { name: string }[];
        first_publish_year?: number;
        cover_id?: number;
        subject?: string[];
      }[];
    };
    const valid = (data.works || []).filter((w) => w.key && extractId(w.key) > 0);
    const results: MediaSummary[] = valid.map((w) => {
      const id = extractId(w.key);
      const authors = (w.authors || []).map((a) => a.name);
      return {
        type: "book",
        id,
        title: w.title,
        originalTitle: authors.length ? `by ${authors.join(", ")}` : null,
        posterPath: coverUrl(w.cover_id),
        backdropPath: coverUrl(w.cover_id),
        date: w.first_publish_year ? `${w.first_publish_year}-01-01` : null,
        year: w.first_publish_year || null,
        genres: (w.subject || []).slice(0, 4),
        overview: authors.length ? `A book by ${authors.join(", ")}.` : "",
        score: null,
        voteCount: 100,
        popularity: 100,
        originalLanguage: "en",
      };
    });
    return {
      page,
      totalPages: Math.min(Math.ceil((data.work_count || 0) / limit), 500),
      totalResults: data.work_count || 0,
      results,
    };
  } catch (err) {
    console.warn(`[books] getBooksBySubject(${subject}) error:`, err instanceof Error ? err.message : err);
    return { page, totalPages: 1, totalResults: 0, results: [] };
  }
}

export async function getBookDetails(id: number): Promise<MediaDetails | null> {
  const key = `OL${id}W`;
  try {
    const [workRes, ratingsRes, editionsRes] = await Promise.all([
      fetch(`${OL_API}/works/${key}.json`, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(8000),
        next: { revalidate: 86400 },
      }),
      fetch(`${OL_API}/works/${key}/ratings.json`, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(8000),
        next: { revalidate: 86400 },
      }).catch(() => null),
      fetch(`${OL_API}/works/${key}/editions.json?limit=1`, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(8000),
        next: { revalidate: 86400 },
      }).catch(() => null),
    ]);

    if (!workRes.ok) return null;
    const work = (await workRes.json()) as OpenLibraryWork;

    // Fetch author names
    const authors: string[] = [];
    if (work.authors?.length) {
      await Promise.all(
        work.authors.slice(0, 3).map(async ({ author }) => {
          if (!author?.key) return;
          try {
            const aRes = await fetch(`${OL_API}${author.key}.json`, { signal: AbortSignal.timeout(4000) });
            if (aRes.ok) {
              const a = (await aRes.json()) as { name?: string };
              if (a.name) authors.push(a.name);
            }
          } catch {
            // Ignored
          }
        }),
      );
    }

    let ratingsAverage: number | null = null;
    let ratingsCount = 0;
    if (ratingsRes?.ok) {
      const r = (await ratingsRes.json()) as { summary?: { average?: number; count?: number } };
      if (r.summary?.average) ratingsAverage = Math.round(r.summary.average * 20);
      if (r.summary?.count) ratingsCount = r.summary.count;
    }

    let pages: number | null = null;
    const publishers: string[] = [];
    if (editionsRes?.ok) {
      const ed = (await editionsRes.json()) as { entries?: { number_of_pages?: number; publishers?: string[] }[] };
      const first = ed.entries?.[0];
      if (first?.number_of_pages) pages = first.number_of_pages;
      if (first?.publishers) publishers.push(...first.publishers);
    }

    const description =
      typeof work.description === "string"
        ? work.description
        : work.description?.value || "";

    const primaryCover = work.covers?.[0] ? coverUrl(work.covers[0]) : null;
    const yearMatch = work.first_publish_date?.match(/\b(\d{4})\b/);
    const year = yearMatch ? Number(yearMatch[1]) : null;
    const genres = (work.subjects || []).slice(0, 6);

    return {
      type: "book",
      id,
      title: work.title,
      originalTitle: authors.length ? `by ${authors.join(", ")}` : null,
      posterPath: primaryCover,
      backdropPath: primaryCover,
      date: work.first_publish_date || (year ? `${year}-01-01` : null),
      year,
      genres,
      overview: description,
      score: ratingsAverage,
      voteCount: ratingsCount,
      popularity: ratingsCount * 10,
      originalLanguage: "en",
      tagline: authors.length ? `By ${authors.join(", ")}` : null,
      format: "Book",
      status: "Published",
      rawStatus: "Published",
      endDate: null,
      runtime: pages ? Math.round(pages * 1.5) : null, // ~1.5 mins per page
      episodes: pages || 1,
      pages,
      seasons: null,
      seasonList: [],
      studios: publishers,
      publishers,
      networks: [],
      countries: [],
      languages: ["English"],
      certification: null,
      budget: null,
      revenue: null,
      homepage: null,
      nextEpisode: null,
      lastEpisode: null,
      creators: authors.map((name, i) => ({ id: i + 1, name, profilePath: null })),
      cast: [],
      crew: [],
      videos: [],
      trailer: null,
      recommendations: [],
      similar: [],
      collection: null,
      keywords: genres,
      externalIds: {
        imdb: null,
        tvdb: null,
        wikidata: null,
        instagram: null,
        twitter: null,
        facebook: null,
        openlibrary: `https://openlibrary.org/works/${key}`,
      },
      watch: null,
    };
  } catch (err) {
    console.warn(`[books] getBookDetails(${id}) error:`, err instanceof Error ? err.message : err);
    return null;
  }
}
