import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Task } from "@shared/schema";
import { Clock, CalendarClock } from "lucide-react";

interface TimeTrackingSummaryProps {
  tasks: Task[];
  className?: string;
}

export function TimeTrackingSummary({ tasks, className }: TimeTrackingSummaryProps) {
  // Calculate total time spent in seconds
  const totalTimeSpent = tasks.reduce((total, task) => {
    return total + (task.timeSpent || 0);
  }, 0);
  
  // Calculate time spent by category
  const timeByCategory: Record<string, number> = {};
  tasks.forEach(task => {
    if (task.timeSpent && task.timeSpent > 0) {
      if (!timeByCategory[task.category]) {
        timeByCategory[task.category] = 0;
      }
      timeByCategory[task.category] += task.timeSpent;
    }
  });
  
  // Format seconds into hours, minutes, seconds
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
    }
  };
  
  const sortedCategories = Object.entries(timeByCategory).sort((a, b) => b[1] - a[1]);
  
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Time Tracking Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Total time spent:</span>
            <span className="text-sm font-bold">{formatTime(totalTimeSpent)}</span>
          </div>
          
          {sortedCategories.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">By category:</p>
              <div className="space-y-1">
                {sortedCategories.map(([category, time]) => (
                  <div key={category} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{category}:</span>
                    <span>{formatTime(time)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {tasks.filter(t => t.timeSpent && t.timeSpent > 0).length === 0 && (
            <p className="text-xs text-muted-foreground">No time tracking data recorded yet. Use the timer on your tasks to track time.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}