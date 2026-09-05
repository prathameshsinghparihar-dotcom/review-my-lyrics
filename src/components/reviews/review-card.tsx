"use client";

import { formatDate } from "@/lib/utils";
import { UserAvatar } from "@/components/ui/avatar";
import { RatingStars } from "@/components/reviews/rating-stars";
import type { SongReview } from "@/types/database";
import { Button } from "@/components/ui/button";

interface ReviewCardProps {
  review: SongReview;
  isOwner?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function ReviewCard({ review, isOwner, onEdit, onDelete }: ReviewCardProps) {
  const name = review.profile?.display_name || "User";
  const username = review.profile?.username || "user";

  return (
    <article className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
      <div className="flex items-start gap-3">
        <UserAvatar
          src={review.profile?.avatar_url}
          name={name}
          className="h-10 w-10"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-zinc-100">{name}</p>
            <span className="text-xs text-zinc-500">@{username}</span>
            <span className="text-xs text-zinc-600">· {formatDate(review.created_at)}</span>
          </div>
          <div className="mt-1">
            <RatingStars value={review.rating} readonly size="sm" />
          </div>
          {review.comment ? (
            <p className="mt-2 text-sm leading-relaxed text-zinc-300">{review.comment}</p>
          ) : null}
          {isOwner ? (
            <div className="mt-3 flex gap-2">
              <Button type="button" size="sm" variant="ghost" onClick={onEdit}>
                Edit
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={onDelete}>
                Delete
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
