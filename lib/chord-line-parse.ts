/**
 * Convert "chord-above-lyrics" text (the format Ultimate Guitar / printed
 * chord sheets use, where a chord line sits on top of a lyric line) into
 * inline ChordPro format ([C]lyric).
 *
 * Idempotent: input that is already ChordPro (inline chords, directives,
 * no standalone chord lines) is returned unchanged.
 */

// Permissive chord token: letter A-G, optional accidental, optional
// modifier/extension/slash bass. Matches Cm7, Dsus4, D/F#, Cmaj7sus4, Bb, F#m, etc.
const CHORD_TOKEN =
  /^[A-G][b#♭♯]?(?:maj|min|m|M|sus|aug|dim|add|°|ø|Δ)*\d*(?:sus[24])?(?:add\d+)?(?:[b#]\d+)?(?:\/[A-G][b#♭♯]?\d*)?$/;

// Bracketed section headers we promote to ChordPro {comment: ...}
const SECTION_RE = /^\[([^\]]+)\]\s*(.*)$/;

function isChordLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("[")) return false;
  if (trimmed.startsWith("{")) return false;
  const tokens = trimmed.split(/\s+/);
  if (tokens.length === 0) return false;
  // Reject lines with obvious lyric punctuation
  if (/[,.!?;:"]/.test(trimmed)) return false;
  return tokens.every((tok) => CHORD_TOKEN.test(tok));
}

function chordOnlyLine(chordLine: string): string {
  const re = /\S+/g;
  const chords: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(chordLine)) !== null) {
    chords.push(m[0]);
  }
  return chords.map((c) => `[${c}]`).join(" ");
}

function mergeChordsIntoLyric(chordLine: string, lyricLine: string): string {
  const chords: Array<{ col: number; chord: string }> = [];
  const re = /\S+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(chordLine)) !== null) {
    chords.push({ col: m.index, chord: m[0] });
  }
  let out = "";
  let cursor = 0;
  for (const { col, chord } of chords) {
    while (cursor < col && cursor < lyricLine.length) {
      out += lyricLine[cursor];
      cursor++;
    }
    while (cursor < col) {
      out += " ";
      cursor++;
    }
    out += `[${chord}]`;
  }
  out += lyricLine.slice(cursor);
  return out;
}

export function convertChordOverLyrics(input: string): string {
  const lines = input.replace(/\r\n/g, "\n").split("\n");
  const result: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      result.push("");
      i++;
      continue;
    }

    const section = trimmed.match(SECTION_RE);
    if (section) {
      const name = section[1].trim();
      result.push(`{comment: ${name}}`);
      // If anything followed the bracket on the same line, keep it as a lyric line
      const rest = section[2];
      if (rest && rest.trim()) result.push(rest);
      i++;
      continue;
    }

    if (isChordLine(line)) {
      // Find the next line that could be its paired lyric: skip blanks, but
      // stop at another chord line, a section header, or a directive.
      let j = i + 1;
      while (j < lines.length && !lines[j].trim()) j++;
      const next = j < lines.length ? lines[j] : null;
      const nextTrim = next?.trim() ?? "";
      const nextIsLyric =
        next !== null &&
        nextTrim.length > 0 &&
        !nextTrim.startsWith("[") &&
        !nextTrim.startsWith("{") &&
        !isChordLine(next);

      if (nextIsLyric && next !== null) {
        result.push(mergeChordsIntoLyric(line, next));
        i = j + 1;
      } else {
        result.push(chordOnlyLine(line));
        i++;
      }
      continue;
    }

    // Plain lyric / directive / passthrough
    result.push(line);
    i++;
  }

  // Collapse 3+ consecutive blank lines to 2 for readability
  return result.join("\n").replace(/\n{3,}/g, "\n\n");
}

/**
 * Returns true if the input looks like chord-over-lyrics format
 * (has at least one standalone chord line). Use this to decide whether
 * to run the converter automatically.
 */
export function looksLikeChordOverLyrics(input: string): boolean {
  const lines = input.replace(/\r\n/g, "\n").split("\n");
  let chordLines = 0;
  for (const line of lines) {
    if (isChordLine(line)) chordLines++;
    if (chordLines >= 2) return true;
  }
  return false;
}
