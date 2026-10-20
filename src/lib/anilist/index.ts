import "server-only";
import type { MediaDetails, MediaSummary, Paged } from "@/lib/media";
import type { CastMember, CrewMember } from "@/lib/tmdb";

const ANILIST_API = "https://graphql.anilist.co";

interface AniListMedia {
  id: number;
  title: {
    romaji?: string | null;
    english?: string | null;
    native?: string | null;
    userPreferred?: string | null;
  };
  coverImage: {
    extraLarge?: string | null;
    large?: string | null;
    medium?: string | null;
  };
  bannerImage?: string | null;
  format?: string | null;
  status?: string | null;
  description?: string | null;
  startDate?: { year?: number | null; month?: number | null; day?: number | null };
  endDate?: { year?: number | null; month?: number | null; day?: number | null };
  season?: string | null;
  seasonYear?: number | null;
  episodes?: number | null;
  duration?: number | null;
  chapters?: number | null;
  volumes?: number | null;
  countryOfOrigin?: string | null;
  genres: string[];
  averageScore?: number | null;
  popularity?: number;
  trailer?: { id?: string | null; site?: string | null } | null;
  nextAiringEpisode?: { episode: number; airingAt: number } | null;
  studios?: { nodes: { id: number; name: string }[] };
  characters?: {
    edges: {
      role: string;
      node: { id: number; name: { full: string }; image?: { large?: string | null } };
      voiceActors?: { id: number; name: { full: string }; image?: { large?: string | null } }[];
    }[];
  };
  staff?: {
    edges: {
      role: string;
      node: { id: number; name: { full: string }; image?: { large?: string | null } };
    }[];
  };
  recommendations?: {
    nodes: {
      mediaRecommendation?: AniListMedia | null;
    }[];
  };
}

async function anilistQuery<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch(ANILIST_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.timeout(8000),
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    throw new Error(`AniList query failed with status ${res.status}`);
  }

  const json = await res.json();
  if (json.errors?.length) {
    throw new Error(json.errors[0]?.message || "AniList GraphQL error");
  }

  return json.data as T;
}

function formatDateFromAniList(date?: { year?: number | null; month?: number | null; day?: number | null }): string | null {
  if (!date?.year) return null;
  const m = date.month ? String(date.month).padStart(2, "0") : "01";
  const d = date.day ? String(date.day).padStart(2, "0") : "01";
  return `${date.year}-${m}-${d}`;
}

function mapStatus(status?: string | null, isManga = false): string {
  switch (status) {
    case "RELEASING":
      return isManga ? "Publishing" : "Airing";
    case "FINISHED":
      return "Finished";
    case "NOT_YET_RELEASED":
      return "Upcoming";
    case "CANCELLED":
      return "Cancelled";
    case "HIATUS":
      return "Hiatus";
    default:
      return status || "Unknown";
  }
}

export function toAnimeSummary(item: AniListMedia): MediaSummary {
  const title = item.title.english || item.title.romaji || item.title.userPreferred || "Untitled";
  const dateStr = formatDateFromAniList(item.startDate);
  return {
    type: "anime",
    id: item.id,
    title,
    originalTitle: item.title.romaji || item.title.native || null,
    posterPath: item.coverImage.extraLarge || item.coverImage.large || item.coverImage.medium || null,
    backdropPath: item.bannerImage || null,
    date: dateStr,
    year: item.seasonYear || item.startDate?.year || null,
    genres: item.genres || [],
    overview: (item.description || "").replace(/<[^>]*>/g, ""),
    score: item.averageScore ?? null,
    voteCount: item.popularity || 0,
    popularity: item.popularity || 0,
    originalLanguage: item.countryOfOrigin === "KR" ? "ko" : item.countryOfOrigin === "CN" ? "zh" : "ja",
  };
}

