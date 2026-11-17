CREATE TABLE "achievements" (
	"profile_id" uuid NOT NULL,
	"achievement_id" text NOT NULL,
	"earned_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "achievements_profile_id_achievement_id_pk" PRIMARY KEY("profile_id","achievement_id")
);
--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "correct_streak" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "fast_streak" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "achievements" ADD CONSTRAINT "achievements_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;