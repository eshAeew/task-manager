import { Task } from "@shared/schema";
import { addDays, format, isSameDay } from "date-fns";
import { CalendarDays, RefreshCw } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface RecurrenceVisualizationProps {
  task: Task;
  compact?: boolean;
}

export function RecurrenceVisualization({ task, compact = false }: RecurrenceVisualizationProps) {
  if (!task.recurrence || task.recurrence === "none") {
    return null;
  }

  // Generate the next 5 occurrences based on recurrence pattern
  const generateNextOccurrences = (task: Task): Date[] => {
    if (!task.dueDate) return [];
    
    const occurrences: Date[] = [];
    const baseDate = new Date(task.dueDate);
    
    for (let i = 0; i < 5; i++) {
      let nextDate: Date;
      
      switch (task.recurrence) {
        case "daily":
          nextDate = addDays(baseDate, i);
          break;
        case "weekly":
          nextDate = addDays(baseDate, i * 7);
          break;
        case "monthly":
          const newDate = new Date(baseDate);
          newDate.setMonth(baseDate.getMonth() + i);
          nextDate = newDate;
          break;
        case "custom":
          if (!task.recurrenceInterval) {
            nextDate = addDays(baseDate, i);
          } else {
            const interval = parseInt(task.recurrenceInterval, 10) || 1;
            nextDate = addDays(baseDate, i * interval);
          }
          break;
        default:
          nextDate = addDays(baseDate, i);
      }
      
      occurrences.push(nextDate);
    }
    
    return occurrences;
  };

  const nextOccurrences = generateNextOccurrences(task);
  
  const getRecurrenceText = () => {
    const recurrenceMap: Record<string, string> = {
      daily: "Repeats daily",
      weekly: "Repeats weekly",
      monthly: "Repeats monthly",
      custom: `Repeats every ${task.recurrenceInterval || 1} day(s)`,
    };

    return recurrenceMap[task.recurrence] || "Repeats";
  };

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1 text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-1 rounded-full">
              <RefreshCw className="h-3 w-3" />
              <span>{task.recurrence}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent className="bg-white dark:bg-slate-900 p-3 shadow-lg rounded-lg border">
            <div className="space-y-2">
              <p className="font-medium">{getRecurrenceText()}</p>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Next occurrences:</p>
                <div className="space-y-1">
                  {nextOccurrences.slice(0, 3).map((date, index) => (
                    <div key={index} className="flex items-center gap-1 text-xs">
                      <CalendarDays className="h-3 w-3 text-muted-foreground" />
                      <span>{format(date, "EEE, MMM d, yyyy")}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="border rounded-md p-3 bg-purple-50 dark:bg-purple-950">
      <div className="flex items-center gap-2 mb-2">
        <RefreshCw className="h-4 w-4 text-purple-600 dark:text-purple-400" />
        <h4 className="font-medium text-sm">{getRecurrenceText()}</h4>
      </div>
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">Next occurrences:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
          {nextOccurrences.map((date, index) => (
            <div key={index} className="flex items-center gap-1 text-xs">
              <CalendarDays className="h-3 w-3 text-muted-foreground" />
              <span>{format(date, "EEE, MMM d, yyyy")}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}