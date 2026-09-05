"use client";

import { useEffect, useRef } from "react";
import { LyricReaction } from "@/components/lyrics/lyric-reaction";
import type { LyricLineWithReactions, ReactionType } from "@/types/database";
import { cn } from "@/lib/utils";

interface LyricLineProps {
  line: LyricLineWithReactions;
  isActive: boolean;
  onSeek?: (time: number) => void;
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

export function LyricLine({
  line,
  isActive,
  onSeek,
  onReactionChange,
}: LyricLineProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive || !ref.current) return;
    ref.current.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [isActive]);

  const canSeek = line.start_time != null;

  return (
    <div
      ref={ref}
      role={canSeek ? "button" : undefined}
      tabIndex={canSeek ? 0 : undefined}
      onClick={() => {
        if (canSeek && line.start_time != null) onSeek?.(line.start_time);
      }}
      onKeyDown={(e) => {
        if (!canSeek) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (line.start_time != null) onSeek?.(line.start_time);
        }
      }}
      className={cn(
        "group rounded-xl px-3 py-2.5 transition duration-200",
        isActive
          ? "scale-[1.01] bg-purple-500/15 text-zinc-50 ring-1 ring-purple-500/30"
          : "text-zinc-400 hover:bg-zinc-900/80 hover:text-zinc-200",
        canSeek && "cursor-pointer"
      )}
      aria-current={isActive ? "true" : undefined}
    >
      <p
        className={cn(
          "text-base leading-relaxed md:text-lg",
          isActive ? "font-medium text-zinc-50" : "font-normal"
        )}
      >
        {line.text}
      </p>
      <div className={cn("md:opacity-70 md:group-hover:opacity-100", isActive && "opacity-100")}>
        <LyricReaction
          lyricLineId={line.id}
          heartCount={line.heart_count}
          likeCount={line.like_count}
          dislikeCount={line.dislike_count}
          userReaction={line.user_reaction}
          onChange={(next) => onReactionChange(line.id, next)}
        />
      </div>
    </div>
  );
}
