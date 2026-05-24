/**
 * Light parser for ChordPro source blocks pulled from third-party services
 * (CCLI SongSelect, OnSong, etc). We pull out the metadata directives so
 * the song row can be populated automatically.
 */
export type ParsedChordPro = {
  title: string | null;
  artist: string | null;
  original_key: string | null;
  bpm: number | null;
  body: string;
};

function readDirective(body: string, name: string): string | null {
  const re = new RegExp(`\\{${name}\\s*:\\s*([^}]+)\\}`, "i");
  const m = body.match(re);
  return m ? m[1].trim() : null;
}

export function parseSingleChordPro(raw: string): ParsedChordPro {
  const body = raw.trim();
  const title =
    readDirective(body, "title") ?? readDirective(body, "t");
  const artist =
    readDirective(body, "artist") ?? readDirective(body, "subtitle");
  const original_key = readDirective(body, "key");
  const bpmRaw = readDirective(body, "tempo");
  const bpm = bpmRaw ? Number(bpmRaw.match(/\d+/)?.[0]) : null;

  return {
    title,
    artist,
    original_key,
    bpm: Number.isFinite(bpm as number) ? bpm : null,
    body,
  };
}

/**
 * Split a paste containing multiple ChordPro blocks. Songs are separated by
 *   1) a line containing only `---` (three or more dashes)  — explicit separator
 *   2) OR a fresh `{title: ...}` directive at the start of a line
 */
export function splitChordProBlocks(raw: string): string[] {
  const text = raw.replace(/\r\n/g, "\n").trim();
  if (!text) return [];

  // First try explicit --- separators.
  const explicit = text
    .split(/^---+$/m)
    .map((s) => s.trim())
    .filter(Boolean);
  if (explicit.length > 1) return explicit;

  // Otherwise split on `{title:` directives.
  const parts: string[] = [];
  const re = /^\{title\s*:/gim;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const chunk = text.slice(lastIndex, match.index).trim();
      if (chunk) parts.push(chunk);
    }
    lastIndex = match.index;
  }
  const tail = text.slice(lastIndex).trim();
  if (tail) parts.push(tail);

  return parts.length ? parts : [text];
}
