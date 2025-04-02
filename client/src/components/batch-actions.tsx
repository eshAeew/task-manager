import { useState } from "react";
import { Task, categoryOptions, statusOptions } from "@shared/schema";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { 
  CheckSquare,
  Clock,
  Tag,
  Trash2, 
  LayoutGrid, 
  Pencil,
  Calendar, 
  AlertTriangle
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Badge } from "./ui/badge";

interface BatchActionsProps {
  tasks: Task[];
  onToggleComplete: (id: number) => void;
  onDeleteTask: (id: number) => void;
  onUpdateStatus: (id: number, status: Task["status"]) => void;
  onUpdateCategory: (id: number, category: Task["category"]) => void;
  onUpdateDueDate: (id: number, dueDate: Date | null) => void;
}

export function BatchActions({
  tasks,
  onToggleComplete,
  onDeleteTask,
  onUpdateStatus,
  onUpdateCategory,
  onUpdateDueDate
}: BatchActionsProps) {
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<number>>(new Set());
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<string>("");
  const [newStatus, setNewStatus] = useState<Task["status"]>("todo");
  const [newCategory, setNewCategory] = useState<Task["category"]>("other");
  const [newDueDate, setNewDueDate] = useState<Date | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  const handleSelectAll = () => {
    if (selectedTaskIds.size === tasks.length) {
      // If all are selected, deselect all
      setSelectedTaskIds(new Set());
    } else {
      // Select all
      const allIds = new Set(tasks.map(task => task.id));
      setSelectedTaskIds(allIds);
    }
  };

  const handleTaskSelection = (taskId: number) => {
    const newSelectedIds = new Set(selectedTaskIds);
    if (newSelectedIds.has(taskId)) {
      newSelectedIds.delete(taskId);
    } else {
      newSelectedIds.add(taskId);
    }
    setSelectedTaskIds(newSelectedIds);
  };

  const handleBatchAction = (action: string) => {
    setActionType(action);
    
    if (action === "delete") {
      setIsConfirmDeleteOpen(true);
    } else {
      setIsActionDialogOpen(true);
    }
  };

  const executeBatchAction = () => {
    const selectedIds = Array.from(selectedTaskIds);
    
    switch (actionType) {
      case "complete":
        selectedIds.forEach(id => {
          const task = tasks.find(t => t.id === id);
          if (task && !task.completed) {
            onToggleComplete(id);
          }
        });
        break;
      case "uncomplete":
        selectedIds.forEach(id => {
          const task = tasks.find(t => t.id === id);
          if (task && task.completed) {
            onToggleComplete(id);
          }
        });
        break;
      case "status":
        selectedIds.forEach(id => {
          onUpdateStatus(id, newStatus);
        });
        break;
      case "category":
        selectedIds.forEach(id => {
          onUpdateCategory(id, newCategory);
        });
        break;
      case "dueDate":
        selectedIds.forEach(id => {
          onUpdateDueDate(id, newDueDate);
        });
        break;
      case "delete":
        selectedIds.forEach(id => {
          onDeleteTask(id);
        });
        setIsConfirmDeleteOpen(false);
        break;
    }

    // Reset state after action
    setIsActionDialogOpen(false);
    setSelectedTaskIds(new Set());
  };

  const selectedCount = selectedTaskIds.size;
  const allSelected = selectedCount === tasks.length && tasks.length > 0;
  const anySelected = selectedCount > 0;

  if (tasks.length === 0) return null;

  return (
    <>
      <div className="mb-4 bg-background border rounded-md p-3">
        <div className="flex items-center mb-3">
          <div className="flex items-center gap-2">
            <Checkbox 
              id="select-all"
              checked={allSelected}
              onCheckedChange={handleSelectAll}
            />
            <label 
              htmlFor="select-all" 
              className="text-sm font-medium cursor-pointer flex items-center gap-1.5"
            >
              Select All
              {selectedCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {selectedCount} selected
                </Badge>
              )}
            </label>
          </div>

          {anySelected && (
            <div className="flex ml-auto gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBatchAction("complete")}
                className="gap-1.5"
              >
                <CheckSquare className="h-4 w-4" />
                <span>Complete</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBatchAction("uncomplete")}
                className="gap-1.5"
              >
                <CheckSquare className="h-4 w-4" />
                <span>Uncomplete</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBatchAction("status")}
                className="gap-1.5"
              >
                <LayoutGrid className="h-4 w-4" />
                <span>Status</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBatchAction("category")}
                className="gap-1.5"
              >
                <Tag className="h-4 w-4" />
                <span>Category</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBatchAction("dueDate")}
                className="gap-1.5"
              >
                <Calendar className="h-4 w-4" />
                <span>Due Date</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBatchAction("delete")}
                className="gap-1.5 text-destructive border-destructive hover:bg-destructive/90 hover:text-white"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete</span>
              </Button>
            </div>
          )}
        </div>

        {selectedCount === 0 && (
          <p className="text-sm text-muted-foreground">
            Select tasks to perform batch actions such as completing multiple tasks at once, 
            changing status, or deleting.
          </p>
        )}
      </div>

      {tasks.map(task => (
        <div 
          key={task.id}
          className={`flex items-center gap-2 mb-1 p-1.5 rounded hover:bg-accent/50 ${
            selectedTaskIds.has(task.id) ? "bg-accent" : ""
          }`}
        >
          <Checkbox 
            checked={selectedTaskIds.has(task.id)}
            onCheckedChange={() => handleTaskSelection(task.id)}
            id={`task-${task.id}`}
          />
          <label 
            htmlFor={`task-${task.id}`}
            className="flex-1 cursor-pointer font-medium text-sm flex items-center"
          >
            {task.title}
            {task.completed && (
              <Badge variant="outline" className="ml-2 text-xs">
                Completed
              </Badge>
            )}
          </label>
        </div>
      ))}

      {/* Status Change Dialog */}
      <Dialog open={isActionDialogOpen && actionType === "status"} onOpenChange={(open) => {
        if (!open) setIsActionDialogOpen(false);
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Change Status for {selectedCount} tasks</DialogTitle>
            <DialogDescription>
              Choose a new status for the selected tasks.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Select value={newStatus} onValueChange={(value) => setNewStatus(value as Task["status"])}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status.toString().replace(/_/g, " ").toLocaleUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsActionDialogOpen(false)}>Cancel</Button>
            <Button onClick={executeBatchAction}>Apply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Change Dialog */}
      <Dialog open={isActionDialogOpen && actionType === "category"} onOpenChange={(open) => {
        if (!open) setIsActionDialogOpen(false);
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Change Category for {selectedCount} tasks</DialogTitle>
            <DialogDescription>
              Choose a new category for the selected tasks.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Select value={newCategory} onValueChange={(value) => setNewCategory(value as Task["category"])}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((category) => (
                  <SelectItem key={category} value={category}>
                    {typeof category === 'string' ? category.charAt(0).toUpperCase() + category.slice(1) : category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsActionDialogOpen(false)}>Cancel</Button>
            <Button onClick={executeBatchAction}>Apply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Due Date Change Dialog */}
      <Dialog open={isActionDialogOpen && actionType === "dueDate"} onOpenChange={(open) => {
        if (!open) setIsActionDialogOpen(false);
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Change Due Date for {selectedCount} tasks</DialogTitle>
            <DialogDescription>
              Choose a new due date for the selected tasks.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !newDueDate && "text-muted-foreground"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {newDueDate ? format(newDueDate, "PPP") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={newDueDate || undefined}
                  onSelect={(date: Date | undefined) => {
                    setNewDueDate(date || null);
                    setIsCalendarOpen(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setNewDueDate(null);
              }}
              className="mr-auto"
            >
              Clear Date
            </Button>
            <Button variant="outline" onClick={() => setIsActionDialogOpen(false)}>Cancel</Button>
            <Button onClick={executeBatchAction}>Apply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isConfirmDeleteOpen} onOpenChange={setIsConfirmDeleteOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Confirm Deletion
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedCount} tasks? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsConfirmDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={executeBatchAction}>
              Delete Tasks
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}