import { useState, useEffect } from "react";
import { TaskForm } from "@/components/task-form";
import { TaskList } from "@/components/task-list";
import { ThemeToggle } from "@/components/theme-toggle";
import { getTasks, addTask, updateTask, deleteTask } from "@/lib/tasks";
import type { Task, InsertTask } from "@shared/schema";

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    setTasks(getTasks());
  }, []);

  const handleAddTask = (data: InsertTask) => {
    const newTask = addTask(data);
    setTasks(prev => [...prev, newTask]);
  };

  const handleToggleComplete = (id: number) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    const updated = updateTask(id, { completed: !task.completed });
    if (updated) {
      setTasks(prev => prev.map(t => t.id === id ? updated : t));
    }
  };

  const handleDeleteTask = (id: number) => {
    deleteTask(id);
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Task Manager</h1>
          <ThemeToggle />
        </div>
        
        <div className="grid gap-8 md:grid-cols-[350px,1fr]">
          <div>
            <TaskForm onSubmit={handleAddTask} />
          </div>
          <div>
            <TaskList 
              tasks={tasks}
              onToggleComplete={handleToggleComplete}
              onDelete={handleDeleteTask}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
