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

function libraryRoot() {
  return path.join(process.cwd(), "public", "library", "songs");
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

function loadLocalLibrarySongs(): LibrarySong[] {
  const root = libraryRoot();
  if (!fs.existsSync(root)) return [];

  const entries = fs.readdirSync(root, { withFileTypes: true });
  const songs: LibrarySong[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const slug = entry.name;
    const dir = path.join(root, slug);
    const meta = readMeta(dir);
    if (!meta) continue;

    const audioFile = findFile(dir, ["audio", "song", "track"], AUDIO_EXTS);
    if (!audioFile) continue;

    const coverFile = findFile(dir, ["cover", "artwork", "art", "image"], COVER_EXTS);

    songs.push({
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
    });
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

async function loadSupabaseLibrarySongs(): Promise<LibrarySong[]> {
  const supabase = createPublicSupabase();
  if (!supabase) return [];

  const { data: folders, error } = await supabase.storage
    .from(LIBRARY_BUCKET)
    .list("songs", { limit: 200, sortBy: { column: "name", order: "asc" } });

  if (error || !folders?.length) {
    if (error) console.warn("[library] Supabase list error:", error.message);
    return [];
  }

  const songs: LibrarySong[] = [];

  for (const folder of folders) {
    // Skip placeholder files; song folders are listed as prefix entries
    if (folder.name.startsWith(".")) continue;
    const slug = folder.name;
    const prefix = `songs/${slug}`;

    const { data: files, error: listError } = await supabase.storage
      .from(LIBRARY_BUCKET)
      .list(prefix, { limit: 50 });

    if (listError || !files?.length) continue;

    const names = files.map((f) => f.name);
    if (!names.includes("song.json")) continue;

    const audioFile = pickByExt(names, AUDIO_EXTS, ["audio", "song", "track"]);
    if (!audioFile) continue;

    const coverFile = pickByExt(names, COVER_EXTS, ["cover", "artwork", "art", "image"]);

    const { data: metaBlob, error: dlError } = await supabase.storage
      .from(LIBRARY_BUCKET)
      .download(`${prefix}/song.json`);

    if (dlError || !metaBlob) continue;

    let meta: LibrarySongMeta;
    try {
      meta = JSON.parse(await metaBlob.text()) as LibrarySongMeta;
      if (!meta.title || !meta.artist || !Array.isArray(meta.lyrics)) continue;
    } catch {
      continue;
    }

    songs.push({
      slug,
      title: meta.title,
      artist: meta.artist,
      genre: meta.genre || "Other",
      description: meta.description || "",
      coverUrl: coverFile ? publicObjectUrl(`${prefix}/${coverFile}`) : null,
      audioUrl: publicObjectUrl(`${prefix}/${audioFile}`),
      lyrics: meta.lyrics.map((l) => ({
        text: l.text,
        section: l.section ?? null,
        start: l.start ?? null,
        end: l.end ?? null,
      })),
      source: "supabase",
    });
  }

  return songs;
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

export async function getLibrarySong(slug: string): Promise<LibrarySong | null> {
  const songs = await loadLibrarySongs();
  return songs.find((s) => s.slug === slug) || null;
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
