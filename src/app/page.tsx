import Link from "next/link";
import { HeroDemo } from "@/components/home/hero-demo";
import { SongCard } from "@/components/music/song-card";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/lib/brand";
import { libraryToCard, loadLibrarySongs } from "@/lib/library";
import { isSupabaseConfigured } from "@/lib/supabase/public";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const songs = (await loadLibrarySongs()).map(libraryToCard);

  return (
    <div>
      <section className="relative overflow-hidden border-b border-zinc-800/80">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(168,85,247,0.18),transparent_50%),radial-gradient(ellipse_at_bottom_left,rgba(236,72,153,0.12),transparent_45%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-2 md:items-center md:px-6 md:py-20">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-purple-400">
              {BRAND.nameUpper}
            </p>
            <h1 className="max-w-xl text-4xl font-bold leading-tight tracking-tight text-zinc-50 md:text-5xl lg:text-6xl">
              {BRAND.tagline}
            </h1>
            <p className="mt-5 max-w-lg text-lg text-zinc-400">
              Listen to songs from the library, read every lyric, and leave line-by-line
              feedback. No accounts.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/discover">Explore Songs</Link>
              </Button>
              {songs[0] ? (
                <Button asChild size="lg" variant="secondary">
                  <Link href={`/songs/${songs[0].slug}`}>Open first song</Link>
                </Button>
              ) : null}
            </div>
            <p className="mt-6 text-sm text-zinc-500">
              {isSupabaseConfigured()
                ? "Media loads from Supabase Storage (with local fallback)."
                : "Add files under public/library/songs — or connect Supabase Storage."}
            </p>
          </div>
          <HeroDemo />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 md:px-6">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-zinc-50">Library songs</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Songs from Supabase Storage and/or your local library folder.
            </p>
          </div>
          <Link href="/discover" className="text-sm text-purple-400 hover:underline">
            See all
          </Link>
        </div>

        {songs.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-4">
            {songs.map((song) => (
              <SongCard key={song.id} song={song} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-zinc-800 p-10 text-center">
            <p className="text-zinc-200">No songs in the library yet.</p>
            <p className="mt-2 text-sm text-zinc-500">
              Upload to Supabase Storage bucket <code>library/songs/…</code> or add files under{" "}
              <code>public/library/songs/</code>. See the README.
            </p>
          </div>
        )}
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <h2 className="mb-8 text-center text-2xl font-bold text-zinc-50 md:text-3xl">
          How it works
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              step: "01",
              title: "Add files",
              body: "Put song.json, audio, and cover in Storage or the local library folder.",
            },
            {
              step: "02",
              title: "Listen & react",
              body: "Anyone can play a song and react to every lyric line.",
            },
            {
              step: "03",
              title: "Review",
              body: "Leave star ratings and comments — no signup required.",
            },
          ].map((item) => (
            <div
              key={item.step}
              className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6"
            >
              <p className="text-sm font-semibold text-purple-400">{item.step}</p>
              <h3 className="mt-2 text-xl font-semibold text-zinc-50">{item.title}</h3>
              <p className="mt-2 text-zinc-400">{item.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
