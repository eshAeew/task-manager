import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { User, Share2, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

export function UserProfile() {
  const [uuid, setUuid] = useState<string>("");
  const [isUuidVisible, setIsUuidVisible] = useState(false);
  const [sharedUuid, setSharedUuid] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    // Load or generate UUID on component mount
    const storedUuid = localStorage.getItem("userUuid");
    if (storedUuid) {
      setUuid(storedUuid);
    } else {
      const newUuid = crypto.randomUUID();
      localStorage.setItem("userUuid", newUuid);
      setUuid(newUuid);
    }
  }, []);

  // Query for shared tasks
  const { data: sharedTasks = [] } = useQuery({
    queryKey: ["/api/tasks/shared", sharedUuid],
    queryFn: async () => {
      if (!sharedUuid) return [];
      const response = await fetch(`/api/tasks/shared/${sharedUuid}`);
      if (!response.ok) throw new Error('Failed to fetch shared tasks');
      return response.json();
    },
    enabled: !!sharedUuid,
  });

  const handleCopyUuid = async () => {
    try {
      await navigator.clipboard.writeText(uuid);
      toast({
        title: "Copied!",
        description: "Your UUID has been copied to clipboard.",
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleViewSharedTasks = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sharedUuid) {
      toast({
        title: "UUID required",
        description: "Please enter a UUID to view shared tasks.",
        variant: "destructive",
      });
      return;
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <User className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>User Profile</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* Your UUID section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h4 className="text-sm font-medium">Show Your UUID</h4>
                <p className="text-sm text-muted-foreground">
                  Make your UUID visible for task sharing
                </p>
              </div>
              <Switch
                checked={isUuidVisible}
                onCheckedChange={setIsUuidVisible}
              />
            </div>

            {isUuidVisible && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="px-3 py-1.5 text-xs font-mono">
                    {uuid}
                  </Badge>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyUuid}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Share this UUID with others to let them see your tasks
                </p>
              </div>
            )}
          </div>

          {/* View shared tasks section */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">View Shared Tasks</h4>
            <form onSubmit={handleViewSharedTasks} className="flex gap-2">
              <Input
                placeholder="Enter UUID to view shared tasks"
                value={sharedUuid}
                onChange={(e) => setSharedUuid(e.target.value)}
              />
              <Button type="submit" size="icon">
                <Search className="h-4 w-4" />
              </Button>
            </form>

            {sharedTasks.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-sm font-medium">Shared Tasks</h5>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {sharedTasks.map((task: any) => (
                    <div key={task.id} className="p-2 bg-muted rounded-lg">
                      <p className="text-sm font-medium">{task.title}</p>
                      <p className="text-xs text-muted-foreground">
                        Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}