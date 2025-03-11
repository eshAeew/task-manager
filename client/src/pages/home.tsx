import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Task, InsertTask } from "@shared/schema";
import { getTasks, addTask, updateTask, deleteTask } from "@/lib/tasks";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, CheckCircle2, Circle } from "lucide-react";
import { format } from "date-fns";
import { TaskForm } from "@/components/task-form";
import { ThemeToggle } from "@/components/theme-toggle";
import { AnalyticsDashboard } from "@/components/analytics-dashboard";
import { TrashBin } from "@/components/trash-bin";
import { VoiceInput } from "@/components/voice-input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { suggestTaskPriority } from "@/lib/task-analyzer";

export default function Home() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<"list" | "kanban">("list");
  const [isFocusMode, setIsFocusMode] = useState(false);

  const { data: tasks = [] } = useQuery({
    queryKey: ["/api/tasks"],
    queryFn: getTasks,
  });

  const handleAddTask = (data: InsertTask) => {
    const newTask = addTask(data);
    queryClient.setQueryData<Task[]>(["/api/tasks"], (oldTasks) => {
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
    };
    handleAddTask(newTask);
  };

  const handleToggleComplete = (task: Task) => {
    const updated = updateTask(task.id, { completed: !task.completed });
    if (updated) {
      queryClient.setQueryData<Task[]>(["/api/tasks"], prev =>
        prev?.map(t => t.id === task.id ? updated : t) || []
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
                <div className="grid gap-6">
                  {tasks.map((task) => (
                    <Card key={task.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="flex items-center gap-3">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleComplete(task)}
                          >
                            {task.completed ? (
                              <CheckCircle2 className="h-5 w-5 text-primary" />
                            ) : (
                              <Circle className="h-5 w-5" />
                            )}
                          </Button>
                          <CardTitle className={task.completed ? "line-through text-muted-foreground" : ""}>
                            {task.title}
                          </CardTitle>
                        </div>
                        <Badge
                          variant={
                            task.priority === 'high' ? 'destructive' :
                              task.priority === 'medium' ? 'default' :
                                'secondary'
                          }
                        >
                          {task.priority}
                        </Badge>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CalendarDays className="h-4 w-4" />
                          {task.dueDate ? (
                            format(new Date(task.dueDate), 'PPP')
                          ) : (
                            'No due date'
                          )}
                        </div>
                        {task.category && (
                          <Badge variant="outline" className="mt-2">
                            {task.category}
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                  ))}

                  {tasks.length === 0 && (
                    <div className="text-center py-12">
                      <h3 className="text-lg font-medium mb-2">No tasks yet</h3>
                      <p className="text-muted-foreground">
                        Add a new task using the button below
                      </p>
                    </div>
                  )}
                </div>
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