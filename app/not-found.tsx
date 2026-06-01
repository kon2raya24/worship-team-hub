import Link from "next/link";
import { Compass } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="glass p-8 max-w-md w-full text-center fade-in">
        <span className="inline-flex items-center justify-center size-12 rounded-xl bg-[#8b5cf6]/10 text-[#8b5cf6] mx-auto">
          <Compass className="size-6" />
        </span>
        <p className="mt-4 font-mono text-xs uppercase tracking-widest text-muted-foreground">
          404
        </p>
        <h1 className="mt-1 text-2xl font-display font-semibold tracking-tight">
          Page not found
        </h1>
        <p className="mt-2 text-sm text-foreground/80">
          That page may have moved, or the link is broken.
        </p>
        <Link href="/" className={buttonVariants() + " mt-5"}>
          Back to home
        </Link>
      </div>
    </div>
  );
}
