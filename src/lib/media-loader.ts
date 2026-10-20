import "server-only";
import type { MediaDetails, MediaType } from "@/lib/media";
import { getMediaDetails as getTmdbMediaDetails } from "@/lib/tmdb";
import { getAnimeDetails, getMangaDetails } from "@/lib/anilist";
import { getGameDetails } from "@/lib/games";
import { getBookDetails } from "@/lib/books";
import { getMusicDetails } from "@/lib/music";

export async function fetchUnifiedMediaDetails(type: MediaType, id: number, region = "US"): Promise<MediaDetails | null> {
  if (type === "anime") {
    return getAnimeDetails(id);
  }
  if (type === "manga") {
    return getMangaDetails(id);
  }
  if (type === "game") {
    return getGameDetails(id);
  }
  if (type === "book") {
    return getBookDetails(id);
  }
  if (type === "music") {
    return getMusicDetails(id);
  }
  return getTmdbMediaDetails(type, id, region);
}
