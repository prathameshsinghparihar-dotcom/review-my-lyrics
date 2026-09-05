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

export function parseLyrics(
  raw: string
): { line_number: number; text: string; section_label: string | null }[] {
  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  const result: { line_number: number; text: string; section_label: string | null }[] = [];
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
