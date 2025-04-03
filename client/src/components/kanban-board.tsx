import { Task, statusOptions } from "@shared/schema";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TaskTimer } from "./task-timer";
import { Button } from "@/components/ui/button";
import { Trash2, FileText, Paperclip, GripVertical, Pencil } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface KanbanBoardProps {
  tasks: Task[];
  onToggleComplete: (id: number) => void;
  onDeleteTask: (id: number) => void;
  onTimeUpdate: (taskId: number, timeSpent: number) => void;
  onUpdateStatus: (id: number, status: Task["status"]) => void;
  onEditTask?: (task: Task) => void;
}

export function KanbanBoard({
  tasks,
  onToggleComplete,
  onDeleteTask,
  onTimeUpdate,
  onUpdateStatus,
  onEditTask,
}: KanbanBoardProps) {
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [draggingOverColumn, setDraggingOverColumn] = useState<Task["status"] | null>(null);

  const columns = statusOptions.map(status => ({
    ...status,
    tasks: tasks.filter(task => task.status === status.value)
  }));

  const handleDragStart = (e: React.DragEvent, taskId: number) => {
    e.dataTransfer.setData("taskId", taskId.toString());
    e.dataTransfer.effectAllowed = "move";
    setDraggingId(taskId);
  };

  const handleDragOver = (e: React.DragEvent, status: Task["status"]) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDraggingOverColumn(status);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDraggingOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, status: Task["status"]) => {
    e.preventDefault();
    const taskId = parseInt(e.dataTransfer.getData("taskId"));
    onUpdateStatus(taskId, status);
    setDraggingId(null);
    setDraggingOverColumn(null);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {columns.map(column => (
        <div
          key={column.value}
          className={cn(
            "bg-muted/50 rounded-lg p-4 transition-colors duration-200",
            draggingOverColumn === column.value && "bg-muted"
          )}
          onDragOver={(e) => handleDragOver(e, column.value)}
          onDrop={(e) => handleDrop(e, column.value)}
          onDragLeave={() => setDraggingOverColumn(null)}
        >
          <h3 className="font-semibold mb-4">{column.label}</h3>
          <div className="space-y-2">
            {column.tasks.map(task => (
              <Card
                key={task.id}
                draggable
                onDragStart={(e) => handleDragStart(e, task.id)}
                onDragEnd={handleDragEnd}
                className={cn(
                  "cursor-move group transition-transform duration-200",
                  draggingId === task.id && "opacity-50 scale-95",
                  task.completed && "opacity-75"
                )}
              >
                <CardHeader className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                        <CardTitle className="text-sm truncate">{task.title}</CardTitle>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          task.priority === 'high' ? 'bg-red-100 text-red-800' :
                          task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {task.priority}
                        </span>
                        {task.attachmentUrl && (
                          <Paperclip className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {onEditTask && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEditTask(task)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDeleteTask(task.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <TaskTimer task={task} onTimeUpdate={onTimeUpdate} />
                </CardContent>
              </Card>
            ))}
            {column.tasks.length === 0 && (
              <div className="h-24 border-2 border-dashed rounded-lg flex items-center justify-center text-sm text-muted-foreground">
                Drop tasks here
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}