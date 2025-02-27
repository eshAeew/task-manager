import { Task, statusOptions } from "@shared/schema";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TaskTimer } from "./task-timer";
import { Button } from "@/components/ui/button";
import { Trash2, FileText, Paperclip } from "lucide-react";

interface KanbanBoardProps {
  tasks: Task[];
  onToggleComplete: (id: number) => void;
  onDeleteTask: (id: number) => void;
  onTimeUpdate: (taskId: number, timeSpent: number) => void;
  onUpdateStatus: (id: number, status: Task["status"]) => void;
}

export function KanbanBoard({
  tasks,
  onToggleComplete,
  onDeleteTask,
  onTimeUpdate,
  onUpdateStatus,
}: KanbanBoardProps) {
  const columns = statusOptions.map(status => ({
    ...status,
    tasks: tasks.filter(task => task.status === status.value)
  }));

  const handleDragStart = (e: React.DragEvent, taskId: number) => {
    e.dataTransfer.setData("taskId", taskId.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, status: Task["status"]) => {
    e.preventDefault();
    const taskId = parseInt(e.dataTransfer.getData("taskId"));
    onUpdateStatus(taskId, status);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {columns.map(column => (
        <div
          key={column.value}
          className="bg-muted/50 rounded-lg p-4"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, column.value)}
        >
          <h3 className="font-semibold mb-4">{column.label}</h3>
          <div className="space-y-2">
            {column.tasks.map(task => (
              <Card
                key={task.id}
                draggable
                onDragStart={(e) => handleDragStart(e, task.id)}
                className="cursor-move"
              >
                <CardHeader className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-sm">{task.title}</CardTitle>
                      <div className="flex items-center gap-2">
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
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDeleteTask(task.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <TaskTimer task={task} onTimeUpdate={onTimeUpdate} />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
