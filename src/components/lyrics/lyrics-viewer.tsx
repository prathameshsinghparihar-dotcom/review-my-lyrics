"use client";

import { useEffect, useMemo, useState } from "react";
import { LyricLine } from "@/components/lyrics/lyric-line";
import { LyricSection } from "@/components/lyrics/lyric-section";
import { getGuestReaction } from "@/lib/guest-storage";
import type { LyricLineWithReactions, ReactionType } from "@/types/database";

interface LyricsViewerProps {
  lines: LyricLineWithReactions[];
  currentTime: number;
  onSeek: (time: number) => void;
  activeSongId?: string;
}

export function LyricsViewer({ lines: initial, currentTime, onSeek }: LyricsViewerProps) {
  const [lines, setLines] = useState(initial);

  useEffect(() => {
    setLines(
      initial.map((line) => {
        const guest = getGuestReaction(line.id);
        if (!guest || line.user_reaction) return line;
        return {
          ...line,
          user_reaction: guest,
          heart_count: line.heart_count + (guest === "heart" ? 1 : 0),
          like_count: line.like_count + (guest === "like" ? 1 : 0),
          dislike_count: line.dislike_count + (guest === "dislike" ? 1 : 0),
        };
      })
    );
  }, [initial]);

  const activeId = useMemo(() => {
    const timed = lines.filter((l) => l.start_time != null);
    if (!timed.length) return null;
    const t = currentTime;
    for (const line of timed) {
      const start = line.start_time ?? 0;
      const end = line.end_time ?? Number.POSITIVE_INFINITY;
      if (t >= start && t < end) return line.id;
    }
    // fallback: last line whose start has passed
    let last: string | null = null;
    for (const line of timed) {
      if ((line.start_time ?? 0) <= t) last = line.id;
    }
    return last;
  }, [lines, currentTime]);

  const sections = useMemo(() => {
    const groups: { label: string | null; items: LyricLineWithReactions[] }[] = [];
    for (const line of lines) {
      const label = line.section_label;
      const last = groups[groups.length - 1];
      if (label || !last) {
        groups.push({ label, items: [line] });
      } else {
        last.items.push(line);
      }
    }
    return groups;
  }, [lines]);

  const onReactionChange = (
    id: string,
    next: {
      heartCount: number;
      likeCount: number;
      dislikeCount: number;
      userReaction: ReactionType | null;
    }
  ) => {
    setLines((prev) =>
      prev.map((l) =>
        l.id === id
          ? {
              ...l,
              heart_count: next.heartCount,
              like_count: next.likeCount,
              dislike_count: next.dislikeCount,
              user_reaction: next.userReaction,
            }
          : l
      )
    );
  };

  if (!lines.length) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-800 p-8 text-center text-zinc-500">
        No lyrics available for this song.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sections.map((section, idx) => (
        <LyricSection key={`${section.label}-${idx}`} label={section.label}>
          {section.items.map((line) => (
            <LyricLine
              key={line.id}
              line={line}
              isActive={activeId === line.id}
              onSeek={onSeek}
              onReactionChange={onReactionChange}
            />
          ))}
        </LyricSection>
      ))}
    </div>
  );
}
