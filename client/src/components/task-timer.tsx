import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Timer, Pause, Play } from "lucide-react";
import { format } from "date-fns";
import { Task } from "@shared/schema";

interface TaskTimerProps {
  task: Task;
  onTimeUpdate: (taskId: number, timeSpent: number) => void;
}

export function TaskTimer({ task, onTimeUpdate }: TaskTimerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [timeSpent, setTimeSpent] = useState(task.timeSpent || 0);
  
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning) {
      interval = setInterval(() => {
        setTimeSpent(prev => {
          const newTime = prev + 1;
          onTimeUpdate(task.id, newTime);
          return newTime;
        });
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [isRunning, task.id, onTimeUpdate]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };

  return (
    <div className="flex items-center gap-2">
      <Timer className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm font-mono">{formatTime(timeSpent)}</span>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsRunning(!isRunning)}
      >
        {isRunning ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
