import { Suspense } from "react";
import Link from "next/link";
import { SongCard } from "@/components/music/song-card";
import { Input } from "@/components/ui/input";
import { SearchForm } from "@/app/search/search-form";
import { searchLibrary } from "@/lib/library";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: PageProps) {
  const { q = "" } = await searchParams;
  const results = q.trim()
    ? await searchLibrary(q)
    : { songs: [], artists: [], lyrics: [] };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <h1 className="text-3xl font-bold">Search</h1>
      <p className="mt-2 text-zinc-400">Search the song library</p>
      <div className="mt-6 max-w-xl">
        <Suspense fallback={<Input placeholder="Search songs, artists, lyrics..." disabled />}>
          <SearchForm initialQuery={q} />
        </Suspense>
      </div>

      {!q.trim() ? (
        <p className="mt-10 text-sm text-zinc-500">Start typing to search.</p>
      ) : (
        <div className="mt-10 space-y-10">
          <section>
            <h2 className="mb-4 text-xl font-semibold">Songs</h2>
            {results.songs.length ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {results.songs.map((s) => (
                  <SongCard key={s.id} song={s} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-500">No songs found.</p>
            )}
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold">Artists</h2>
            {results.artists.length ? (
              <ul className="space-y-2">
                {results.artists.map((a) => (
                  <li
                    key={a.id}
                    className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3"
                  >
                    {a.display_name}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-zinc-500">No artists found.</p>
            )}
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold">Lyrics</h2>
            {results.lyrics.length ? (
              <div className="space-y-2">
                {results.lyrics.map((l) => (
                  <Link
                    key={l.id}
                    href={`/songs/${l.song_slug}`}
                    className="block rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 transition hover:border-zinc-700"
                  >
                    <p className="text-zinc-200">&ldquo;{l.text}&rdquo;</p>
                    <p className="mt-1 text-xs text-zinc-500">in {l.song_title}</p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-500">No lyric matches.</p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
