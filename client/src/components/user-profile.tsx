import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { User, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function UserProfile() {
  const [uuid, setUuid] = useState<string>("");
  const [isUuidVisible, setIsUuidVisible] = useState(false);
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
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="text-sm font-medium">Show UUID</h4>
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
      </DialogContent>
    </Dialog>
  );
}