export function toMangaSummary(item: AniListMedia): MediaSummary {
  const title = item.title.english || item.title.romaji || item.title.userPreferred || "Untitled";
  const dateStr = formatDateFromAniList(item.startDate);
  return {
    type: "manga",
    id: item.id,
    title,
    originalTitle: item.title.romaji || item.title.native || null,
    posterPath: item.coverImage.extraLarge || item.coverImage.large || item.coverImage.medium || null,
    backdropPath: item.bannerImage || null,
    date: dateStr,
    year: item.startDate?.year || null,
    genres: item.genres || [],
    overview: (item.description || "").replace(/<[^>]*>/g, ""),
    score: item.averageScore ?? null,
    voteCount: item.popularity || 0,
    popularity: item.popularity || 0,
    originalLanguage: item.countryOfOrigin === "KR" ? "ko" : item.countryOfOrigin === "CN" ? "zh" : "ja",
  };
}

const MEDIA_LIST_FRAGMENT = `
  id
  title { romaji english native userPreferred }
  coverImage { extraLarge large medium }
  bannerImage
  format
  status
  description
  startDate { year month day }
  seasonYear
  genres
  averageScore
  popularity
  countryOfOrigin
`;

/* ------------------------------------------------------------------------- */
/*                                   Anime                                   */
/* ------------------------------------------------------------------------- */

export async function getTrendingAnime(page = 1, perPage = 20): Promise<Paged<MediaSummary>> {
  const query = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo { total currentPage hasNextPage }
        media(type: ANIME, sort: TRENDING_DESC, isAdult: false) {
          ${MEDIA_LIST_FRAGMENT}
        }
      }
    }
  `;
  const data = await anilistQuery<{ Page: { pageInfo: { total: number; hasNextPage: boolean }; media: AniListMedia[] } }>(query, { page, perPage });
  return {
    page,
    totalPages: data.Page.pageInfo.hasNextPage ? page + 1 : page,
    totalResults: data.Page.pageInfo.total,
    results: data.Page.media.map(toAnimeSummary),
  };
}

export async function getPopularAnime(page = 1, perPage = 20): Promise<Paged<MediaSummary>> {
  const query = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo { total currentPage hasNextPage }
        media(type: ANIME, sort: POPULARITY_DESC, isAdult: false) {
          ${MEDIA_LIST_FRAGMENT}
        }
      }
    }
  `;
  const data = await anilistQuery<{ Page: { pageInfo: { total: number; hasNextPage: boolean }; media: AniListMedia[] } }>(query, { page, perPage });
  return {
    page,
    totalPages: data.Page.pageInfo.hasNextPage ? page + 1 : page,
    totalResults: data.Page.pageInfo.total,
    results: data.Page.media.map(toAnimeSummary),
  };
}

export async function getTopRatedAnime(page = 1, perPage = 20): Promise<Paged<MediaSummary>> {
  const query = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo { total currentPage hasNextPage }
        media(type: ANIME, sort: SCORE_DESC, isAdult: false) {
          ${MEDIA_LIST_FRAGMENT}
        }
      }
    }
  `;
  const data = await anilistQuery<{ Page: { pageInfo: { total: number; hasNextPage: boolean }; media: AniListMedia[] } }>(query, { page, perPage });
  return {
    page,
    totalPages: data.Page.pageInfo.hasNextPage ? page + 1 : page,
    totalResults: data.Page.pageInfo.total,
    results: data.Page.media.map(toAnimeSummary),
  };
}

export async function getAiringAnime(page = 1, perPage = 20): Promise<Paged<MediaSummary>> {
  const query = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo { total currentPage hasNextPage }
        media(type: ANIME, status: RELEASING, sort: POPULARITY_DESC, isAdult: false) {
          ${MEDIA_LIST_FRAGMENT}
        }
      }
    }
  `;
  const data = await anilistQuery<{ Page: { pageInfo: { total: number; hasNextPage: boolean }; media: AniListMedia[] } }>(query, { page, perPage });
  return {
    page,
    totalPages: data.Page.pageInfo.hasNextPage ? page + 1 : page,
    totalResults: data.Page.pageInfo.total,
    results: data.Page.media.map(toAnimeSummary),
  };
}

