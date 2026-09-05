"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAudio } from "@/components/providers/audio-provider";
import { formatTimestamp } from "@/lib/utils";

export interface TimestampLine {
  line_number: number;
  text: string;
  section_label: string | null;
  start_time: number | null;
  end_time: number | null;
}

interface TimestampEditorProps {
  lines: TimestampLine[];
  onChange: (lines: TimestampLine[]) => void;
  audioUrl?: string | null;
  songMeta?: {
    id: string;
    title: string;
    slug: string;
    artistName: string;
    coverUrl: string | null;
  };
}

export function TimestampEditor({
  lines,
  onChange,
  audioUrl,
  songMeta,
}: TimestampEditorProps) {
  const { currentTime, playTrack, seek, isPlaying, track } = useAudio();
  const [selected, setSelected] = useState(0);

  const active = useMemo(
    () => track?.id === songMeta?.id && isPlaying,
    [track?.id, songMeta?.id, isPlaying]
  );

  const setStart = (index: number, value: number | null) => {
    const next = lines.map((l, i) =>
      i === index ? { ...l, start_time: value } : l
    );
    onChange(next);
  };

  const setEnd = (index: number, value: number | null) => {
    const next = lines.map((l, i) =>
      i === index ? { ...l, end_time: value } : l
    );
    onChange(next);
  };

  const captureStart = () => {
    setStart(selected, Number(currentTime.toFixed(1)));
  };

  const captureEnd = () => {
    setEnd(selected, Number(currentTime.toFixed(1)));
  };

  return (
    <div className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-zinc-50">Timestamp editor</h3>
          <p className="text-sm text-zinc-400">
            Optional — play audio and stamp start/end times per line.
          </p>
        </div>
        {audioUrl && songMeta ? (
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              playTrack({
                id: songMeta.id,
                title: songMeta.title,
                slug: songMeta.slug,
                artistName: songMeta.artistName,
                coverUrl: songMeta.coverUrl,
                audioUrl,
              })
            }
          >
            {active ? "Playing…" : "Play audio"}
          </Button>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="outline" onClick={captureStart}>
          Set start @ {formatTimestamp(currentTime)}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={captureEnd}>
          Set end @ {formatTimestamp(currentTime)}
        </Button>
      </div>

      <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
        {lines.map((line, index) => (
          <button
            key={line.line_number}
            type="button"
            onClick={() => {
              setSelected(index);
              if (line.start_time != null) seek(line.start_time);
            }}
            className={`grid w-full grid-cols-[88px_88px_1fr] items-center gap-2 rounded-xl border px-2 py-2 text-left text-sm ${
              selected === index
                ? "border-purple-500/50 bg-purple-500/10"
                : "border-zinc-800 bg-zinc-950/40"
            }`}
          >
            <Input
              value={line.start_time ?? ""}
              placeholder="start"
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => {
                const v = e.target.value;
                setStart(index, v === "" ? null : Number(v));
              }}
              className="h-8 px-2 text-xs"
            />
            <Input
              value={line.end_time ?? ""}
              placeholder="end"
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => {
                const v = e.target.value;
                setEnd(index, v === "" ? null : Number(v));
              }}
              className="h-8 px-2 text-xs"
            />
            <span className="truncate text-zinc-300">{line.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
