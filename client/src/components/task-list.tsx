import { useState, useEffect } from "react";
import { Task } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Trash2, RefreshCw, Timer, Bell, Download, Upload } from "lucide-react";
import { format, isPast } from "date-fns";
import { PomodoroTimer } from "./pomodoro-timer";
import { useToast } from "@/hooks/use-toast";
import { getTasks, importTasks } from "@/lib/tasks";

interface TaskListProps {
  tasks: Task[];
  onToggleComplete: (id: number) => void;
  onDelete: (id: number) => void;
  onImport: (tasks: Task[]) => void;
}

export function TaskList({ tasks, onToggleComplete, onDelete, onImport }: TaskListProps) {
  const [filter, setFilter] = useState<string>("all");
  const [activeTimerTaskId, setActiveTimerTaskId] = useState<number | null>(null);
  const { toast } = useToast();

  // Check for tasks that need reminders
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      tasks.forEach(task => {
        if (
          task.reminderEnabled &&
          task.reminderTime &&
          !task.completed &&
          Math.abs(now.getTime() - new Date(task.reminderTime).getTime()) < 60000 // Within 1 minute
        ) {
          if (Notification.permission === "granted") {
            new Notification(`Task Reminder: ${task.title}`, {
              body: `Don't forget to complete this task!`,
              icon: "/favicon.ico"
            });
          }
        }
      });
    };

    const interval = setInterval(checkReminders, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [tasks]);

  const filteredTasks = tasks.filter(task => {
    if (filter === "all") return true;
    return task.priority === filter;
  });

  const priorityBadgeColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "medium": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "low": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      default: return "";
    }
  };

  const getRecurrenceText = (task: Task) => {
    if (!task.recurrence || task.recurrence === "none") return null;

    const recurrenceMap = {
      daily: "Repeats daily",
      weekly: "Repeats weekly",
      monthly: "Repeats monthly",
      custom: `Repeats every ${task.recurrenceInterval}`,
    };

    return recurrenceMap[task.recurrence];
  };

  const handleExport = () => {
    const allTasks = getTasks();
    const dataStr = JSON.stringify(allTasks, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;

    const link = document.createElement('a');
    link.setAttribute('href', dataUri);
    link.setAttribute('download', `tasks-${format(new Date(), 'yyyy-MM-dd')}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Tasks Exported",
      description: "Your tasks have been exported successfully.",
    });
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const tasks = JSON.parse(e.target?.result as string);
        importTasks(tasks);
        onImport(tasks);
        toast({
          title: "Tasks Imported",
          description: "Your tasks have been imported successfully.",
        });
      } catch (error) {
        toast({
          title: "Import Failed",
          description: "Failed to import tasks. Please check the file format.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset input
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-4">
            Tasks
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
            <div className="relative">
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Import
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {filteredTasks.map(task => (
          <div key={task.id} className="flex flex-col p-4 rounded-lg border">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <Checkbox
                  checked={task.completed}
                  onCheckedChange={() => onToggleComplete(task.id)}
                />
                <div>
                  <p className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                    {task.title}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    <span className={`text-xs px-2 py-1 rounded-full ${priorityBadgeColor(task.priority)}`}>
                      {task.priority}
                    </span>
                    {task.recurrence !== "none" && (
                      <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 flex items-center gap-1">
                        <RefreshCw className="h-3 w-3" />
                        {getRecurrenceText(task)}
                      </span>
                    )}
                    {task.reminderEnabled && task.reminderTime && (
                      <span className="text-xs px-2 py-1 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 flex items-center gap-1">
                        <Bell className="h-3 w-3" />
                        Reminder: {format(task.reminderTime, "PPp")}
                      </span>
                    )}
                  </div>
                  {task.dueDate && (
                    <p className={`text-xs mt-1 ${
                      isPast(task.dueDate) && !task.completed
                        ? "text-red-600 dark:text-red-400"
                        : "text-muted-foreground"
                    }`}>
                      Due: {format(task.dueDate, "PPP")}
                    </p>
                  )}
                  {task.nextDue && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Next due: {format(task.nextDue, "PPP")}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setActiveTimerTaskId(
                    activeTimerTaskId === task.id ? null : task.id
                  )}
                >
                  <Timer className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onDelete(task.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {activeTimerTaskId === task.id && (
              <div className="mt-4 border-t pt-4">
                <PomodoroTimer taskTitle={task.title} />
              </div>
            )}
          </div>
        ))}
        {filteredTasks.length === 0 && (
          <p className="text-center text-muted-foreground">No tasks found</p>
        )}
      </CardContent>
    </Card>
  );
}