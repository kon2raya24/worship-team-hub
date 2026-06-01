import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const base = [
  "group/button relative inline-flex shrink-0 items-center justify-center",
  "rounded-md border bg-clip-padding font-sans font-semibold tracking-[-0.01em]",
  "whitespace-nowrap select-none isolate",
  "transition-[transform,background,border-color,box-shadow,filter,color] duration-150 ease-out",
  "outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:border-accent/60",
  "active:scale-[0.97] active:duration-75",
  "disabled:pointer-events-none disabled:opacity-50 disabled:saturate-50",
  "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-[1.05em]",
  "[&_svg]:[stroke-width:2.25]",
].join(" ");

const buttonVariants = cva(base, {
  variants: {
    variant: {
      // PRIMARY — aurora gradient + neon glow. The hero CTA.
      // Light ("day") base uses a vivid OPAQUE gradient so white text stays
      // legible on a light page; the `dark:` overrides restore the original
      // translucent neon-glass treatment on dark (unchanged).
      default: cn(
        "bg-[linear-gradient(135deg,#0e7490,#7c3aed_55%,#db2777)] border-transparent text-white",
        "shadow-[0_6px_18px_-6px_rgba(124,58,237,0.55)] hover:brightness-110",
        "dark:bg-[linear-gradient(135deg,rgba(0,232,255,0.28),rgba(139,92,246,0.32)_55%,rgba(255,58,163,0.24))]",
        "dark:border-accent/40",
        "dark:shadow-[0_0_0_1px_rgba(255,255,255,0.05)_inset,0_8px_24px_-8px_rgba(0,232,255,0.3),0_4px_32px_-4px_rgba(139,92,246,0.25)]",
        "dark:hover:border-accent/65",
        "dark:hover:shadow-[0_0_0_1px_rgba(255,255,255,0.08)_inset,0_0_28px_rgba(0,232,255,0.55),0_0_56px_rgba(139,92,246,0.4)]"
      ),
      // OUTLINE — frosted glass with hairline. Secondary actions.
      outline: cn(
        "border-input bg-tint-1 backdrop-blur-md text-foreground/90",
        "shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset]",
        "hover:bg-tint-2 hover:border-hairline-strong hover:text-foreground",
        "hover:shadow-[0_1px_0_0_rgba(255,255,255,0.12)_inset,0_4px_16px_-6px_rgba(0,232,255,0.2)]"
      ),
      // SECONDARY — solid soft surface
      secondary: cn(
        "border-border bg-tint-2 text-foreground",
        "shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset]",
        "hover:bg-tint-3 hover:border-hairline-strong"
      ),
      // GHOST — no chrome until hover
      ghost: cn(
        "border-transparent text-muted-foreground shadow-none",
        "hover:bg-tint-2 hover:text-foreground"
      ),
      // DESTRUCTIVE — red glow for delete actions. Light base uses the
      // theme red token (readable on white); `dark:` keeps the neon-red glow.
      destructive: cn(
        "border-destructive/40 bg-destructive/10 text-destructive",
        "hover:bg-destructive/15 hover:border-destructive/60",
        "dark:border-destructive/40 dark:bg-destructive/10 dark:text-[#ff7a89]",
        "dark:shadow-[0_0_0_1px_rgba(255,85,102,0.1)_inset,0_4px_18px_-6px_rgba(255,85,102,0.3)]",
        "dark:hover:bg-destructive/20 dark:hover:border-destructive/65 dark:hover:text-[#ff8a99]",
        "dark:hover:shadow-[0_0_0_1px_rgba(255,85,102,0.2)_inset,0_0_24px_rgba(255,85,102,0.5)]"
      ),
      link: "border-transparent text-accent underline-offset-4 hover:underline shadow-none",
    },
    size: {
      // 40px mobile / 36px desktop — comfortable tap target on phones.
      default: "h-10 sm:h-9 gap-1.5 px-3.5 text-sm",
      xs: "h-7 gap-1 rounded-sm px-2 text-xs",
      // 36px mobile / 32px desktop — still tappable; only used for in-row actions.
      sm: "h-9 sm:h-8 gap-1.5 rounded-sm px-3 text-[0.8125rem]",
      // 44px mobile / 40px desktop — prominent CTAs / "Save" buttons.
      lg: "h-11 sm:h-10 gap-2 px-4 text-sm",
      icon: "size-10 sm:size-9",
      "icon-xs": "size-7 rounded-sm",
      "icon-sm": "size-9 sm:size-8 rounded-sm",
      "icon-lg": "size-11 sm:size-10",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
