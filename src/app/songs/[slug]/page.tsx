import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SongPageClient } from "@/app/songs/[slug]/song-page-client";
import {
  getLibrarySong,
  libraryToDetails,
  libraryToLyrics,
} from "@/lib/library";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const song = await getLibrarySong(slug);
  if (!song) return { title: "Song not found" };
  return {
    title: `${song.title} — ${song.artist}`,
    description: `Listen to ${song.title} by ${song.artist} and review every lyric line.`,
  };
}

export default async function SongPage({ params }: PageProps) {
  const { slug } = await params;
  const song = await getLibrarySong(slug);
  if (!song) notFound();

  return (
    <SongPageClient
      song={libraryToDetails(song)}
      lyrics={libraryToLyrics(song)}
      reviews={[]}
      distribution={{ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }}
      guestMode
    />
  );
}
