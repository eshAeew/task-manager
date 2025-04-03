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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [view, setView] = useState<"list" | "kanban">("list");
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
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
  
  // Edit task functionality
  const handleEditTask = (task: Task) => {
    setTaskToEdit(task);
    setIsEditModalOpen(true);
  };
  
  const handleUpdateTask = (data: InsertTask) => {
    console.log("handleUpdateTask called with data:", data);
    
    if (!taskToEdit) {
      console.error("No task to edit!");
      return;
    }
    
    console.log("Updating task with ID:", taskToEdit.id);
    
    try {
      const updated = updateTask(taskToEdit.id, data);
      
      console.log("Task update result:", updated);
      
      if (updated) {
        queryClient.setQueryData<Task[]>(["/api/tasks"], prev => 
          prev?.map(t => t.id === taskToEdit.id ? updated : t) || []
        );
        toast({
          title: "Task updated",
          description: "Your task has been updated successfully",
        });
        setIsEditModalOpen(false);
        setTaskToEdit(null);
      } else {
        console.error("updateTask returned null");
        toast({
          title: "Update failed",
          description: "Could not update the task. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error updating task:", error);
      toast({
        title: "Error",
        description: "An error occurred while updating the task",
        variant: "destructive"
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

        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Task</DialogTitle>
              <DialogDescription>
                Make changes to your task here. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            {taskToEdit && (
              <TaskForm 
                onSubmit={handleUpdateTask}
                defaultValues={taskToEdit}
                onCancel={() => setIsEditModalOpen(false)}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}