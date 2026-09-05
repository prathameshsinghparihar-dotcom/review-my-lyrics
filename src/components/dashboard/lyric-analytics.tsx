"use client";

import { useMemo, useState } from "react";
import { dislikePercent, positivePercent } from "@/lib/utils";
import type { LyricLineWithReactions } from "@/types/database";
import { cn } from "@/lib/utils";

type SortKey = "loved" | "liked" | "disliked" | "reviewed";

interface LyricAnalyticsProps {
  lines: (LyricLineWithReactions & {
    positive_pct?: number;
    dislike_pct?: number;
    total_reactions?: number;
  })[];
}

export function LyricAnalytics({ lines }: LyricAnalyticsProps) {
  const [sort, setSort] = useState<SortKey>("loved");

  const sorted = useMemo(() => {
    const copy = [...lines];
    copy.sort((a, b) => {
      if (sort === "loved") return b.heart_count - a.heart_count;
      if (sort === "liked") return b.like_count - a.like_count;
      if (sort === "disliked") return b.dislike_count - a.dislike_count;
      return (
        b.heart_count +
        b.like_count +
        b.dislike_count -
        (a.heart_count + a.like_count + a.dislike_count)
      );
    });
    return copy;
  }, [lines, sort]);

  const best = [...lines]
    .filter((l) => l.heart_count + l.like_count + l.dislike_count > 0)
    .sort(
      (a, b) =>
        positivePercent(b.heart_count, b.like_count, b.dislike_count) -
        positivePercent(a.heart_count, a.like_count, a.dislike_count)
    )
    .slice(0, 5);

  const worst = [...lines]
    .filter((l) => l.heart_count + l.like_count + l.dislike_count > 0)
    .sort(
      (a, b) =>
        dislikePercent(b.heart_count, b.like_count, b.dislike_count) -
        dislikePercent(a.heart_count, a.like_count, a.dislike_count)
    )
    .slice(0, 5);

  return (
    <div className="space-y-8">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
          <h3 className="mb-3 font-semibold text-emerald-400">Best lines</h3>
          {best.length === 0 ? (
            <p className="text-sm text-zinc-500">No reactions yet.</p>
          ) : (
            <ol className="space-y-3">
              {best.map((l, i) => (
                <li key={l.id} className="text-sm">
                  <span className="text-zinc-500">{i + 1}. </span>
                  <span className="text-zinc-200">&ldquo;{l.text}&rdquo;</span>
                  <span className="ml-2 text-emerald-400">
                    Positive:{" "}
                    {positivePercent(l.heart_count, l.like_count, l.dislike_count)}%
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
          <h3 className="mb-3 font-semibold text-red-400">Most disliked lines</h3>
          {worst.length === 0 ? (
            <p className="text-sm text-zinc-500">No reactions yet.</p>
          ) : (
            <ol className="space-y-3">
              {worst.map((l, i) => (
                <li key={l.id} className="text-sm">
                  <span className="text-zinc-500">{i + 1}. </span>
                  <span className="text-zinc-200">&ldquo;{l.text}&rdquo;</span>
                  <span className="ml-2 text-red-400">
                    Dislike:{" "}
                    {dislikePercent(l.heart_count, l.like_count, l.dislike_count)}%
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      <div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-zinc-50">Lyric performance</h3>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["loved", "Most Loved"],
                ["liked", "Most Liked"],
                ["disliked", "Most Disliked"],
                ["reviewed", "Most Reviewed"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setSort(key)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-medium",
                  sort === key
                    ? "bg-purple-500 text-white"
                    : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {sorted.map((l) => {
            const pos = positivePercent(l.heart_count, l.like_count, l.dislike_count);
            const neg = dislikePercent(l.heart_count, l.like_count, l.dislike_count);
            const highlight =
              pos >= 90
                ? "border-emerald-500/30 bg-emerald-500/5"
                : neg >= 30
                  ? "border-red-500/30 bg-red-500/5"
                  : "border-zinc-800 bg-zinc-900/40";
            return (
              <div
                key={l.id}
                className={cn("rounded-xl border p-3 md:p-4", highlight)}
              >
                <p className="text-sm text-zinc-100 md:text-base">{l.text}</p>
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-zinc-400">
                  <span>❤️ {l.heart_count}</span>
                  <span>👍 {l.like_count}</span>
                  <span>👎 {l.dislike_count}</span>
                  <span className="text-emerald-400">{pos}% positive</span>
                  <span className="text-red-400">{neg}% dislike</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
