ALTER TYPE "public"."forum_category" ADD VALUE 'ANIME' BEFORE 'EPISODE_DISCUSSION';--> statement-breakpoint
ALTER TYPE "public"."forum_category" ADD VALUE 'GAMES' BEFORE 'EPISODE_DISCUSSION';--> statement-breakpoint
ALTER TYPE "public"."media_type" ADD VALUE 'anime';--> statement-breakpoint
ALTER TYPE "public"."media_type" ADD VALUE 'game';