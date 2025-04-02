import { useMemo } from "react";
import { Task } from "@shared/schema";
import { format, addDays, addWeeks, addMonths, parseISO } from "date-fns";
import { Calendar, Clock, RepeatIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface RecurrenceVisualizationProps {
  task: Task;
  compact?: boolean;
}

export function RecurrenceVisualization({ task, compact = false }: RecurrenceVisualizationProps) {
  // Generate next occurrences based on recurrence pattern
  const nextOccurrences = useMemo(() => {
    if (task.recurrence === "none") return [];
    return generateNextOccurrences(task);
  }, [task]);

  const generateNextOccurrences = (task: Task): Date[] => {
    if (task.recurrence === "none") return [];
    
    // Start from either next due date or current date
    const startDate = task.nextDue 
      ? new Date(task.nextDue) 
      : task.dueDate 
        ? new Date(task.dueDate) 
        : new Date();
        
    // Show next 3 occurrences
    const occurrences: Date[] = [];
    let lastDate = new Date(startDate);
    
    for (let i = 0; i < 3; i++) {
      let nextDate: Date;
      
      switch (task.recurrence) {
        case "daily":
          nextDate = addDays(lastDate, 1);
          break;
        case "weekly":
          nextDate = addWeeks(lastDate, 1);
          break;
        case "monthly":
          nextDate = addMonths(lastDate, 1);
          break;
        case "custom":
          // Try to parse the interval as a number of days
          if (task.recurrenceInterval) {
            const days = parseInt(task.recurrenceInterval);
            if (!isNaN(days)) {
              nextDate = addDays(lastDate, days);
              break;
            }
          }
          // Default to weekly if custom interval is invalid
          nextDate = addWeeks(lastDate, 1);
          break;
        default:
          nextDate = addDays(lastDate, 1);
      }
      
      occurrences.push(nextDate);
      lastDate = nextDate;
    }
    
    return occurrences;
  };

  const getRecurrenceText = (task: Task): string => {
    switch (task.recurrence) {
      case "daily": return "Repeats daily";
      case "weekly": return "Repeats weekly";
      case "monthly": return "Repeats monthly";
      case "custom": 
        if (task.recurrenceInterval) {
          const days = parseInt(task.recurrenceInterval);
          if (!isNaN(days)) {
            return `Repeats every ${days} day${days !== 1 ? 's' : ''}`;
          }
        }
        return "Custom repeat";
      default: return "";
    }
  };

  if (task.recurrence === "none") {
    return null;
  }

  if (compact) {
    return (
      <Badge variant="outline" className="flex items-center font-normal">
        <RepeatIcon className="h-3 w-3 mr-1" />
        {task.recurrence}
      </Badge>
    );
  }

  return (
    <div className="mt-2">
      <div className="flex items-center mb-1 text-sm text-muted-foreground">
        <RepeatIcon className="h-3.5 w-3.5 mr-1" />
        <span>{getRecurrenceText(task)}</span>
      </div>
      
      {nextOccurrences.length > 0 && (
        <div className="text-xs text-muted-foreground space-y-1">
          <div className="font-medium">Next occurrences:</div>
          <div className="grid grid-cols-1 gap-1">
            {nextOccurrences.map((date, index) => (
              <div key={index} className="flex items-center">
                <Calendar className="h-3 w-3 mr-1.5" />
                <span>{format(date, "EEE, MMM d, yyyy")}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}