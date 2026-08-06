"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="outline"
      size="sm"
      className="rounded-full w-9 h-9 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 relative overflow-hidden"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      title="Toggle Dark Mode"
    >
      <Sun className="h-[1.2rem] w-[1.2rem] transition-all duration-300 rotate-0 scale-100 dark:-rotate-90 dark:scale-0 absolute" />
      <Moon className="h-[1.2rem] w-[1.2rem] transition-all duration-300 rotate-90 scale-0 dark:rotate-0 dark:scale-100 absolute" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
