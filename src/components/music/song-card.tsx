"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, Pause, Play, Star } from "lucide-react";
import { useAudio } from "@/components/providers/audio-provider";
import type { SongCardData } from "@/types/database";
import { cn } from "@/lib/utils";

interface SongCardProps {
  song: SongCardData;
  className?: string;
}

export function SongCard({ song, className }: SongCardProps) {
  const { track, isPlaying, playTrack, togglePlay } = useAudio();
  const active = track?.id === song.id;
  const playing = active && isPlaying;

  const onPlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!song.audio_url) return;
    if (active) togglePlay();
    else {
      playTrack({
        id: song.id,
        title: song.title,
        slug: song.slug,
        artistName: song.artist.display_name,
        coverUrl: song.cover_url,
        audioUrl: song.audio_url,
      });
    }
  };

  return (
    <Link
      href={`/songs/${song.slug}`}
      className={cn(
        "group block overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 transition hover:border-zinc-700 hover:bg-zinc-900",
        className
      )}
    >
      <div className="relative aspect-square overflow-hidden bg-zinc-800">
        {song.cover_url ? (
          <Image
            src={song.cover_url}
            alt={`${song.title} cover`}
            fill
            className="object-cover transition duration-500 group-hover:scale-105"
            sizes="(max-width:768px) 50vw, 25vw"
            unoptimized={song.cover_url.startsWith("http")}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-purple-900/40 to-pink-900/30 text-zinc-500">
            No cover
          </div>
        )}
        <button
          type="button"
          onClick={onPlay}
          disabled={!song.audio_url}
          className="absolute bottom-3 right-3 flex h-11 w-11 items-center justify-center rounded-full bg-purple-500 text-white opacity-100 shadow-lg transition hover:scale-105 hover:bg-purple-400 md:opacity-0 md:group-hover:opacity-100"
          aria-label={playing ? "Pause song" : "Play song"}
        >
          {playing ? <Pause className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5" />}
        </button>
      </div>
      <div className="space-y-1 p-3.5">
        <h3 className="truncate font-semibold text-zinc-50">{song.title}</h3>
        <p className="truncate text-sm text-zinc-400">{song.artist.display_name}</p>
        <div className="flex items-center justify-between pt-1 text-xs text-zinc-500">
          <span>{song.genre || "Other"}</span>
          <span className="inline-flex items-center gap-1 text-zinc-300">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            {song.average_rating > 0 ? song.average_rating.toFixed(1) : "—"}
            <span className="text-zinc-500">· {song.review_count}</span>
          </span>
        </div>
      </div>
    </Link>
  );
}

export function SongCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60">
      <div className="aspect-square animate-pulse bg-zinc-800" />
      <div className="space-y-2 p-3.5">
        <div className="h-4 w-3/4 animate-pulse rounded bg-zinc-800" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-zinc-800" />
      </div>
    </div>
  );
}

export function FavoriteIcon({ filled }: { filled?: boolean }) {
  return (
    <Heart
      className={cn("h-5 w-5", filled ? "fill-pink-500 text-pink-500" : "text-zinc-300")}
    />
  );
}
