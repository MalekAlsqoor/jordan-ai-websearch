import { createInsertSchema } from "drizzle-zod";
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const sourcesTable = pgTable("jordan_sources", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  publisher: text("publisher").notNull(),
  domain: text("domain").notNull(),
  url: text("url").notNull(),
  sourceType: text("source_type").notNull(),
  retrievedAt: timestamp("retrieved_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  publicationDate: text("publication_date"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertSourceSchema = createInsertSchema(sourcesTable).omit({
  createdAt: true,
});
export type InsertSource = z.infer<typeof insertSourceSchema>;
export type Source = typeof sourcesTable.$inferSelect;