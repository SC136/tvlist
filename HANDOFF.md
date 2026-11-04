# Omnilist — Context & Architecture Handoff

## 1. Project Overview
Omnilist (formerly `tvlist`) is an all-in-one social entertainment tracker uniting AniList's list management, profile customizer, and social feed with Letterboxd's diary, reviews, and community features across **7 media categories**:
1. **Movies** (TMDB)
2. **TV Shows** (TMDB)
3. **Anime** (AniList GraphQL, TMDB fallback)
4. **Manga** (AniList GraphQL — Manga, Manhwa, Light Novels)
5. **Books** (Open Library API)
6. **Music** (Apple Music / iTunes API with 30s playable audio previews)
7. **Video Games** (RAWG API + Steam cover CDN + offline fallback)

---

## 2. Core Tech Stack
- **Framework**: Next.js 16.3.8 (App Router, Turbopack, React 19).
- **Language**: TypeScript 5.
- **Styling**: Tailwind CSS 4 (`@tailwindcss/postcss`).
- **Database & ORM**: Drizzle ORM (`drizzle-orm`, `drizzle-kit`) with Postgres (`postgres` driver).
  - **Production DB**: Neon serverless Postgres (`DATABASE_URL`).
  - **Local Development**: If `DATABASE_URL` is unset in `.env.local`, `scripts/dev.mjs` spins up an embedded PGlite instance (`@electric-sql/pglite`) in `.data/pglite` on port 54329 and runs migrations automatically.
- **Authentication**: Better Auth (`better-auth`) with `username` and `nextCookies` plugins.
  - Hashing: `better-auth/crypto` (`scrypt`).
  - Supports username and email login, session caching, password strength validation, and `/forgot-password` token reset.

---

## 3. Critical Architecture & Routing

### Media Loading Architecture
- `src/lib/media.ts`: Single source of truth for types (`MediaType`, `MediaCategory`, `MediaDetails`, `MediaSummary`, `Paged`).
- `src/lib/media-loader.ts`: Central dispatcher function `fetchUnifiedMediaDetails(type, id, region)`. Routes to:
  - `movie` / `tv` -> `src/lib/tmdb/index.ts`
  - `anime` / `manga` -> `src/lib/anilist/index.ts`
  - `game` -> `src/lib/games/index.ts`
  - `book` -> `src/lib/books/index.ts`
  - `music` -> `src/lib/music/index.ts`
- `src/lib/queries/media-page.ts`: Server-side request-cached data fetcher `getMediaPage(type, id)`. Resolves media details, viewer state, user list entry, favorite status, and community stats in parallel.

### Media Routing
- `src/app/[type]/[id]/layout.tsx`: Universal layout for all 7 media types. Immersive ambient backdrop hero, poster card, action bar (`AddToList`, `MediaActions`), and pill-style navigation tabs (`Overview`, `Cast` [movies/TV/anime], `Characters` [manga], `Crew`/`Staff`, `Stats`, `Social`, `Reviews`).
- `src/app/[type]/[id]/page.tsx`: Overview tab rendering synopsis, game screenshots, music tracklists with `<audio>` previews, trailers, recommendations, and reviews.

### Search Routing
- `src/app/search/page.tsx`: Universal search (`/search?q=...`) executing concurrent queries across all 7 media types, people, and community members. Category filter tabs with live counts (`All`, `Movies`, `TV`, `Anime`, `Manga`, `Books`, `Music`, `Games`, `People`, `Users`).
- `src/app/search/[type]/page.tsx`: Deep browse by category with curated sub-lists (`trending`, `top_rated`, `airing`, `new`, etc.) and filters (`src/components/media/browse-filters.tsx`).
- `src/app/api/search/route.ts`: Quick search JSON endpoint powering `QuickSearch` modal (`Ctrl+K` or `/`).

### User Profiles & Lists
- `src/app/user/[username]/layout.tsx`: Profile shell with customizable banner, avatar, headline/quote, location, website link, and palette tinting.
- `src/app/user/[username]/[movielist|tvlist|animelist|mangalist|booklist|musiclist|gamelist]/page.tsx`: Type-specific user lists rendering `UserListView`.
- `src/app/user/[username]/diary/page.tsx`: Letterboxd-style chronological viewing/reading/playing diary.
- `src/app/user/[username]/stats/page.tsx`: Deep user statistics across categories (hours/days watched, pages read, track counts, score distributions, creators, studios).

---

## 4. Key Gotchas & Domain Quirks

1. **ISP Blocking on TMDB**:
   - `api.themoviedb.org` is DNS-blocked/sinkholed by several Indian ISPs.
   - `src/lib/tmdb/index.ts` uses `https://api.tmdb.org/3` as primary endpoint (CloudFront CDN) with automatic fallback.
   - Poster images proxy through Next.js rewrites: `/img/tmdb/*` -> `https://image.tmdb.org/t/p/*` to avoid browser image timeouts.

2. **RAWG Image CDN**:
   - RAWG rotating hashes causes 404s for older images.
   - Game images proxy via `/img/rawg/*` -> `https://media.rawg.io/media/*`.
   - Curated fallback games in `src/lib/games/mock-games.ts` use stable Steam CDN URLs (`shared.cloudflare.steamstatic.com`).

3. **AniList Anime vs TMDB Anime Separation**:
   - TMDB includes anime under `/tv` and `/movie`.
   - `isAnimeMedia()` in `src/lib/media.ts` filters out East Asian animated titles (`ja`, `zh`, `ko`, `JP`, `CN`, `KR`) from movie and TV lists, routing them strictly to Anime.
   - If AniList GraphQL API undergoes temporary outages (e.g. 403 status issues), `searchTmdbAnime` in `src/lib/tmdb/index.ts` acts as search fallback.

4. **Postgres ID Sizes**:
   - `media.tmdb_id` is typed as `bigint` in `src/db/schema.ts` (`integer` is insufficient for 10-digit Apple Music IDs).

5. **Database Enums**:
   - `media_type`: `['movie', 'tv', 'anime', 'game', 'manga', 'book', 'music']`
   - `forum_category`: `['GENERAL', 'MOVIES', 'TV', 'ANIME', 'MANGA', 'GAMES', 'BOOKS', 'MUSIC', 'EPISODE_DISCUSSION', 'RECOMMENDATIONS', 'NEWS', 'SITE_FEEDBACK', 'OFF_TOPIC']`

6. **MyAnimeList XML Import Dates**:
   - MAL XML exports often output `'0000-00-00'` for incomplete dates.
   - `cleanDateSchema` in `src/actions/import.ts` sanitizes this to `null` before Drizzle database queries, preventing Postgres date range errors.

---

## 5. Development & Verification Commands

```bash
# Install dependencies
pnpm install

# Start local development (runs Next.js on port 3000)
pnpm dev

# Type checking
pnpm typecheck

# Drizzle schema migrations
pnpm db:generate
pnpm db:migrate
```

---

## 6. Environment Variables (`.env.local`)
```env
TMDB_API_KEY=<Bearer token or v3 key>
RAWG_API_KEY=<RAWG API Key>
DATABASE_URL=postgresql://... (Neon connection string; omit to use embedded PGlite)
BETTER_AUTH_SECRET=<32+ char secret>
BETTER_AUTH_URL=http://localhost:3000
```

---

## 7. Working Conventions & User Rules
- **No unsolicited git push**: Only commit locally; do NOT push to remote origin unless the user explicitly prompts to push.
- **Browser Automation**: Do not run automated browsers to test without asking the user first.
- **Style**: Terse, direct, no pleasantries or filler. State the thing, action, reason, and next step.
