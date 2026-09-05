"use client";

import { Heart, Pause, Play, ThumbsDown, ThumbsUp } from "lucide-react";
import { useState } from "react";

const DEMO_LINES = [
  { text: "I drove through the city lights", heart: 42, like: 81, dislike: 7 },
  { text: "Trying to find my way back home", heart: 31, like: 62, dislike: 12 },
  { text: "Every road remembers your name", heart: 89, like: 104, dislike: 5, active: true },
  { text: "Take me where the stars don't fade", heart: 54, like: 73, dislike: 9 },
];

export function HeroDemo() {
  const [playing, setPlaying] = useState(false);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-950 to-purple-950/40 p-4 shadow-2xl shadow-purple-950/30 md:p-6">
      <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-purple-500/20 blur-3xl" />
      <div className="absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-pink-500/10 blur-3xl" />

      <div className="relative grid gap-5 md:grid-cols-[140px_1fr]">
        <div className="mx-auto h-36 w-36 overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 shadow-lg md:mx-0 md:h-full md:w-full md:max-w-[140px]">
          <div className="flex h-full flex-col items-center justify-center p-3 text-center">
            <p className="text-xs uppercase tracking-widest text-white/70">Demo</p>
            <p className="mt-2 text-lg font-bold text-white">Midnight Drive</p>
            <p className="text-sm text-white/80">Alex Carter</p>
          </div>
        </div>

        <div className="min-w-0">
          <div className="mb-4 flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-3">
            <button
              type="button"
              onClick={() => setPlaying((p) => !p)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500 text-white"
              aria-label={playing ? "Pause demo" : "Play demo"}
            >
              {playing ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
            </button>
            <div className="flex-1">
              <div className="mb-1 flex justify-between text-[10px] text-zinc-500">
                <span>{playing ? "0:14" : "0:00"}</span>
                <span>3:24</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className={`h-full rounded-full bg-purple-500 transition-all ${
                    playing ? "w-[38%] animate-pulse-soft" : "w-[8%]"
                  }`}
                />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            {DEMO_LINES.map((line) => (
              <div
                key={line.text}
                className={`rounded-xl px-3 py-2 transition ${
                  line.active
                    ? "bg-purple-500/20 ring-1 ring-purple-500/40"
                    : "opacity-60"
                }`}
              >
                <p
                  className={`text-sm md:text-base ${
                    line.active ? "font-medium text-zinc-50" : "text-zinc-400"
                  }`}
                >
                  {line.text}
                </p>
                <div className="mt-1 flex gap-3 text-xs text-zinc-500">
                  <span className="inline-flex items-center gap-1 text-rose-400">
                    <Heart className="h-3 w-3 fill-current" /> {line.heart}
                  </span>
                  <span className="inline-flex items-center gap-1 text-blue-400">
                    <ThumbsUp className="h-3 w-3" /> {line.like}
                  </span>
                  <span className="inline-flex items-center gap-1 text-red-400">
                    <ThumbsDown className="h-3 w-3" /> {line.dislike}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
