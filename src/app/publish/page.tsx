"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { GENRES } from "@/types/database";
import { parseLyrics } from "@/lib/utils";

const SECRET_KEY = "lyricpulse_publish_secret";
const MAX_AUDIO = 50 * 1024 * 1024;
const MAX_COVER = 5 * 1024 * 1024;

type UploadTarget = {
  path: string;
  token: string;
  signedUrl: string;
  contentType: string;
};

type PublishResponse = {
  error?: string;
  slug?: string;
  path?: string;
  lines?: number;
  uploads?: {
    audio: UploadTarget;
    cover: UploadTarget | null;
  };
};

function fileExt(file: File, fallback: string): string {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName) return fromName === "jpeg" ? "jpg" : fromName;
  return fallback;
}

async function putToSignedUrl(target: UploadTarget, file: File) {
  const res = await fetch(target.signedUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type || target.contentType,
      "x-upsert": "true",
    },
    body: file,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Upload failed (${res.status})${text ? `: ${text.slice(0, 160)}` : ""}`
    );
  }
}

export default function PublishPage() {
  const router = useRouter();
  const [unlocked, setUnlocked] = useState(() => {
    if (typeof window === "undefined") return false;
    return !!sessionStorage.getItem(SECRET_KEY);
  });
  const [secret, setSecret] = useState(() => {
    if (typeof window === "undefined") return "";
    return sessionStorage.getItem(SECRET_KEY) || "";
  });
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [genre, setGenre] = useState("Other");
  const [description, setDescription] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [audio, setAudio] = useState<File | null>(null);
  const [cover, setCover] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const previewLines = useMemo(() => parseLyrics(lyrics).slice(0, 8), [lyrics]);
  const lineCount = useMemo(() => parseLyrics(lyrics).length, [lyrics]);

  const unlock = () => {
    if (!secret.trim()) {
      toast.error("Enter the publish password");
      return;
    }
    sessionStorage.setItem(SECRET_KEY, secret.trim());
    setUnlocked(true);
    toast.success("Unlocked");
  };

  const onCover = (file: File | null) => {
    setCover(file);
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverPreview(file ? URL.createObjectURL(file) : null);
  };

  const onLyricsFile = async (file: File | null) => {
    if (!file) return;
    const name = file.name.toLowerCase();
    const okExt = [".txt", ".lrc", ".md", ".text"].some((ext) => name.endsWith(ext));
    const okType =
      !file.type ||
      file.type.startsWith("text/") ||
      file.type === "application/json";
    if (!okExt && !okType) {
      toast.error("Use a .txt lyrics file");
      return;
    }
    try {
      const text = await file.text();
      const cleaned = text.replace(/^\uFEFF/, "").trim();
      if (!cleaned) {
        toast.error("That file is empty");
        return;
      }
      setLyrics(cleaned);
      toast.success(`Loaded lyrics from ${file.name}`);
    } catch {
      toast.error("Couldn't read that file");
    }
  };

  const publish = async () => {
    if (!title.trim() || !artist.trim() || !lyrics.trim() || !audio) {
      toast.error("Title, artist, lyrics, and audio are required");
      return;
    }
    if (lineCount < 1) {
      toast.error("No lyric lines found — paste one line per row");
      return;
    }
    if (audio.size > MAX_AUDIO) {
      toast.error("Audio must be under 50MB");
      return;
    }
    if (cover && cover.size > MAX_COVER) {
      toast.error("Cover must be under 5MB");
      return;
    }

    setBusy(true);
    try {
      const prepareRes = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret,
          title: title.trim(),
          artist: artist.trim(),
          genre,
          description: description.trim(),
          lyrics,
          audioExt: fileExt(audio, "mp3"),
          audioContentType: audio.type || "audio/mpeg",
          coverExt: cover ? fileExt(cover, "jpg") : null,
          coverContentType: cover?.type || null,
        }),
      });

      const prepareText = await prepareRes.text();
      let data: PublishResponse;
      try {
        data = JSON.parse(prepareText) as PublishResponse;
      } catch {
        toast.error(
          prepareRes.status === 413
            ? "Request too large for the server."
            : `Server error (${prepareRes.status}). Check PUBLISH_SECRET and Supabase env vars on Vercel.`
        );
        return;
      }

      if (!prepareRes.ok || !data.uploads?.audio) {
        toast.error(
          data.error ||
            (prepareRes.status === 413
              ? "Request too large for the server."
              : `Request failed (${prepareRes.status})`)
        );
        if (prepareRes.status === 401) {
          sessionStorage.removeItem(SECRET_KEY);
          setUnlocked(false);
        }
        return;
      }

      toast.message("Uploading audio…");
      await putToSignedUrl(data.uploads.audio, audio);

      if (cover && data.uploads.cover) {
        toast.message("Uploading cover…");
        await putToSignedUrl(data.uploads.cover, cover);
      }

      toast.success(
        `Published — ${data.lines ?? lineCount} lyric lines written to song.json`
      );
      router.push(data.path || `/songs/${data.slug}`);
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Publish failed";
      toast.error(message.includes("Failed to fetch") ? "Network error — check your connection and Supabase URL" : message);
    } finally {
      setBusy(false);
    }
  };

  if (!unlocked) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-4 py-12">
        <h1 className="text-3xl font-bold">Publish a song</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Enter the publish password from <code>.env.local</code> (
          <code>PUBLISH_SECRET</code>).
        </p>
        <div className="mt-6 space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
          <Label htmlFor="secret">Password</Label>
          <Input
            id="secret"
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") unlock();
            }}
          />
          <Button type="button" className="w-full" onClick={unlock}>
            Unlock
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 md:px-6">
      <h1 className="text-3xl font-bold">Publish a song</h1>
      <p className="mt-2 text-zinc-400">
        Upload a lyrics <code>.txt</code>, audio, and cover — we create{" "}
        <code>song.json</code> and upload media straight to Supabase (avoids Vercel size limits).
      </p>

      <div className="mt-8 space-y-5 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 md:p-6">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="artist">Artist</Label>
          <Input id="artist" value={artist} onChange={(e) => setArtist(e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="genre">Genre</Label>
          <select
            id="genre"
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            className="flex h-10 w-full rounded-xl border border-zinc-700 bg-zinc-900/80 px-3 text-sm text-zinc-50"
          >
            {GENRES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description (optional)</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="lyrics-file">Upload lyrics file (.txt)</Label>
          <Input
            id="lyrics-file"
            type="file"
            accept=".txt,.lrc,.md,.text,text/plain"
            onChange={(e) => {
              void onLyricsFile(e.target.files?.[0] || null);
              e.target.value = "";
            }}
          />
          <p className="text-xs text-zinc-500">
            Choose a text file and it fills the lyrics box below (you can still edit after).
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="lyrics">Lyrics</Label>
          <Textarea
            id="lyrics"
            value={lyrics}
            onChange={(e) => setLyrics(e.target.value)}
            rows={12}
            className="font-mono text-sm"
            placeholder={"VERSE 1\n\nLine one\nLine two\n\nCHORUS\n\nHook line"}
          />
          <p className="text-xs text-zinc-500">
            One line per row. Optional labels: VERSE 1, CHORUS, BRIDGE, OUTRO. Blank lines
            separate sections. {lineCount > 0 ? `${lineCount} lines ready for song.json.` : ""}
          </p>
          {previewLines.length > 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3 text-xs text-zinc-400">
              <p className="mb-2 font-medium text-zinc-300">Preview → song.json lyrics</p>
              <ul className="space-y-1">
                {previewLines.map((l, i) => (
                  <li key={`${l.line_number}-${i}`}>
                    {l.section_label ? (
                      <span className="text-purple-400">{l.section_label}: </span>
                    ) : null}
                    {l.text}
                  </li>
                ))}
                {lineCount > previewLines.length ? (
                  <li className="text-zinc-600">…and {lineCount - previewLines.length} more</li>
                ) : null}
              </ul>
            </div>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="audio">Audio</Label>
          <Input
            id="audio"
            type="file"
            accept="audio/mpeg,audio/wav,audio/mp4,audio/ogg,.mp3,.wav,.m4a,.ogg"
            onChange={(e) => setAudio(e.target.files?.[0] || null)}
          />
          {audio ? (
            <p className="text-xs text-zinc-500">
              {audio.name} ({(audio.size / (1024 * 1024)).toFixed(1)} MB)
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="cover">Cover image (optional)</Label>
          <Input
            id="cover"
            type="file"
            accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
            onChange={(e) => onCover(e.target.files?.[0] || null)}
          />
          {coverPreview ? (
            <div className="relative mt-2 h-36 w-36 overflow-hidden rounded-xl">
              <Image src={coverPreview} alt="Cover preview" fill className="object-cover" unoptimized />
            </div>
          ) : null}
        </div>

        <Button type="button" size="lg" disabled={busy} onClick={() => void publish()}>
          <Upload className="h-4 w-4" />
          {busy ? "Publishing…" : "Publish to Supabase"}
        </Button>

        <p className="text-xs text-zinc-500">
          Or manage files in{" "}
          <Link href="/discover" className="text-purple-400 hover:underline">
            Discover
          </Link>{" "}
          after publishing.
        </p>
      </div>
    </div>
  );
}
