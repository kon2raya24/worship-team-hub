"use client";

import { useOptimistic, useTransition } from "react";
import { CheckCircle2 } from "lucide-react";
import { togglePrayer } from "@/app/(app)/prayer/actions";

/**
 * Client-side optimistic toggle for "mark answered / mark open". Flips the
 * UI immediately so a slow 3G round-trip doesn't leave the leader tapping
 * a frozen-looking button on Sunday morning.
 */
export function PrayerToggle({
  id,
  isAnswered,
}: {
  id: string;
  isAnswered: boolean;
}) {
  const [optimisticAnswered, setOptimisticAnswered] = useOptimistic(
    isAnswered,
    (_state, next: boolean) => next
  );
  const [pending, start] = useTransition();

  return (
    <>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          start(async () => {
            setOptimisticAnswered(!optimisticAnswered);
            try {
              await togglePrayer(id, optimisticAnswered);
            } catch {
              // useOptimistic auto-reverts on transition error.
            }
          });
        }}
        className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors inline-flex items-center gap-1"
      >
        {optimisticAnswered ? "Mark open" : "Mark answered"}
      </button>
      {/* When the optimistic state is "answered" we surface the chip even
          before the server confirms, so the visual cue lands immediately. */}
      <span data-answered={optimisticAnswered ? "true" : "false"} className="sr-only">
        {optimisticAnswered ? "Answered" : "Open"}
      </span>
      {optimisticAnswered && !isAnswered && (
        <span className="inline-flex items-center gap-1 text-chart-5 text-[10px] font-mono uppercase tracking-wider">
          <CheckCircle2 className="size-3" /> Answered
        </span>
      )}
    </>
  );
}
