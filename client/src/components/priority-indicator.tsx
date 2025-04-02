import { useMemo } from "react";

interface PriorityIndicatorProps {
  priority: string;
  className?: string;
}

export function PriorityIndicator({ priority, className }: PriorityIndicatorProps) {
  const { color, label } = useMemo(() => {
    switch (priority.toLowerCase()) {
      case 'high':
        return { color: 'bg-red-500', label: 'High' };
      case 'medium':
        return { color: 'bg-yellow-500', label: 'Medium' };
      case 'low':
        return { color: 'bg-blue-500', label: 'Low' };
      default:
        return { color: 'bg-gray-400', label: 'Unknown' };
    }
  }, [priority]);

  return (
    <div className={`flex items-center gap-1 ${className || ''}`}>
      <div className={`h-2 w-2 rounded-full ${color}`} />
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}