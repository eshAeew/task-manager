import { Task, InsertTask } from "@shared/schema";
import { addDays, addWeeks, addMonths, parseISO } from "date-fns";

const STORAGE_KEY = "tasks";

export function getTasks(): Task[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  try {
    const tasks = JSON.parse(stored);
    // Convert date strings back to Date objects
    return tasks.map((task: any) => ({
      ...task,
      createdAt: parseISO(task.createdAt),
      lastCompleted: task.lastCompleted ? parseISO(task.lastCompleted) : null,
      nextDue: task.nextDue ? parseISO(task.nextDue) : null,
    }));
  } catch {
    return [];
  }
}

function calculateNextDueDate(task: Task): Date | null {
  if (!task.recurrence || task.recurrence === "none") return null;

  const baseDate = task.lastCompleted || task.createdAt;

  switch (task.recurrence) {
    case "daily":
      return addDays(baseDate, 1);
    case "weekly":
      return addWeeks(baseDate, 1);
    case "monthly":
      return addMonths(baseDate, 1);
    case "custom":
      if (!task.recurrenceInterval) return null;
      const [amount, unit] = task.recurrenceInterval.split(" ");
      const num = parseInt(amount);
      if (isNaN(num)) return null;

      switch (unit.toLowerCase()) {
        case "day":
        case "days":
          return addDays(baseDate, num);
        case "week":
        case "weeks":
          return addWeeks(baseDate, num);
        case "month":
        case "months":
          return addMonths(baseDate, num);
        default:
          return null;
      }
    default:
      return null;
  }
}

export function saveTasks(tasks: Task[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

export function addTask(task: InsertTask): Task {
  const tasks = getTasks();
  const newTask: Task = {
    ...task,
    id: Date.now(),
    createdAt: new Date(),
    completed: false,
    lastCompleted: null,
    nextDue: task.recurrence !== "none" ? calculateNextDueDate({
      ...task,
      id: Date.now(),
      createdAt: new Date(),
      lastCompleted: null,
    } as Task) : null,
  };
  tasks.push(newTask);
  saveTasks(tasks);
  return newTask;
}

export function updateTask(id: number, updates: Partial<InsertTask>) {
  const tasks = getTasks();
  const index = tasks.findIndex(t => t.id === id);
  if (index === -1) return;

  const task = tasks[index];
  const updatedTask = { ...task, ...updates };

  // If marking as completed and task is recurring, update lastCompleted and calculate next due date
  if (updates.completed && !task.completed && task.recurrence !== "none") {
    updatedTask.lastCompleted = new Date();
    updatedTask.nextDue = calculateNextDueDate(updatedTask);
    updatedTask.completed = false; // Reset completion for next occurrence
  }

  tasks[index] = updatedTask;
  saveTasks(tasks);
  return updatedTask;
}

export function deleteTask(id: number) {
  const tasks = getTasks();
  const filtered = tasks.filter(t => t.id !== id);
  saveTasks(filtered);
}