import { cn } from "@/lib/utils";

interface PriorityIndicatorProps {
  priority: string;
  className?: string;
}

export function PriorityIndicator({ priority, className }: PriorityIndicatorProps) {
  const getColor = () => {
    switch (priority.toLowerCase()) {
      case "high":
        return "bg-red-500 dark:bg-red-600";
      case "medium":
        return "bg-yellow-500 dark:bg-yellow-600";
      case "low":
        return "bg-blue-500 dark:bg-blue-600";
      default:
        return "bg-gray-500 dark:bg-gray-600";
    }
  };

  const getWidth = () => {
    switch (priority.toLowerCase()) {
      case "high":
        return "w-full";
      case "medium":
        return "w-2/3";
      case "low":
        return "w-1/3";
      default:
        return "w-0";
    }
  };

  return (
    <div className={cn("h-1.5 rounded-full bg-muted overflow-hidden w-16", className)}>
      <div className={`h-full ${getColor()} ${getWidth()}`} />
    </div>
  );
}