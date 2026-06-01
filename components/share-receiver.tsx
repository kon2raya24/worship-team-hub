"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Sparkles } from "lucide-react";

/**
 * When the PWA is opened via a Web Share Target or a File Handler, we land
 * on /songs/import. This component reads the incoming payload and pre-fills
 * the textarea so the user just has to confirm + import.
 */
export function ShareReceiver({ textareaId }: { textareaId: string }) {
  const params = useSearchParams();
  const [hint, setHint] = useState<string | null>(null);
  const handled = useRef(false);

  // One-shot init that reads URL params + writes to an uncontrolled DOM
  // textarea and registers a launchQueue consumer. setHint reflects the
  // result of those external side-effects, not derived state.
  useEffect(() => {
    if (handled.current) return;

    const ta = document.getElementById(textareaId) as HTMLTextAreaElement | null;
    if (!ta) return;

    // 1) Web Share Target — title/text/url come in as query params
    const title = params.get("title");
    const text = params.get("text");
    const url = params.get("url");
    if (title || text || url) {
      handled.current = true;
      const parts: string[] = [];
      if (title) parts.push(`{title: ${title}}`);
      if (url) parts.push(`{artist: }`, `{reference: ${url}}`);
      if (text) parts.push("", text);
      ta.value = (parts.join("\n") + "\n" + (ta.value ?? "")).trim();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHint("Pre-filled from shared content. Edit then hit Import.");
      ta.focus();
      return;
    }

    // 2) File Handlers — handle .chordpro / .pro files dropped on the app
    type LaunchParams = { files: FileSystemFileHandle[] };
    type LaunchQueue = {
      setConsumer: (cb: (params: LaunchParams) => void) => void;
    };
    const launchQueue = (window as unknown as { launchQueue?: LaunchQueue })
      .launchQueue;
    if (launchQueue && typeof launchQueue.setConsumer === "function") {
      launchQueue.setConsumer(async (lp: LaunchParams) => {
        if (!lp.files || lp.files.length === 0) return;
        handled.current = true;
        const blocks: string[] = [];
        for (const handle of lp.files) {
          try {
            const file = await handle.getFile();
            blocks.push(await file.text());
          } catch {
            /* permission denied or non-text — skip */
          }
        }
        if (blocks.length > 0) {
          ta.value = blocks.join("\n\n---\n\n").trim();
          setHint(
            `Loaded ${blocks.length} file${blocks.length === 1 ? "" : "s"}. Review then import.`
          );
          ta.focus();
        }
      });
    }
  }, [params, textareaId]);

  if (!hint) return null;
  return (
    <div className="glass p-3 flex items-center gap-2 text-sm border border-accent/30 bg-accent/[0.04]">
      <Sparkles className="size-4 text-accent shrink-0" />
      <span className="text-foreground/80">{hint}</span>
    </div>
  );
}
