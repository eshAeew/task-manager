import { useState, useMemo } from "react";
import { Task } from "@shared/schema";
import { PriorityIndicator } from "./priority-indicator";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Card, CardContent, CardFooter } from "./ui/card";
import { TaskForm } from "./task-form";
import { InsertTask } from "@shared/schema";
import { ScrollArea } from "./ui/scroll-area";
import { Search, Edit, Clock, Calendar, Tag, CheckSquare, ArrowUpDown, Filter } from "lucide-react";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TaskArchiveProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
}

type SortOption = "title" | "priority" | "dueDate" | "createdAt" | "completed";

export function TaskArchive({ tasks, onEditTask }: TaskArchiveProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("title");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [showCompleted, setShowCompleted] = useState<boolean>(true);
  const [showIncomplete, setShowIncomplete] = useState<boolean>(true);
  
  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
  };

  const handleEditClick = () => {
    if (selectedTask) {
      setIsEditDialogOpen(true);
    }
  };

  const handleCloseDialog = () => {
    setIsEditDialogOpen(false);
  };

  const handleUpdateTask = (data: InsertTask) => {
    if (selectedTask) {
      onEditTask({ ...selectedTask, ...data });
      setIsEditDialogOpen(false);
    }
  };
  
  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  // Filter and sort tasks
  const filteredAndSortedTasks = useMemo(() => {
    // First filter tasks
    let filtered = tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCompletionFilter = 
        (showCompleted && task.completed) || 
        (showIncomplete && !task.completed);
      
      return matchesSearch && matchesCompletionFilter;
    });

    // Then sort tasks
    return filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
        case "priority": {
          const priorityValue = { high: 3, medium: 2, low: 1 };
          comparison = (priorityValue[a.priority] || 0) - (priorityValue[b.priority] || 0);
          break;
        }
        case "dueDate":
          if (a.dueDate && b.dueDate) {
            comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          } else if (a.dueDate) {
            comparison = -1;
          } else if (b.dueDate) {
            comparison = 1;
          }
          break;
        case "createdAt":
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
          break;
        case "completed":
          comparison = (a.completed ? 1 : 0) - (b.completed ? 1 : 0);
          break;
      }
      
      return sortOrder === "asc" ? comparison : -comparison;
    });
  }, [tasks, searchTerm, sortBy, sortOrder, showCompleted, showIncomplete]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="title">Title</SelectItem>
              <SelectItem value="priority">Priority</SelectItem>
              <SelectItem value="dueDate">Due Date</SelectItem>
              <SelectItem value="createdAt">Created Date</SelectItem>
              <SelectItem value="completed">Completion</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="icon"
            onClick={toggleSortOrder}
            className="h-10 w-10"
            title={sortOrder === "asc" ? "Ascending" : "Descending"}
          >
            <ArrowUpDown className={`h-4 w-4 transition-transform ${sortOrder === "desc" ? "rotate-180" : ""}`} />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-10">
                <Filter className="h-4 w-4 mr-2" />
                <span>Filter</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Task Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setShowCompleted(!showCompleted)}
              >
                <div className="flex items-center gap-2">
                  <CheckSquare className="h-4 w-4 text-green-500" />
                  <span>Completed Tasks</span>
                </div>
                <div className={`w-3 h-3 rounded-full ${showCompleted ? 'bg-green-500' : 'bg-gray-300'}`} />
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setShowIncomplete(!showIncomplete)}
              >
                <div className="flex items-center gap-2">
                  <CheckSquare className="h-4 w-4 text-gray-500" />
                  <span>Incomplete Tasks</span>
                </div>
                <div className={`w-3 h-3 rounded-full ${showIncomplete ? 'bg-green-500' : 'bg-gray-300'}`} />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {selectedTask && (
          <Button
            size="sm"
            variant="default"
            onClick={handleEditClick}
          >
            Edit Task
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAndSortedTasks.map((task: Task) => (
          <Card 
            key={task.id}
            className={`cursor-pointer transition-all duration-200 hover:shadow-md overflow-hidden ${
              selectedTask?.id === task.id ? "ring-2 ring-primary" : ""
            }`}
            onClick={() => handleTaskClick(task)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="truncate flex-1">
                  <div className="font-medium text-lg">{task.title}</div>
                </div>
                <PriorityIndicator priority={task.priority} className="ml-2" />
              </div>
              
              <div className="flex items-center text-sm text-muted-foreground gap-2 mb-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {task.dueDate ? (
                  <span>{format(new Date(task.dueDate), 'MMM d, yyyy')}</span>
                ) : (
                  <span>No due date</span>
                )}
              </div>
              
              {task.timeSpent && task.timeSpent > 0 && (
                <div className="flex items-center text-sm text-muted-foreground gap-2 mb-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{Math.round(task.timeSpent / 60)} minutes spent</span>
                </div>
              )}
              
              {task.tags && task.tags.length > 0 && (
                <div className="flex items-center text-sm text-muted-foreground gap-2 mt-2 flex-wrap">
                  <Tag className="h-3.5 w-3.5" />
                  {task.tags.map((tag: string, index: number) => (
                    <Badge key={index} variant="secondary" className="font-normal text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
            
            <CardFooter className="p-0 border-t">
              <div 
                className={`flex items-center w-full px-4 py-2 text-sm font-medium ${
                  task.completed ? 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300' : 'bg-gray-50 text-gray-700 dark:bg-gray-900 dark:text-gray-300'
                }`}
              >
                <CheckSquare className={`h-4 w-4 mr-2 ${task.completed ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`} />
                <span>{task.completed ? "Completed" : "Not Completed"}</span>
                
                <Button
                  size="sm"
                  variant="ghost"
                  className="p-0 h-auto ml-auto"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTask(task);
                    setIsEditDialogOpen(true);
                  }}
                >
                  <Edit className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>

      {filteredAndSortedTasks.length === 0 && (
        <div className="text-center py-12 text-muted-foreground bg-gray-50 dark:bg-gray-900 rounded-lg">
          <Search className="h-10 w-10 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
          <p className="text-lg">No tasks found.</p>
          <p>Try a different search term or adjust your filters.</p>
        </div>
      )}

      {selectedTask && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Task</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[70vh]">
              <TaskForm
                onSubmit={handleUpdateTask}
                defaultValues={selectedTask}
                onCancel={handleCloseDialog}
              />
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}