export async function getAnimeMovies(page = 1, perPage = 20): Promise<Paged<MediaSummary>> {
  const query = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo { total currentPage hasNextPage }
        media(type: ANIME, format: MOVIE, sort: POPULARITY_DESC, isAdult: false) {
          ${MEDIA_LIST_FRAGMENT}
        }
      }
    }
  `;
  const data = await anilistQuery<{ Page: { pageInfo: { total: number; hasNextPage: boolean }; media: AniListMedia[] } }>(query, { page, perPage });
  return {
    page,
    totalPages: data.Page.pageInfo.hasNextPage ? page + 1 : page,
    totalResults: data.Page.pageInfo.total,
    results: data.Page.media.map(toAnimeSummary),
  };
}

export async function searchAnime(
  queryStr?: string,
  filters: { genre?: string; year?: number; sort?: string; format?: string; status?: string } = {},
  page = 1,
  perPage = 20,
): Promise<Paged<MediaSummary>> {
  const query = `
    query ($page: Int, $perPage: Int, $search: String, $genre: String, $year: Int, $sort: [MediaSort], $format: MediaFormat, $status: MediaStatus) {
      Page(page: $page, perPage: $perPage) {
        pageInfo { total currentPage hasNextPage }
        media(type: ANIME, search: $search, genre: $genre, seasonYear: $year, sort: $sort, format: $format, status: $status, isAdult: false) {
          ${MEDIA_LIST_FRAGMENT}
        }
      }
    }
  `;

  let sortEnum = "POPULARITY_DESC";
  if (filters.sort === "score") sortEnum = "SCORE_DESC";
  else if (filters.sort === "newest") sortEnum = "START_DATE_DESC";
  else if (filters.sort === "oldest") sortEnum = "START_DATE";
  else if (filters.sort === "title") sortEnum = "TITLE_ROMAJI";
  else if (filters.sort === "trending") sortEnum = "TRENDING_DESC";

  const variables: Record<string, unknown> = {
    page,
    perPage,
    sort: [sortEnum],
  };

  if (queryStr) variables.search = queryStr;
  if (filters.genre) variables.genre = filters.genre;
  if (filters.year) variables.year = filters.year;
  if (filters.format) variables.format = filters.format;
  if (filters.status) variables.status = filters.status;

  const data = await anilistQuery<{ Page: { pageInfo: { total: number; hasNextPage: boolean }; media: AniListMedia[] } }>(query, variables);
  return {
    page,
    totalPages: data.Page.pageInfo.hasNextPage ? page + 1 : page,
    totalResults: data.Page.pageInfo.total,
    results: data.Page.media.map(toAnimeSummary),
  };
}

export async function getAnimeDetails(id: number): Promise<MediaDetails | null> {
  const query = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        id
        title { romaji english native userPreferred }
        coverImage { extraLarge large medium }
        bannerImage
        format
        status
        description
        startDate { year month day }
        endDate { year month day }
        season
        seasonYear
        episodes
        duration
        countryOfOrigin
        genres
        averageScore
        popularity
        trailer { id site }
        nextAiringEpisode { episode airingAt }
        studios(isMain: true) { nodes { id name } }
        characters(sort: [ROLE, RELEVANCE], perPage: 12) {
          edges {
            role
            node { id name { full: userPreferred } image { large } }
            voiceActors(language: JAPANESE) {
              id
              name { full: userPreferred }
              image { large }
            }
          }
        }
        staff(perPage: 8) {
          edges {
            role
            node { id name { full: userPreferred } image { large } }
          }
        }
        recommendations(perPage: 10) {
          nodes {
            mediaRecommendation {
              ${MEDIA_LIST_FRAGMENT}
            }
          }
        }
      }
    }
  `;

  try {
    const data = await anilistQuery<{ Media: AniListMedia }>(query, { id });
    const item = data.Media;
    if (!item) return null;

    const summary = toAnimeSummary(item);
    const endDateStr = formatDateFromAniList(item.endDate);

    const cast: CastMember[] = (item.characters?.edges || []).map((edge) => {
      const va = edge.voiceActors?.[0];
      return {
        id: va ? va.id : edge.node.id,
        name: va ? va.name.full : edge.node.name.full,
        character: edge.node.name.full,
        profilePath: va?.image?.large || edge.node.image?.large || null,
        episodes: null,
      };
    });

    const crew: CrewMember[] = (item.staff?.edges || []).map((edge) => ({
      id: edge.node.id,
      name: edge.node.name.full,
      jobs: [edge.role],
      department: "Staff",
      profilePath: edge.node.image?.large || null,
      episodes: null,
    }));

    const studios = (item.studios?.nodes || []).map((s) => s.name);

    let nextEpisode = null;
    if (item.nextAiringEpisode) {
      const airDate = new Date(item.nextAiringEpisode.airingAt * 1000).toISOString().slice(0, 10);
      nextEpisode = {
        season: 1,
        episode: item.nextAiringEpisode.episode,
        name: `Episode ${item.nextAiringEpisode.episode}`,
        airDate,
      };
    }

    const recommendations = (item.recommendations?.nodes || [])
      .map((n) => n.mediaRecommendation)
      .filter((m): m is AniListMedia => Boolean(m))
      .map(toAnimeSummary);

    return {
      ...summary,
      tagline: item.season ? `${item.season} ${item.seasonYear || ""}`.trim() : null,
      format: item.format || "TV",
      status: mapStatus(item.status),
      rawStatus: item.status || null,
      endDate: endDateStr,
      runtime: item.duration || null,
      episodes: item.episodes || null,
      seasons: 1,
      seasonList: [],
      studios,
      networks: [],
      countries: [item.countryOfOrigin || "JP"],
      languages: [item.countryOfOrigin === "KR" ? "Korean" : item.countryOfOrigin === "CN" ? "Chinese" : "Japanese"],
      certification: null,
      budget: null,
      revenue: null,
      homepage: null,
      nextEpisode,
      lastEpisode: null,
      creators: crew.slice(0, 3).map((c) => ({ id: c.id, name: c.name, profilePath: c.profilePath })),
      cast,
      crew,
      videos: [],
      trailer: item.trailer?.id && item.trailer?.site === "youtube" ? { key: item.trailer.id, name: "Trailer" } : null,
      recommendations,
      similar: [],
      collection: null,
      keywords: item.genres,
      externalIds: { imdb: null, tvdb: null, wikidata: null, instagram: null, twitter: null, facebook: null },
      watch: null,
    };
  } catch (err) {
    console.error("Failed to fetch AniList anime details:", err);
    return null;
  }
}

