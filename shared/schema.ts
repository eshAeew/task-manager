import { pgTable, text, serial, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  priority: text("priority", { enum: ["low", "medium", "high"] }).notNull(),
  completed: boolean("completed").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTaskSchema = createInsertSchema(tasks)
  .pick({
    title: true,
    priority: true,
    completed: true,
  })
  .extend({
    title: z.string().min(1, "Title is required").max(100),
    priority: z.enum(["low", "medium", "high"]),
  });

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

export const priorityColors = {
  low: "bg-blue 500",
  medium: "bg-yellow-500",
  high: "bg-red-500",
} as const;
