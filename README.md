# Omnilist

A unified social tracker for **movies, TV shows, anime, manga, books, music and video games**: lists with progress and scores, an experience diary, reviews, custom lists, deep stats, and a community feed.

- **Lists**: Watching / Reading / Playing / Listening / Planning / Completed / Rewatching / Paused / Dropped, with episode/chapter/page progress, dates, rewatches, private notes and five scoring systems (100, 10.0, 10, 5 stars, smileys)
- **Diary**: log every viewing, reading, listening or playthrough with a date, rating, like and rewatch/reread/relisten/replay (Letterboxd style)
- **Reviews** with helpfulness voting, **custom ranked lists**, **favourites** across all 7 media types
- **Social**: activity feed, status posts, profile messages, likes, replies, @mentions, follows, notifications
- **Profiles**: banner, avatar, profile colour, activity heatmap, and a full stats page (genres, creators, studios, release/experience years)
- **Discovery**: trending / airing / top-rated across movies, TV, anime, manga, books, music and games with rich filters, airing schedule, "where to watch"
- **Forum** with categories (Movies, TV, Anime, Manga, Books, Music, Games, etc.), threads linked to titles, nested comments, pin/lock for moderators
- **Letterboxd import** (diary/ratings/watched/watchlist CSVs) and full JSON export
- Light and dark modes with **seven colour palettes** users can switch between, mobile friendly

Media data provided by [TMDB](https://www.themoviedb.org/) (Movies & TV), [AniList](https://anilist.co/) (Anime & Manga), [Open Library](https://openlibrary.org/) (Books), [Apple Music / iTunes](https://www.apple.com/itunes/) (Music), and [RAWG](https://rawg.io/) / Steam (Games).

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Postgres + Drizzle ORM · Better Auth · TMDB API

## Run it locally

Requires Node 20.9+ and [pnpm](https://pnpm.io/installation) (`corepack enable` is the easiest way to get the pinned version).

```bash
pnpm install
cp .env.example .env.local     # then fill in TMDB_API_KEY and BETTER_AUTH_SECRET
pnpm dev
```

`pnpm dev` starts an **embedded Postgres** (stored in `.data/`) when `DATABASE_URL` is empty, so you need no Docker or cloud account to develop. Set `DATABASE_URL` to use a real Postgres instead.

Without a `TMDB_API_KEY` the site runs on a small built-in demo catalog. Get a free key at <https://www.themoviedb.org/settings/api> (use the **API Read Access Token**).

| Command | What it does |
| --- | --- |
| `pnpm dev` | Dev server (+ local database if `DATABASE_URL` is empty) |
| `pnpm build` / `pnpm start` | Production build / server |
| `pnpm typecheck` / `pnpm lint` | Checks |
| `pnpm db:generate` | Generate a SQL migration after editing `src/db/schema.ts` |
| `pnpm db:migrate` | Apply migrations to `DATABASE_URL` |

## Deploy to Vercel (free)

**Hosting: Vercel** (free Hobby plan) · **Database: Neon** (free Postgres) · **Data: TMDB** (free key).

1. **Database.** Create a project at <https://neon.com> and copy the **pooled** connection string of its default (`main`) branch.
   (Tip: keep `main` for production and use a separate Neon branch, such as `dev`, for local development and Vercel *Preview* deployments.)
2. **Import the repo** at <https://vercel.com/new>. The framework (Next.js), build command (`vercel-build`) and region are picked up from `package.json` and `vercel.json`.
3. **Set environment variables** (Project → Settings → Environment Variables):

   | Variable | Value | Required |
   | --- | --- | --- |
   | `DATABASE_URL` | Neon **pooled** connection string | yes |
   | `TMDB_API_KEY` | TMDB API Read Access Token (<https://www.themoviedb.org/settings/api>) | yes (without it the site shows a tiny demo catalog) |
   | `BETTER_AUTH_SECRET` | random 32+ chars: `openssl rand -base64 32` | yes |
   | `CRON_SECRET` | random string: `openssl rand -hex 32` | yes (the daily job refuses to run without it) |
   | `BETTER_AUTH_URL` | `https://your-domain`, **Production only** | only for a custom domain; Vercel URLs are detected automatically |
   | `DATABASE_URL_UNPOOLED` | Neon direct connection string | optional (derived from `DATABASE_URL` otherwise) |
   | `GOOGLE_CLIENT_ID/SECRET`, `DISCORD_CLIENT_ID/SECRET` | OAuth app credentials | optional: enables those sign-in buttons |
   | `BLOB_READ_WRITE_TOKEN` | Vercel Blob token | optional: enables avatar/banner uploads |

4. **Deploy.** On every **production** deploy the build first applies pending database migrations (`drizzle/`) and fails the deploy if one breaks, so a bad schema never goes live. Preview deploys never touch the database unless you set `RUN_MIGRATIONS=1`.
5. **Daily job.** `vercel.json` schedules `/api/cron/refresh` (06:00 UTC). It sends "new episode aired" notifications and refreshes airing shows. Vercel authenticates it automatically with `CRON_SECRET`.

To apply migrations by hand instead: `DATABASE_URL="postgres://…" pnpm db:migrate`.

### Which database? (it won't go to sleep for good)

| Option | Free-tier behaviour |
| --- | --- |
| **Neon** (recommended) | Compute suspends after 5 idle minutes and **wakes automatically in ~0.5 s** on the next request. It never needs manual restoring. 0.5 GB storage, 100 compute-hours/month. |
| Supabase | Free projects are **paused after 7 days without activity** and stay down until someone restores them. Not suitable for a public site. |
| CockroachDB Serverless | Doesn't pause and has 10 GiB, but it isn't fully Postgres-compatible, so it's riskier with this schema. |

Because everything goes through Drizzle + standard Postgres, you can move to any Postgres host (Railway, Render, a VPS, Neon's paid tier with always-on compute) by changing `DATABASE_URL` and running `pnpm db:migrate`.

## Making someone a moderator

Roles live in the `user.role` column (`user`, `moderator`, `admin`). Update it with SQL or `pnpm db:studio`:

```sql
UPDATE "user" SET role = 'admin' WHERE username = 'yourname';
```

Moderators can pin/lock forum threads and delete other people's posts, replies, reviews and lists.

## Project layout

```
src/app         routes (pages, API routes, server components)
src/actions     server actions (list, social, review, forum, diary, settings, import)
src/components  UI (layout, media, list, social, review, forum, user, settings)
src/db          Drizzle schema + connection
src/lib         TMDB client, queries, auth, formatting, validation
drizzle/        SQL migrations
scripts/dev.mjs local dev launcher (embedded database)
```

## Notes

- This site is not affiliated with Letterboxd or TMDB. The "Terms & Privacy" page is a template; have it reviewed before launching publicly.
- Next.js 16 differs from older versions; see `AGENTS.md` before changing framework-level code.
