"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { createShareLink } from "@/app/(app)/share-actions";

export function ShareButton({
  resourceType,
  resourceId,
}: {
  resourceType: "song" | "setlist";
  resourceId: string;
}) {
  const [pending, start] = useTransition();
  const [url, setUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function generate() {
    start(async () => {
      const token = await createShareLink(resourceType, resourceId);
      const full = `${window.location.origin}/share/${token}`;
      setUrl(full);
      try {
        await navigator.clipboard.writeText(full);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        /* ignore */
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={generate}
        disabled={pending}
      >
        {pending ? "Generating…" : url ? (copied ? "Copied!" : "Copy again") : "Share link"}
      </Button>
      {url && (
        <input
          readOnly
          value={url}
          onClick={(e) => e.currentTarget.select()}
          className="text-xs border rounded-md p-1.5 flex-1 bg-zinc-50 dark:bg-zinc-900 font-mono"
        />
      )}
    </div>
  );
}
