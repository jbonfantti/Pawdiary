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
