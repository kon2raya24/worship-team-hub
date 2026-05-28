import sanitizeHtml from "sanitize-html";
import {
  ChordProParser,
  ChordsOverWordsParser,
  HtmlDivFormatter,
  Song,
} from "chordsheetjs";

export function parseChordPro(body: string): Song {
  const trimmed = body.trim();
  if (!trimmed) {
    return new ChordProParser().parse("");
  }
  // Heuristic: ChordPro uses {directives} and [Chord] brackets. If we see neither,
  // treat as the older "chords-over-words" format.
  if (trimmed.includes("{") || trimmed.includes("[")) {
    return new ChordProParser().parse(trimmed);
  }
  return new ChordsOverWordsParser().parse(trimmed);
}

export function transposeSong(song: Song, semitones: number): Song {
  if (!semitones) return song;
  return song.transpose(semitones);
}

export function renderHtml(song: Song): string {
  // chordsheetjs does NOT HTML-escape titles/comments/lyrics, so a malicious
  // ChordPro body could inject <script>/onerror. Sanitize before this string
  // ever reaches dangerouslySetInnerHTML (server-rendered song page + client
  // viewer + public share links). sanitize-html is pure JS (no jsdom), so it
  // runs safely in Vercel's serverless runtime — unlike isomorphic-dompurify.
  return sanitizeHtml(new HtmlDivFormatter().format(song), {
    allowedTags: [
      "div", "span", "p", "br", "h1", "h2", "h3",
      "strong", "em", "b", "i", "sub", "sup",
      "table", "thead", "tbody", "tr", "td", "th",
    ],
    allowedAttributes: { "*": ["class"] },
  });
}

export function renderTransposedHtml(body: string, semitones = 0): string {
  try {
    const song = parseChordPro(body);
    return renderHtml(transposeSong(song, semitones));
  } catch {
    // If parsing fails, fall back to plain text so the page still renders.
    return `<pre>${escapeHtml(body)}</pre>`;
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
