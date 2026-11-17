ALTER TABLE "profiles" ADD COLUMN "is_mod" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "boat" text DEFAULT 'canoe' NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "title" text;