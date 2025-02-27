import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, RefreshCw } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { getDeletedTasks, restoreTask, permanentlyDeleteTask } from "@/lib/tasks";
import type { Task } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface TrashBinProps {
  onRestore: (task: Task) => void;
}

export function TrashBin({ onRestore }: TrashBinProps) {
  const [deletedTasks, setDeletedTasks] = useState<Array<Task & { deletedAt: string }>>([]);
  const { toast } = useToast();

  useEffect(() => {
    setDeletedTasks(getDeletedTasks());
  }, []);

  const handleRestore = (id: number) => {
    const restored = restoreTask(id);
    if (restored) {
      onRestore(restored);
      setDeletedTasks(prev => prev.filter(t => t.id !== id));
      toast({
        title: "Task Restored",
        description: "The task has been restored successfully.",
      });
    }
  };

  const handlePermanentDelete = (id: number) => {
    permanentlyDeleteTask(id);
    setDeletedTasks(prev => prev.filter(t => t.id !== id));
    toast({
      title: "Task Deleted",
      description: "The task has been permanently deleted.",
      variant: "destructive",
    });
  };

  if (deletedTasks.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trash2 className="h-5 w-5" />
          Recycle Bin
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {deletedTasks.map(task => (
          <div
            key={task.id}
            className="flex items-center justify-between p-4 rounded-lg border"
          >
            <div>
              <p className="font-medium">{task.title}</p>
              <p className="text-sm text-muted-foreground">
                Deleted {formatDistanceToNow(new Date(task.deletedAt))} ago
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRestore(task.id)}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Restore
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handlePermanentDelete(task.id)}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
