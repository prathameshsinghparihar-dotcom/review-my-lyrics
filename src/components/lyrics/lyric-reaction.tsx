"use client";

import { useState } from "react";
import { Heart, ThumbsDown, ThumbsUp } from "lucide-react";
import { toast } from "sonner";
import { getGuestReaction, setGuestReaction } from "@/lib/guest-storage";
import type { ReactionType } from "@/types/database";
import { cn, positivePercent } from "@/lib/utils";

interface LyricReactionProps {
  lyricLineId: string;
  heartCount: number;
  likeCount: number;
  dislikeCount: number;
  userReaction: ReactionType | null;
  onChange: (next: {
    heartCount: number;
    likeCount: number;
    dislikeCount: number;
    userReaction: ReactionType | null;
  }) => void;
}

export function LyricReaction({
  lyricLineId,
  heartCount,
  likeCount,
  dislikeCount,
  userReaction,
  onChange,
}: LyricReactionProps) {
  const [anim, setAnim] = useState<ReactionType | null>(null);

  const applyOptimistic = (type: ReactionType, current: ReactionType | null) => {
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
  };

  const react = (type: ReactionType) => {
    const current = userReaction ?? getGuestReaction(lyricLineId);
    const optimistic = applyOptimistic(type, current);
    onChange(optimistic);
    setGuestReaction(lyricLineId, optimistic.userReaction);
    setAnim(type);
    setTimeout(() => setAnim(null), 280);
    toast.success(
      optimistic.userReaction
        ? `Reaction saved ${
            optimistic.userReaction === "heart"
              ? "❤️"
              : optimistic.userReaction === "like"
                ? "👍"
                : "👎"
          }`
        : "Reaction removed"
    );
  };

  const pct = positivePercent(heartCount, likeCount, dislikeCount);

  const btn = (
    type: ReactionType,
    count: number,
    label: string,
    icon: React.ReactNode,
    selectedClass: string
  ) => (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        react(type);
      }}
      aria-label={label}
      aria-pressed={userReaction === type}
      className={cn(
        "inline-flex items-center gap-1 rounded-lg px-1.5 py-1 text-xs transition duration-200",
        userReaction === type
          ? selectedClass
          : "text-zinc-500 hover:bg-zinc-800/80 hover:text-zinc-200",
        anim === type && "scale-110"
      )}
    >
      {icon}
      <span>{count}</span>
    </button>
  );

  return (
    <div className="mt-1 flex flex-wrap items-center gap-1">
      {btn(
        "heart",
        heartCount,
        "Heart lyric",
        <Heart className={cn("h-3.5 w-3.5", userReaction === "heart" && "fill-current")} />,
        "bg-rose-500/20 text-rose-400 ring-1 ring-rose-500/40"
      )}
      {btn(
        "like",
        likeCount,
        "Like lyric",
        <ThumbsUp className={cn("h-3.5 w-3.5", userReaction === "like" && "fill-current")} />,
        "bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/40"
      )}
      {btn(
        "dislike",
        dislikeCount,
        "Dislike lyric",
        <ThumbsDown
          className={cn("h-3.5 w-3.5", userReaction === "dislike" && "fill-current")}
        />,
        "bg-red-500/20 text-red-400 ring-1 ring-red-500/40"
      )}
      {heartCount + likeCount + dislikeCount > 0 ? (
        <span className="ml-1 hidden text-[10px] text-zinc-600 group-hover:inline sm:inline">
          {pct}% positive
        </span>
      ) : null}
    </div>
  );
}