/* ------------------------------------------------------------------------- */
/*                                   Manga                                   */
/* ------------------------------------------------------------------------- */

export async function getTrendingManga(page = 1, perPage = 20): Promise<Paged<MediaSummary>> {
  const query = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo { total currentPage hasNextPage }
        media(type: MANGA, sort: TRENDING_DESC, isAdult: false) {
          ${MEDIA_LIST_FRAGMENT}
        }
      }
    }
  `;
  const data = await anilistQuery<{ Page: { pageInfo: { total: number; hasNextPage: boolean }; media: AniListMedia[] } }>(query, { page, perPage });
  return {
    page,
    totalPages: data.Page.pageInfo.hasNextPage ? page + 1 : page,
    totalResults: data.Page.pageInfo.total,
    results: data.Page.media.map(toMangaSummary),
  };
}

export async function getPopularManga(page = 1, perPage = 20): Promise<Paged<MediaSummary>> {
  const query = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo { total currentPage hasNextPage }
        media(type: MANGA, sort: POPULARITY_DESC, isAdult: false) {
          ${MEDIA_LIST_FRAGMENT}
        }
      }
    }
  `;
  const data = await anilistQuery<{ Page: { pageInfo: { total: number; hasNextPage: boolean }; media: AniListMedia[] } }>(query, { page, perPage });
  return {
    page,
    totalPages: data.Page.pageInfo.hasNextPage ? page + 1 : page,
    totalResults: data.Page.pageInfo.total,
    results: data.Page.media.map(toMangaSummary),
  };
}

