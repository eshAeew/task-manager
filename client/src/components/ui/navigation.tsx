import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Home, Heart } from "lucide-react";

export function Navigation() {
  const [location] = useLocation();

  return (
    <nav className="fixed bottom-4 right-4 flex gap-2">
      <Button
        variant={location === "/" ? "default" : "outline"}
        size="icon"
        asChild
      >
        <Link href="/">
          <Home className="h-4 w-4" />
        </Link>
      </Button>
      <Button
        variant={location === "/support" ? "default" : "outline"}
        size="icon"
        asChild
      >
        <Link href="/support">
          <Heart className="h-4 w-4" />
        </Link>
      </Button>
    </nav>
  );
}
