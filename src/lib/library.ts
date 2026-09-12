import fs from "fs";
import path from "path";
import type {
  LyricLineWithReactions,
  SongCardData,
  SongWithDetails,
} from "@/types/database";
import {
  LIBRARY_BUCKET,
  createPublicSupabase,
  isSupabaseConfigured,
  publicObjectUrl,
} from "@/lib/supabase/public";

export interface LibraryLyricLine {
  text: string;
  section?: string | null;
  start?: number | null;
  end?: number | null;
}

export interface LibrarySongMeta {
  title: string;
  artist: string;
  genre?: string;
  description?: string;
  lyrics: LibraryLyricLine[];
}

export interface LibrarySong {
  slug: string;
  title: string;
  artist: string;
  genre: string;
  description: string;
  coverUrl: string | null;
  audioUrl: string;
  lyrics: LibraryLyricLine[];
  source: "supabase" | "local";
}

const AUDIO_EXTS = [".mp3", ".wav", ".m4a", ".ogg", ".webm"];
const COVER_EXTS = [".jpg", ".jpeg", ".png", ".webp"];
const SUPABASE_TIMEOUT_MS = 8000;

function libraryRoot() {
  return path.join(process.cwd(), "public", "library", "songs");
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

function findFile(dir: string, basenames: string[], exts: string[]): string | null {
  for (const base of basenames) {
    for (const ext of exts) {
      const full = path.join(dir, `${base}${ext}`);
      if (fs.existsSync(full)) return `${base}${ext}`;
    }
  }
  try {
    const files = fs.readdirSync(dir);
    const hit = files.find((f) => exts.includes(path.extname(f).toLowerCase()));
    return hit || null;
  } catch {
    return null;
  }
}

function readMeta(dir: string): LibrarySongMeta | null {
  const metaPath = path.join(dir, "song.json");
  if (!fs.existsSync(metaPath)) return null;
  try {
    const raw = JSON.parse(fs.readFileSync(metaPath, "utf8")) as LibrarySongMeta;
    if (!raw.title || !raw.artist || !Array.isArray(raw.lyrics)) return null;
    return raw;
  } catch {
    return null;
  }
}

function loadLocalSong(slug: string): LibrarySong | null {
  const dir = path.join(libraryRoot(), slug);
  if (!fs.existsSync(dir)) return null;
  const meta = readMeta(dir);
  if (!meta) return null;
  const audioFile = findFile(dir, ["audio", "song", "track"], AUDIO_EXTS);
  if (!audioFile) return null;
  const coverFile = findFile(dir, ["cover", "artwork", "art", "image"], COVER_EXTS);
  return {
    slug,
    title: meta.title,
    artist: meta.artist,
    genre: meta.genre || "Other",
    description: meta.description || "",
    coverUrl: coverFile ? `/library/songs/${slug}/${coverFile}` : null,
    audioUrl: `/library/songs/${slug}/${audioFile}`,
    lyrics: meta.lyrics.map((l) => ({
      text: l.text,
      section: l.section ?? null,
      start: l.start ?? null,
      end: l.end ?? null,
    })),
    source: "local",
  };
}

function loadLocalLibrarySongs(): LibrarySong[] {
  const root = libraryRoot();
  if (!fs.existsSync(root)) return [];

  const entries = fs.readdirSync(root, { withFileTypes: true });
  const songs: LibrarySong[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const song = loadLocalSong(entry.name);
    if (song) songs.push(song);
  }

  return songs;
}

function pickByExt(names: string[], exts: string[], preferred: string[]): string | null {
  for (const base of preferred) {
    const hit = names.find(
      (n) =>
        path.parse(n).name.toLowerCase() === base &&
        exts.includes(path.extname(n).toLowerCase())
    );
    if (hit) return hit;
  }
  return names.find((n) => exts.includes(path.extname(n).toLowerCase())) || null;
}

function metaToSong(
  slug: string,
  meta: LibrarySongMeta,
  audioFile: string,
  coverFile: string | null,
  source: "supabase" | "local"
): LibrarySong {
  const prefix = `songs/${slug}`;
  return {
    slug,
    title: meta.title,
    artist: meta.artist,
    genre: meta.genre || "Other",
    description: meta.description || "",
    coverUrl:
      source === "supabase"
        ? coverFile
          ? publicObjectUrl(`${prefix}/${coverFile}`)
          : null
        : coverFile
          ? `/library/songs/${slug}/${coverFile}`
          : null,
    audioUrl:
      source === "supabase"
        ? publicObjectUrl(`${prefix}/${audioFile}`)
        : `/library/songs/${slug}/${audioFile}`,
    lyrics: meta.lyrics.map((l) => ({
      text: l.text,
      section: l.section ?? null,
      start: l.start ?? null,
      end: l.end ?? null,
    })),
    source,
  };
}

async function loadSupabaseSong(slug: string): Promise<LibrarySong | null> {
  const supabase = createPublicSupabase();
  if (!supabase) return null;

  const prefix = `songs/${slug}`;

  try {
    const { data: files, error: listError } = await withTimeout(
      supabase.storage.from(LIBRARY_BUCKET).list(prefix, { limit: 50 }),
      SUPABASE_TIMEOUT_MS,
      `list ${prefix}`
    );

    if (listError || !files?.length) return null;

    const names = files.map((f) => f.name);
    if (!names.includes("song.json")) return null;

    const audioFile = pickByExt(names, AUDIO_EXTS, ["audio", "song", "track"]);
    if (!audioFile) return null;
    const coverFile = pickByExt(names, COVER_EXTS, ["cover", "artwork", "art", "image"]);

    const { data: metaBlob, error: dlError } = await withTimeout(
      supabase.storage.from(LIBRARY_BUCKET).download(`${prefix}/song.json`),
      SUPABASE_TIMEOUT_MS,
      `download ${prefix}/song.json`
    );

    if (dlError || !metaBlob) return null;

    const meta = JSON.parse(await metaBlob.text()) as LibrarySongMeta;
    if (!meta.title || !meta.artist || !Array.isArray(meta.lyrics)) return null;

    return metaToSong(slug, meta, audioFile, coverFile, "supabase");
  } catch (err) {
    console.warn(`[library] Supabase song "${slug}" failed:`, err);
    return null;
  }
}

async function loadSupabaseLibrarySongs(): Promise<LibrarySong[]> {
  const supabase = createPublicSupabase();
  if (!supabase) return [];

  try {
    const { data: folders, error } = await withTimeout(
      supabase.storage
        .from(LIBRARY_BUCKET)
        .list("songs", { limit: 200, sortBy: { column: "name", order: "asc" } }),
      SUPABASE_TIMEOUT_MS,
      "list songs"
    );

    if (error || !folders?.length) {
      if (error) console.warn("[library] Supabase list error:", error.message);
      return [];
    }

    const songs: LibrarySong[] = [];

    for (const folder of folders) {
      if (folder.name.startsWith(".")) continue;
      const song = await loadSupabaseSong(folder.name);
      if (song) songs.push(song);
    }

    return songs;
  } catch (err) {
    console.warn("[library] Supabase library load failed:", err);
    return [];
  }
}

function mergeSongs(remote: LibrarySong[], local: LibrarySong[]): LibrarySong[] {
  const map = new Map<string, LibrarySong>();
  for (const song of local) map.set(song.slug, song);
  // Supabase wins when both exist (production media)
  for (const song of remote) map.set(song.slug, song);
  return Array.from(map.values()).sort((a, b) => a.title.localeCompare(b.title));
}

/**
 * Load library songs.
 * Prefer Supabase Storage when configured; merge with local public/library for offline/dev.
 */
export async function loadLibrarySongs(): Promise<LibrarySong[]> {
  const local = loadLocalLibrarySongs();

  if (!isSupabaseConfigured()) {
    return local.sort((a, b) => a.title.localeCompare(b.title));
  }

  try {
    const remote = await loadSupabaseLibrarySongs();
    if (remote.length) return mergeSongs(remote, local);
    return local.sort((a, b) => a.title.localeCompare(b.title));
  } catch (err) {
    console.warn("[library] Falling back to local library:", err);
    return local.sort((a, b) => a.title.localeCompare(b.title));
  }
}

/** Fast path for song pages — avoid listing the whole bucket. */
export async function getLibrarySong(slug: string): Promise<LibrarySong | null> {
  const local = loadLocalSong(slug);

  if (!isSupabaseConfigured()) return local;

  // If we already have a local copy, don't block navigation on a slow Supabase call
  try {
    const remote = local
      ? await withTimeout(loadSupabaseSong(slug), 2500, `song ${slug}`)
      : await loadSupabaseSong(slug);
    return remote || local;
  } catch (err) {
    console.warn(`[library] getLibrarySong("${slug}") falling back to local:`, err);
    return local;
  }
}

export function libraryToCard(song: LibrarySong): SongCardData {
  return {
    id: `library-${song.slug}`,
    title: song.title,
    slug: song.slug,
    genre: song.genre,
    cover_url: song.coverUrl,
    audio_url: song.audioUrl,
    artist: {
      id: `artist-${song.artist.toLowerCase().replace(/\s+/g, "-")}`,
      username: song.artist.toLowerCase().replace(/\s+/g, "-"),
      display_name: song.artist,
      avatar_url: null,
    },
    average_rating: 0,
    review_count: 0,
  };
}

export function libraryToDetails(song: LibrarySong): SongWithDetails {
  const card = libraryToCard(song);
  return {
    id: card.id,
    artist_id: card.artist.id,
    title: song.title,
    slug: song.slug,
    description: song.description || null,
    genre: song.genre,
    cover_url: song.coverUrl,
    audio_url: song.audioUrl,
    status: "published",
    published_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    artist: {
      id: card.artist.id,
      username: card.artist.username,
      display_name: song.artist,
      avatar_url: null,
      bio: null,
      created_at: new Date().toISOString(),
    },
    stats: {
      song_id: card.id,
      average_rating: 0,
      review_count: 0,
      play_count: 0,
      unique_listeners: 0,
      favorite_count: 0,
    },
    is_favorited: false,
  };
}

export function libraryToLyrics(song: LibrarySong): LyricLineWithReactions[] {
  return song.lyrics.map((line, i) => ({
    id: `${song.slug}-line-${i + 1}`,
    song_id: `library-${song.slug}`,
    line_number: i + 1,
    text: line.text,
    section_label: line.section ?? null,
    start_time: line.start ?? null,
    end_time: line.end ?? null,
    created_at: new Date().toISOString(),
    heart_count: 0,
    like_count: 0,
    dislike_count: 0,
    user_reaction: null,
  }));
}

export async function searchLibrary(q: string) {
  const term = q.trim().toLowerCase();
  const songs = await loadLibrarySongs();
  if (!term) {
    return { songs: songs.map(libraryToCard), artists: [], lyrics: [] };
  }

  const matchedSongs = songs.filter(
    (s) =>
      s.title.toLowerCase().includes(term) ||
      s.artist.toLowerCase().includes(term) ||
      s.genre.toLowerCase().includes(term) ||
      s.description.toLowerCase().includes(term)
  );

  const artists = Array.from(new Set(matchedSongs.map((s) => s.artist))).map((name) => ({
    id: `artist-${name.toLowerCase().replace(/\s+/g, "-")}`,
    username: name.toLowerCase().replace(/\s+/g, "-"),
    display_name: name,
    avatar_url: null as string | null,
    bio: null as string | null,
    created_at: new Date().toISOString(),
  }));

  const lyrics = songs.flatMap((s) =>
    s.lyrics
      .map((l, i) => ({ line: l, i }))
      .filter(({ line }) => line.text.toLowerCase().includes(term))
      .map(({ line, i }) => ({
        id: `${s.slug}-line-${i + 1}`,
        text: line.text,
        song_id: `library-${s.slug}`,
        song_title: s.title,
        song_slug: s.slug,
        cover_url: s.coverUrl,
      }))
  );

  return {
    songs: matchedSongs.map(libraryToCard),
    artists,
    lyrics,
  };
}
