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

export function simpleUpdateTask(id: number, title: string): Task | null {
  console.log("simpleUpdateTask called with id:", id, "title:", title);
  try {
    // Get all tasks
    const tasks = getTasks();
    console.log("Retrieved tasks:", tasks.length);
    
    // Find the task
    const index = tasks.findIndex(t => t.id === id);
    console.log("Task index in array:", index);
    
    if (index === -1) {
      console.error("Task not found with id:", id);
      return null;
    }
    
    // Get the original task
    const originalTask = tasks[index];
    console.log("Original task:", originalTask);
    
    // Create simple update
    const updatedTask = { 
      ...originalTask,
      title: title 
    };
    
    console.log("Simple updated task:", updatedTask);
    
    // Update in array
    tasks[index] = updatedTask;
    
    // Save to localStorage
    console.log("Saving tasks to localStorage...");
    saveTasks(tasks);
    
    // Verify the save worked
    const verifyTasks = getTasks();
    const verifiedTask = verifyTasks.find(t => t.id === id);
    console.log("Verified saved task:", verifiedTask);
    
    return updatedTask;
  } catch (error) {
    console.error("Error in simpleUpdateTask:", error);
    return null;
  }
}

/**
 * Simple, reliable function to update a task with given properties
 */
export function updateTask(id: number, updates: Partial<InsertTask>): Task | null {
  try {
    const tasks = getTasks();
    const index = tasks.findIndex(t => t.id === id);
    
    if (index === -1) {
      return null;
    }

    const task = tasks[index];
    
    // Helper function to safely handle date fields
    const safeDate = (date: any): Date | null => {
      if (date === undefined || date === null) return null;
      return date instanceof Date ? date : new Date(date);
    };
    
    // Helper function to ensure array type and handle null/undefined
    const safeArray = <T>(arr: T[] | undefined | null): T[] => {
      return Array.isArray(arr) ? arr : [];
    };
    
    // Helper for type checking a TaskLink
    const isTaskLink = (item: any): item is { url: string; title: string } => {
      return typeof item === 'object' && item !== null && 
        typeof item.url === 'string' && 
        typeof item.title === 'string';
    };
    
    // Clean and validate links if provided
    const processedLinks = updates.links !== undefined
      ? safeArray(updates.links).filter(isTaskLink)
      : task.links;
    
    // Create a clean updated task object
    const updatedTask: Task = {
      // Original metadata
      id: task.id,
      createdAt: task.createdAt,
      
      // Task properties with updates applied
      title: updates.title ?? task.title,
      priority: updates.priority ?? task.priority,
      category: updates.category ?? task.category,
      status: updates.status ?? task.status,
      completed: updates.completed ?? task.completed,
      
      // Arrays with null safety
      tags: updates.tags !== undefined ? safeArray(updates.tags) : safeArray(task.tags),
      links: processedLinks,
      
      // Numeric values
      timeSpent: updates.timeSpent ?? task.timeSpent ?? 0,
      xpEarned: updates.xpEarned ?? task.xpEarned ?? 0,
      
      // Date fields
      dueDate: updates.dueDate !== undefined ? safeDate(updates.dueDate) : task.dueDate,
      lastStarted: task.lastStarted,
      lastCompleted: task.lastCompleted,
      nextDue: task.nextDue,
      
      // Recurrence fields 
      recurrence: updates.recurrence ?? task.recurrence,
      recurrenceInterval: updates.recurrenceInterval ?? task.recurrenceInterval,
      
      // Reminder fields
      reminderEnabled: updates.reminderEnabled ?? task.reminderEnabled,
      reminderTime: updates.reminderTime !== undefined ? safeDate(updates.reminderTime) : task.reminderTime,
      
      // Optional fields
      notes: updates.notes !== undefined ? updates.notes : task.notes,
      attachmentUrl: updates.attachmentUrl !== undefined ? updates.attachmentUrl : task.attachmentUrl,
      attachmentName: updates.attachmentName !== undefined ? updates.attachmentName : task.attachmentName,
    };

    // If marking as completed and task is recurring, update lastCompleted and calculate next due date
    if (updates.completed && !task.completed && task.recurrence !== "none") {
      updatedTask.lastCompleted = new Date();
      updatedTask.nextDue = calculateNextDueDate(updatedTask);
      updatedTask.completed = false; // Reset completion for next occurrence
    }

    // Save changes
    tasks[index] = updatedTask;
    saveTasks(tasks);
    return updatedTask;
  } catch (error) {
    console.error("Error updating task:", error);
    return null;
  }
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