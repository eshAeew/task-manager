import { Progress } from "@/components/ui/progress";
import { Task } from "@shared/schema";
import { useEffect, useState } from "react";

interface TaskProgressProps {
  tasks: Task[];
  className?: string;
}

export function TaskProgress({ tasks, className }: TaskProgressProps) {
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    if (tasks.length === 0) {
      setProgress(0);
      return;
    }
    
    const completedCount = tasks.filter(task => task.completed).length;
    const progressValue = Math.round((completedCount / tasks.length) * 100);
    
    // Animate the progress bar
    const timer = setTimeout(() => {
      setProgress(progressValue);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [tasks]);
  
  if (tasks.length === 0) {
    return null;
  }
  
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between items-center">
        <p className="text-sm font-medium">Task Completion</p>
        <p className="text-sm text-muted-foreground">{progress}%</p>
      </div>
      <Progress value={progress} className="h-2" />
      <p className="text-xs text-muted-foreground">
        {tasks.filter(task => task.completed).length} of {tasks.length} tasks completed
      </p>
    </div>
  );
}