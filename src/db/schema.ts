import {
  boolean,
  date,
  index,
  integer,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/** Parent accounts. Kids never have credentials of their own. */
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Login sessions. Only a SHA-256 hash of the cookie token is stored. */
export const sessions = pgTable(
  "sessions",
  {
    tokenHash: text("token_hash").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

/** Kid profiles: a nickname and an avatar, nothing else. */
export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    nickname: text("nickname").notNull(),
    avatar: text("avatar").notNull(),
    /** Turned on by a parent (with their password): unlocks mods-only gear. */
    isMod: boolean("is_mod").notNull().default(false),
    /** A grown-up's switch (also password-protected): every lake and the Open Ocean open. */
    unlockAll: boolean("unlock_all").notNull().default(false),
    boat: text("boat").notNull().default("canoe"),
    /** A mod's title, shown under their name. */
    title: text("title"),
    /** Correct answers in a row, and fast (under 2 seconds) correct answers in a row, for achievements. */
    correctStreak: integer("correct_streak").notNull().default(0),
    fastStreak: integer("fast_streak").notNull().default(0),
    /** Answers in a row that could have hooked the blue marlin but didn't; at LEGENDARY_GUARANTEE the next one will. */
    marlinDrought: integer("marlin_drought").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("profiles_user_idx").on(t.userId)],
);

/** Spaced-repetition state for each fact, per profile. */
export const factProgress = pgTable(
  "fact_progress",
  {
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    table: integer("table").notNull(),
    multiplier: integer("multiplier").notNull(),
    box: integer("box").notNull().default(0),
    dueAt: timestamp("due_at", { withTimezone: true }).notNull(),
    correctCount: integer("correct_count").notNull().default(0),
    wrongCount: integer("wrong_count").notNull().default(0),
    lastAnsweredAt: timestamp("last_answered_at", { withTimezone: true }),
  },
  (t) => [primaryKey({ columns: [t.profileId, t.table, t.multiplier] })],
);

/** Every bass he lands. */
export const catches = pgTable(
  "catches",
  {
    id: serial("id").primaryKey(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    speciesId: text("species_id").notNull(),
    weightOz: integer("weight_oz").notNull(),
    table: integer("table").notNull(),
    multiplier: integer("multiplier").notNull(),
    responseMs: integer("response_ms").notNull(),
    caughtAt: timestamp("caught_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("catches_profile_idx").on(t.profileId, t.caughtAt)],
);

/** Achievements on an angler's trophy wall. */
export const achievements = pgTable(
  "achievements",
  {
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    achievementId: text("achievement_id").notNull(),
    earnedAt: timestamp("earned_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.profileId, t.achievementId] })],
);

/** Daily AI generation counts per parent account, for rate limiting. */
export const aiUsage = pgTable(
  "ai_usage",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    day: date("day").notNull(),
    count: integer("count").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.userId, t.day] })],
);
