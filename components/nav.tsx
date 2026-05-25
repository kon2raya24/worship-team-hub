"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useFormStatus } from "react-dom";
import {
  Home,
  Music,
  ListMusic,
  Calendar,
  BookOpen,
  Heart,
  Megaphone,
  Files,
  Users,
  Gamepad2,
  LogOut,
  Settings as SettingsIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "@/app/(app)/actions";
import { roleLabel, type Role } from "@/lib/roles";

const links = [
  { href: "/", label: "Home", Icon: Home },
  { href: "/songs", label: "Library", Icon: Music },
  { href: "/setlists", label: "Setlists", Icon: ListMusic },
  { href: "/schedule", label: "Schedule", Icon: Calendar },
  { href: "/team", label: "Team", Icon: Users },
  { href: "/devotions", label: "Devotions", Icon: BookOpen },
  { href: "/prayer", label: "Prayer", Icon: Heart },
  { href: "/announcements", label: "News", Icon: Megaphone },
  { href: "/files", label: "Files", Icon: Files },
  { href: "/games", label: "Games", Icon: Gamepad2 },
];

export function Nav({ displayName, role }: { displayName: string; role: string }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.08] bg-[#070a17]/75 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-3 sm:px-4 md:px-6 py-2.5">
        <div className="flex items-center gap-1 p-1 bg-white/[0.025] border border-white/[0.08] rounded-lg">
          <Link
            href="/"
            className="flex items-center gap-2 group shrink-0 px-1.5 py-1 rounded-md hover:bg-white/[0.05] transition-colors"
          >
            <span className="brand-mark h-6 w-6 inline-block" />
            <span className="hidden md:inline font-display font-semibold tracking-wide text-[14px]">
              Worship Hub
            </span>
          </Link>

          {/* Horizontally scrollable nav links */}
          <nav className="flex-1 min-w-0 flex gap-0.5 text-sm overflow-x-auto no-scrollbar">
            {links.map(({ href, label, Icon }) => {
              const active =
                href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  title={label}
                  className={cn(
                    "relative inline-flex items-center gap-1.5 px-2 py-1.5 rounded-md transition-all shrink-0",
                    active
                      ? "text-white bg-white/[0.09] ring-1 ring-white/[0.16] shadow-[0_0_18px_rgba(139,92,246,0.18)]"
                      : "text-[#8a92b4] hover:text-white hover:bg-white/[0.05]"
                  )}
                >
                  <Icon className="size-3.5" strokeWidth={1.75} />
                  <span className="hidden md:inline">{label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-0.5 text-sm shrink-0">
            <Link
              href="/settings"
              className="inline-flex items-center justify-center size-8 rounded-md text-[#8a92b4] hover:text-white hover:bg-white/[0.05] transition-colors"
              aria-label="Settings"
            >
              <SettingsIcon className="size-3.5" strokeWidth={1.75} />
            </Link>
            <span className="hidden lg:flex items-center gap-2 px-2 text-[#8a92b4]">
              <span className="text-white/90">{displayName}</span>
              <span
                className="font-mono text-[9px] tracking-[0.18em] px-1.5 py-[3px] rounded-md border border-[#00e8ff]/35 text-[#00e8ff] uppercase font-semibold"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(0,232,255,0.18), rgba(139,92,246,0.18))",
                }}
              >
                {roleLabel(role as Role)}
              </span>
            </span>
            <form action={signOut}>
              <SignOutButton />
            </form>
          </div>
        </div>
      </div>

      <style jsx>{`
        :global(.no-scrollbar) {
          scrollbar-width: none;
        }
        :global(.no-scrollbar::-webkit-scrollbar) {
          display: none;
        }
      `}</style>
    </header>
  );
}

function SignOutButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-1.5 text-[#8a92b4] hover:text-white transition-colors px-2 py-1 rounded-md hover:bg-white/[0.05] disabled:opacity-60 disabled:pointer-events-none"
      aria-label="Sign out"
    >
      {pending ? (
        <span className="inline-block h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
      ) : (
        <LogOut className="size-3.5" strokeWidth={1.75} />
      )}
      <span className="hidden sm:inline">
        {pending ? "Signing out…" : "Sign out"}
      </span>
    </button>
  );
}
