import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

export default function Support() {
  return (
    <div className="container mx-auto p-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center">Support the Creator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center">
            <img
              src="/qr.jpg"
              alt="Support QR Code"
              className="max-w-[200px] rounded-lg shadow-lg"
            />
          </div>
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              If you find this task manager helpful, consider supporting the creator!
            </p>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => window.open("https://linktr.ee/yo.esha", "_blank")}
            >
              <ExternalLink className="h-4 w-4" />
              Visit Creator's Linktree
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
