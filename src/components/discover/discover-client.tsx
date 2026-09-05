"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { SongCard } from "@/components/music/song-card";
import { Button } from "@/components/ui/button";
import { GENRES } from "@/types/database";
import type { SongCardData } from "@/types/database";
import { cn } from "@/lib/utils";

const SORTS = [
  { value: "trending", label: "Trending" },
  { value: "newest", label: "Newest" },
  { value: "most_reviewed", label: "Most Reviewed" },
  { value: "highest_rated", label: "Highest Rated" },
];

interface DiscoverClientProps {
  initialSongs: SongCardData[];
  total: number;
  initialGenre: string;
  initialSort: string;
  initialPage: number;
}

export function DiscoverClient({
  initialSongs,
  total,
  initialGenre,
  initialSort,
  initialPage,
}: DiscoverClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pageSize = 12;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const update = (patch: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(patch).forEach(([k, v]) => {
      if (!v || v === "All") params.delete(k);
      else params.set(k, v);
    });
    router.push(`/discover?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {["All", ...GENRES].map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => update({ genre: g, page: "1" })}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-sm font-medium",
              initialGenre === g
                ? "bg-purple-500 text-white"
                : "bg-zinc-900 text-zinc-400 ring-1 ring-zinc-800 hover:text-zinc-200"
            )}
          >
            {g}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {SORTS.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => update({ sort: s.value, page: "1" })}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium",
              initialSort === s.value
                ? "bg-zinc-100 text-zinc-900"
                : "bg-zinc-900 text-zinc-400 ring-1 ring-zinc-800"
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {initialSongs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-800 p-10 text-center">
          <p className="text-zinc-300">No songs found.</p>
          <p className="mt-1 text-sm text-zinc-500">
            Try changing your search or filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-4">
          {initialSongs.map((song) => (
            <SongCard key={song.id} song={song} />
          ))}
        </div>
      )}

      {totalPages > 1 ? (
        <div className="flex items-center justify-center gap-3 pt-4">
          <Button
            variant="secondary"
            disabled={initialPage <= 1}
            onClick={() => update({ page: String(initialPage - 1) })}
          >
            Previous
          </Button>
          <span className="text-sm text-zinc-400">
            Page {initialPage} of {totalPages}
          </span>
          <Button
            variant="secondary"
            disabled={initialPage >= totalPages}
            onClick={() => update({ page: String(initialPage + 1) })}
          >
            Next
          </Button>
        </div>
      ) : null}
    </div>
  );
}
