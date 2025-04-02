import { differenceInDays, isPast } from "date-fns";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface DueDateCountdownProps {
  dueDate: Date | string;
  className?: string;
}

export function DueDateCountdown({ dueDate, className }: DueDateCountdownProps) {
  const parsedDueDate = dueDate instanceof Date ? dueDate : new Date(dueDate);
  const today = new Date();
  const daysLeft = differenceInDays(parsedDueDate, today);
  const isOverdue = isPast(parsedDueDate) && daysLeft !== 0;
  
  const getColorClass = () => {
    if (isOverdue) return "text-red-500 dark:text-red-400";
    if (daysLeft === 0) return "text-yellow-500 dark:text-yellow-400";
    if (daysLeft <= 2) return "text-orange-500 dark:text-orange-400";
    return "text-green-500 dark:text-green-400";
  };
  
  const getMessage = () => {
    if (isOverdue) return `Overdue by ${Math.abs(daysLeft)} day${Math.abs(daysLeft) === 1 ? '' : 's'}`;
    if (daysLeft === 0) return "Due today";
    if (daysLeft === 1) return "Due tomorrow";
    return `${daysLeft} days left`;
  };
  
  return (
    <div className={cn("flex items-center gap-1 text-xs font-medium", getColorClass(), className)}>
      <Clock className="h-3 w-3" />
      <span>{getMessage()}</span>
    </div>
  );
}