import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const base = [
  "group/button relative inline-flex shrink-0 items-center justify-center",
  "rounded-md border bg-clip-padding font-sans font-semibold tracking-[-0.01em]",
  "whitespace-nowrap select-none isolate",
  "transition-[transform,background,border-color,box-shadow,filter,color] duration-150 ease-out",
  "outline-none focus-visible:ring-2 focus-visible:ring-[#00e8ff]/50 focus-visible:border-[#00e8ff]/60",
  "active:scale-[0.97] active:duration-75",
  "disabled:pointer-events-none disabled:opacity-50 disabled:saturate-50",
  "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-[1.05em]",
  "[&_svg]:[stroke-width:2.25]",
].join(" ");

const buttonVariants = cva(base, {
  variants: {
    variant: {
      // PRIMARY — aurora gradient + neon glow. The hero CTA.
      default: cn(
        "bg-[linear-gradient(135deg,rgba(0,232,255,0.28),rgba(139,92,246,0.32)_55%,rgba(255,58,163,0.24))]",
        "border-[#00e8ff]/40 text-white",
        "shadow-[0_0_0_1px_rgba(255,255,255,0.05)_inset,0_8px_24px_-8px_rgba(0,232,255,0.3),0_4px_32px_-4px_rgba(139,92,246,0.25)]",
        "hover:border-[#00e8ff]/65 hover:brightness-110",
        "hover:shadow-[0_0_0_1px_rgba(255,255,255,0.08)_inset,0_0_28px_rgba(0,232,255,0.55),0_0_56px_rgba(139,92,246,0.4)]"
      ),
      // OUTLINE — frosted glass with hairline. Secondary actions.
      outline: cn(
        "border-white/[0.12] bg-white/[0.04] backdrop-blur-md text-white/90",
        "shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset]",
        "hover:bg-white/[0.08] hover:border-white/[0.28] hover:text-white",
        "hover:shadow-[0_1px_0_0_rgba(255,255,255,0.12)_inset,0_4px_16px_-6px_rgba(0,232,255,0.2)]"
      ),
      // SECONDARY — solid soft surface
      secondary: cn(
        "border-white/[0.08] bg-white/[0.06] text-white/95",
        "shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset]",
        "hover:bg-white/[0.1] hover:border-white/[0.16]"
      ),
      // GHOST — no chrome until hover
      ghost: cn(
        "border-transparent text-white/70 shadow-none",
        "hover:bg-white/[0.06] hover:text-white"
      ),
      // DESTRUCTIVE — red glow for delete actions
      destructive: cn(
        "border-[#ff5566]/40 bg-[#ff5566]/10 text-[#ff7a89]",
        "shadow-[0_0_0_1px_rgba(255,85,102,0.1)_inset,0_4px_18px_-6px_rgba(255,85,102,0.3)]",
        "hover:bg-[#ff5566]/20 hover:border-[#ff5566]/65 hover:text-[#ff8a99]",
        "hover:shadow-[0_0_0_1px_rgba(255,85,102,0.2)_inset,0_0_24px_rgba(255,85,102,0.5)]"
      ),
      link: "border-transparent text-[#00e8ff] underline-offset-4 hover:underline shadow-none",
    },
    size: {
      // 36px — standard web button height, comfortable tap target on mobile.
      default: "h-9 gap-1.5 px-3.5 text-sm",
      xs: "h-7 gap-1 rounded-sm px-2 text-xs",
      sm: "h-8 gap-1.5 rounded-sm px-3 text-[0.8125rem]",
      // 40px — slightly bigger for prominent CTAs.
      lg: "h-10 gap-2 px-4 text-sm",
      icon: "size-9",
      "icon-xs": "size-7 rounded-sm",
      "icon-sm": "size-8 rounded-sm",
      "icon-lg": "size-10",
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
