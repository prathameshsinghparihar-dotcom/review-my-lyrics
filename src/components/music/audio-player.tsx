"use client";

import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { useAudio, type PlayerTrack } from "@/components/providers/audio-provider";
import { Button } from "@/components/ui/button";
import { formatDuration } from "@/lib/utils";

interface AudioPlayerProps {
  track: PlayerTrack;
  compact?: boolean;
}

export function AudioPlayer({ track, compact }: AudioPlayerProps) {
  const {
    track: current,
    isPlaying,
    currentTime,
    duration,
    volume,
    playTrack,
    togglePlay,
    seek,
    setVolume,
  } = useAudio();

  const active = current?.id === track.id;
  const playing = active && isPlaying;
  const time = active ? currentTime : 0;
  const dur = active ? duration : 0;
  const progress = dur > 0 ? (time / dur) * 100 : 0;

  const onPlayClick = () => {
    if (active) togglePlay();
    else playTrack(track);
  };

  return (
    <div
      className={
        compact
          ? "rounded-2xl border border-zinc-800 bg-zinc-900/80 p-3"
          : "rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950 p-4"
      }
    >
      <div className="flex items-center gap-3">
        <Button
          type="button"
          size="icon"
          className="h-12 w-12 rounded-full"
          onClick={onPlayClick}
          aria-label={playing ? "Pause song" : "Play song"}
        >
          {playing ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="ml-0.5 h-5 w-5" />
          )}
        </Button>

        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center justify-between text-xs text-zinc-400">
            <span>{formatDuration(time)}</span>
            <span>{formatDuration(dur)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={dur || 0}
            step={0.1}
            value={time}
            onChange={(e) => {
              if (!active) playTrack(track);
              seek(Number(e.target.value));
            }}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-zinc-800 accent-purple-500"
            aria-label="Seek"
            style={{
              background: `linear-gradient(to right, #A855F7 ${progress}%, #27272A ${progress}%)`,
            }}
          />
        </div>

        <div className="hidden items-center gap-2 sm:flex">
          <button
            type="button"
            onClick={() => setVolume(volume > 0 ? 0 : 0.85)}
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
            aria-label={volume > 0 ? "Mute" : "Unmute"}
          >
            {volume > 0 ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-20 accent-purple-500"
            aria-label="Volume"
          />
        </div>
      </div>
    </div>
  );
}