export async function getTopRatedManga(page = 1, perPage = 20): Promise<Paged<MediaSummary>> {
  const query = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo { total currentPage hasNextPage }
        media(type: MANGA, sort: SCORE_DESC, isAdult: false) {
          ${MEDIA_LIST_FRAGMENT}
        }
      }
    }
  `;
  const data = await anilistQuery<{ Page: { pageInfo: { total: number; hasNextPage: boolean }; media: AniListMedia[] } }>(query, { page, perPage });
  return {
    page,
    totalPages: data.Page.pageInfo.hasNextPage ? page + 1 : page,
    totalResults: data.Page.pageInfo.total,
    results: data.Page.media.map(toMangaSummary),
  };
}

export async function getTopManhwa(page = 1, perPage = 20): Promise<Paged<MediaSummary>> {
  const query = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo { total currentPage hasNextPage }
        media(type: MANGA, countryOfOrigin: "KR", sort: POPULARITY_DESC, isAdult: false) {
          ${MEDIA_LIST_FRAGMENT}
        }
      }
    }
  `;
  const data = await anilistQuery<{ Page: { pageInfo: { total: number; hasNextPage: boolean }; media: AniListMedia[] } }>(query, { page, perPage });
  return {
    page,
    totalPages: data.Page.pageInfo.hasNextPage ? page + 1 : page,
    totalResults: data.Page.pageInfo.total,
    results: data.Page.media.map(toMangaSummary),
  };
}

