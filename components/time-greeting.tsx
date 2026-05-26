"use client";

import { useSyncExternalStore } from "react";
import { Sparkles } from "lucide-react";

function greetingFor(hour: number) {
  if (hour < 5) return "Good evening";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function getSnapshot(): string {
  const now = new Date();
  const greet = greetingFor(now.getHours()).toUpperCase();
  const weekday = now.toLocaleDateString(undefined, { weekday: "long" });
  return `${greet} · ${weekday}`;
}

// No subscription — the greeting doesn't need to update mid-session.
const subscribe = () => () => {};

// Render an empty string on the server to avoid timezone-related hydration
// mismatch (Philippines is UTC+8; server clock is UTC).
const getServerSnapshot = (): string => "";

/**
 * Renders the dashboard eyebrow ("GOOD MORNING · SUNDAY") using the
 * browser's local time.
 */
export function TimeGreeting() {
  const label = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    <p className="eyebrow flex items-center gap-2 min-h-[1em]" suppressHydrationWarning>
      <Sparkles className="size-3" strokeWidth={2} />
      <span>{label}</span>
    </p>
  );
}
