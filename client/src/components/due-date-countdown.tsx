import { useMemo } from "react";
import { differenceInMinutes, differenceInHours, differenceInDays, isPast, isToday } from "date-fns";

interface DueDateCountdownProps {
  dueDate: Date | string;
  className?: string;
}

export function DueDateCountdown({ dueDate, className }: DueDateCountdownProps) {
  const { text, status } = useMemo(() => {
    const date = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
    
    // If date is invalid, return error
    if (isNaN(date.getTime())) {
      return { text: "Invalid date", status: "neutral" };
    }
    
    // Check if past
    if (isPast(date) && !isToday(date)) {
      return { text: "Overdue!", status: "danger" };
    }
    
    // Calculate differences
    const now = new Date();
    const diffMinutes = differenceInMinutes(date, now);
    const diffHours = differenceInHours(date, now);
    const diffDays = differenceInDays(date, now);
    
    // Determine text and status based on time left
    if (diffDays > 7) {
      return { text: `${diffDays} days left`, status: "safe" };
    } else if (diffDays > 2) {
      return { text: `${diffDays} days left`, status: "normal" };
    } else if (diffDays > 0) {
      return { text: `${diffDays} days left`, status: "warning" };
    } else if (diffHours > 0) {
      return { text: `${diffHours} hours left`, status: "urgent" };
    } else if (diffMinutes > 0) {
      return { text: `${diffMinutes} minutes left`, status: "critical" };
    } else {
      return { text: "Due now", status: "danger" };
    }
  }, [dueDate]);
  
  const statusClassMap = {
    safe: "text-green-600",
    normal: "text-blue-600",
    warning: "text-amber-600",
    urgent: "text-orange-600",
    critical: "text-red-600",
    danger: "text-red-600 font-bold",
    neutral: "text-gray-600",
  };
  
  return (
    <span className={`${statusClassMap[status as keyof typeof statusClassMap]} ${className || ""}`}>
      {text}
    </span>
  );
}