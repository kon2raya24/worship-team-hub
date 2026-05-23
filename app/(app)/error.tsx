"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App route error:", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-2xl p-6 mt-8 border border-red-200 dark:border-red-900 rounded-xl bg-red-50/50 dark:bg-red-950/30">
      <h2 className="text-xl font-semibold text-red-700 dark:text-red-300">
        Something went wrong
      </h2>
      <p className="text-sm text-red-700/80 dark:text-red-300/80 mt-2 font-mono whitespace-pre-wrap break-words">
        {error.message}
      </p>
      {error.digest && (
        <p className="text-xs text-red-700/60 dark:text-red-300/60 mt-2">
          Digest: <code>{error.digest}</code>
        </p>
      )}
      <Button onClick={reset} variant="outline" className="mt-4">
        Try again
      </Button>
    </div>
  );
}
