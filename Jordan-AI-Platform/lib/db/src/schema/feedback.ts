import { createInsertSchema } from "drizzle-zod";
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const feedbackTable = pgTable("jordan_feedback", {
  id: text("id").primaryKey(),
  kind: text("kind").notNull(),
  message: text("message").notNull(),
  question: text("question"),
  knowledgeId: text("knowledge_id"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertFeedbackSchema = createInsertSchema(feedbackTable).omit({
  createdAt: true,
});
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;
export type Feedback = typeof feedbackTable.$inferSelect;