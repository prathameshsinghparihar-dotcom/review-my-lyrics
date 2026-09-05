import Link from "next/link";
import { UserAvatar } from "@/components/ui/avatar";
import type { Profile } from "@/types/database";

interface ArtistCardProps {
  artist: Profile;
  songCount?: number;
  averageRating?: number;
}

export function ArtistCard({ artist, songCount, averageRating }: ArtistCardProps) {
  return (
    <Link
      href={`/artists/${artist.username}`}
      className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 transition hover:border-zinc-700 hover:bg-zinc-900"
    >
      <UserAvatar
        src={artist.avatar_url}
        name={artist.display_name}
        className="h-14 w-14"
      />
      <div className="min-w-0">
        <p className="truncate font-semibold text-zinc-50">{artist.display_name}</p>
        <p className="truncate text-sm text-zinc-400">@{artist.username}</p>
        <p className="mt-1 text-xs text-zinc-500">
          {songCount != null ? `${songCount} songs` : "Artist"}
          {averageRating != null && averageRating > 0
            ? ` · ★ ${averageRating.toFixed(1)}`
            : ""}
        </p>
      </div>
    </Link>
  );
}

export function ArtistHeader({
  artist,
  songCount,
  averageRating,
  totalReviews,
}: {
  artist: Profile;
  songCount: number;
  averageRating: number;
  totalReviews: number;
}) {
  return (
    <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-end">
      <UserAvatar
        src={artist.avatar_url}
        name={artist.display_name}
        className="h-28 w-28 text-2xl"
      />
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-purple-400">
          Artist
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-50 md:text-5xl">
          {artist.display_name}
        </h1>
        <p className="text-zinc-400">@{artist.username}</p>
        {artist.bio ? <p className="max-w-2xl text-zinc-300">{artist.bio}</p> : null}
        <div className="flex flex-wrap gap-4 pt-1 text-sm text-zinc-400">
          <span>{songCount} songs</span>
          <span>★ {averageRating > 0 ? averageRating.toFixed(1) : "—"}</span>
          <span>{totalReviews} reviews</span>
        </div>
      </div>
    </div>
  );
}
