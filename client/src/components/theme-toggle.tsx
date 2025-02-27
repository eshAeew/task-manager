import { Moon, Sun, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { themes } from "../../../theme.json";

interface ThemePreference {
  mode: "light" | "dark";
  color: string;
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemePreference>(() => {
    const stored = localStorage.getItem("theme-preference");
    return stored ? JSON.parse(stored) : { mode: "light", color: themes[0].primary };
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme.mode);
    root.style.setProperty("--primary", theme.color);
    localStorage.setItem("theme-preference", JSON.stringify(theme));
  }, [theme]);

  return (
    <div className="flex gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <Palette className="h-[1.2rem] w-[1.2rem]" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {themes.map((t) => (
            <DropdownMenuItem
              key={t.name}
              onClick={() => setTheme({ ...theme, color: t.primary })}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: t.primary }}
                />
                {t.name}
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        variant="outline"
        size="icon"
        onClick={() => setTheme(prev => ({
          ...prev,
          mode: prev.mode === "light" ? "dark" : "light"
        }))}
      >
        <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    </div>
  );
}