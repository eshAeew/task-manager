import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { TaskForm } from "@/components/task-form";
import { TaskList } from "@/components/task-list";
import { ThemeToggle } from "@/components/theme-toggle";
import { AnalyticsDashboard } from "@/components/analytics-dashboard";
import { TrashBin } from "@/components/trash-bin";
import { VoiceInput } from "@/components/voice-input";
import { DateFilter } from "@/components/date-filter";
import { UserProfile } from "@/components/user-profile";
import { getTasks, addTask, updateTask, deleteTask } from "@/lib/tasks";
import type { Task, InsertTask } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { suggestTaskPriority } from "@/lib/task-analyzer";
import { startOfDay, endOfDay, isWithinInterval } from "date-fns";

export default function Home() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<"list" | "kanban">("list");
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [userUuid, setUserUuid] = useState<string>("");

  useEffect(() => {
    const storedUuid = localStorage.getItem("userUuid");
    if (storedUuid) {
      setUserUuid(storedUuid);
    } else {
      const newUuid = crypto.randomUUID();
      localStorage.setItem("userUuid", newUuid);
      setUserUuid(newUuid);
    }
  }, []);

  const { data: tasks = [], refetch } = useQuery({
    queryKey: ["/api/tasks", userUuid],
    queryFn: () => getTasks(userUuid),
    enabled: !!userUuid,
  });

  const handleAddTask = (data: InsertTask) => {
    const taskWithUuid = {
      ...data,
      userUuid,
      isShared: false,
    };
    const newTask = addTask(taskWithUuid);
    queryClient.setQueryData<Task[]>(["/api/tasks", userUuid], (oldTasks) => {
      return [...(oldTasks || []), newTask];
    });
  };

  const handleVoiceInput = (transcript: string) => {
    const newTask: InsertTask = {
      title: transcript,
      priority: suggestTaskPriority(transcript),
      completed: false,
      recurrence: "none",
      reminderEnabled: false,
      status: "todo",
      category: "other",
      timeSpent: 0,
      xpEarned: 0,
      dueDate: new Date(),
      userUuid,
      isShared: false
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
      queryClient.setQueryData<Task[]>(["/api/tasks", userUuid], prev => 
        prev?.map(t => t.id === id ? updated : t) || []
      );
    }
  };

  const handleUpdateStatus = (id: number, status: Task["status"]) => {
    const updated = updateTask(id, { status });
    if (updated) {
      queryClient.setQueryData<Task[]>(["/api/tasks", userUuid], prev => 
        prev?.map(t => t.id === id ? updated : t) || []
      );
    }
  };

  const handleDeleteTask = (id: number) => {
    deleteTask(id);
    queryClient.setQueryData<Task[]>(["/api/tasks", userUuid], prev => 
      prev?.filter(t => t.id !== id) || []
    );
  };

  const handleImportTasks = (importedTasks: Task[]) => {
    queryClient.setQueryData<Task[]>(["/api/tasks", userUuid], importedTasks);
  };

  const handleRestoreTask = (task: Task) => {
    queryClient.setQueryData<Task[]>(["/api/tasks", userUuid], prev => 
      [...(prev || []), task]
    );
  };

  const handleTimeUpdate = (taskId: number, timeSpent: number) => {
    const updated = updateTask(taskId, { timeSpent });
    if (updated) {
      queryClient.setQueryData<Task[]>(["/api/tasks", userUuid], prev => 
        prev?.map(t => t.id === taskId ? updated : t) || []
      );
    }
  };

  const filteredTasks = selectedDate
    ? tasks.filter(task => {
        const taskDate = new Date(task.dueDate || task.createdAt);
        return isWithinInterval(taskDate, {
          start: startOfDay(selectedDate),
          end: endOfDay(selectedDate)
        });
      })
    : tasks;

  return (
    <div className={`min-h-screen bg-background ${isFocusMode ? 'bg-black/95' : ''}`}>
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Task Manager</h1>
          <div className="flex items-center gap-2">
            <UserProfile />
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
                <div className="mb-4">
                  <DateFilter
                    selectedDate={selectedDate}
                    onDateSelect={setSelectedDate}
                  />
                </div>
                <TaskList 
                  tasks={filteredTasks}
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