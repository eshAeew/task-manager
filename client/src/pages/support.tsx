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
              src="https://media-hosting.imagekit.io//cd4b66324346476d/cef6a572-7e45-490e-93da-fac9c29089eb.jpg?Expires=1835367367&Key-Pair-Id=K2ZIVPTIP2VGHC&Signature=3Pk57DfF6hCTHC9Z32-gA46yTXKhKwh5i42RF6BXKelljgZp7i8oGZ89B1EYZhhMVVdQEqogw321tZgh~zyoh9QimzUU8HK6Hka~zlfLhYPfOtkYaGqmPp4w0GGMHgfeT5bnAAnvsz4kH6Rm3VqgqcwZhXCDwQTBrYuaYW52XTk3Uqib099joM11WpQA3IxFotKMQBB4i5icrYom-JUVf36n69EukHtYyJURycdnC-VtHoT~R~vYHRXM70jZxPKTIMshW4TA1PLzumjcEmj5paM~UvvNeCsDdSiKeroDGSyG5UdhAtGmaW3hzYu9YyYY9doJcXKLpHYyC3S77gcnLA__"
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
