"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingStarsProps {
  value: number;
  onChange?: (value: number) => void;
  size?: "sm" | "md" | "lg";
  readonly?: boolean;
}

export function RatingStars({
  value,
  onChange,
  size = "md",
  readonly,
}: RatingStarsProps) {
  const sizes = {
    sm: "h-3.5 w-3.5",
    md: "h-5 w-5",
    lg: "h-7 w-7",
  };

  return (
    <div className="inline-flex items-center gap-1" role="img" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= Math.round(value);
        if (readonly || !onChange) {
          return (
            <Star
              key={star}
              className={cn(
                sizes[size],
                filled ? "fill-amber-400 text-amber-400" : "text-zinc-700"
              )}
            />
          );
        }
        return (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            aria-label={`Rate ${star} stars`}
            className="rounded p-0.5 transition hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
          >
            <Star
              className={cn(
                sizes[size],
                star <= value ? "fill-amber-400 text-amber-400" : "text-zinc-600"
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
