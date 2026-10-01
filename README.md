# tvlist

A social tracker for **movies and TV shows**: lists with progress and scores, a viewing diary, reviews, custom lists, stats, and a community feed.

- **Lists**: Watching / Planning / Completed / Rewatching / Paused / Dropped, with episode progress, dates, rewatches, private notes and five scoring systems (100, 10.0, 10, 5 stars, smileys)
- **Diary**: log every viewing with a date, half-star rating, like and rewatch (Letterboxd style)
- **Reviews** with helpfulness voting, **custom ranked lists**, **favourites** (titles and people)
- **Social**: activity feed, status posts, profile messages, likes, replies, @mentions, follows, notifications
- **Profiles**: banner, avatar, profile colour, activity heatmap, and a full stats page (genres, actors, directors, studios, release/watch years)
- **Discovery**: trending / airing / top-rated, filters (genre, year, format, status, country, language, streaming service), airing schedule, "where to watch"
- **Forum** with categories, threads linked to titles, nested comments, pin/lock for moderators
- **Letterboxd import** (diary/ratings/watched/watchlist CSVs) and full JSON export
- Light and dark modes with **seven colour palettes** users can switch between, mobile friendly

Movie and TV data comes from [TMDB](https://www.themoviedb.org/).

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Postgres + Drizzle ORM · Better Auth · TMDB API

## Run it locally

```bash
npm install
cp .env.example .env.local     # then fill in TMDB_API_KEY and BETTER_AUTH_SECRET
npm run dev
```

`npm run dev` starts an **embedded Postgres** (stored in `.data/`) when `DATABASE_URL` is empty, so you need no Docker or cloud account to develop. Set `DATABASE_URL` to use a real Postgres instead.

Without a `TMDB_API_KEY` the site runs on a small built-in demo catalog. Get a free key at <https://www.themoviedb.org/settings/api> (use the **API Read Access Token**).

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server (+ local database if `DATABASE_URL` is empty) |
| `npm run build` / `npm start` | Production build / server |
| `npm run typecheck` / `npm run lint` | Checks |
| `npm run db:generate` | Generate a SQL migration after editing `src/db/schema.ts` |
| `npm run db:migrate` | Apply migrations to `DATABASE_URL` |

## Deploy (free)

**Hosting: Vercel** (free Hobby plan). **Database: Neon** (free Postgres).

1. **Create the database** at <https://neon.com> and copy the **pooled** connection string.
2. **Apply the schema** (once, from your machine):
   ```bash
   DATABASE_URL="postgres://…" npm run db:migrate
   ```
   Run it again after future schema changes.
3. **Deploy to Vercel**: import the repo and set these environment variables:

   | Variable | Value |
   | --- | --- |
   | `DATABASE_URL` | Neon pooled connection string |
   | `TMDB_API_KEY` | your TMDB read access token |
   | `BETTER_AUTH_SECRET` | random 32+ chars (`openssl rand -base64 32`) |
   | `BETTER_AUTH_URL` | `https://your-domain` |
   | `CRON_SECRET` | any random string (protects the daily job) |

   Optional: `GOOGLE_CLIENT_ID/SECRET`, `DISCORD_CLIENT_ID/SECRET` (enables those sign-in buttons), `BLOB_READ_WRITE_TOKEN` (enables avatar/banner uploads via Vercel Blob).
4. `vercel.json` already schedules a daily job (`/api/cron/refresh`) that sends "new episode aired" notifications and refreshes airing shows.

### Which database? (it won't go to sleep for good)

| Option | Free-tier behaviour |
| --- | --- |
| **Neon** (recommended) | Compute suspends after 5 idle minutes and **wakes automatically in ~0.5 s** on the next request. It never needs manual restoring. 0.5 GB storage, 100 compute-hours/month. |
| Supabase | Free projects are **paused after 7 days without activity** and stay down until someone restores them. Not suitable for a public site. |
| CockroachDB Serverless | Doesn't pause and has 10 GiB, but it isn't fully Postgres-compatible, so it's riskier with this schema. |

Because everything goes through Drizzle + standard Postgres, you can move to any Postgres host (Railway, Render, a VPS, Neon's paid tier with always-on compute) by changing `DATABASE_URL` and running `npm run db:migrate`.

## Making someone a moderator

Roles live in the `user.role` column (`user`, `moderator`, `admin`). Update it with SQL or `npm run db:studio`:

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
