import { pgTable, text, serial, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  priority: text("priority", { enum: ["low", "medium", "high"] }).notNull(),
  completed: boolean("completed").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  // Add recurrence fields
  recurrence: text("recurrence", { 
    enum: ["none", "daily", "weekly", "monthly", "custom"] 
  }).notNull().default("none"),
  recurrenceInterval: text("recurrence_interval"), // For custom intervals (e.g., "3 days")
  lastCompleted: timestamp("last_completed"),
  nextDue: timestamp("next_due"),
  // Add due date and reminder fields
  dueDate: timestamp("due_date"),
  reminderEnabled: boolean("reminder_enabled").notNull().default(false),
  reminderTime: timestamp("reminder_time"), // When to show the reminder
});

export const insertTaskSchema = createInsertSchema(tasks)
  .pick({
    title: true,
    priority: true,
    completed: true,
    recurrence: true,
    recurrenceInterval: true,
    nextDue: true,
    dueDate: true,
    reminderEnabled: true,
    reminderTime: true,
  })
  .extend({
    title: z.string().min(1, "Title is required").max(100),
    priority: z.enum(["low", "medium", "high"]),
    recurrence: z.enum(["none", "daily", "weekly", "monthly", "custom"]).default("none"),
    recurrenceInterval: z.string().optional(),
    nextDue: z.date().optional(),
    dueDate: z.date().optional(),
    reminderEnabled: z.boolean().default(false),
    reminderTime: z.date().optional(),
  });

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

export const priorityColors = {
  low: "bg-blue-500",
  medium: "bg-yellow-500",
  high: "bg-red-500",
} as const;

export const recurrenceOptions = [
  { value: "none", label: "No Recurrence" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "custom", label: "Custom Interval" },
] as const;