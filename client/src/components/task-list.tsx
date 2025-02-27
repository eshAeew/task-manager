import { useState } from "react";
import { Task } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Trash2, RefreshCw, Timer } from "lucide-react";
import { format } from "date-fns";
import { PomodoroTimer } from "./pomodoro-timer";

interface TaskListProps {
  tasks: Task[];
  onToggleComplete: (id: number) => void;
  onDelete: (id: number) => void;
}

export function TaskList({ tasks, onToggleComplete, onDelete }: TaskListProps) {
  const [filter, setFilter] = useState<string>("all");
  const [activeTimerTaskId, setActiveTimerTaskId] = useState<number | null>(null);

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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
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
                  <div className="flex gap-2 mt-1">
                    <span className={`text-xs px-2 py-1 rounded-full ${priorityBadgeColor(task.priority)}`}>
                      {task.priority}
                    </span>
                    {task.recurrence !== "none" && (
                      <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 flex items-center gap-1">
                        <RefreshCw className="h-3 w-3" />
                        {getRecurrenceText(task)}
                      </span>
                    )}
                  </div>
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