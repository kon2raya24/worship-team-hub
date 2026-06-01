import { PlayCircle, Music2 } from "lucide-react";

/** Returns { provider, src } for an embeddable YouTube/Spotify URL, or null. */
function parseMedia(
  url: string
): { provider: "youtube" | "spotify"; src: string } | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");

    // YouTube — watch?v=, youtu.be/, /embed/, /shorts/
    if (host === "youtu.be") {
      const id = u.pathname.slice(1);
      if (id) return { provider: "youtube", src: `https://www.youtube.com/embed/${id}` };
    }
    if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
      const v = u.searchParams.get("v");
      if (v) return { provider: "youtube", src: `https://www.youtube.com/embed/${v}` };
      const m = u.pathname.match(/^\/(embed|shorts)\/([^/?]+)/);
      if (m) return { provider: "youtube", src: `https://www.youtube.com/embed/${m[2]}` };
    }

    // Spotify — open.spotify.com/(track|episode|album|playlist)/ID
    if (host === "open.spotify.com" || host === "spotify.com") {
      const m = u.pathname.match(/^\/(track|episode|album|playlist)\/([^/?]+)/);
      if (m) {
        return {
          provider: "spotify",
          src: `https://open.spotify.com/embed/${m[1]}/${m[2]}?utm_source=generator&theme=0`,
        };
      }
    }
  } catch {
    // not a URL
  }
  return null;
}

export function MediaEmbed({ url }: { url: string }) {
  const parsed = parseMedia(url);
  if (!parsed) return null;

  const isYouTube = parsed.provider === "youtube";
  return (
    <section className="glass overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3 border-b border-border">
        {isYouTube ? (
          <PlayCircle className="size-4 text-[#ff3aa3]" />
        ) : (
          <Music2 className="size-4 text-[#8eff6a]" />
        )}
        <span className="eyebrow">
          {isYouTube ? "YouTube reference" : "Spotify reference"}
        </span>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Open in new tab →
        </a>
      </div>
      <div
        className={isYouTube ? "aspect-video bg-black" : "bg-black"}
        style={isYouTube ? undefined : { height: 152 }}
      >
        <iframe
          src={parsed.src}
          title={`${parsed.provider} embed`}
          className="w-full h-full"
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
          loading="lazy"
          allowFullScreen={isYouTube}
        />
      </div>
    </section>
  );
}
