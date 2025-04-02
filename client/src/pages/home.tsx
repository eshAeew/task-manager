import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { TaskForm } from "@/components/task-form";
import { TaskList } from "@/components/task-list";
import { ThemeToggle } from "@/components/theme-toggle";
import { MiniDashboard } from "@/components/mini-dashboard";
import { TrashBin } from "@/components/trash-bin";
import { VoiceInput } from "@/components/voice-input";
import { DateFilter } from "@/components/date-filter";
import { getTasks, addTask, updateTask, deleteTask } from "@/lib/tasks";
import type { Task, InsertTask } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { suggestTaskPriority } from "@/lib/task-analyzer";
import { startOfDay, endOfDay, isWithinInterval } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function Home() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<"list" | "kanban">("list");
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const { data: tasks = [], refetch } = useQuery({
    queryKey: ["/api/tasks"],
    queryFn: getTasks,
  });

  const handleAddTask = (data: InsertTask) => {
    const newTask = addTask(data);
    queryClient.setQueryData<Task[]>(["/api/tasks"], (oldTasks) => {
      return [...(oldTasks || []), newTask];
    });
  };

  const handleEditTask = (taskId: number) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setTaskToEdit(task);
      setEditDialogOpen(true);
    }
  };

  const handleUpdateTask = (data: InsertTask) => {
    if (!taskToEdit) return;
    
    const updated = updateTask(taskToEdit.id, data);
    if (updated) {
      queryClient.setQueryData<Task[]>(["/api/tasks"], prev => 
        prev?.map(t => t.id === taskToEdit.id ? updated : t) || []
      );
      setEditDialogOpen(false);
      setTaskToEdit(null);
    }
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
      dueDate: new Date()
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
      queryClient.setQueryData<Task[]>(["/api/tasks"], prev => 
        prev?.map(t => t.id === id ? updated : t) || []
      );
    }
  };

  const handleUpdateStatus = (id: number, status: Task["status"]) => {
    const updated = updateTask(id, { status });
    if (updated) {
      queryClient.setQueryData<Task[]>(["/api/tasks"], prev => 
        prev?.map(t => t.id === id ? updated : t) || []
      );
    }
  };

  const handleDeleteTask = (id: number) => {
    deleteTask(id);
    queryClient.setQueryData<Task[]>(["/api/tasks"], prev => 
      prev?.filter(t => t.id !== id) || []
    );
  };

  const handleImportTasks = (importedTasks: Task[]) => {
    queryClient.setQueryData<Task[]>(["/api/tasks"], importedTasks);
  };

  const handleRestoreTask = (task: Task) => {
    queryClient.setQueryData<Task[]>(["/api/tasks"], prev => 
      [...(prev || []), task]
    );
  };

  const handleTimeUpdate = (taskId: number, timeSpent: number) => {
    const updated = updateTask(taskId, { timeSpent });
    if (updated) {
      queryClient.setQueryData<Task[]>(["/api/tasks"], prev => 
        prev?.map(t => t.id === taskId ? updated : t) || []
      );
    }
  };

  const filteredTasks = selectedDate
    ? tasks.filter(task => {
        if (!task.dueDate) return false;
        // Convert string or Date to Date object safely
        const taskDueDate = task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate);
        return isWithinInterval(taskDueDate, {
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
            <VoiceInput onTranscript={handleVoiceInput} />
            <ThemeToggle />
          </div>
        </div>

        <div className="mb-8">
          <MiniDashboard tasks={tasks} />
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
                  onEditTask={handleEditTask}
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

      {/* Edit Task Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          {taskToEdit && (
            <TaskForm 
              onSubmit={handleUpdateTask} 
              defaultValues={taskToEdit}
              onCancel={() => setEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}