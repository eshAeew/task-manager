import { pgTable, serial, text, boolean, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Simple Task Link type
export type TaskLink = {
  url: string;
  title: string;
};

// Define User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users)
  .omit({ id: true, createdAt: true })
  .extend({
    username: z.string().min(3, "Username must be at least 3 characters"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    email: z.string().email("Invalid email address"),
  });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Simplified task schema with essential fields
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  priority: text("priority", { enum: ["low", "medium", "high"] }).notNull(),
  completed: boolean("completed").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  dueDate: timestamp("due_date"),
  status: text("status", { 
    enum: ["todo", "in_progress", "done"] 
  }).notNull().default("todo"),
  category: text("category", {
    enum: ["work", "personal", "study", "shopping", "health", "other"]
  }).notNull().default("other"),
});

export const insertTaskSchema = createInsertSchema(tasks)
  .omit({ id: true, createdAt: true })
  .extend({
    title: z.string().min(1, "Title is required").max(100),
    description: z.string().optional(),
    priority: z.enum(["low", "medium", "high"]),
    dueDate: z.date().optional(),
    status: z.enum(["todo", "in_progress", "done"]).default("todo"),
    category: z.enum(["work", "personal", "study", "shopping", "health", "other"]).default("other"),
  });

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

// Constants for UI display
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

export const priorityColors = {
  low: "bg-blue-500",
  medium: "bg-yellow-500",
  high: "bg-red-500",
} as const;

export const statusOptions = [
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Done" },
] as const;

export const recurrenceOptions = [
  { value: "none", label: "No Recurrence" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "custom", label: "Custom Interval" },
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