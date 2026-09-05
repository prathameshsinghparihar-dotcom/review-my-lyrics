import type { ReactionType } from "@/types/database";

const REACTION_KEY = "lyricpulse_guest_reactions";
const REVIEW_KEY = "lyricpulse_guest_reviews";
const FAVORITE_KEY = "lyricpulse_guest_favorites";

type ReactionMap = Record<string, ReactionType>;

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function getGuestReaction(lyricLineId: string): ReactionType | null {
  const map = readJson<ReactionMap>(REACTION_KEY, {});
  return map[lyricLineId] || null;
}

export function setGuestReaction(
  lyricLineId: string,
  reaction: ReactionType | null
): void {
  const map = readJson<ReactionMap>(REACTION_KEY, {});
  if (reaction) map[lyricLineId] = reaction;
  else delete map[lyricLineId];
  writeJson(REACTION_KEY, map);
}

export function getGuestReview(songId: string): {
  rating: number;
  comment: string | null;
} | null {
  const map = readJson<Record<string, { rating: number; comment: string | null }>>(
    REVIEW_KEY,
    {}
  );
  return map[songId] || null;
}

export function setGuestReview(
  songId: string,
  review: { rating: number; comment: string | null } | null
): void {
  const map = readJson<Record<string, { rating: number; comment: string | null }>>(
    REVIEW_KEY,
    {}
  );
  if (review) map[songId] = review;
  else delete map[songId];
  writeJson(REVIEW_KEY, map);
}

export function getGuestFavorites(): string[] {
  return readJson<string[]>(FAVORITE_KEY, []);
}

export function toggleGuestFavorite(songId: string): boolean {
  const list = getGuestFavorites();
  const exists = list.includes(songId);
  const next = exists ? list.filter((id) => id !== songId) : [...list, songId];
  writeJson(FAVORITE_KEY, next);
  return !exists;
}

export function isGuestFavorite(songId: string): boolean {
  return getGuestFavorites().includes(songId);
}
