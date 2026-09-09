import { createInsertSchema } from "drizzle-zod";
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod/v4";
import { categoriesTable } from "./categories";
import { sourcesTable } from "./sources";

export const knowledgeTable = pgTable("jordan_knowledge", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  titleEn: text("title_en").notNull(),
  summary: text("summary").notNull(),
  categoryId: text("category_id")
    .notNull()
    .references(() => categoriesTable.id),
  status: text("status").notNull().default("review"),
  lastVerified: timestamp("last_verified", { withTimezone: true }),
  sourceId: text("source_id")
    .notNull()
    .references(() => sourcesTable.id),
  tags: text("tags").array().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertKnowledgeSchema = createInsertSchema(knowledgeTable).omit({
  createdAt: true,
  updatedAt: true,
});
export type InsertKnowledge = z.infer<typeof insertKnowledgeSchema>;
export type Knowledge = typeof knowledgeTable.$inferSelect;