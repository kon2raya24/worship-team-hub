"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Home" },
  { href: "/songs", label: "Songs" },
  { href: "/setlists", label: "Setlists" },
  { href: "/schedule", label: "Schedule" },
  { href: "/devotions", label: "Devotions" },
  { href: "/prayer", label: "Prayer" },
  { href: "/announcements", label: "Announcements" },
  { href: "/files", label: "Files" },
];

export function Nav({ displayName, role }: { displayName: string; role: string }) {
  const pathname = usePathname();

  return (
    <header className="border-b bg-white dark:bg-zinc-950">
      <div className="mx-auto max-w-6xl px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-2">
        <Link href="/" className="font-semibold tracking-tight">
          Worship Hub
        </Link>
        <nav className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {links.map((l) => {
            const active =
              l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors",
                  active
                    ? "text-zinc-900 dark:text-zinc-50 font-medium"
                    : "text-zinc-500"
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-3 text-sm">
          <span className="text-zinc-500">
            {displayName}{" "}
            <span className="text-xs uppercase tracking-wide text-zinc-400">
              {role}
            </span>
          </span>
          <form action="/auth/signout" method="post">
            <button type="submit" className="underline text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
