"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

function greetingFor(hour: number) {
  if (hour < 5) return "Good evening";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

/**
 * Renders the dashboard eyebrow ("GOOD MORNING · SUNDAY") using the
 * browser's local time, since the server runs in UTC and would otherwise
 * be 8 hours off for the Philippines.
 */
export function TimeGreeting() {
  // Use a neutral placeholder on first server render so hydration matches.
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    const now = new Date();
    const greet = greetingFor(now.getHours()).toUpperCase();
    const weekday = now.toLocaleDateString(undefined, { weekday: "long" });
    setLabel(`${greet} · ${weekday}`);
  }, []);

  return (
    <p className="eyebrow flex items-center gap-2 min-h-[1em]" suppressHydrationWarning>
      <Sparkles className="size-3" strokeWidth={2} />
      <span>{label ?? ""}</span>
    </p>
  );
}
