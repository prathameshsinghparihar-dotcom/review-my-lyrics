import { Suspense } from "react";
import { DiscoverClient } from "@/components/discover/discover-client";
import { SongCardSkeleton } from "@/components/music/song-card";
import { libraryToCard, loadLibrarySongs } from "@/lib/library";

export const dynamic = "force-dynamic";

type DiscoverSort = "trending" | "newest" | "most_reviewed" | "highest_rated";

interface PageProps {
  searchParams: Promise<{
    genre?: string;
    sort?: string;
    page?: string;
    q?: string;
  }>;
}

export default async function DiscoverPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const genre = params.genre || "All";
  const sort = (params.sort as DiscoverSort) || "newest";
  const page = Number(params.page || "1") || 1;
  const pageSize = 12;

  let songs = (await loadLibrarySongs()).map(libraryToCard);

  if (genre !== "All") {
    songs = songs.filter((s) => s.genre === genre);
  }
  if (params.q) {
    const q = params.q.toLowerCase();
    songs = songs.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.artist.display_name.toLowerCase().includes(q)
    );
  }

  if (sort === "highest_rated") {
    songs = [...songs].sort((a, b) => b.average_rating - a.average_rating);
  } else if (sort === "most_reviewed") {
    songs = [...songs].sort((a, b) => b.review_count - a.review_count);
  }

  const total = songs.length;
  const from = (page - 1) * pageSize;
  const pageSongs = songs.slice(from, from + pageSize);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-50">Discover</h1>
        <p className="mt-2 text-zinc-400">
          Songs from your library. Anyone can listen and review.
        </p>
      </div>
      <Suspense
        fallback={
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <SongCardSkeleton key={i} />
            ))}
          </div>
        }
      >
        <DiscoverClient
          initialSongs={pageSongs}
          total={total}
          initialGenre={genre}
          initialSort={sort}
          initialPage={page}
        />
      </Suspense>
    </div>
  );
}
