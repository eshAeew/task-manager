import { pgTable, text, serial, boolean, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Add link type definition
export type TaskLink = {
  url: string;
  title: string;
};

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  priority: text("priority", { enum: ["low", "medium", "high"] }).notNull(),
  completed: boolean("completed").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  // Add links storage
  links: text("links").array(),
  // Add notes storage
  notes: text("notes"),
  // Existing fields
  timeSpent: integer("time_spent").default(0),
  lastStarted: timestamp("last_started"),
  xpEarned: integer("xp_earned").default(0),
  status: text("status", { 
    enum: ["todo", "in_progress", "done"] 
  }).notNull().default("todo"),
  category: text("category", {
    enum: ["work", "personal", "study", "shopping", "health", "other"]
  }).notNull().default("other"),
  tags: text("tags").array(),
  attachmentUrl: text("attachment_url"),
  attachmentName: text("attachment_name"),
  recurrence: text("recurrence", { 
    enum: ["none", "daily", "weekly", "monthly", "custom"] 
  }).notNull().default("none"),
  recurrenceInterval: text("recurrence_interval"),
  lastCompleted: timestamp("last_completed"),
  nextDue: timestamp("next_due"),
  dueDate: timestamp("due_date"),
  reminderEnabled: boolean("reminder_enabled").notNull().default(false),
  reminderTime: timestamp("reminder_time"),
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
    status: true,
    category: true,
    tags: true,
    attachmentUrl: true,
    attachmentName: true,
    timeSpent: true,
    lastStarted: true,
    xpEarned: true,
    links: true,
    notes: true,
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
    status: z.enum(["todo", "in_progress", "done"]).default("todo"),
    category: z.enum(["work", "personal", "study", "shopping", "health", "other"]).default("other"),
    tags: z.array(z.string()).optional(),
    attachmentUrl: z.string().optional(),
    attachmentName: z.string().optional(),
    timeSpent: z.number().int().default(0),
    lastStarted: z.date().optional(),
    xpEarned: z.number().int().default(0),
    links: z.array(z.object({
      url: z.string().url("Invalid URL"),
      title: z.string(),
    })).optional(),
    notes: z.string().optional(),
  });

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

export const categoryIcons = {
  work: "💼",
  personal: "👤",
  study: "📚",
  shopping: "🛒",
  health: "🏥",
  other: "📌",
} as const;

export const categoryOptions = [
  { value: "work", label: "Work", icon: categoryIcons.work },
  { value: "personal", label: "Personal", icon: categoryIcons.personal },
  { value: "study", label: "Study", icon: categoryIcons.study },
  { value: "shopping", label: "Shopping", icon: categoryIcons.shopping },
  { value: "health", label: "Health", icon: categoryIcons.health },
  { value: "other", label: "Other", icon: categoryIcons.other },
] as const;

export const XP_REWARDS = {
  TASK_COMPLETE: 10,
  HIGH_PRIORITY_BONUS: 5,
  STREAK_BONUS: 2,
  EARLY_COMPLETION: 3,
} as const;

export const BADGES = {
  BEGINNER: {
    id: "beginner",
    name: "Beginner",
    description: "Complete your first task",
    icon: "🎉",
    requirement: 1,
  },
  PRODUCTIVE: {
    id: "productive",
    name: "Productivity Champion",
    description: "Complete 10 tasks in a day",
    icon: "🏆",
    requirement: 10,
  },
  CONSISTENT: {
    id: "consistent",
    name: "Consistency King",
    description: "Maintain a 5-day streak",
    icon: "👑",
    requirement: 5,
  },
  SPEEDSTER: {
    id: "speedster",
    name: "Speed Demon",
    description: "Complete 5 tasks before their due date",
    icon: "⚡",
    requirement: 5,
  },
} as const;

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

export const statusOptions = [
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Done" },
] as const;