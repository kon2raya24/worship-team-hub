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
  return new HtmlDivFormatter().format(song);
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
