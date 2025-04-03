import { Task, InsertTask } from "@shared/schema";
import { addDays, addWeeks, addMonths, parseISO, subDays } from "date-fns";

const STORAGE_KEY = "tasks";
const TRASH_KEY = "deleted_tasks";
const TRASH_EXPIRY_DAYS = 7;

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
    const validTasks = tasks.filter((task: DeletedTask) => {
      const deletedDate = new Date(task.deletedAt);
      const daysDiff = Math.floor(
        (currentDate.getTime() - deletedDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysDiff < TRASH_EXPIRY_DAYS;
    });

    if (validTasks.length !== tasks.length) {
      localStorage.setItem(TRASH_KEY, JSON.stringify(validTasks));
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
  localStorage.setItem(TRASH_KEY, JSON.stringify(tasks));
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
  
  // Process the task to ensure all fields are in the correct format
  const processedTask = { ...task };
  
  // Ensure links are in the correct format
  if (processedTask.links === undefined) {
    processedTask.links = null;
  }
  
  const newTask: Task = {
    ...processedTask,
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
    links: processedTask.links || null,
    notes: processedTask.notes || null,
  } as Task; // Type casting to avoid TypeScript errors
  
  tasks.push(newTask);
  saveTasks(tasks);
  return newTask;
}

export function updateTask(id: number, updates: Partial<InsertTask>) {
  const tasks = getTasks();
  const index = tasks.findIndex(t => t.id === id);
  if (index === -1) return null;

  const task = tasks[index];
  
  // Process the updates to handle date conversions
  const processedUpdates = { ...updates };
  
  // Convert date strings to Date objects
  if (updates.dueDate) {
    processedUpdates.dueDate = new Date(updates.dueDate);
  }
  
  if (updates.reminderTime) {
    processedUpdates.reminderTime = new Date(updates.reminderTime);
  }
  
  // Ensure links are always in the correct format
  if (updates.links !== undefined && updates.links !== null) {
    // Force cast to string[] to keep TypeScript happy
    processedUpdates.links = updates.links as string[];
  }

  // Type cast to resolve the type incompatibility
  const updatedTask = { ...task, ...processedUpdates } as Task;

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
    const deletedTasks = getDeletedTasks();
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