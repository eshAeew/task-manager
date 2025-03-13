import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { type Task, insertTaskSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Tasks API routes
  app.get("/api/tasks", (req, res) => {
    const userUuid = req.query.userUuid as string;
    if (!userUuid) {
      return res.status(400).json({ message: "User UUID is required" });
    }

    // Get both user's tasks and shared tasks
    const tasks = storage.getTasks().filter(task => 
      task.userUuid === userUuid || (task.isShared && task.userUuid !== userUuid)
    );
    res.json(tasks);
  });

  app.get("/api/tasks/shared/:uuid", (req, res) => {
    const { uuid } = req.params;
    const sharedTasks = storage.getTasks().filter(task => 
      task.userUuid === uuid && task.isShared
    );
    res.json(sharedTasks);
  });

  app.post("/api/tasks", (req, res) => {
    const result = insertTaskSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: "Invalid task data", errors: result.error });
    }
    const task = storage.insertTask(result.data);
    res.json(task);
  });

  app.patch("/api/tasks/:id/share", (req, res) => {
    const id = parseInt(req.params.id);
    const { isShared } = req.body;

    const task = storage.updateTask(id, { isShared });
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.json(task);
  });

  const httpServer = createServer(app);
  return httpServer;
}