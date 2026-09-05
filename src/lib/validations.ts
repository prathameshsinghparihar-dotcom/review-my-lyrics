import { z } from "zod";
import { GENRES } from "@/types/database";

export const signupSchema = z.object({
  displayName: z.string().min(2, "Display name must be at least 2 characters").max(50),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30)
    .regex(/^[a-z0-9_]+$/, "Username can only contain lowercase letters, numbers, and underscores"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

export const profileSchema = z.object({
  display_name: z.string().min(2).max(50),
  bio: z.string().max(500).optional().nullable(),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9_]+$/),
});

export const songSchema = z.object({
  title: z.string().min(1, "Title is required").max(120),
  genre: z.enum(GENRES as [string, ...string[]]),
  description: z.string().max(2000).optional().nullable(),
  lyrics: z.string().min(1, "Lyrics are required"),
  status: z.enum(["draft", "published", "unpublished"]),
});

export const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional().nullable(),
});

export const reactionSchema = z.enum(["heart", "like", "dislike"]);

export const MAX_AUDIO_SIZE = 50 * 1024 * 1024; // 50MB
export const MAX_COVER_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2MB

export const ALLOWED_AUDIO = [
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/mp4",
  "audio/m4a",
  "audio/x-m4a",
  "audio/ogg",
  "audio/webm",
];

export const ALLOWED_IMAGE = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

export function validateAudioFile(file: File): string | null {
  const ext = file.name.split(".").pop()?.toLowerCase();
  const okExt = ["mp3", "wav", "m4a", "ogg", "webm"].includes(ext || "");
  if (!okExt && !ALLOWED_AUDIO.includes(file.type)) {
    return "Audio must be mp3, wav, m4a, or ogg.";
  }
  if (file.size > MAX_AUDIO_SIZE) {
    return "Audio file must be under 50MB.";
  }
  return null;
}

export function validateCoverFile(file: File): string | null {
  const ext = file.name.split(".").pop()?.toLowerCase();
  const okExt = ["jpg", "jpeg", "png", "webp"].includes(ext || "");
  if (!okExt && !ALLOWED_IMAGE.includes(file.type)) {
    return "Cover must be jpg, png, or webp.";
  }
  if (file.size > MAX_COVER_SIZE) {
    return "Cover image must be under 5MB.";
  }
  return null;
}
