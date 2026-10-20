import type { ForumCategory } from "@/db/schema";

export const FORUM_CATEGORIES: { key: ForumCategory; label: string; description: string; color: string }[] = [
  { key: "GENERAL", label: "General", description: "General community discussion", color: "#6b8afd" },
  { key: "MOVIES", label: "Movies", description: "Discuss films, old and new", color: "#a06bf0" },
  { key: "TV", label: "TV", description: "Talk about series and seasons", color: "#2fbf8a" },
  { key: "ANIME", label: "Anime", description: "Seasonal anime and Japanese animation", color: "#ec6fb0" },
  { key: "MANGA", label: "Manga", description: "Manga, manhwa, light novels and webtoons", color: "#f97316" },
  { key: "BOOKS", label: "Books", description: "Novels, literature, fiction and non-fiction", color: "#0ea5e9" },
  { key: "MUSIC", label: "Music", description: "Albums, artists, tracks and music discussion", color: "#a855f7" },
  { key: "GAMES", label: "Games", description: "Video games, releases, and gameplay", color: "#e08a1e" },
  { key: "EPISODE_DISCUSSION", label: "Episode Discussion", description: "Episode-by-episode threads", color: "#3aa6b8" },
  { key: "RECOMMENDATIONS", label: "Recommendations", description: "Ask for and share recommendations", color: "#ef5f7a" },
  { key: "NEWS", label: "News", description: "Announcements, trailers and industry news", color: "#f59e0b" },
  { key: "SITE_FEEDBACK", label: "Site Feedback", description: "Bugs, ideas and feedback for Omnilist", color: "#7c8aa0" },
  { key: "OFF_TOPIC", label: "Off-Topic", description: "Everything else", color: "#64748b" },
];

export function categoryInfo(key: string) {
  return FORUM_CATEGORIES.find((c) => c.key === key) ?? FORUM_CATEGORIES[0];
}
