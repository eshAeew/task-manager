import { Task } from "@shared/schema";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Clock, CalendarClock, AlertTriangle } from "lucide-react";
import { Link } from "wouter";
import { useEffect, useState } from "react";
import { isPast } from "date-fns";

interface MiniDashboardProps {
  tasks: Task[];
}

export function MiniDashboard({ tasks }: MiniDashboardProps) {
  const [completionRate, setCompletionRate] = useState(0);
  
  useEffect(() => {
    if (tasks.length === 0) {
      setCompletionRate(0);
      return;
    }
    
    const completedCount = tasks.filter(task => task.completed).length;
    const progressValue = Math.round((completedCount / tasks.length) * 100);
    
    // Animate the progress
    const timer = setTimeout(() => {
      setCompletionRate(progressValue);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [tasks]);
  
  // Count tasks due today/overdue
  const overdueCount = tasks.filter(task => 
    !task.completed && task.dueDate && isPast(new Date(task.dueDate))
  ).length;
  
  // High priority tasks
  const highPriorityCount = tasks.filter(task => 
    !task.completed && task.priority === "high"
  ).length;
  
  return (
    <Card className="bg-card">
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="flex flex-col items-center justify-center p-3 border rounded-md bg-background">
            <div className="mb-2 text-xl font-bold">{tasks.length}</div>
            <div className="text-xs text-muted-foreground text-center">Total Tasks</div>
          </div>
          
          <div className="flex flex-col items-center justify-center p-3 border rounded-md bg-background">
            <div className="mb-2 text-xl font-bold flex items-center gap-1">
              <CheckCircle className="h-4 w-4 text-green-500" />
              {tasks.filter(t => t.completed).length}
            </div>
            <div className="text-xs text-muted-foreground text-center">Completed</div>
          </div>
          
          <div className="flex flex-col items-center justify-center p-3 border rounded-md bg-background">
            <div className="mb-2 text-xl font-bold flex items-center gap-1">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              {highPriorityCount}
            </div>
            <div className="text-xs text-muted-foreground text-center">High Priority</div>
          </div>
          
          <div className="flex flex-col items-center justify-center p-3 border rounded-md bg-background">
            <div className="mb-2 text-xl font-bold flex items-center gap-1">
              <Clock className="h-4 w-4 text-red-500" />
              {overdueCount}
            </div>
            <div className="text-xs text-muted-foreground text-center">Overdue</div>
          </div>
        </div>
        
        <div className="mt-4">
          <div className="flex justify-between items-center mb-1">
            <div className="text-sm font-medium">Completion</div>
            <div className="text-sm text-muted-foreground">{completionRate}%</div>
          </div>
          <Progress value={completionRate} className="h-2" />
        </div>
        
        <div className="mt-4 text-center">
          <Link href="/dashboard" className="text-xs text-primary hover:underline inline-flex items-center">
            <CalendarClock className="h-3 w-3 mr-1" />
            View full dashboard
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}