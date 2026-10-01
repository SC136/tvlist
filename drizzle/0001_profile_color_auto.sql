ALTER TABLE "user" ALTER COLUMN "profile_color" SET DEFAULT 'auto';--> statement-breakpoint
UPDATE "user" SET "profile_color" = 'auto' WHERE "profile_color" NOT IN ('auto', 'marquee', 'noir', 'lagoon', 'orchid', 'forest', 'azure', 'graphite');
