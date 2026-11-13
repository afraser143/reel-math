import {
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
