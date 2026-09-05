"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RatingStars } from "@/components/reviews/rating-stars";
import { setGuestReview } from "@/lib/guest-storage";
import { reviewSchema } from "@/lib/validations";

interface ReviewFormProps {
  songId: string;
  existing?: {
    id: string;
    rating: number;
    comment: string | null;
  } | null;
  guestMode?: boolean;
  onSaved: (guestPayload?: { rating: number; comment: string | null }) => void;
}

export function ReviewForm({ songId, existing, onSaved }: ReviewFormProps) {
  const [rating, setRating] = useState(existing?.rating || 0);
  const [comment, setComment] = useState(existing?.comment || "");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const parsed = reviewSchema.safeParse({
      rating,
      comment: comment.trim() || null,
    });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0]?.message || "Invalid review");
      return;
    }

    setLoading(true);
    try {
      setGuestReview(songId, {
        rating: parsed.data.rating,
        comment: parsed.data.comment ?? null,
      });
      toast.success(existing ? "Review updated" : "Review posted");
      onSaved({
        rating: parsed.data.rating,
        comment: parsed.data.comment ?? null,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
      <h3 className="font-medium text-zinc-100">
        {existing ? "Edit your review" : "Write a review"}
      </h3>
      <p className="text-xs text-zinc-500">Anyone can review — saved on this device.</p>
      <RatingStars value={rating} onChange={setRating} size="lg" />
      <Textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="What did you think of the lyrics?"
        rows={4}
      />
      <Button type="button" onClick={() => void submit()} disabled={loading || rating < 1}>
        {loading ? "Saving…" : existing ? "Update review" : "Post review"}
      </Button>
    </div>
  );
}
