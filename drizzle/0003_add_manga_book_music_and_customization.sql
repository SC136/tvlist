ALTER TYPE "public"."forum_category" ADD VALUE 'MANGA' BEFORE 'GAMES';--> statement-breakpoint
ALTER TYPE "public"."forum_category" ADD VALUE 'BOOKS' BEFORE 'EPISODE_DISCUSSION';--> statement-breakpoint
ALTER TYPE "public"."forum_category" ADD VALUE 'MUSIC' BEFORE 'EPISODE_DISCUSSION';--> statement-breakpoint
ALTER TYPE "public"."media_type" ADD VALUE 'manga';--> statement-breakpoint
ALTER TYPE "public"."media_type" ADD VALUE 'book';--> statement-breakpoint
ALTER TYPE "public"."media_type" ADD VALUE 'music';--> statement-breakpoint
ALTER TABLE "media" ALTER COLUMN "tmdb_id" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "website" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "location" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "status_quote" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "default_tab" text DEFAULT 'overview' NOT NULL;