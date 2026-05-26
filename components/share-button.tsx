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
  const [clipboardFailed, setClipboardFailed] = useState(false);

  // Reset state if the parent reuses the button for a different resource.
  // React 19 prop-change pattern: compare during render rather than effect.
  const resourceKey = `${resourceType}:${resourceId}`;
  const [prevResourceKey, setPrevResourceKey] = useState(resourceKey);
  if (prevResourceKey !== resourceKey) {
    setPrevResourceKey(resourceKey);
    setUrl(null);
    setCopied(false);
    setClipboardFailed(false);
  }

  function generate() {
    start(async () => {
      const token = await createShareLink(resourceType, resourceId);
      const full = `${window.location.origin}/share/${token}`;
      setUrl(full);
      setClipboardFailed(false);
      try {
        await navigator.clipboard.writeText(full);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Insecure context, permissions denied, or old browser.
        // The input below stays visible so the user can long-press / select-all manually.
        setClipboardFailed(true);
      }
    });
  }

  const buttonLabel = pending
    ? "Generating…"
    : url
      ? copied
        ? "Copied!"
        : clipboardFailed
          ? "Tap link to copy"
          : "Copy again"
      : "Share link";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={generate}
          disabled={pending}
        >
          {buttonLabel}
        </Button>
        {url && (
          <input
            readOnly
            value={url}
            onClick={(e) => e.currentTarget.select()}
            className="text-xs border rounded-md p-1.5 flex-1 bg-zinc-50 dark:bg-zinc-900 font-mono"
            aria-label="Public share link"
          />
        )}
      </div>
      {clipboardFailed && (
        <p className="text-[11px] text-[#ffb547]">
          Auto-copy isn&apos;t available here — tap the link above to select it.
        </p>
      )}
    </div>
  );
}
