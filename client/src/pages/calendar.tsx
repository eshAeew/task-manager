import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, Plus, Filter, BarChart } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Task } from "@shared/schema";
import { format, isToday, isSameDay, addDays, subDays, startOfDay, endOfDay, parseISO, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { categoryIcons } from "@shared/schema";
import { TaskTimer } from "@/components/task-timer";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { TaskForm } from "@/components/task-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [view, setView] = useState<"day" | "week" | "timeline">("day");
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  // Handle time update
  const handleTimeUpdate = (taskId: number, timeSpent: number) => {
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

  // Get tasks for selected date or week
  const getTasksForPeriod = () => {
    if (view === "week") {
      const start = startOfWeek(selectedDate);
      const end = endOfWeek(selectedDate);
      return tasks.filter(task => {
        if (!task.dueDate) return false;
        const taskDate = new Date(task.dueDate);
        return taskDate >= start && taskDate <= end;
      });
    }
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      return isSameDay(new Date(task.dueDate), selectedDate);
    });
  };

  // Apply filters
  const filteredTasks = getTasksForPeriod().filter(task => {
    const matchesCategory = filterCategory === "all" || task.category === filterCategory;
    const matchesPriority = filterPriority === "all" || task.priority === filterPriority;
    return matchesCategory && matchesPriority;
  });

  // Group tasks by hour for timeline view
  const timelineGroups = filteredTasks.reduce((acc, task) => {
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

  // Task statistics for the current view
  const taskStats = {
    total: filteredTasks.length,
    completed: filteredTasks.filter(t => t.completed).length,
    high: filteredTasks.filter(t => t.priority === 'high').length,
    medium: filteredTasks.filter(t => t.priority === 'medium').length,
    low: filteredTasks.filter(t => t.priority === 'low').length,
  };

  // Get days for week view
  const weekDays = view === "week" ? eachDayOfInterval({
    start: startOfWeek(selectedDate),
    end: endOfWeek(selectedDate)
  }) : [];

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
            <Select value={view} onValueChange={(v: "day" | "week" | "timeline") => setView(v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select view" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Day View</SelectItem>
                <SelectItem value="week">Week View</SelectItem>
                <SelectItem value="timeline">Timeline</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => setIsAddingTask(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-wrap gap-4">
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="work">Work</SelectItem>
                <SelectItem value="personal">Personal</SelectItem>
                <SelectItem value="study">Study</SelectItem>
                <SelectItem value="shopping">Shopping</SelectItem>
                <SelectItem value="health">Health</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            {/* Task Statistics */}
            <div className="flex gap-2 ml-auto">
              <Badge variant="outline">{taskStats.total} Total</Badge>
              <Badge variant="secondary">{taskStats.completed} Done</Badge>
              <Badge variant="destructive">{taskStats.high} High</Badge>
              <Badge variant="warning">{taskStats.medium} Medium</Badge>
              <Badge variant="default">{taskStats.low} Low</Badge>
            </div>
          </div>
        </Card>

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
                  {view === "week" ? (
                    <span>
                      Week of {format(startOfWeek(selectedDate), 'MMM d')} - {format(endOfWeek(selectedDate), 'MMM d, yyyy')}
                    </span>
                  ) : (
                    <span>
                      {format(selectedDate, 'MMMM d, yyyy')}
                      {isToday(selectedDate) && (
                        <Badge variant="outline" className="ml-2">Today</Badge>
                      )}
                    </span>
                  )}
                </CardTitle>
                <Badge variant="secondary">
                  {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {view === "week" ? (
                <ScrollArea className="h-[600px]">
                  <div className="space-y-4">
                    {weekDays.map(day => {
                      const dayTasks = filteredTasks.filter(task => 
                        task.dueDate && isSameDay(new Date(task.dueDate), day)
                      );
                      return (
                        <div key={format(day, 'yyyy-MM-dd')} className="space-y-2">
                          <h3 className="font-medium">
                            {format(day, 'EEEE, MMM d')}
                            {isToday(day) && (
                              <Badge variant="outline" className="ml-2">Today</Badge>
                            )}
                          </h3>
                          {dayTasks.length > 0 ? (
                            <div className="space-y-2">
                              {dayTasks.map(task => (
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
                                        </div>
                                        {task.dueDate && (
                                          <p className="mt-2 text-sm text-muted-foreground">
                                            Due at {formatTime(task.dueDate)}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">No tasks scheduled</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              ) : view === "timeline" ? (
                <ScrollArea className="h-[600px]">
                  <div className="space-y-1">
                    {hours.map((hour) => (
                      <div key={hour} className="flex items-start gap-4 p-2 rounded hover:bg-muted/50">
                        <div className="w-16 text-sm text-muted-foreground">
                          {format(parseISO(`2000-01-01T${hour}`), 'h a')}
                        </div>
                        <div className="flex-1">
                          {timelineGroups[hour]?.map((task) => (
                            <Card 
                              key={task.id} 
                              className={`mb-2 ${
                                task.priority === 'high' ? 'border-red-500' :
                                task.priority === 'medium' ? 'border-yellow-500' :
                                'border-blue-500'
                              } border-l-4`}
                            >
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
              ) : (
                <ScrollArea className="h-[600px] pr-4">
                  {filteredTasks.length > 0 ? (
                    <div className="space-y-4">
                      {filteredTasks.map((task) => (
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
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Task Dialog */}
      <Dialog open={isAddingTask} onOpenChange={setIsAddingTask}>
        <DialogContent className="max-w-lg">
          <DialogTitle>Add New Task</DialogTitle>
          <TaskForm
            onSubmit={(task) => {
              // Handle task creation
              setIsAddingTask(false);
              toast({
                title: "Task created",
                description: "New task has been added successfully.",
              });
            }}
            onCancel={() => setIsAddingTask(false)}
            defaultValues={{
              dueDate: selectedDate,
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}