import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, Plus } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Task } from "@shared/schema";
import { format, isToday, isSameDay, addDays, subDays, startOfDay, endOfDay, parseISO } from "date-fns";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { categoryIcons } from "@shared/schema";
import { TaskTimer } from "@/components/task-timer";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [view, setView] = useState<"day" | "timeline">("day");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  // Handle time update
  const handleTimeUpdate = (taskId: number, timeSpent: number) => {
    // Update the task in the cache
    queryClient.setQueryData<Task[]>(["/api/tasks"], (oldTasks = []) => {
      return oldTasks.map(task => 
        task.id === taskId ? { ...task, timeSpent } : task
      );
    });

    toast({
      title: "Time updated",
      description: "Task time has been updated successfully.",
    });
  };

  // Format time for display
  const formatTime = (time: string | Date) => {
    return format(typeof time === 'string' ? parseISO(time) : time, 'h:mm a');
  };

  // Get tasks for selected date
  const tasksForSelectedDate = tasks.filter(task => {
    if (task.dueDate) {
      return isSameDay(new Date(task.dueDate), selectedDate);
    }
    return false;
  });

  // Group tasks by hour for timeline view
  const timelineGroups = tasksForSelectedDate.reduce((acc, task) => {
    if (task.dueDate) {
      const hour = format(new Date(task.dueDate), 'HH:00');
      if (!acc[hour]) {
        acc[hour] = [];
      }
      acc[hour].push(task);
    }
    return acc;
  }, {} as Record<string, Task[]>);

  // Create hours array for timeline
  const hours = Array.from({ length: 24 }, (_, i) => 
    format(new Date().setHours(i, 0, 0, 0), 'HH:00')
  );

  // Navigation functions
  const goToPreviousDay = () => setSelectedDate(subDays(selectedDate, 1));
  const goToNextDay = () => setSelectedDate(addDays(selectedDate, 1));
  const goToToday = () => setSelectedDate(new Date());

  // Get task counts for each date
  const tasksByDate = tasks.reduce((acc, task) => {
    if (task.dueDate) {
      const dateStr = format(new Date(task.dueDate), 'yyyy-MM-dd');
      acc[dateStr] = (acc[dateStr] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col gap-8">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold flex items-center gap-2">
            <CalendarIcon className="h-8 w-8" />
            Calendar
          </h1>
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => setView(view === "day" ? "timeline" : "day")}>
              {view === "day" ? "Switch to Timeline" : "Switch to Day View"}
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar Section */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Monthly View</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center mb-4 space-x-2">
                <Button variant="outline" size="sm" onClick={goToPreviousDay}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button 
                  variant={isToday(selectedDate) ? "default" : "outline"} 
                  size="sm" 
                  onClick={goToToday}
                >
                  Today
                </Button>
                <Button variant="outline" size="sm" onClick={goToNextDay}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="rounded-md border"
                modifiers={{
                  hasTask: (date) => {
                    const dateStr = format(date, 'yyyy-MM-dd');
                    return dateStr in tasksByDate;
                  }
                }}
                modifiersStyles={{
                  hasTask: {
                    backgroundColor: 'hsl(var(--primary) / 0.1)',
                    color: 'hsl(var(--primary))',
                    fontWeight: '500'
                  }
                }}
                components={{
                  DayContent: ({ date }) => {
                    const dateStr = format(date, 'yyyy-MM-dd');
                    const count = tasksByDate[dateStr];
                    return (
                      <div className="relative w-full h-full flex items-center justify-center">
                        <span>{format(date, 'd')}</span>
                        {count && (
                          <span className="absolute bottom-0 right-0 w-2 h-2 bg-primary rounded-full" />
                        )}
                      </div>
                    );
                  }
                }}
              />
            </CardContent>
          </Card>

          {/* Tasks Section */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  {format(selectedDate, 'MMMM d, yyyy')}
                  {isToday(selectedDate) && (
                    <Badge variant="outline" className="ml-2">Today</Badge>
                  )}
                </CardTitle>
                <Badge variant="secondary">
                  {tasksForSelectedDate.length} {tasksForSelectedDate.length === 1 ? 'task' : 'tasks'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {view === "day" ? (
                <ScrollArea className="h-[600px] pr-4">
                  {tasksForSelectedDate.length > 0 ? (
                    <div className="space-y-4">
                      {tasksForSelectedDate.map((task) => (
                        <Card key={task.id} className="bg-muted/50">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-4">
                              <Checkbox checked={task.completed} />
                              <div className="flex-1">
                                <div className="flex items-start justify-between gap-2">
                                  <h3 className="font-medium">{task.title}</h3>
                                  <Badge className={
                                    task.priority === 'high' ? 'bg-red-500' :
                                    task.priority === 'medium' ? 'bg-yellow-500' :
                                    'bg-blue-500'
                                  }>
                                    {task.priority}
                                  </Badge>
                                </div>

                                <div className="mt-2 flex flex-wrap gap-2">
                                  {task.category && (
                                    <Badge variant="outline" className="flex items-center gap-1">
                                      <span>{categoryIcons[task.category]}</span>
                                      {task.category}
                                    </Badge>
                                  )}
                                  {task.tags?.map((tag) => (
                                    <Badge key={tag} variant="secondary">
                                      #{tag}
                                    </Badge>
                                  ))}
                                </div>

                                {task.dueDate && (
                                  <p className="mt-2 text-sm text-muted-foreground">
                                    Due at {formatTime(task.dueDate)}
                                  </p>
                                )}

                                {task.notes && (
                                  <p className="mt-2 text-sm text-muted-foreground bg-muted p-2 rounded">
                                    {task.notes}
                                  </p>
                                )}

                                <TaskTimer 
                                  task={task} 
                                  onTimeUpdate={handleTimeUpdate}
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <CalendarIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
                      <p className="text-muted-foreground">
                        No tasks scheduled for this date
                      </p>
                    </div>
                  )}
                </ScrollArea>
              ) : (
                <ScrollArea className="h-[600px]">
                  <div className="space-y-1">
                    {hours.map((hour) => (
                      <div key={hour} className="flex items-start gap-4 p-2 rounded hover:bg-muted/50">
                        <div className="w-16 text-sm text-muted-foreground">
                          {format(parseISO(`2000-01-01T${hour}`), 'h a')}
                        </div>
                        <div className="flex-1">
                          {timelineGroups[hour]?.map((task) => (
                            <Card key={task.id} className="mb-2 bg-muted/50">
                              <CardContent className="p-2">
                                <div className="flex items-center gap-2">
                                  <Checkbox checked={task.completed} />
                                  <span className="font-medium">{task.title}</span>
                                  <Badge variant="outline" className="ml-auto">
                                    {task.priority}
                                  </Badge>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}