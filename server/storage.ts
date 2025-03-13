import { users, type User, type InsertUser } from "@shared/schema";
import { Task, InsertTask } from "@shared/schema";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getTasks(): Task[];
  insertTask(task: InsertTask): Task;
  updateTask(id: number, updates: Partial<Task>): Task | undefined;
  deleteTask(id: number): void;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private tasks: Map<number, Task>;
  currentId: number;

  constructor() {
    this.users = new Map();
    this.tasks = new Map();
    this.currentId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  getTasks(): Task[] {
    return Array.from(this.tasks.values());
  }

  insertTask(task: InsertTask): Task {
    const id = this.currentId++;
    const newTask: Task = {
      ...task,
      id,
      createdAt: new Date(),
      completed: false,
      timeSpent: 0,
      lastStarted: null,
      xpEarned: 0,
      tags: task.tags || [],
      attachmentUrl: task.attachmentUrl || null,
      attachmentName: task.attachmentName || null,
      lastCompleted: null,
      nextDue: null,
    };

    this.tasks.set(id, newTask);
    return newTask;
  }

  updateTask(id: number, updates: Partial<Task>): Task | undefined {
    const task = this.tasks.get(id);
    if (!task) return undefined;

    const updatedTask = { ...task, ...updates };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  deleteTask(id: number): void {
    this.tasks.delete(id);
  }
}

export const storage = new MemStorage();