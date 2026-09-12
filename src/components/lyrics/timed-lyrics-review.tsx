"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Heart, ThumbsDown, ThumbsUp } from "lucide-react";
import { toast } from "sonner";
import { getGuestReaction, setGuestReaction } from "@/lib/guest-storage";
import type { LyricLineWithReactions, ReactionType } from "@/types/database";
import { cn } from "@/lib/utils";

interface TimedLyricsReviewProps {
  lines: LyricLineWithReactions[];
  currentTime: number;
  isPlaying: boolean;
  onReactionChange: (
    id: string,
    next: {
      heartCount: number;
      likeCount: number;
      dislikeCount: number;
      userReaction: ReactionType | null;
    }
  ) => void;
}

function applyOptimistic(
  type: ReactionType,
  current: ReactionType | null,
  heartCount: number,
  likeCount: number,
  dislikeCount: number
) {
  let nextHeart = heartCount;
  let nextLike = likeCount;
  let nextDislike = dislikeCount;
  let nextUser: ReactionType | null = type;

  if (current === type) {
    nextUser = null;
    if (type === "heart") nextHeart -= 1;
    if (type === "like") nextLike -= 1;
    if (type === "dislike") nextDislike -= 1;
  } else {
    if (current === "heart") nextHeart -= 1;
    if (current === "like") nextLike -= 1;
    if (current === "dislike") nextDislike -= 1;
    if (type === "heart") nextHeart += 1;
    if (type === "like") nextLike += 1;
    if (type === "dislike") nextDislike += 1;
  }

  return {
    heartCount: Math.max(0, nextHeart),
    likeCount: Math.max(0, nextLike),
    dislikeCount: Math.max(0, nextDislike),
    userReaction: nextUser,
  };
}

export function TimedLyricsReview({
  lines,
  currentTime,
  isPlaying,
  onReactionChange,
}: TimedLyricsReviewProps) {
  const timed = useMemo(
    () =>
      [...lines]
        .filter((l) => l.start_time != null)
        .sort((a, b) => (a.start_time ?? 0) - (b.start_time ?? 0)),
    [lines]
  );

  const [activeLineId, setActiveLineId] = useState<string | null>(null);
  const [showButtons, setShowButtons] = useState(false);
  const reviewedRef = useRef<Set<string>>(new Set());

  // Reset when user seeks backward
  const prevTimeRef = useRef(0);
  useEffect(() => {
    if (currentTime + 1.25 < prevTimeRef.current) {
      setActiveLineId(null);
      setShowButtons(false);
      reviewedRef.current = new Set();
    }
    prevTimeRef.current = currentTime;
  }, [currentTime]);

  // While a timed lyric is playing, show it + rating buttons (until rated or next line)
  useEffect(() => {
    if (!timed.length) return;

    const t = currentTime;
    let singing: LyricLineWithReactions | null = null;
    for (const line of timed) {
      const start = line.start_time ?? 0;
      const end = line.end_time ?? Number.POSITIVE_INFINITY;
      if (t >= start && t < end) {
        singing = line;
        break;
      }
    }

    if (singing) {
      setActiveLineId(singing.id);
      setShowButtons(!reviewedRef.current.has(singing.id));
      return;
    }

    // Between lines — hide buttons; keep last lyric text until the next starts
    setShowButtons(false);
  }, [currentTime, timed]);

  const activeLine = activeLineId
    ? timed.find((l) => l.id === activeLineId) || null
    : null;

  const react = (type: ReactionType) => {
    if (!activeLine || !showButtons) return;
    const current = activeLine.user_reaction ?? getGuestReaction(activeLine.id);
    const optimistic = applyOptimistic(
      type,
      current,
      activeLine.heart_count,
      activeLine.like_count,
      activeLine.dislike_count
    );
    onReactionChange(activeLine.id, optimistic);
    setGuestReaction(activeLine.id, optimistic.userReaction);
    reviewedRef.current.add(activeLine.id);
    setShowButtons(false);

    toast.success(
      optimistic.userReaction === "heart"
        ? "Loved this line ❤️"
        : optimistic.userReaction === "like"
          ? "Liked this line 👍"
          : optimistic.userReaction === "dislike"
            ? "Disliked this line 👎"
            : "Reaction removed"
    );
  };

  if (!timed.length) {
    return (
      <div className="flex min-h-[12rem] flex-col justify-center rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/40 px-4 py-6 text-center">
        <p className="text-sm font-medium text-zinc-300">Live lyric review</p>
        <p className="mt-2 text-xs leading-relaxed text-zinc-500">
          Add an <code className="text-zinc-400">.srt</code> file when publishing so
          lines sync with the song. Then heart, like, or dislike while each line plays.
        </p>
      </div>
    );
  }

  const label = showButtons
    ? "Rate this line"
    : activeLine
      ? "Now playing"
      : isPlaying
        ? "Listening…"
        : "Press play";

  return (
    <div className="flex min-h-[12rem] flex-col justify-between rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 px-4 py-5 shadow-inner">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
          {label}
        </p>
        <p
          className={cn(
            "mt-3 text-lg font-medium leading-snug transition duration-300 md:text-xl",
            activeLine ? "text-zinc-50" : "text-zinc-600"
          )}
        >
          {activeLine?.text ||
            (isPlaying ? "…" : "Timed lyrics appear here while the song plays")}
        </p>
        {activeLine?.section_label ? (
          <p className="mt-2 text-xs uppercase tracking-wider text-purple-400/80">
            {activeLine.section_label}
          </p>
        ) : null}
      </div>

      <div
        className={cn(
          "mt-6 transition-all duration-300",
          showButtons
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-2 opacity-0"
        )}
        aria-hidden={!showButtons}
      >
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => react("heart")}
            aria-label="Heart lyric"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/20 text-rose-400 ring-1 ring-rose-500/40 transition hover:scale-105 hover:bg-rose-500/30"
          >
            <Heart className="h-5 w-5 fill-current" />
          </button>
          <button
            type="button"
            onClick={() => react("like")}
            aria-label="Like lyric"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/40 transition hover:scale-105 hover:bg-blue-500/30"
          >
            <ThumbsUp className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => react("dislike")}
            aria-label="Dislike lyric"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20 text-red-400 ring-1 ring-red-500/40 transition hover:scale-105 hover:bg-red-500/30"
          >
            <ThumbsDown className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-2 text-center text-[11px] text-zinc-500">
          Rate while the line plays — skips when the next line starts
        </p>
      </div>
    </div>
  );
}
