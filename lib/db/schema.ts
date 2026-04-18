import { relations } from "drizzle-orm";
import {
  boolean,
  json,
  pgEnum,
  pgTable,
  real,
  integer,
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

export const makeupTemplateStatusEnum = pgEnum("makeup_template_status", [
  "processing",
  "ready",
  "failed",
]);

export const makeupJobStatusEnum = pgEnum("makeup_job_status", [
  "queued",
  "processing",
  "completed",
  "failed",
]);

export const makeupJobStageEnum = pgEnum("makeup_job_stage", [
  "research",
  "adversarial",
  "rebuttal",
  "finalize",
]);

export const makeupActivityStatusEnum = pgEnum("makeup_activity_status", [
  "pending",
  "running",
  "completed",
  "failed",
]);

export const makeupTemplates = pgTable("makeupTemplates", {
  id: uuid().primaryKey().defaultRandom(),
  ownerId: text()
    .notNull()
    .references(() => users.userId, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
  status: makeupTemplateStatusEnum().default("processing").notNull(),
  name: varchar({ length: 200 }),
  generatedPreviewPhoto: text(),
  inferredCost: real(),
  rating: real(),
  saved: boolean().default(false).notNull(),
  makeupInstructions: text(),
  products: json(), // TODO: migrate to dedicated db table
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
});

export const makeupProcessingJobs = pgTable("makeupProcessingJobs", {
  id: uuid().primaryKey().defaultRandom(),
  ownerId: text()
    .notNull()
    .references(() => users.userId, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
  templateId: uuid()
    .notNull()
    .references(() => makeupTemplates.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
  sourcePhotoUrl: text().notNull(),
  sourcePhotoKey: varchar({ length: 255 }),
  status: makeupJobStatusEnum().default("queued").notNull(),
  currentStage: makeupJobStageEnum().default("research").notNull(),
  elapsedSeconds: integer().default(0).notNull(),
  errorMessage: text(),
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  startedAt: timestamp({ withTimezone: true }),
  completedAt: timestamp({ withTimezone: true }),
});

export const makeupProcessingActivities = pgTable(
  "makeupProcessingActivities",
  {
    id: uuid().primaryKey().defaultRandom(),
    jobId: uuid()
      .notNull()
      .references(() => makeupProcessingJobs.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    kind: makeupJobStageEnum().notNull(),
    title: varchar({ length: 120 }).notNull(),
    description: text(),
    status: makeupActivityStatusEnum().default("pending").notNull(),
    sequence: integer().notNull(),
    payload: json(),
    startedAt: timestamp({ withTimezone: true }),
    completedAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  }
);

export const usersRelations = relations(users, ({ many }) => ({
  makeupTemplates: many(makeupTemplates),
  makeupProcessingJobs: many(makeupProcessingJobs),
}));

export const makeupTemplatesRelations = relations(
  makeupTemplates,
  ({ many, one }) => ({
    owner: one(users, {
      fields: [makeupTemplates.ownerId],
      references: [users.userId],
    }),
    processingJobs: many(makeupProcessingJobs),
  })
);

export const makeupProcessingJobsRelations = relations(
  makeupProcessingJobs,
  ({ many, one }) => ({
    owner: one(users, {
      fields: [makeupProcessingJobs.ownerId],
      references: [users.userId],
    }),
    template: one(makeupTemplates, {
      fields: [makeupProcessingJobs.templateId],
      references: [makeupTemplates.id],
    }),
    activities: many(makeupProcessingActivities),
  })
);

export const makeupProcessingActivitiesRelations = relations(
  makeupProcessingActivities,
  ({ one }) => ({
    job: one(makeupProcessingJobs, {
      fields: [makeupProcessingActivities.jobId],
      references: [makeupProcessingJobs.id],
    }),
  }),
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type MakeupTemplate = typeof makeupTemplates.$inferSelect;
export type NewMakeupTemplate = typeof makeupTemplates.$inferInsert;

export type MakeupProcessingJob = typeof makeupProcessingJobs.$inferSelect;
export type NewMakeupProcessingJob = typeof makeupProcessingJobs.$inferInsert;

export type MakeupProcessingActivity =
  typeof makeupProcessingActivities.$inferSelect;
export type NewMakeupProcessingActivity =
  typeof makeupProcessingActivities.$inferInsert;
