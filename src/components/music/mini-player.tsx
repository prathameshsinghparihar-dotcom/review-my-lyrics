"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Pause, Play } from "lucide-react";
import { useAudio } from "@/components/providers/audio-provider";
import { formatDuration } from "@/lib/utils";

export function MiniPlayer() {
  const { track, isPlaying, currentTime, duration, togglePlay } = useAudio();
  const pathname = usePathname();
  const router = useRouter();

  if (!track) return null;
  if (pathname.startsWith(`/songs/${track.slug}`)) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed bottom-[4.5rem] left-0 right-0 z-40 border-t border-zinc-800 bg-zinc-950/95 px-3 py-2 backdrop-blur md:bottom-0 md:px-6">
      <div className="mx-auto flex max-w-7xl items-center gap-3">
        <button
          type="button"
          onClick={() => router.push(`/songs/${track.slug}`)}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
          aria-label="Open full player"
        >
          <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-zinc-800">
            {track.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={track.coverUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : null}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-zinc-50">{track.title}</p>
            <p className="truncate text-xs text-zinc-400">{track.artistName}</p>
          </div>
        </button>

        <button
          type="button"
          onClick={togglePlay}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500 text-white hover:bg-purple-400"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
        </button>

        <div className="hidden items-center gap-2 text-xs text-zinc-400 sm:flex">
          <span>{formatDuration(currentTime)}</span>
          <div className="h-1 w-28 overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-purple-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span>{formatDuration(duration)}</span>
        </div>

        <Link
          href={`/songs/${track.slug}`}
          className="hidden text-xs text-purple-400 hover:text-purple-300 md:inline"
        >
          Open
        </Link>
      </div>
      <div className="mt-2 h-0.5 w-full overflow-hidden rounded-full bg-zinc-800 sm:hidden">
        <div
          className="h-full rounded-full bg-purple-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
