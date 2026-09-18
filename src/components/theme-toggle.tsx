"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const dark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => {
        const next = dark ? "light" : "dark";
        setTheme(next); // persisted in localStorage ("jexi-theme")
        document.cookie = `jexi-theme=${next}; path=/; max-age=31536000; samesite=lax`;
      }}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn("inline-flex size-10 items-center justify-center rounded-full text-fg transition hover:text-gold", className)}
    >
      {!mounted ? (
        <span className="size-[18px]" />
      ) : dark ? (
        <Sun className="size-[18px]" strokeWidth={1.5} />
      ) : (
        <Moon className="size-[18px]" strokeWidth={1.5} />
      )}
    </button>
  );
}
