export interface BannerPreset {
  id: string;
  name: string;
  category: "Cinema" | "Anime" | "Games" | "Sci-Fi" | "Books" | "Aesthetic";
  url: string;
}

export interface AvatarPreset {
  id: string;
  name: string;
  url: string;
}

export const BANNER_PRESETS: BannerPreset[] = [
  {
    id: "blade-runner",
    name: "Cyberpunk Neon",
    category: "Sci-Fi",
    url: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1700&q=80",
  },
  {
    id: "cinema-theater",
    name: "Classic Cinema",
    category: "Cinema",
    url: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1700&q=80",
  },
  {
    id: "ghibli-sky",
    name: "Anime Sunset Sky",
    category: "Anime",
    url: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1700&q=80",
  },
  {
    id: "retro-arcade",
    name: "Arcade Glow",
    category: "Games",
    url: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1700&q=80",
  },
  {
    id: "cozy-library",
    name: "Old Library",
    category: "Books",
    url: "https://images.unsplash.com/photo-1507842229453-7e37be2161b5?auto=format&fit=crop&w=1700&q=80",
  },
  {
    id: "synthwave-grid",
    name: "Synthwave Horizon",
    category: "Aesthetic",
    url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1700&q=80",
  },
  {
    id: "tokyo-night",
    name: "Tokyo Rain",
    category: "Anime",
    url: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1700&q=80",
  },
  {
    id: "dark-minimal",
    name: "Dark Horizon",
    category: "Aesthetic",
    url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1700&q=80",
  },
];

export const AVATAR_PRESETS: AvatarPreset[] = [
  {
    id: "shinobi",
    name: "Shinobi",
    url: "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=300&h=300&q=80",
  },
  {
    id: "cyber",
    name: "Cyber Gaze",
    url: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=300&h=300&q=80",
  },
  {
    id: "astro",
    name: "Spaceman",
    url: "https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?auto=format&fit=crop&w=300&h=300&q=80",
  },
  {
    id: "neon-cat",
    name: "Neon Silhouette",
    url: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=300&h=300&q=80",
  },
  {
    id: "retro-pilot",
    name: "Aviator",
    url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&h=300&q=80",
  },
  {
    id: "monochrome",
    name: "Noir Silhouette",
    url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&h=300&q=80",
  },
];
