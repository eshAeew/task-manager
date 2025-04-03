import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { TaskForm } from "@/components/task-form";
import { TaskList } from "@/components/task-list";
import { TaskArchive } from "@/components/task-archive";
import { ThemeToggle } from "@/components/theme-toggle";
import { MiniDashboard } from "@/components/mini-dashboard";
import { TrashBin } from "@/components/trash-bin";
import { VoiceInput } from "@/components/voice-input";
import { DateFilter } from "@/components/date-filter";
import { TaskFilter, TaskFilterOptions } from "@/components/task-filter";
import { TagFilter } from "@/components/tag-filter";
import { getTasks, addTask, updateTask, deleteTask, simpleUpdateTask } from "@/lib/tasks";
import type { Task, InsertTask } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { suggestTaskPriority } from "@/lib/task-analyzer";
import { startOfDay, endOfDay, isWithinInterval, isPast, isToday } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [view, setView] = useState<"list" | "kanban">("list");
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [filterOptions, setFilterOptions] = useState<TaskFilterOptions>({
    showCompleted: true,
    showNotCompleted: true,
    showOverdue: false,
    filterTags: [],
  });

  const { data: tasks = [], refetch } = useQuery({
    queryKey: ["/api/tasks"],
    queryFn: getTasks,
  });

  const handleAddTask = (data: InsertTask) => {
    const newTask = addTask(data);
    queryClient.setQueryData<Task[]>(["/api/tasks"], (oldTasks) => {
      return [...(oldTasks || []), newTask];
    });
  };

  const handleVoiceInput = (transcript: string) => {
    const newTask: InsertTask = {
      title: transcript,
      priority: suggestTaskPriority(transcript),
      completed: false,
      recurrence: "none",
      reminderEnabled: false,
      status: "todo",
      category: "other",
      timeSpent: 0,
      xpEarned: 0,
      dueDate: new Date()
    };
    handleAddTask(newTask);
  };

  const handleToggleComplete = (id: number) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const updated = updateTask(id, { 
      completed: !task.completed,
      status: !task.completed ? "done" : task.status 
    });
    if (updated) {
      queryClient.setQueryData<Task[]>(["/api/tasks"], prev => 
        prev?.map(t => t.id === id ? updated as Task : t) || []
      );
    }
  };

  const handleUpdateStatus = (id: number, status: Task["status"]) => {
    const updated = updateTask(id, { status });
    if (updated) {
      queryClient.setQueryData<Task[]>(["/api/tasks"], prev => 
        prev?.map(t => t.id === id ? updated as Task : t) || []
      );
    }
  };

  const handleDeleteTask = (id: number) => {
    deleteTask(id);
    queryClient.setQueryData<Task[]>(["/api/tasks"], prev => 
      prev?.filter(t => t.id !== id) || []
    );
  };

  const handleImportTasks = (importedTasks: Task[]) => {
    queryClient.setQueryData<Task[]>(["/api/tasks"], importedTasks);
  };

  const handleRestoreTask = (task: Task) => {
    queryClient.setQueryData<Task[]>(["/api/tasks"], prev => 
      [...(prev || []), task]
    );
  };

  const handleTimeUpdate = (taskId: number, timeSpent: number) => {
    const updated = updateTask(taskId, { timeSpent });
    if (updated) {
      queryClient.setQueryData<Task[]>(["/api/tasks"], prev => 
        prev?.map(t => t.id === taskId ? updated as Task : t) || []
      );
    }
  };
  
  const handleEditTask = (task: Task) => {
    console.log("handleEditTask called with task:", task);
    setEditingTask(task);
    setIsEditDialogOpen(true);
    console.log("Edit dialog should be open now:", isEditDialogOpen);
  };
  
  const handleUpdateTask = (data: InsertTask) => {
    if (!editingTask) {
      console.error("Cannot update task: No editing task found");
      toast({
        title: "Update failed",
        description: "No task selected for editing. Please try again.",
        variant: "destructive",
      });
      return;
    }
    
    console.log("Updating task with ID:", editingTask.id);
    console.log("Full update data:", data);
    
    // Ensure data is properly cleaned up
    const cleanData = {
      ...data,
      // Make sure links are handled correctly
      links: Array.isArray(data.links) ? data.links : [],
      // Handle attachment fields
      attachmentUrl: data.attachmentUrl || null,
      attachmentName: data.attachmentName || null,
      // Handle notes field
      notes: data.notes || null
    };
    
    console.log("Cleaned data for update:", cleanData);
    
    try {
      // Call the updateTask function
      console.log("Calling updateTask with ID:", editingTask.id);
      const updated = updateTask(editingTask.id, cleanData);
      
      console.log("Result from updateTask:", updated);
      
      if (updated) {
        console.log("Task updated successfully:", updated);
        
        // Update local state
        queryClient.setQueryData<Task[]>(["/api/tasks"], prev => {
          console.log("Updating local task cache...");
          if (!prev) {
            console.log("No previous tasks in cache");
            return [updated];
          }
          return prev.map(t => t.id === editingTask.id ? updated : t);
        });
        
        // Show success message
        toast({
          title: "Task updated",
          description: "Your task has been successfully updated.",
        });
        
        // Close the dialog
        setIsEditDialogOpen(false);
        setEditingTask(null);
        
        // Force a refetch to ensure we have the latest data
        console.log("Refetching tasks...");
        refetch();
      } else {
        console.error("Task update returned null/undefined");
        console.error("Tasks array from localStorage:", localStorage.getItem("tasks"));
        
        // Show error message if task couldn't be updated
        toast({
          title: "Update failed",
          description: "There was a problem updating your task. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating task:", error);
      console.error("Error details:", error instanceof Error ? error.message : String(error));
      toast({
        title: "Update error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Helper function to determine if a task is overdue
  const isTaskOverdue = (task: Task): boolean => {
    if (!task.dueDate) return false;
    const taskDueDate = task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate);
    return isPast(taskDueDate) && !isToday(taskDueDate) && !task.completed;
  };

  // Apply filters in stages
  const applyDateFilter = (tasks: Task[]): Task[] => {
    if (!selectedDate) return tasks;
    
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      // Convert string or Date to Date object safely
      const taskDueDate = task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate);
      return isWithinInterval(taskDueDate, {
        start: startOfDay(selectedDate),
        end: endOfDay(selectedDate)
      });
    });
  };

  const applyStatusFilters = (tasks: Task[]): Task[] => {
    return tasks.filter(task => {
      // Filter by completion status
      if (task.completed && !filterOptions.showCompleted) return false;
      if (!task.completed && !filterOptions.showNotCompleted) return false;
      
      // Filter by overdue status
      if (filterOptions.showOverdue && !isTaskOverdue(task)) return false;
      
      return true;
    });
  };

  // Filter by tags
  const applyTagFilters = (tasks: Task[]): Task[] => {
    if (!filterOptions.filterTags || filterOptions.filterTags.length === 0) {
      return tasks;
    }
    
    return tasks.filter(task => {
      if (!task.tags || task.tags.length === 0) return false;
      
      // Check if task has at least one of the selected tags
      return filterOptions.filterTags.some(tag => 
        task.tags?.includes(tag)
      );
    });
  };

  // Apply all filters
  const filteredTasks = applyTagFilters(applyStatusFilters(applyDateFilter(tasks)));

  return (
    <div className={`min-h-screen bg-background ${isFocusMode ? 'bg-black/95' : ''}`}>
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Task Manager</h1>
          <div className="flex items-center gap-2">
            <VoiceInput onTranscript={handleVoiceInput} />
            <ThemeToggle />
          </div>
        </div>

        <div className="mb-8">
          <MiniDashboard tasks={tasks} />
        </div>

        <Tabs defaultValue="tasks">
          <TabsList>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="archive">Task Archive</TabsTrigger>
            <TabsTrigger value="trash">Recycle Bin</TabsTrigger>
          </TabsList>
          
          <TabsContent value="tasks">
            <div className="grid gap-8 md:grid-cols-[350px,1fr]">
              <div>
                <TaskForm onSubmit={handleAddTask} />
              </div>
              <div>
                <div className="flex flex-col gap-3 mb-4">
                  <div className="flex flex-wrap gap-3 items-center justify-between">
                    <div className="flex gap-2 items-center">
                      <DateFilter
                        selectedDate={selectedDate}
                        onDateSelect={setSelectedDate}
                      />
                      <TaskFilter 
                        filters={filterOptions} 
                        onFilterChange={setFilterOptions}
                      />
                    </div>
                    
                    <TagFilter 
                      selectedTags={filterOptions.filterTags}
                      availableTags={Array.from(new Set(
                        tasks.flatMap(task => task.tags || [])
                      ))}
                      onTagsChange={(tags) => setFilterOptions({...filterOptions, filterTags: tags})}
                    />
                  </div>
                </div>
                
                <TaskList 
                  tasks={filteredTasks}
                  onToggleComplete={handleToggleComplete}
                  onDeleteTask={handleDeleteTask}
                  onImportTasks={handleImportTasks}
                  onTimeUpdate={handleTimeUpdate}
                  onUpdateStatus={handleUpdateStatus}
                  onEditTask={handleEditTask}
                  view={view}
                  isFocusMode={isFocusMode}
                  onToggleFocusMode={() => setIsFocusMode(!isFocusMode)}
                  onChangeView={(v) => setView(v)}
                />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="archive" className="py-4">
            <div className="mb-4">
              <h2 className="text-2xl font-bold">Task Archive</h2>
              <p className="text-muted-foreground">View all tasks in a simplified format</p>
            </div>
            <TaskArchive 
              tasks={tasks} 
              onEditTask={handleEditTask} 
            />
          </TabsContent>
          
          <TabsContent value="trash">
            <TrashBin onRestore={handleRestoreTask} />
          </TabsContent>
        </Tabs>

        <Dialog 
          open={isEditDialogOpen} 
          onOpenChange={(open) => {
            console.log("Dialog open state changing to:", open);
            setIsEditDialogOpen(open);
          }}
        >
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Task {editingTask?.id}</DialogTitle>
            </DialogHeader>
            {editingTask && (
              <>
                <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950 rounded border border-amber-200 dark:border-amber-800">
                  <p className="text-sm text-amber-800 dark:text-amber-300 mb-2">
                    Editing task ID: {editingTask.id}
                  </p>
                  <button 
                    type="button" 
                    className="w-full px-4 py-2 bg-blue-500 text-white rounded font-medium text-sm"
                    onClick={() => {
                      console.log("Forcing update on task:", editingTask.id);
                      
                      // Call the simple update function directly that we imported
                      const result = simpleUpdateTask(editingTask.id, editingTask.title + " (Updated)");
                      console.log("Simple update result:", result);
                      
                      if (result) {
                        // Show success message
                        toast({
                          title: "Task updated",
                          description: "Your task has been successfully updated with the simpler update function.",
                        });
                        
                        // Close the dialog
                        setIsEditDialogOpen(false);
                        setEditingTask(null);
                        
                        // Force a refetch to ensure we have the latest data
                        refetch();
                      } else {
                        toast({
                          title: "Update failed",
                          description: "The simple update function failed.",
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    Force Update (Debug)
                  </button>
                </div>
                <TaskForm 
                  onSubmit={handleUpdateTask} 
                  defaultValues={editingTask}
                  onCancel={() => setIsEditDialogOpen(false)}
                />
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}