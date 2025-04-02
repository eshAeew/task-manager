import { useMemo } from "react";
import { Task } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PriorityIndicator } from "./priority-indicator";
import { CalendarDays, Clock } from "lucide-react";
import { format, isToday, isTomorrow, addDays, isWithinInterval } from "date-fns";
import { DueDateCountdown } from "./due-date-countdown";
import { Button } from "./ui/button";

interface UpcomingTasksProps {
  tasks: Task[];
  onToggleComplete: (id: number) => void;
  onEditTask: (task: Task) => void;
}

export function UpcomingTasks({ tasks, onToggleComplete, onEditTask }: UpcomingTasksProps) {
  const upcomingTasks = useMemo(() => {
    const today = new Date();
    const nextWeek = addDays(today, 7);
    
    return tasks
      .filter(task => 
        !task.completed && 
        task.dueDate && 
        isWithinInterval(new Date(task.dueDate), { start: today, end: nextWeek })
      )
      .sort((a, b) => {
        // Sort by due date first
        const dateA = new Date(a.dueDate!);
        const dateB = new Date(b.dueDate!);
        
        if (dateA.getTime() !== dateB.getTime()) {
          return dateA.getTime() - dateB.getTime();
        }
        
        // If due dates are the same, sort by priority
        const priorityValues = { high: 3, medium: 2, low: 1 };
        return (priorityValues[b.priority] || 0) - (priorityValues[a.priority] || 0);
      })
      .slice(0, 5); // Limit to 5 tasks
  }, [tasks]);

  const getDateLabel = (date: Date) => {
    if (isToday(date)) {
      return "Today";
    } else if (isTomorrow(date)) {
      return "Tomorrow";
    } else {
      return format(date, "EEE, MMM d");
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Upcoming Tasks</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {upcomingTasks.length > 0 ? (
            upcomingTasks.map(task => (
              <div 
                key={task.id} 
                className="flex border rounded-md p-3 hover:bg-secondary/30 transition-colors"
              >
                <div className="mr-2 mt-0.5">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => onToggleComplete(task.id)}
                    className="h-4 w-4 rounded border-gray-300 cursor-pointer"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-medium truncate">{task.title}</div>
                    <PriorityIndicator priority={task.priority} />
                  </div>
                  
                  {task.dueDate && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <CalendarDays className="h-3.5 w-3.5 mr-1.5" />
                      <span>{getDateLabel(new Date(task.dueDate))}</span>
                      <span className="mx-1">•</span>
                      <DueDateCountdown dueDate={task.dueDate} className="text-xs" />
                    </div>
                  )}
                </div>
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="ml-2 h-8 w-8 p-0"
                  onClick={() => onEditTask(task)}
                >
                  <Clock className="h-4 w-4" />
                </Button>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <p>No upcoming tasks due this week</p>
              <p className="text-sm">Create tasks with due dates to see them here</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}