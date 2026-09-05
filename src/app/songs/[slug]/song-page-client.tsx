"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Heart, Star } from "lucide-react";
import { toast } from "sonner";
import { AudioPlayer } from "@/components/music/audio-player";
import { LyricsViewer } from "@/components/lyrics/lyrics-viewer";
import { ReviewCard } from "@/components/reviews/review-card";
import { ReviewForm } from "@/components/reviews/review-form";
import { RatingStars } from "@/components/reviews/rating-stars";
import { Button } from "@/components/ui/button";
import { useAudio } from "@/components/providers/audio-provider";
import {
  getGuestReview,
  isGuestFavorite,
  setGuestReview,
  toggleGuestFavorite,
} from "@/lib/guest-storage";
import type {
  LyricLineWithReactions,
  SongReview,
  SongWithDetails,
} from "@/types/database";
import { cn } from "@/lib/utils";

interface SongPageClientProps {
  song: SongWithDetails;
  lyrics: LyricLineWithReactions[];
  reviews: SongReview[];
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
  guestMode?: boolean;
}

export function SongPageClient({
  song,
  lyrics,
  reviews: initialReviews,
  distribution,
}: SongPageClientProps) {
  const { currentTime, seek, track, playTrack } = useAudio();
  const [favorited, setFavorited] = useState(false);
  const [reviews, setReviews] = useState(initialReviews);
  const [sort, setSort] = useState<"newest" | "highest" | "lowest">("newest");
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    setFavorited(isGuestFavorite(song.id));
    const guestReview = getGuestReview(song.id);
    if (guestReview) {
      setReviews([
        {
          id: `guest-review-${song.id}`,
          song_id: song.id,
          user_id: "guest",
          rating: guestReview.rating,
          comment: guestReview.comment,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          profile: {
            id: "guest",
            username: "guest",
            display_name: "Guest",
            avatar_url: null,
            bio: null,
            created_at: new Date().toISOString(),
          },
        },
        ...initialReviews.filter((r) => r.user_id !== "guest"),
      ]);
    } else {
      setReviews(initialReviews);
    }
  }, [song.id, initialReviews]);

  const myReview = useMemo(
    () => reviews.find((r) => r.user_id === "guest") || null,
    [reviews]
  );

  const activeTime = track?.id === song.id ? currentTime : 0;
  const totalReviews = reviews.length;
  const avg =
    totalReviews > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / totalReviews
      : song.stats.average_rating;

  const sortedReviews = useMemo(() => {
    const copy = [...reviews];
    if (sort === "newest") copy.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    if (sort === "highest") copy.sort((a, b) => b.rating - a.rating);
    if (sort === "lowest") copy.sort((a, b) => a.rating - b.rating);
    return copy;
  }, [reviews, sort]);

  const localDistribution = useMemo(() => {
    const dist: Record<1 | 2 | 3 | 4 | 5, number> = { ...distribution };
    for (const r of reviews) {
      const rating = r.rating as 1 | 2 | 3 | 4 | 5;
      if (rating >= 1 && rating <= 5) dist[rating] += 1;
    }
    return dist;
  }, [distribution, reviews]);

  const toggleFavorite = () => {
    const next = toggleGuestFavorite(song.id);
    setFavorited(next);
    toast.success(next ? "Saved to favorites" : "Removed from favorites");
  };

  const deleteReview = () => {
    if (!myReview) return;
    setGuestReview(song.id, null);
    setReviews((prev) => prev.filter((r) => r.user_id !== "guest"));
    toast.success("Review deleted");
    setEditing(false);
  };

  const onReviewSaved = (guestPayload?: { rating: number; comment: string | null }) => {
    if (!guestPayload) return;
    setReviews((prev) => {
      const withoutGuest = prev.filter((r) => r.user_id !== "guest");
      return [
        {
          id: `guest-review-${song.id}`,
          song_id: song.id,
          user_id: "guest",
          rating: guestPayload.rating,
          comment: guestPayload.comment,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          profile: {
            id: "guest",
            username: "guest",
            display_name: "Guest",
            avatar_url: null,
            bio: null,
            created_at: new Date().toISOString(),
          },
        },
        ...withoutGuest,
      ];
    });
    setEditing(false);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-10">
      <div className="mb-8 grid gap-6 md:grid-cols-[200px_1fr] md:items-end">
        <div className="relative mx-auto aspect-square w-48 overflow-hidden rounded-2xl bg-zinc-800 shadow-2xl md:mx-0 md:w-full">
          {song.cover_url ? (
            <Image
              src={song.cover_url}
              alt=""
              fill
              className="object-cover"
              sizes="200px"
              unoptimized
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-purple-800 to-pink-800 text-sm text-white/70">
              No cover
            </div>
          )}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-purple-400">
            {song.genre || "Song"}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-50 md:text-5xl">
            {song.title}
          </h1>
          <p className="mt-2 text-lg text-zinc-300">{song.artist.display_name}</p>
          {song.description ? (
            <p className="mt-3 max-w-2xl text-sm text-zinc-400">{song.description}</p>
          ) : null}
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-zinc-300">
            <span className="inline-flex items-center gap-1">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              {avg > 0 ? avg.toFixed(1) : "—"} / 5
            </span>
            <span>{totalReviews} reviews</span>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            {song.audio_url ? (
              <Button
                type="button"
                onClick={() =>
                  playTrack({
                    id: song.id,
                    title: song.title,
                    slug: song.slug,
                    artistName: song.artist.display_name,
                    coverUrl: song.cover_url,
                    audioUrl: song.audio_url!,
                  })
                }
              >
                Play
              </Button>
            ) : null}
            <Button type="button" variant="secondary" onClick={toggleFavorite}>
              <Heart className={cn("h-4 w-4", favorited && "fill-pink-500 text-pink-500")} />
              {favorited ? "Saved" : "Save"}
            </Button>
          </div>
        </div>
      </div>

      {song.audio_url ? (
        <div className="mb-8">
          <AudioPlayer
            track={{
              id: song.id,
              title: song.title,
              slug: song.slug,
              artistName: song.artist.display_name,
              coverUrl: song.cover_url,
              audioUrl: song.audio_url,
            }}
          />
        </div>
      ) : (
        <div className="mb-8 rounded-2xl border border-dashed border-zinc-800 p-4 text-sm text-zinc-500">
          Audio is not available for this song.
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <h2 className="mb-4 text-xl font-semibold text-zinc-50">Lyrics</h2>
          <p className="mb-4 text-sm text-zinc-500">
            React to every line. Tap a timestamped line to seek.
          </p>
          <LyricsViewer lines={lyrics} currentTime={activeTime} onSeek={seek} />
        </div>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
            <h2 className="text-lg font-semibold">Community rating</h2>
            <div className="mt-3 flex items-center gap-3">
              <p className="text-4xl font-bold">{avg > 0 ? avg.toFixed(1) : "—"}</p>
              <div>
                <RatingStars value={avg} readonly />
                <p className="mt-1 text-xs text-zinc-500">Based on {totalReviews} reviews</p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {([5, 4, 3, 2, 1] as const).map((star) => {
                const count = localDistribution[star] || 0;
                const pct = totalReviews ? Math.round((count / totalReviews) * 100) : 0;
                return (
                  <div key={star} className="flex items-center gap-2 text-xs text-zinc-400">
                    <span className="w-6">{star} ★</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-800">
                      <div
                        className="h-full rounded-full bg-amber-400"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-8 text-right">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          {(!myReview || editing) && (
            <ReviewForm songId={song.id} existing={myReview} onSaved={onReviewSaved} />
          )}

          <div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold">Reviews</h2>
              <div className="flex gap-1">
                {(
                  [
                    ["newest", "Newest"],
                    ["highest", "Highest"],
                    ["lowest", "Lowest"],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSort(key)}
                    className={cn(
                      "rounded-lg px-2 py-1 text-xs",
                      sort === key ? "bg-zinc-100 text-zinc-900" : "text-zinc-500"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {sortedReviews.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-800 p-6 text-center text-sm text-zinc-500">
                <p>No reviews yet.</p>
                <p className="mt-1">Be the first person to review this song.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedReviews.map((review) => (
                  <ReviewCard
                    key={review.id}
                    review={review}
                    isOwner={review.user_id === "guest"}
                    onEdit={() => setEditing(true)}
                    onDelete={deleteReview}
                  />
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
