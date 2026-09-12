import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatTimestamp(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "00:00.0";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toFixed(1).padStart(4, "0")}`;
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

export function positivePercent(heart: number, like: number, dislike: number): number {
  const total = heart + like + dislike;
  if (total === 0) return 0;
  return Math.round(((heart + like) / total) * 100);
}

export function dislikePercent(heart: number, like: number, dislike: number): number {
  const total = heart + like + dislike;
  if (total === 0) return 0;
  return Math.round((dislike / total) * 100);
}

export type ParsedLyricLine = {
  line_number: number;
  text: string;
  section_label: string | null;
  start?: number | null;
  end?: number | null;
};

/** Parse plain lyrics (optional VERSE/CHORUS headers). */
export function parseLyrics(raw: string): ParsedLyricLine[] {
  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  const result: ParsedLyricLine[] = [];
  let currentSection: string | null = null;
  let lineNumber = 0;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      currentSection = null;
      continue;
    }

    const sectionMatch = line.match(
      /^(VERSE\s*\d*|CHORUS|BRIDGE|OUTRO|INTRO|PRE-CHORUS|HOOK)[:\s]*$/i
    );
    if (sectionMatch) {
      currentSection = sectionMatch[1].replace(/\s+/g, " ").toUpperCase();
      continue;
    }

    lineNumber += 1;
    result.push({
      line_number: lineNumber,
      text: line,
      section_label: currentSection,
    });
    currentSection = null;
  }

  return result;
}

/** SRT timestamp `00:01:02,500` or `00:01:02.500` → seconds */
export function parseSrtTimestamp(value: string): number {
  const cleaned = value.trim().replace(",", ".");
  const parts = cleaned.split(":");
  if (parts.length === 3) {
    const h = Number(parts[0]);
    const m = Number(parts[1]);
    const s = Number(parts[2]);
    if ([h, m, s].every(Number.isFinite)) return h * 3600 + m * 60 + s;
  }
  if (parts.length === 2) {
    const m = Number(parts[0]);
    const s = Number(parts[1]);
    if ([m, s].every(Number.isFinite)) return m * 60 + s;
  }
  return 0;
}

export function looksLikeSrt(raw: string): boolean {
  return /\d{1,2}:\d{2}:\d{2}[,.]\d{1,3}\s*-->\s*\d{1,2}:\d{2}:\d{2}[,.]\d{1,3}/.test(
    raw
  );
}

/**
 * Parse SubRip (.srt) cues into timed lyric lines.
 * Multi-line cue text is joined with a space.
 */
export function parseSrt(raw: string): ParsedLyricLine[] {
  const text = raw.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").trim();
  if (!text) return [];

  const blocks = text.split(/\n\s*\n/);
  const result: ParsedLyricLine[] = [];
  let lineNumber = 0;

  for (const block of blocks) {
    const lines = block
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    if (!lines.length) continue;

    let idx = 0;
    if (/^\d+$/.test(lines[0])) idx = 1;
    if (idx >= lines.length) continue;

    const timing = lines[idx].match(
      /^(\d{1,2}:\d{2}:\d{2}[,.]\d{1,3})\s*-->\s*(\d{1,2}:\d{2}:\d{2}[,.]\d{1,3})/
    );
    if (!timing) continue;

    const start = parseSrtTimestamp(timing[1]);
    const end = parseSrtTimestamp(timing[2]);
    const cueText = lines
      .slice(idx + 1)
      .join(" ")
      .replace(/<[^>]+>/g, "")
      .trim();
    if (!cueText) continue;

    lineNumber += 1;
    result.push({
      line_number: lineNumber,
      text: cueText,
      section_label: null,
      start,
      end: end > start ? end : start + 0.01,
    });
  }

  return result;
}

/** Auto-detect SRT vs plain lyrics. */
export function parseLyricsInput(raw: string): ParsedLyricLine[] {
  const cleaned = raw.replace(/^\uFEFF/, "").trim();
  if (!cleaned) return [];
  if (looksLikeSrt(cleaned)) return parseSrt(cleaned);
  return parseLyrics(cleaned);
}

export function uniqueSlug(base: string, existing: string[]): string {
  const slug = slugify(base) || "song";
  if (!existing.includes(slug)) return slug;
  let i = 2;
  while (existing.includes(`${slug}-${i}`)) i += 1;
  return `${slug}-${i}`;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
