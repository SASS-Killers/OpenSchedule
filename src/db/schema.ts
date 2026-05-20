import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").unique().notNull(),
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(),
  role: text("role", { enum: ["admin", "host"] }).notNull().default("host"),
  timezone: text("timezone").notNull().default("UTC"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at").notNull(),
});

export const verificationCodes = sqliteTable("verification_codes", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  code: text("code").notNull(),
  attempts: integer("attempts").notNull().default(0),
  expiresAt: integer("expires_at").notNull(),
  createdAt: integer("created_at").notNull(),
});

export const schedules = sqliteTable("schedules", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  dayOfWeek: integer("day_of_week").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
});

export const eventTypes = sqliteTable("event_types", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  slug: text("slug").notNull(),
  description: text("description"),
  duration: integer("duration").notNull(),
  bufferBefore: integer("buffer_before").notNull().default(0),
  bufferAfter: integer("buffer_after").notNull().default(0),
  minimumNotice: integer("minimum_notice").notNull().default(4),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
});
