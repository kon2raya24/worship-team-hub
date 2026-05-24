import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export function PageHeader({
  icon: Icon,
  title,
  subtitle,
  action,
  back,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <header className="space-y-3">
      {back && (
        <Link
          href={back.href}
          className="inline-flex items-center gap-1.5 text-xs text-[#8a92b4] hover:text-white transition-colors"
        >
          <ArrowLeft className="size-3" /> {back.label}
        </Link>
      )}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <span className="inline-flex items-center justify-center size-11 rounded-lg bg-white/[0.05] ring-1 ring-white/[0.12] text-[#00e8ff] shrink-0">
            <Icon className="size-5" strokeWidth={1.75} />
          </span>
          <div className="min-w-0">
            <h1 className="text-2xl md:text-3xl font-display font-semibold tracking-tight leading-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-[#8a92b4] mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </header>
  );
}
