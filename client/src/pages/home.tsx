import { useState, useEffect } from "react";
import { TaskForm } from "@/components/task-form";
import { TaskList } from "@/components/task-list";
import { ThemeToggle } from "@/components/theme-toggle";
import { AnalyticsDashboard } from "@/components/analytics-dashboard";
import { TrashBin } from "@/components/trash-bin";
import { VoiceInput } from "@/components/voice-input";
import { getTasks, addTask, updateTask, deleteTask } from "@/lib/tasks";
import type { Task, InsertTask } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { suggestTaskPriority } from "@/lib/task-analyzer";

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [view, setView] = useState<"list" | "kanban">("list");
  const [isFocusMode, setIsFocusMode] = useState(false);

  useEffect(() => {
    setTasks(getTasks());
  }, []);

  const handleAddTask = (data: InsertTask) => {
    const newTask = addTask(data);
    setTasks(prev => [...prev, newTask]);
  };

  const handleVoiceInput = (transcript: string) => {
    const newTask: InsertTask = {
      title: transcript,
      priority: suggestTaskPriority(transcript),
      completed: false,
      recurrence: "none",
      reminderEnabled: false,
      status: "todo",
    };
    handleAddTask(newTask);
  };

  const handleToggleComplete = (id: number) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const updated = updateTask(id, { 
      completed: !task.completed,
      status: !task.completed ? "done" : task.status 
    });
    if (updated) {
      setTasks(prev => prev.map(t => t.id === id ? updated : t));
    }
  };

  const handleUpdateStatus = (id: number, status: Task["status"]) => {
    const updated = updateTask(id, { status });
    if (updated) {
      setTasks(prev => prev.map(t => t.id === id ? updated : t));
    }
  };

  const handleDeleteTask = (id: number) => {
    deleteTask(id);
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const handleImportTasks = (importedTasks: Task[]) => {
    setTasks(importedTasks);
  };

  const handleRestoreTask = (task: Task) => {
    setTasks(prev => [...prev, task]);
  };

  const handleTimeUpdate = (taskId: number, timeSpent: number) => {
    const updated = updateTask(taskId, { timeSpent });
    if (updated) {
      setTasks(prev => prev.map(t => t.id === taskId ? updated : t));
    }
  };

  return (
    <div className={`min-h-screen bg-background ${isFocusMode ? 'bg-black/95' : ''}`}>
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Task Manager</h1>
          <div className="flex items-center gap-2">
            <VoiceInput onTranscript={handleVoiceInput} />
            <ThemeToggle />
          </div>
        </div>

        <div className="mb-8">
          <AnalyticsDashboard tasks={tasks} />
        </div>

        <Tabs defaultValue="tasks">
          <TabsList>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="trash">Recycle Bin</TabsTrigger>
          </TabsList>
          <TabsContent value="tasks">
            <div className="grid gap-8 md:grid-cols-[350px,1fr]">
              <div>
                <TaskForm onSubmit={handleAddTask} />
              </div>
              <div>
                <TaskList 
                  tasks={tasks}
                  onToggleComplete={handleToggleComplete}
                  onDeleteTask={handleDeleteTask}
                  onImportTasks={handleImportTasks}
                  onTimeUpdate={handleTimeUpdate}
                  onUpdateStatus={handleUpdateStatus}
                  view={view}
                  isFocusMode={isFocusMode}
                  onToggleFocusMode={() => setIsFocusMode(!isFocusMode)}
                  onChangeView={(v) => setView(v)}
                />
              </div>
            </div>
          </TabsContent>
          <TabsContent value="trash">
            <TrashBin onRestore={handleRestoreTask} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}