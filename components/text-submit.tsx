"use client";

import { useFormStatus } from "react-dom";

/**
 * A subtle inline-text submit button (no glass, no border) that shows
 * pending state when its parent <form> action is running.
 */
export function TextSubmit({
  children,
  pendingLabel,
  className = "",
  danger,
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
  danger?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex items-center gap-1 text-xs transition-colors disabled:opacity-60 disabled:pointer-events-none ${
        danger
          ? "text-muted-foreground hover:text-red-400"
          : "text-muted-foreground hover:text-foreground"
      } ${className}`}
    >
      {pending && (
        <span className="inline-block h-2.5 w-2.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
      )}
      {pending && pendingLabel ? pendingLabel : children}
    </button>
  );
}
