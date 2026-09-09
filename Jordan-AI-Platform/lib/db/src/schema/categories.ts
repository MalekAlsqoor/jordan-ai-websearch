import { createInsertSchema } from "drizzle-zod";
import { integer, pgTable, text } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const categoriesTable = pgTable("jordan_categories", {
  id: text("id").primaryKey(),
  label: text("label").notNull(),
  labelEn: text("label_en").notNull(),
  description: text("description").notNull(),
  count: integer("count").notNull().default(0),
  accent: text("accent").notNull(),
});

export const insertCategorySchema = createInsertSchema(categoriesTable);
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categoriesTable.$inferSelect;