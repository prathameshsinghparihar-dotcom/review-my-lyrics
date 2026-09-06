import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createServiceSupabase } from "@/lib/supabase/service";
import { LIBRARY_BUCKET } from "@/lib/supabase/public";
import { parseLyrics, slugify, uniqueSlug } from "@/lib/utils";

export const runtime = "nodejs";

const AUDIO_EXTS = ["mp3", "wav", "m4a", "ogg", "webm"] as const;
const COVER_EXTS = ["jpg", "jpeg", "png", "webp"] as const;

type Body = {
  secret?: string;
  title?: string;
  artist?: string;
  genre?: string;
  description?: string;
  lyrics?: string;
  audioExt?: string;
  audioContentType?: string;
  coverExt?: string | null;
  coverContentType?: string | null;
};

function normalizeExt(value: string | undefined, allowed: readonly string[]): string | null {
  const ext = (value || "").toLowerCase().replace(/^\./, "");
  return allowed.includes(ext) ? ext : null;
}

export async function POST(request: Request) {
  try {
    const expected = process.env.PUBLISH_SECRET;
    if (!expected) {
      return NextResponse.json(
        {
          error:
            "PUBLISH_SECRET is not set on the server. Add it in Vercel → Settings → Environment Variables (and .env.local locally).",
        },
        { status: 500 }
      );
    }

    let body: Body;
    try {
      body = (await request.json()) as Body;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const secret = String(body.secret || "");
    if (secret !== expected) {
      return NextResponse.json({ error: "Wrong publish password." }, { status: 401 });
    }

    const title = String(body.title || "").trim();
    const artist = String(body.artist || "").trim();
    const genre = String(body.genre || "Other").trim() || "Other";
    const description = String(body.description || "").trim();
    const lyricsRaw = String(body.lyrics || "").trim();
    const audioExt = normalizeExt(body.audioExt, AUDIO_EXTS);
    const coverExt = body.coverExt
      ? normalizeExt(body.coverExt, COVER_EXTS)
      : null;

    if (!title) {
      return NextResponse.json({ error: "Title is required." }, { status: 400 });
    }
    if (!artist) {
      return NextResponse.json({ error: "Artist is required." }, { status: 400 });
    }
    if (!lyricsRaw) {
      return NextResponse.json({ error: "Paste some lyrics." }, { status: 400 });
    }
    if (!audioExt) {
      return NextResponse.json(
        { error: "Audio must be mp3, wav, m4a, ogg, or webm." },
        { status: 400 }
      );
    }
    if (body.coverExt && !coverExt) {
      return NextResponse.json(
        { error: "Cover must be jpg, png, or webp." },
        { status: 400 }
      );
    }

    const parsed = parseLyrics(lyricsRaw);
    if (!parsed.length) {
      return NextResponse.json(
        { error: "No lyric lines found. Paste one line per row." },
        { status: 400 }
      );
    }

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

    let supabase;
    try {
      supabase = createServiceSupabase();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Supabase not configured";
      return NextResponse.json({ error: message }, { status: 500 });
    }

    const { data: folders } = await supabase.storage
      .from(LIBRARY_BUCKET)
      .list("songs", { limit: 200 });
    const existing = (folders || []).map((f) => f.name).filter(Boolean);
    const slug = uniqueSlug(slugify(title) || "song", existing);
    const prefix = `songs/${slug}`;

    const songPath = `${prefix}/song.json`;
    const { error: songError } = await supabase.storage
      .from(LIBRARY_BUCKET)
      .upload(songPath, Buffer.from(JSON.stringify(songJson, null, 2), "utf8"), {
        upsert: true,
        contentType: "application/json",
      });
    if (songError) {
      return NextResponse.json(
        { error: `Failed to write song.json: ${songError.message}` },
        { status: 500 }
      );
    }

    const audioPath = `${prefix}/audio.${audioExt}`;
    const { data: audioSign, error: audioSignError } = await supabase.storage
      .from(LIBRARY_BUCKET)
      .createSignedUploadUrl(audioPath, { upsert: true });
    if (audioSignError || !audioSign) {
      return NextResponse.json(
        {
          error: `Could not prepare audio upload: ${audioSignError?.message || "unknown error"}`,
        },
        { status: 500 }
      );
    }

    let coverUpload: { path: string; token: string; signedUrl: string } | null = null;
    if (coverExt) {
      const coverPath = `${prefix}/cover.${coverExt === "jpeg" ? "jpg" : coverExt}`;
      const { data: coverSign, error: coverSignError } = await supabase.storage
        .from(LIBRARY_BUCKET)
        .createSignedUploadUrl(coverPath, { upsert: true });
      if (coverSignError || !coverSign) {
        return NextResponse.json(
          {
            error: `Could not prepare cover upload: ${coverSignError?.message || "unknown error"}`,
          },
          { status: 500 }
        );
      }
      coverUpload = {
        path: coverSign.path,
        token: coverSign.token,
        signedUrl: coverSign.signedUrl,
      };
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
      uploads: {
        audio: {
          path: audioSign.path,
          token: audioSign.token,
          signedUrl: audioSign.signedUrl,
          contentType: body.audioContentType || "application/octet-stream",
        },
        cover: coverUpload
          ? {
              ...coverUpload,
              contentType: body.coverContentType || "application/octet-stream",
            }
          : null,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Publish failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
