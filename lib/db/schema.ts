import { relations } from "drizzle-orm";
import {
  json,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  userId: text().primaryKey(),
  maxBudget: real(),
  userRealPhoto: text(),
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
});

export const makeupTemplates = pgTable("makeupTemplates", {
  id: uuid().primaryKey().defaultRandom(),
  ownerId: text()
    .notNull()
    .references(() => users.userId, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
  generatedPreviewPhoto: varchar({ length: 255 }),
  inferredCost: real(),
  rating: real(),
  makeupInstructions: text(),
  products: json(), // TODO: migrate to dedicated db table
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  makeupTemplates: many(makeupTemplates),
}));

export const makeupTemplatesRelations = relations(
  makeupTemplates,
  ({ one }) => ({
    owner: one(users, {
      fields: [makeupTemplates.ownerId],
      references: [users.userId],
    }),
  }),
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type MakeupTemplate = typeof makeupTemplates.$inferSelect;
export type NewMakeupTemplate = typeof makeupTemplates.$inferInsert;
