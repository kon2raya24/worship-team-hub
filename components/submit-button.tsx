"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import type { ComponentProps } from "react";

type Props = ComponentProps<typeof Button> & {
  pendingLabel?: string;
};

export function SubmitButton({
  children,
  pendingLabel,
  disabled,
  className,
  ...props
}: Props) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending || disabled}
      aria-busy={pending || undefined}
      className={className}
      {...props}
    >
      {pending ? (
        <>
          <Spinner />
          <span>{pendingLabel ?? "Working…"}</span>
        </>
      ) : (
        children
      )}
    </Button>
  );
}

function Spinner() {
  return (
    <span
      aria-hidden
      className="inline-block h-3.5 w-3.5 rounded-full border-[1.5px] border-current border-t-transparent animate-spin"
    />
  );
}
