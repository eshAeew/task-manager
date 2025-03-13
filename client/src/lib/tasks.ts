import { Task, InsertTask } from "@shared/schema";
import { addDays, addWeeks, addMonths, parseISO, subDays } from "date-fns";

const STORAGE_KEY = "tasks";
const TRASH_KEY = "deleted_tasks";
const TRASH_EXPIRY_DAYS = 7;

interface DeletedTask extends Task {
  deletedAt: string;
}

export function getTasks(userUuid: string): Task[] {
  const stored = localStorage.getItem("tasks");
  if (!stored) return [];
  try {
    const tasks = JSON.parse(stored);
    // Filter tasks based on UUID (own tasks + shared tasks)
    return tasks.filter((task: Task) =>
      task.userUuid === userUuid || (task.isShared && task.userUuid !== userUuid)
    ).map((task: any) => ({
      ...task,
      createdAt: new Date(task.createdAt),
      lastCompleted: task.lastCompleted ? new Date(task.lastCompleted) : null,
      nextDue: task.nextDue ? new Date(task.nextDue) : null,
      dueDate: task.dueDate ? new Date(task.dueDate) : null,
      reminderTime: task.reminderTime ? new Date(task.reminderTime) : null,
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
      createdAt: new Date(task.createdAt),
      lastCompleted: task.lastCompleted ? new Date(task.lastCompleted) : null,
      nextDue: task.nextDue ? new Date(task.nextDue) : null,
      dueDate: task.dueDate ? new Date(task.dueDate) : null,
      reminderTime: task.reminderTime ? new Date(task.reminderTime) : null,
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
  const tasks = getTasks(task.userUuid);
  const newTask: Task = {
    ...task,
    id: Date.now(),
    createdAt: new Date(),
    completed: false,
    lastCompleted: null,
    nextDue: null,
    lastStarted: null,
    timeSpent: 0,
    xpEarned: 0,
    tags: task.tags || [],
    attachmentUrl: task.attachmentUrl || null,
    attachmentName: task.attachmentName || null,
  };
  tasks.push(newTask);
  saveTasks(tasks);
  return newTask;
}

export function updateTask(id: number, updates: Partial<Task>): Task | undefined {
  const allTasks = getTasks(updates.userUuid || '');
  const index = allTasks.findIndex(t => t.id === id);
  if (index === -1) return;

  const task = allTasks[index];
  const updatedTask = { ...task, ...updates };

  allTasks[index] = updatedTask;
  saveTasks(allTasks);
  return updatedTask;
}

export function deleteTask(id: number) {
  const tasks = getTasks('');
  const filtered = tasks.filter(t => t.id !== id);
  saveTasks(filtered);
}

export function toggleTaskSharing(id: number, isShared: boolean): Task | undefined {
  const tasks = getTasks('');
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  return updateTask(id, { isShared });
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
  const tasks = getTasks(restoredTask.userUuid); // Added userUuid for consistency
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