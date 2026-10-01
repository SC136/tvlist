import type { ForumCategory } from "@/db/schema";

export const FORUM_CATEGORIES: { key: ForumCategory; label: string; description: string; color: string }[] = [
  { key: "GENERAL", label: "General", description: "Anything movie or TV related", color: "#6b8afd" },
  { key: "MOVIES", label: "Movies", description: "Discuss films, old and new", color: "#a06bf0" },
  { key: "TV", label: "TV", description: "Talk about series and seasons", color: "#2fbf8a" },
  { key: "EPISODE_DISCUSSION", label: "Episode Discussion", description: "Episode-by-episode threads", color: "#e08a1e" },
  { key: "RECOMMENDATIONS", label: "Recommendations", description: "Ask for and share recommendations", color: "#ec6fb0" },
  { key: "NEWS", label: "News", description: "Announcements, trailers and industry news", color: "#ef5f7a" },
  { key: "SITE_FEEDBACK", label: "Site Feedback", description: "Bugs, ideas and feedback for tvlist", color: "#7c8aa0" },
  { key: "OFF_TOPIC", label: "Off-Topic", description: "Everything else", color: "#3aa6b8" },
];

export function categoryInfo(key: string) {
  return FORUM_CATEGORIES.find((c) => c.key === key) ?? FORUM_CATEGORIES[0];
}
