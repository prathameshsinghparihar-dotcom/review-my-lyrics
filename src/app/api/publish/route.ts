import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createServiceSupabase } from "@/lib/supabase/service";
import { LIBRARY_BUCKET } from "@/lib/supabase/public";
import { parseLyrics, slugify, uniqueSlug } from "@/lib/utils";

export const runtime = "nodejs";

const AUDIO_TYPES = [
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
const IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_AUDIO = 50 * 1024 * 1024;
const MAX_COVER = 5 * 1024 * 1024;

function audioExt(file: File): string {
  const name = file.name.toLowerCase();
  if (name.endsWith(".wav")) return "wav";
  if (name.endsWith(".m4a")) return "m4a";
  if (name.endsWith(".ogg")) return "ogg";
  if (name.endsWith(".webm")) return "webm";
  if (file.type.includes("wav")) return "wav";
  if (file.type.includes("ogg")) return "ogg";
  if (file.type.includes("mp4") || file.type.includes("m4a")) return "m4a";
  return "mp3";
}

function coverExt(file: File): string {
  const name = file.name.toLowerCase();
  if (name.endsWith(".png")) return "png";
  if (name.endsWith(".webp")) return "webp";
  return "jpg";
}

function isAudioOk(file: File): boolean {
  const ext = file.name.split(".").pop()?.toLowerCase();
  return (
    ["mp3", "wav", "m4a", "ogg", "webm"].includes(ext || "") ||
    AUDIO_TYPES.includes(file.type)
  );
}

function isImageOk(file: File): boolean {
  const ext = file.name.split(".").pop()?.toLowerCase();
  return (
    ["jpg", "jpeg", "png", "webp"].includes(ext || "") ||
    IMAGE_TYPES.includes(file.type)
  );
}

export async function POST(request: Request) {
  try {
    const expected = process.env.PUBLISH_SECRET;
    if (!expected) {
      return NextResponse.json(
        {
          error:
            "PUBLISH_SECRET is not set in .env.local. Add a password there to enable publishing.",
        },
        { status: 500 }
      );
    }

    const form = await request.formData();
    const secret = String(form.get("secret") || "");
    if (secret !== expected) {
      return NextResponse.json({ error: "Wrong publish password." }, { status: 401 });
    }

    const title = String(form.get("title") || "").trim();
    const artist = String(form.get("artist") || "").trim();
    const genre = String(form.get("genre") || "Other").trim() || "Other";
    const description = String(form.get("description") || "").trim();
    const lyricsRaw = String(form.get("lyrics") || "").trim();
    const audio = form.get("audio");
    const cover = form.get("cover");

    if (!title) {
      return NextResponse.json({ error: "Title is required." }, { status: 400 });
    }
    if (!artist) {
      return NextResponse.json({ error: "Artist is required." }, { status: 400 });
    }
    if (!lyricsRaw) {
      return NextResponse.json({ error: "Paste some lyrics." }, { status: 400 });
    }
    if (!(audio instanceof File) || audio.size === 0) {
      return NextResponse.json({ error: "Audio file is required." }, { status: 400 });
    }
    if (!isAudioOk(audio)) {
      return NextResponse.json(
        { error: "Audio must be mp3, wav, m4a, or ogg." },
        { status: 400 }
      );
    }
    if (audio.size > MAX_AUDIO) {
      return NextResponse.json({ error: "Audio must be under 50MB." }, { status: 400 });
    }
    if (cover instanceof File && cover.size > 0) {
      if (!isImageOk(cover)) {
        return NextResponse.json(
          { error: "Cover must be jpg, png, or webp." },
          { status: 400 }
        );
      }
      if (cover.size > MAX_COVER) {
        return NextResponse.json({ error: "Cover must be under 5MB." }, { status: 400 });
      }
    }

    const parsed = parseLyrics(lyricsRaw);
    if (!parsed.length) {
      return NextResponse.json(
        { error: "No lyric lines found. Paste one line per row." },
        { status: 400 }
      );
    }

    // Automatically build song.json from pasted lyrics
    const songJson = {
      title,
      artist,
      genre,
      description,
      lyrics: parsed.map((line) => ({
        text: line.text,
        ...(line.section_label ? { section: line.section_label } : {}),
      })),
    };

    const supabase = createServiceSupabase();

    const { data: folders } = await supabase.storage
      .from(LIBRARY_BUCKET)
      .list("songs", { limit: 200 });
    const existing = (folders || []).map((f) => f.name).filter(Boolean);
    const slug = uniqueSlug(slugify(title) || "song", existing);

    const prefix = `songs/${slug}`;
    const audioName = `audio.${audioExt(audio)}`;
    const uploads: { path: string; body: Buffer; contentType: string }[] = [
      {
        path: `${prefix}/song.json`,
        body: Buffer.from(JSON.stringify(songJson, null, 2), "utf8"),
        contentType: "application/json",
      },
      {
        path: `${prefix}/${audioName}`,
        body: Buffer.from(await audio.arrayBuffer()),
        contentType: audio.type || "audio/mpeg",
      },
    ];

    if (cover instanceof File && cover.size > 0) {
      uploads.push({
        path: `${prefix}/cover.${coverExt(cover)}`,
        body: Buffer.from(await cover.arrayBuffer()),
        contentType: cover.type || "image/jpeg",
      });
    }

    for (const item of uploads) {
      const { error } = await supabase.storage
        .from(LIBRARY_BUCKET)
        .upload(item.path, item.body, {
          upsert: true,
          contentType: item.contentType,
        });
      if (error) {
        return NextResponse.json(
          { error: `Upload failed (${item.path}): ${error.message}` },
          { status: 500 }
        );
      }
    }

    revalidatePath("/");
    revalidatePath("/discover");
    revalidatePath(`/songs/${slug}`);

    return NextResponse.json({
      ok: true,
      slug,
      title,
      lines: songJson.lyrics.length,
      path: `/songs/${slug}`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Publish failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
