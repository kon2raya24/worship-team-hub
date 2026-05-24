import { Nav } from "@/components/nav";
import { requireProfile } from "@/lib/auth";
import { Toaster } from "@/components/ui/sonner";
import { SongCacheSync } from "@/components/song-cache-sync";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();

  return (
    <>
      <Nav displayName={profile.display_name} role={profile.role} />
      <main className="mx-auto max-w-6xl px-3 sm:px-4 md:px-6 py-4 sm:py-6 flex-1 w-full fade-in">
        {children}
      </main>
      <SongCacheSync />
      <Toaster richColors closeButton />
    </>
  );
}