export async function getLightNovels(page = 1, perPage = 20): Promise<Paged<MediaSummary>> {
  const query = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo { total currentPage hasNextPage }
        media(type: MANGA, format: NOVEL, sort: POPULARITY_DESC, isAdult: false) {
          ${MEDIA_LIST_FRAGMENT}
        }
      }
    }
  `;
  const data = await anilistQuery<{ Page: { pageInfo: { total: number; hasNextPage: boolean }; media: AniListMedia[] } }>(query, { page, perPage });
  return {
    page,
    totalPages: data.Page.pageInfo.hasNextPage ? page + 1 : page,
    totalResults: data.Page.pageInfo.total,
    results: data.Page.media.map(toMangaSummary),
  };
}

export async function searchManga(
  queryStr?: string,
  filters: { genre?: string; year?: number; sort?: string; format?: string; status?: string; country?: string } = {},
  page = 1,
  perPage = 20,
): Promise<Paged<MediaSummary>> {
  const query = `
    query ($page: Int, $perPage: Int, $search: String, $genre: String, $startDateLike: String, $sort: [MediaSort], $format: MediaFormat, $status: MediaStatus, $country: CountryCode) {
      Page(page: $page, perPage: $perPage) {
        pageInfo { total currentPage hasNextPage }
        media(type: MANGA, search: $search, genre: $genre, startDate_like: $startDateLike, sort: $sort, format: $format, status: $status, countryOfOrigin: $country, isAdult: false) {
          ${MEDIA_LIST_FRAGMENT}
        }
      }
    }
  `;

  let sortEnum = "POPULARITY_DESC";
  if (filters.sort === "score") sortEnum = "SCORE_DESC";
  else if (filters.sort === "newest") sortEnum = "START_DATE_DESC";
  else if (filters.sort === "oldest") sortEnum = "START_DATE";
  else if (filters.sort === "title") sortEnum = "TITLE_ROMAJI";
  else if (filters.sort === "trending") sortEnum = "TRENDING_DESC";

  const variables: Record<string, unknown> = {
    page,
    perPage,
    sort: [sortEnum],
  };

  if (queryStr) variables.search = queryStr;
  if (filters.genre) variables.genre = filters.genre;
  if (filters.year) variables.startDateLike = `${filters.year}%`;
  if (filters.format) variables.format = filters.format;
  if (filters.status) variables.status = filters.status;
  if (filters.country) variables.country = filters.country;

  const data = await anilistQuery<{ Page: { pageInfo: { total: number; hasNextPage: boolean }; media: AniListMedia[] } }>(query, variables);
  return {
    page,
    totalPages: data.Page.pageInfo.hasNextPage ? page + 1 : page,
    totalResults: data.Page.pageInfo.total,
    results: data.Page.media.map(toMangaSummary),
  };
}

export async function getMangaDetails(id: number): Promise<MediaDetails | null> {
  const query = `
    query ($id: Int) {
      Media(id: $id, type: MANGA) {
        id
        title { romaji english native userPreferred }
        coverImage { extraLarge large medium }
        bannerImage
        format
        status
        description
        startDate { year month day }
        endDate { year month day }
        chapters
        volumes
        countryOfOrigin
        genres
        averageScore
        popularity
        characters(sort: [ROLE, RELEVANCE], perPage: 12) {
          edges {
            role
            node { id name { full: userPreferred } image { large } }
          }
        }
        staff(perPage: 8) {
          edges {
            role
            node { id name { full: userPreferred } image { large } }
          }
        }
        recommendations(perPage: 10) {
          nodes {
            mediaRecommendation {
              ${MEDIA_LIST_FRAGMENT}
            }
          }
        }
      }
    }
  `;

  try {
    const data = await anilistQuery<{ Media: AniListMedia }>(query, { id });
    const item = data.Media;
    if (!item) return null;

    const summary = toMangaSummary(item);
    const endDateStr = formatDateFromAniList(item.endDate);

    const cast: CastMember[] = (item.characters?.edges || []).map((edge) => ({
      id: edge.node.id,
      name: edge.node.name.full,
      character: edge.role,
      profilePath: edge.node.image?.large || null,
      episodes: null,
    }));

    const crew: CrewMember[] = (item.staff?.edges || []).map((edge) => ({
      id: edge.node.id,
      name: edge.node.name.full,
      jobs: [edge.role],
      department: "Author / Artist",
      profilePath: edge.node.image?.large || null,
      episodes: null,
    }));

    const recommendations = (item.recommendations?.nodes || [])
      .map((n) => n.mediaRecommendation)
      .filter((m): m is AniListMedia => Boolean(m))
      .map(toMangaSummary);

    const formatLabel =
      item.format === "NOVEL"
        ? "Light Novel"
        : item.format === "ONE_SHOT"
          ? "One Shot"
          : item.countryOfOrigin === "KR"
            ? "Manhwa"
            : item.countryOfOrigin === "CN"
              ? "Manhua"
              : "Manga";

    return {
      ...summary,
      tagline: item.volumes ? `${item.volumes} Volumes` : null,
      format: formatLabel,
      status: mapStatus(item.status, true),
      rawStatus: item.status || null,
      endDate: endDateStr,
      runtime: null,
      episodes: item.chapters || null,
      chapters: item.chapters || null,
      volumes: item.volumes || null,
      seasons: null,
      seasonList: [],
      studios: [],
      networks: [],
      countries: [item.countryOfOrigin || "JP"],
      languages: [item.countryOfOrigin === "KR" ? "Korean" : item.countryOfOrigin === "CN" ? "Chinese" : "Japanese"],
      certification: null,
      budget: null,
      revenue: null,
      homepage: null,
      nextEpisode: null,
      lastEpisode: null,
      creators: crew.slice(0, 3).map((c) => ({ id: c.id, name: c.name, profilePath: c.profilePath })),
      cast,
      crew,
      videos: [],
      trailer: null,
      recommendations,
      similar: [],
      collection: null,
      keywords: item.genres,
      externalIds: { imdb: null, tvdb: null, wikidata: null, instagram: null, twitter: null, facebook: null },
      watch: null,
    };
  } catch (err) {
    console.error("Failed to fetch AniList manga details:", err);
    return null;
  }
}
