import { useState, useEffect } from "react";
import { Task, TaskLink } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Trash2, RefreshCw, Timer, Bell, Download, Upload, Layout, Maximize2, Minimize2, Paperclip, Link as LinkIcon, ChevronDown, ChevronUp } from "lucide-react";
import { format, isPast } from "date-fns";
import { PomodoroTimer } from "./pomodoro-timer";
import { TaskTimer } from "./task-timer";
import { useToast } from "@/hooks/use-toast";
import { getTasks, importTasks } from "@/lib/tasks";
import { KanbanBoard } from "./kanban-board";
import { TaskSearch } from "./task-search";
import { RecurrenceVisualization } from "./recurrence-visualization";
import { PriorityIndicator } from "./priority-indicator";
import { TaskProgress } from "./task-progress";
import { DueDateCountdown } from "./due-date-countdown";
import { categoryIcons } from "@shared/schema";
import { ArrowUpDown } from "lucide-react";

interface TaskListProps {
  tasks: Task[];
  onToggleComplete: (id: number) => void;
  onDeleteTask: (id: number) => void;
  onImportTasks: (tasks: Task[]) => void;
  onTimeUpdate: (taskId: number, timeSpent: number) => void;
  onUpdateStatus: (id: number, status: Task["status"]) => void;
  onEditTask?: (task: Task) => void;
  view: "list" | "kanban";
  isFocusMode: boolean;
  onToggleFocusMode: () => void;
  onChangeView: (view: "list" | "kanban") => void;
}

