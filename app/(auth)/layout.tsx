export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center p-4 overflow-hidden">
      {/* Aurora blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -left-32 h-[28rem] w-[28rem] rounded-full bg-[#8b5cf6]/30 blur-[120px] animate-pulse"
        style={{ animationDuration: "7s" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/3 -right-32 h-[24rem] w-[24rem] rounded-full bg-[#00e8ff]/25 blur-[100px] animate-pulse"
        style={{ animationDuration: "9s" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 left-1/4 h-[20rem] w-[20rem] rounded-full bg-[#ff3aa3]/20 blur-[100px]"
      />

      <div className="relative w-full max-w-sm fade-in">
        <div className="mb-6 flex flex-col items-center gap-3">
          <span className="brand-mark inline-block h-14 w-14" />
          <div className="text-center">
            <div className="font-display text-2xl font-semibold tracking-wide">
              Worship Hub
            </div>
            <div className="eyebrow mt-1.5">Worship · Team · Hub</div>
            <div className="text-xs text-muted-foreground italic mt-3 max-w-[18rem] mx-auto">
              &ldquo;Sing to the Lord a new song; sing to the Lord, all the
              earth.&rdquo;
              <span className="not-italic"> — Psalm 96:1</span>
            </div>
          </div>
        </div>
        <div className="glass p-6">{children}</div>
      </div>
    </div>
  );
}
