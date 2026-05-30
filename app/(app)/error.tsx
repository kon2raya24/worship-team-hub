"use client";

import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";
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
    <div className="mx-auto max-w-2xl mt-8 fade-in">
      <div className="glass p-6 border border-[#ff5566]/25">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center justify-center size-9 rounded-lg bg-[#ff5566]/10 text-[#ff5566] shrink-0">
            <TriangleAlert className="size-4" />
          </span>
          <h2 className="text-xl font-display font-semibold tracking-tight">
            Something went wrong
          </h2>
        </div>
        <p className="text-sm text-[#c8cee6]/80 mt-3 font-mono whitespace-pre-wrap break-words">
          {error.message}
        </p>
        {error.digest && (
          <p className="text-xs text-[#8a92b4] mt-2">
            Digest: <code>{error.digest}</code>
          </p>
        )}
        <Button onClick={reset} variant="outline" className="mt-4">
          Try again
        </Button>
      </div>
    </div>
  );
}