export function TaskList({
  tasks,
  onToggleComplete,
  onDeleteTask,
  onImportTasks,
  onTimeUpdate,
  onUpdateStatus,
  onEditTask,
  view,
  isFocusMode,
  onToggleFocusMode,
  onChangeView,
}: TaskListProps) {
  const [filter, setFilter] = useState<string>("all");
  const [activeTimerTaskId, setActiveTimerTaskId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"dueDate" | "priority" | "createdAt" | "title">("dueDate");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [expandedNotes, setExpandedNotes] = useState<number[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      tasks.forEach(task => {
        if (
          task.reminderEnabled &&
          task.reminderTime &&
          !task.completed &&
          Math.abs(now.getTime() - new Date(task.reminderTime).getTime()) < 60000
        ) {
          if (Notification.permission === "granted") {
            new Notification(`Task Reminder: ${task.title}`, {
              body: `Don't forget to complete this task!`,
              icon: "/favicon.ico"
            });
          }
        }
      });
    };

    const interval = setInterval(checkReminders, 30000);
    return () => clearInterval(interval);
  }, [tasks]);

  // Helper function to get sortable value
  const getSortableValue = (task: Task, field: typeof sortBy) => {
    switch (field) {
      case "dueDate":
        return task.dueDate ? new Date(task.dueDate).getTime() : Infinity;
      case "priority": {
        const priorityMap = { high: 1, medium: 2, low: 3 };
        return priorityMap[task.priority as keyof typeof priorityMap] || 4;
      }
      case "createdAt":
        return task.createdAt ? new Date(task.createdAt).getTime() : 0;
      case "title":
        return task.title.toLowerCase();
      default:
        return 0;
    }
  };

  const filteredTasks = tasks
    .filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPriority = filter === "all" || task.priority === filter;
      const matchesCategory = selectedCategory === "all" || task.category === selectedCategory;
      const matchesTags = selectedTags.length === 0 ||
        (Array.isArray(task.tags) && selectedTags.every(tag => task.tags!.includes(tag)));
      return matchesSearch && matchesPriority && matchesCategory && matchesTags;
    })
    .sort((a, b) => {
      const valueA = getSortableValue(a, sortBy);
      const valueB = getSortableValue(b, sortBy);

      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return sortDirection === 'asc'
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      }

      return sortDirection === 'asc'
        ? (valueA as number) - (valueB as number)
        : (valueB as number) - (valueA as number);
    });

  const priorityBadgeColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "medium": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "low": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      default: return "";
    }
  };

  const getRecurrenceText = (task: Task) => {
    if (!task.recurrence || task.recurrence === "none") return null;

    const recurrenceMap = {
      daily: "Repeats daily",
      weekly: "Repeats weekly",
      monthly: "Repeats monthly",
      custom: `Repeats every ${task.recurrenceInterval}`,
    };

    return recurrenceMap[task.recurrence];
  };

  const handleExport = () => {
    const allTasks = getTasks();
    const dataStr = JSON.stringify(allTasks, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;

    const link = document.createElement('a');
    link.setAttribute('href', dataUri);
    link.setAttribute('download', `tasks-${format(new Date(), 'yyyy-MM-dd')}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Tasks Exported",
      description: "Your tasks have been exported successfully.",
    });
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const tasks = JSON.parse(e.target?.result as string);
        importTasks(tasks);
        onImportTasks(tasks);
        toast({
          title: "Tasks Imported",
          description: "Your tasks have been imported successfully.",
        });
      } catch (error) {
        toast({
          title: "Import Failed",
          description: "Failed to import tasks. Please check the file format.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleToggleComplete = (taskId: number) => {
    const task = tasks.find(t => t.id === taskId);
    if (task?.reminderEnabled) {
      if (Notification.permission === "granted") {
        new Notification(`Task ${task.completed ? 'Uncompleted' : 'Completed'}!`, {
          body: `Task "${task.title}" has been ${task.completed ? 'uncompleted' : 'completed'}.`,
          icon: "/favicon.ico"
        });
      }
    }
    onToggleComplete(taskId);
  };

  const toggleNotes = (taskId: number) => {
    setExpandedNotes(prev =>
      prev.includes(taskId)
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  if (view === "kanban") {
    return (
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Tasks</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => onChangeView("list")}
              >
                <Layout className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={onToggleFocusMode}
              >
                {isFocusMode ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <KanbanBoard
            tasks={tasks}
            onToggleComplete={onToggleComplete}
            onDeleteTask={onDeleteTask}
            onTimeUpdate={onTimeUpdate}
            onUpdateStatus={onUpdateStatus}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-4">
            Tasks
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => onChangeView("kanban")}
            >
              <Layout className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={onToggleFocusMode}
            >
              {isFocusMode ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
            <div className="relative">
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Import
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <TaskSearch
            onSearch={setSearchTerm}
            onCategoryChange={setSelectedCategory}
            onTagAdd={(tag) => setSelectedTags(prev => [...prev, tag])}
            onTagRemove={(tag) => setSelectedTags(prev => prev.filter(t => t !== tag))}
            tags={selectedTags}
          />

          <TaskProgress tasks={tasks} className="mb-4 p-3 border rounded-md bg-card" />

          <div className="flex flex-wrap items-center gap-2 p-2 border rounded-md bg-muted/30">
            <span className="text-sm font-medium">Sort by:</span>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={sortBy === "dueDate" ? "secondary" : "outline"}
                size="sm"
                className="h-8"
                onClick={() => {
                  if (sortBy === "dueDate") {
                    setSortDirection(prev => prev === "asc" ? "desc" : "asc");
                  } else {
                    setSortBy("dueDate");
                    setSortDirection("asc");
                  }
                }}
              >
                Due Date
                {sortBy === "dueDate" && (
                  sortDirection === "asc" ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                )}
              </Button>

              <Button
                variant={sortBy === "priority" ? "secondary" : "outline"}
                size="sm"
                className="h-8"
                onClick={() => {
                  if (sortBy === "priority") {
                    setSortDirection(prev => prev === "asc" ? "desc" : "asc");
                  } else {
                    setSortBy("priority");
                    setSortDirection("asc");
                  }
                }}
              >
                Priority
                {sortBy === "priority" && (
                  sortDirection === "asc" ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                )}
              </Button>

              <Button
                variant={sortBy === "title" ? "secondary" : "outline"}
                size="sm"
                className="h-8"
                onClick={() => {
                  if (sortBy === "title") {
                    setSortDirection(prev => prev === "asc" ? "desc" : "asc");
                  } else {
                    setSortBy("title");
                    setSortDirection("asc");
                  }
                }}
              >
                Title
                {sortBy === "title" && (
                  sortDirection === "asc" ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                )}
              </Button>

              <Button
                variant={sortBy === "createdAt" ? "secondary" : "outline"}
                size="sm"
                className="h-8"
                onClick={() => {
                  if (sortBy === "createdAt") {
                    setSortDirection(prev => prev === "asc" ? "desc" : "asc");
                  } else {
                    setSortBy("createdAt");
                    setSortDirection("asc");
                  }
                }}
              >
                Created
                {sortBy === "createdAt" && (
                  sortDirection === "asc" ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
        {filteredTasks.map(task => (
          <div key={task.id} className="flex flex-col p-4 rounded-lg border">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <Checkbox
                  checked={task.completed}
                  onCheckedChange={() => handleToggleComplete(task.id)}
                />
                <div>
                  <p className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                    {task.title}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${priorityBadgeColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      <PriorityIndicator priority={task.priority} />
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                      {categoryIcons[task.category]} {task.category}
                    </span>
                    {task.tags?.map(tag => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground"
                      >
                        #{tag}
                      </span>
                    ))}
                    {task.recurrence !== "none" && (
                      <RecurrenceVisualization task={task} compact={true} />
                    )}
                    {task.reminderEnabled && task.reminderTime && (
                      <span className="text-xs px-2 py-1 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 flex items-center gap-1">
                        <Bell className="h-3 w-3" />
                        Reminder: {format(task.reminderTime, "PPp")}
                      </span>
                    )}
                    {task.links && Array.isArray(task.links) && task.links.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {task.links.map((link, index) => {
                          // Ensure link is in the correct format
                          const isValidLink = typeof link === 'object' && link !== null && 'url' in link && 'title' in link;
                          if (!isValidLink) return null;
                          
                          // Now TypeScript knows this is a valid link with url and title properties
                          return (
                            <a
                              key={index}
                              href={link.url as string}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer flex items-center gap-1 transition-colors"
                              title={link.url as string}
                            >
                              <LinkIcon className="h-3 w-3" />
                              {link.title as string}
                            </a>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  {task.dueDate && (
                    <div className="flex justify-between items-center mt-1">
                      <p className={`text-xs ${
                        isPast(task.dueDate) && !task.completed
                          ? "text-red-600 dark:text-red-400"
                          : "text-muted-foreground"
                      }`}>
                        Due: {format(task.dueDate, "PPP")}
                      </p>
                      {!task.completed && <DueDateCountdown dueDate={task.dueDate} />}
                    </div>
                  )}
                  {task.nextDue && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Next due: {format(task.nextDue, "PPP")}
                    </p>
                  )}
                  {task.attachmentUrl && (
                    <a
                      href={task.attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <Paperclip className="h-3 w-3" />
                      View Attachment
                    </a>
                  )}
                  <TaskTimer task={task} onTimeUpdate={onTimeUpdate} />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setActiveTimerTaskId(
                    activeTimerTaskId === task.id ? null : task.id
                  )}
                >
                  <Timer className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    console.log("Edit button clicked for task:", task);
                    onEditTask?.(task);
                  }}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDeleteTask(task.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {activeTimerTaskId === task.id && (
              <div className="mt-4 border-t pt-4">
                <PomodoroTimer taskTitle={task.title} />
              </div>
            )}

            {task.recurrence !== "none" && task.recurrence !== undefined && (
              <div className="mt-2">
                <RecurrenceVisualization task={task} />
              </div>
            )}
            {task.notes && (
              <div className="mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleNotes(task.id)}
                  className="w-full flex items-center justify-between py-1"
                >
                  <span className="text-sm">Notes</span>
                  {expandedNotes.includes(task.id) ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
                {expandedNotes.includes(task.id) && (
                  <div className="mt-2 p-3 bg-muted/30 rounded-md">
                    <p className="text-sm whitespace-pre-wrap">{task.notes}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {filteredTasks.length === 0 && (
          <p className="text-center text-muted-foreground">No tasks found</p>
        )}
      </CardContent>
    </Card>
  );
}