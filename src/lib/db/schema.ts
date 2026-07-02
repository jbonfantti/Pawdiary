import {
  pgTable,
  text,
  timestamp,
  uuid,
  numeric,
  boolean,
  index,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkId: text("clerk_id").notNull().unique(),
  email: text("email").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const pets = pgTable(
  "pets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    breed: text("breed"),
    birthDate: timestamp("birth_date", { withTimezone: true }),
    photoUrl: text("photo_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("pets_user_id_idx").on(table.userId)],
);

export const timelineEntryTypeValues = ["photo", "video", "milestone"] as const;

export const timelineEntries = pgTable(
  "timeline_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    petId: uuid("pet_id")
      .notNull()
      .references(() => pets.id, { onDelete: "cascade" }),
    type: text("type", { enum: timelineEntryTypeValues }).notNull(),
    mediaUrl: text("media_url"),
    caption: text("caption"),
    aiGenerated: boolean("ai_generated").default(false).notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("timeline_entries_pet_id_idx").on(table.petId),
    index("timeline_entries_occurred_at_idx").on(table.occurredAt),
  ],
);

export const healthRecordTypeValues = ["weight", "vaccine", "dewormer", "vet_visit"] as const;

export const healthRecords = pgTable(
  "health_records",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    petId: uuid("pet_id")
      .notNull()
      .references(() => pets.id, { onDelete: "cascade" }),
    type: text("type", { enum: healthRecordTypeValues }).notNull(),
    weightKg: numeric("weight_kg", { precision: 5, scale: 2 }),
    notes: text("notes"),
    recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("health_records_pet_id_idx").on(table.petId),
    index("health_records_recorded_at_idx").on(table.recordedAt),
  ],
);

export const posts = pgTable(
  "posts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    petId: uuid("pet_id")
      .notNull()
      .references(() => pets.id, { onDelete: "cascade" }),
    timelineEntryId: uuid("timeline_entry_id").references(() => timelineEntries.id, {
      onDelete: "set null",
    }),
    mediaUrl: text("media_url").notNull(),
    caption: text("caption"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("posts_user_id_idx").on(table.userId),
    index("posts_pet_id_idx").on(table.petId),
    index("posts_created_at_idx").on(table.createdAt),
  ],
);

export const postLikes = pgTable(
  "post_likes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("post_likes_post_id_idx").on(table.postId),
    index("post_likes_post_id_user_id_idx").on(table.postId, table.userId),
  ],
);

export const follows = pgTable(
  "follows",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    followerId: uuid("follower_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    followeeId: uuid("followee_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("follows_follower_id_idx").on(table.followerId),
    index("follows_followee_id_idx").on(table.followeeId),
    index("follows_follower_id_followee_id_idx").on(table.followerId, table.followeeId),
  ],
);

export const healthSignalTypeValues = [
  "behavior_change",
  "weight_change",
  "lethargy",
  "visual_concern",
] as const;

export const healthSignalStatusValues = [
  "new",
  "acknowledged",
  "dismissed",
  "acted_on",
] as const;

export const petHealthSignals = pgTable(
  "pet_health_signals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    petId: uuid("pet_id")
      .notNull()
      .references(() => pets.id, { onDelete: "cascade" }),
    timelineEntryId: uuid("timeline_entry_id").references(() => timelineEntries.id, {
      onDelete: "cascade",
    }),
    postId: uuid("post_id").references(() => posts.id, { onDelete: "cascade" }),
    signalType: text("signal_type", { enum: healthSignalTypeValues }).notNull(),
    description: text("description").notNull(),
    confidence: numeric("confidence", { precision: 3, scale: 2 }).notNull(),
    status: text("status", { enum: healthSignalStatusValues }).default("new").notNull(),
    detectedAt: timestamp("detected_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("pet_health_signals_pet_id_idx").on(table.petId),
    index("pet_health_signals_status_idx").on(table.status),
    index("pet_health_signals_detected_at_idx").on(table.detectedAt),
  ],
);

export const subscriptionStatusValues = [
  "active",
  "trialing",
  "past_due",
  "canceled",
  "incomplete",
] as const;

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" })
      .unique(),
    stripeCustomerId: text("stripe_customer_id").notNull(),
    stripeSubscriptionId: text("stripe_subscription_id"),
    status: text("status", { enum: subscriptionStatusValues }).notNull(),
    currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("subscriptions_stripe_customer_id_idx").on(table.stripeCustomerId)],
);
