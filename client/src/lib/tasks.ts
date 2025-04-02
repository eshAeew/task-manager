import { Task, InsertTask } from "@shared/schema";
import { addDays, addWeeks, addMonths, parseISO, subDays } from "date-fns";

const STORAGE_KEY = "tasks";
const TRASH_KEY = "deleted_tasks";
const TRASH_EXPIRY_DAYS = 7;
const MAX_DELETED_TASKS = 50;

interface DeletedTask extends Task {
  deletedAt: string;
}

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
      dueDate: task.dueDate ? parseISO(task.dueDate) : null,
      reminderTime: task.reminderTime ? parseISO(task.reminderTime) : null,
    }));
  } catch {
    return [];
  }
}

export function getDeletedTasks(): DeletedTask[] {
  const stored = localStorage.getItem(TRASH_KEY);
  if (!stored) return [];
  try {
    const tasks = JSON.parse(stored);
    // Remove expired tasks (older than 7 days)
    const currentDate = new Date();
    let validTasks = tasks.filter((task: DeletedTask) => {
      const deletedDate = new Date(task.deletedAt);
      const daysDiff = Math.floor(
        (currentDate.getTime() - deletedDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysDiff < TRASH_EXPIRY_DAYS;
    });

    // If we have too many tasks after filtering expired ones, limit the total
    if (validTasks.length > MAX_DELETED_TASKS) {
      // Sort by deletion date (most recent first)
      validTasks.sort((a, b) => 
        new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime()
      );
      // Keep only the most recent MAX_DELETED_TASKS items
      validTasks = validTasks.slice(0, MAX_DELETED_TASKS);
    }

    if (validTasks.length !== tasks.length) {
      try {
        localStorage.setItem(TRASH_KEY, JSON.stringify(validTasks));
      } catch (error) {
        console.error('Error updating deleted tasks during cleanup:', error);
        // If we can't save, reduce further
        if (validTasks.length > MAX_DELETED_TASKS / 2) {
          validTasks = validTasks.slice(0, Math.floor(MAX_DELETED_TASKS / 2));
          try {
            localStorage.setItem(TRASH_KEY, JSON.stringify(validTasks));
          } catch (innerError) {
            console.error('Still cannot save reduced deleted tasks:', innerError);
            // As a last resort, clear all deleted tasks
            localStorage.removeItem(TRASH_KEY);
            return [];
          }
        }
      }
    }

    return validTasks.map((task: any) => ({
      ...task,
      createdAt: parseISO(task.createdAt),
      lastCompleted: task.lastCompleted ? parseISO(task.lastCompleted) : null,
      nextDue: task.nextDue ? parseISO(task.nextDue) : null,
      dueDate: task.dueDate ? parseISO(task.dueDate) : null,
      reminderTime: task.reminderTime ? parseISO(task.reminderTime) : null,
      deletedAt: task.deletedAt,
    }));
  } catch {
    return [];
  }
}

function saveDeletedTasks(tasks: DeletedTask[]) {
  try {
    localStorage.setItem(TRASH_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.error('Error saving deleted tasks:', error);
    // If we hit storage quota, trim the oldest tasks
    if (tasks.length > 1) {
      // Sort by deletion date and keep only the most recent ones
      const sortedTasks = [...tasks].sort((a, b) => 
        new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime()
      );
      // Keep only the MAX_DELETED_TASKS most recent ones
      const trimmedTasks = sortedTasks.slice(0, MAX_DELETED_TASKS);
      try {
        localStorage.setItem(TRASH_KEY, JSON.stringify(trimmedTasks));
      } catch (innerError) {
        console.error('Still cannot save deleted tasks after trimming:', innerError);
        // As a last resort, clear all deleted tasks
        localStorage.removeItem(TRASH_KEY);
      }
    } else {
      // If there's only one task and we still can't save, clear all
      localStorage.removeItem(TRASH_KEY);
    }
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
      // Handle numeric-only input (treat as days)
      if (!isNaN(Number(task.recurrenceInterval))) {
        const num = parseInt(task.recurrenceInterval);
        return addDays(baseDate, num);
      }
      
      const parts = task.recurrenceInterval.split(" ");
      if (parts.length < 2) return addDays(baseDate, 1); // Default to 1 day if format is invalid
      
      const [amount, unit] = parts;
      const num = parseInt(amount);
      if (isNaN(num)) return addDays(baseDate, 1); // Default to 1 day if amount is invalid
      
      if (!unit) return addDays(baseDate, num); // If no unit specified, assume days
      
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
    dueDate: task.dueDate ? new Date(task.dueDate) : null,
    reminderTime: task.reminderTime ? new Date(task.reminderTime) : null,
    recurrenceInterval: task.recurrenceInterval || null,
    timeSpent: task.timeSpent || 0,
    lastStarted: null,
    xpEarned: task.xpEarned || 0,
    tags: task.tags || [],
    attachmentUrl: task.attachmentUrl || null,
    attachmentName: task.attachmentName || null,
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
  const taskToDelete = tasks.find(t => t.id === id);
  if (taskToDelete) {
    // Move to trash
    let deletedTasks = getDeletedTasks();
    
    // If we have too many deleted tasks, remove the oldest ones
    if (deletedTasks.length >= MAX_DELETED_TASKS) {
      // Sort by deletion date (oldest first)
      deletedTasks.sort((a, b) => 
        new Date(a.deletedAt).getTime() - new Date(b.deletedAt).getTime()
      );
      // Remove the oldest tasks to make room
      deletedTasks = deletedTasks.slice(deletedTasks.length - MAX_DELETED_TASKS + 1);
    }
    
    const deletedTask: DeletedTask = {
      ...taskToDelete,
      deletedAt: new Date().toISOString(),
    };
    
    deletedTasks.push(deletedTask);
    saveDeletedTasks(deletedTasks);
  }

  const filtered = tasks.filter(t => t.id !== id);
  saveTasks(filtered);
}

export function restoreTask(id: number) {
  const deletedTasks = getDeletedTasks();
  const taskToRestore = deletedTasks.find(t => t.id === id);
  if (!taskToRestore) return;

  // Remove from trash
  const updatedDeletedTasks = deletedTasks.filter(t => t.id !== id);
  saveDeletedTasks(updatedDeletedTasks);

  // Add back to active tasks
  const { deletedAt, ...restoredTask } = taskToRestore;
  const tasks = getTasks();
  tasks.push(restoredTask);
  saveTasks(tasks);

  return restoredTask;
}

export function permanentlyDeleteTask(id: number) {
  const deletedTasks = getDeletedTasks();
  const filtered = deletedTasks.filter(t => t.id !== id);
  saveDeletedTasks(filtered);
}

export function importTasks(newTasks: Task[]) {
  // Convert date strings to Date objects
  const processedTasks = newTasks.map(task => ({
    ...task,
    createdAt: new Date(task.createdAt),
    lastCompleted: task.lastCompleted ? new Date(task.lastCompleted) : null,
    nextDue: task.nextDue ? new Date(task.nextDue) : null,
    dueDate: task.dueDate ? new Date(task.dueDate) : null,
    reminderTime: task.reminderTime ? new Date(task.reminderTime) : null,
  }));
  saveTasks(processedTasks);
  return processedTasks;
}