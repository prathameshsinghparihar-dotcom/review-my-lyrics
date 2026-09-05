import type {
  LyricLineWithReactions,
  SongCardData,
  SongReview,
  SongWithDetails,
} from "@/types/database";

const ARTISTS = {
  alex: {
    id: "demo-artist-alex",
    username: "alexcarter",
    display_name: "Alex Carter",
    avatar_url: "https://picsum.photos/seed/alexcarter/200",
    bio: "Indie songwriter exploring late-night drives and neon cities.",
    created_at: "2026-01-01T00:00:00.000Z",
  },
  maya: {
    id: "demo-artist-maya",
    username: "mayavale",
    display_name: "Maya Vale",
    avatar_url: "https://picsum.photos/seed/mayavale/200",
    bio: "Pop writer focused on chorus hooks and sharp one-liners.",
    created_at: "2026-01-02T00:00:00.000Z",
  },
  jordan: {
    id: "demo-artist-jordan",
    username: "jordanlee",
    display_name: "Jordan Lee",
    avatar_url: "https://picsum.photos/seed/jordanlee/200",
    bio: "R&B storyteller.",
    created_at: "2026-01-03T00:00:00.000Z",
  },
} as const;

function audio(n: number) {
  return `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${n}.mp3`;
}

function cover(seed: string) {
  return `https://picsum.photos/seed/${seed}/600`;
}

const MIDNIGHT_LINES = [
  { section: "VERSE 1", text: "I drove through the city lights", heart: 42, like: 81, dislike: 7, start: 0, end: 4.2 },
  { section: null, text: "Trying to find my way back home", heart: 31, like: 62, dislike: 12, start: 4.2, end: 8.4 },
  { section: null, text: "Every road remembers your name", heart: 89, like: 104, dislike: 5, start: 8.4, end: 12.6 },
  { section: null, text: "The dashboard glows like open flame", heart: 55, like: 70, dislike: 8, start: 12.6, end: 16.8 },
  { section: "CHORUS", text: "Take me where the stars don't fade", heart: 76, like: 95, dislike: 6, start: 16.8, end: 21 },
  { section: null, text: "Take me where we can begin again", heart: 71, like: 88, dislike: 9, start: 21, end: 25.2 },
  { section: "VERSE 2", text: "Radio hums a borrowed tune", heart: 40, like: 58, dislike: 11, start: 25.2, end: 29.4 },
  { section: null, text: "Windows down beneath the moon", heart: 48, like: 66, dislike: 7, start: 29.4, end: 33.6 },
  { section: null, text: "Your laughter lives in every lane", heart: 63, like: 79, dislike: 4, start: 33.6, end: 37.8 },
  { section: null, text: "I chase the quiet through the rain", heart: 58, like: 72, dislike: 10, start: 37.8, end: 42 },
  { section: "BRIDGE", text: "Maps unfold but never stay", heart: 35, like: 44, dislike: 18, start: 42, end: 46.2 },
  { section: null, text: "Still I follow yesterday", heart: 52, like: 61, dislike: 14, start: 46.2, end: 50.4 },
  { section: null, text: "Hold the wheel and let it bend", heart: 47, like: 55, dislike: 9, start: 50.4, end: 54.6 },
  { section: null, text: "This midnight drive might never end", heart: 84, like: 91, dislike: 6, start: 54.6, end: 58.8 },
  { section: "OUTRO", text: "Sing the chorus soft and slow", heart: 60, like: 74, dislike: 5, start: 58.8, end: 63 },
  { section: null, text: "Tell the night what we both know", heart: 67, like: 80, dislike: 8, start: 63, end: 67.2 },
];

function buildLyrics(
  songId: string,
  rows: typeof MIDNIGHT_LINES
): LyricLineWithReactions[] {
  return rows.map((row, i) => ({
    id: `${songId}-line-${i + 1}`,
    song_id: songId,
    line_number: i + 1,
    text: row.text,
    section_label: row.section,
    start_time: row.start,
    end_time: row.end,
    created_at: "2026-01-01T00:00:00.000Z",
    heart_count: row.heart,
    like_count: row.like,
    dislike_count: row.dislike,
    user_reaction: null,
  }));
}

export const DEMO_SONGS: SongWithDetails[] = [
  {
    id: "demo-song-midnight-drive",
    artist_id: ARTISTS.alex.id,
    title: "Midnight Drive",
    slug: "midnight-drive",
    description: "A fictional late-night indie track made for line-by-line lyric feedback.",
    genre: "Indie",
    cover_url: cover("midnightdrive"),
    audio_url: audio(1),
    status: "published",
    published_at: "2026-08-01T00:00:00.000Z",
    created_at: "2026-08-01T00:00:00.000Z",
    updated_at: "2026-08-01T00:00:00.000Z",
    artist: ARTISTS.alex,
    stats: {
      song_id: "demo-song-midnight-drive",
      average_rating: 4.7,
      review_count: 128,
      play_count: 4821,
      unique_listeners: 2104,
      favorite_count: 312,
    },
    is_favorited: false,
  },
  {
    id: "demo-song-neon-letters",
    artist_id: ARTISTS.maya.id,
    title: "Neon Letters",
    slug: "neon-letters",
    description: "Bright pop writing with a chorus built to be reacted to.",
    genre: "Pop",
    cover_url: cover("neonletters"),
    audio_url: audio(2),
    status: "published",
    published_at: "2026-08-05T00:00:00.000Z",
    created_at: "2026-08-05T00:00:00.000Z",
    updated_at: "2026-08-05T00:00:00.000Z",
    artist: ARTISTS.maya,
    stats: {
      song_id: "demo-song-neon-letters",
      average_rating: 4.4,
      review_count: 86,
      play_count: 3012,
      unique_listeners: 1400,
      favorite_count: 190,
    },
    is_favorited: false,
  },
  {
    id: "demo-song-glass-harbor",
    artist_id: ARTISTS.jordan.id,
    title: "Glass Harbor",
    slug: "glass-harbor",
    description: "Soft R&B storytelling by the water.",
    genre: "R&B",
    cover_url: cover("glassharbor"),
    audio_url: audio(3),
    status: "published",
    published_at: "2026-08-10T00:00:00.000Z",
    created_at: "2026-08-10T00:00:00.000Z",
    updated_at: "2026-08-10T00:00:00.000Z",
    artist: ARTISTS.jordan,
    stats: {
      song_id: "demo-song-glass-harbor",
      average_rating: 4.8,
      review_count: 64,
      play_count: 2210,
      unique_listeners: 980,
      favorite_count: 150,
    },
    is_favorited: false,
  },
  {
    id: "demo-song-soft-static",
    artist_id: ARTISTS.alex.id,
    title: "Soft Static",
    slug: "soft-static",
    description: "Electronic haze and half-remembered verses.",
    genre: "Electronic",
    cover_url: cover("softstatic"),
    audio_url: audio(4),
    status: "published",
    published_at: "2026-08-12T00:00:00.000Z",
    created_at: "2026-08-12T00:00:00.000Z",
    updated_at: "2026-08-12T00:00:00.000Z",
    artist: ARTISTS.alex,
    stats: {
      song_id: "demo-song-soft-static",
      average_rating: 4.1,
      review_count: 41,
      play_count: 1670,
      unique_listeners: 720,
      favorite_count: 88,
    },
    is_favorited: false,
  },
  {
    id: "demo-song-paper-moons",
    artist_id: ARTISTS.maya.id,
    title: "Paper Moons",
    slug: "paper-moons",
    description: "Acoustic sketches and fragile bridges.",
    genre: "Acoustic",
    cover_url: cover("papermoons"),
    audio_url: audio(5),
    status: "published",
    published_at: "2026-08-18T00:00:00.000Z",
    created_at: "2026-08-18T00:00:00.000Z",
    updated_at: "2026-08-18T00:00:00.000Z",
    artist: ARTISTS.maya,
    stats: {
      song_id: "demo-song-paper-moons",
      average_rating: 4.5,
      review_count: 53,
      play_count: 1988,
      unique_listeners: 860,
      favorite_count: 120,
    },
    is_favorited: false,
  },
];

const OTHER_LINES = [
  { section: "VERSE 1", text: "Counting echoes in the dark", heart: 28, like: 44, dislike: 6, start: 0, end: 4 },
  { section: null, text: "Folding silence into sparks", heart: 33, like: 51, dislike: 8, start: 4, end: 8 },
  { section: null, text: "Write your name across the sky", heart: 61, like: 70, dislike: 4, start: 8, end: 12 },
  { section: null, text: "Teach the quiet how to fly", heart: 49, like: 58, dislike: 7, start: 12, end: 16 },
  { section: "CHORUS", text: "Broken compass, steady heart", heart: 72, like: 81, dislike: 5, start: 16, end: 20 },
  { section: null, text: "We were unfinished works of art", heart: 80, like: 92, dislike: 3, start: 20, end: 24 },
  { section: "VERSE 2", text: "Harbor lights and borrowed time", heart: 37, like: 46, dislike: 9, start: 24, end: 28 },
  { section: null, text: "Keep the rhythm, keep the rhyme", heart: 41, like: 55, dislike: 6, start: 28, end: 32 },
  { section: null, text: "Paper moons and velvet rain", heart: 58, like: 64, dislike: 8, start: 32, end: 36 },
  { section: null, text: "Something soft beneath the pain", heart: 66, like: 73, dislike: 11, start: 36, end: 40 },
  { section: "BRIDGE", text: "Hold the chorus, let it breathe", heart: 45, like: 52, dislike: 10, start: 40, end: 44 },
  { section: null, text: "Promise less than we believe", heart: 39, like: 48, dislike: 16, start: 44, end: 48 },
  { section: "OUTRO", text: "If the morning finds us gone", heart: 50, like: 60, dislike: 7, start: 48, end: 52 },
  { section: null, text: "Leave the melody turned on", heart: 68, like: 77, dislike: 5, start: 52, end: 56 },
  { section: null, text: "Every lyric learns your face", heart: 74, like: 85, dislike: 4, start: 56, end: 60 },
  { section: null, text: "Every silence fills the space", heart: 57, like: 69, dislike: 9, start: 60, end: 64 },
];

export const DEMO_LYRICS: Record<string, LyricLineWithReactions[]> = {
  "demo-song-midnight-drive": buildLyrics("demo-song-midnight-drive", MIDNIGHT_LINES),
  "demo-song-neon-letters": buildLyrics("demo-song-neon-letters", OTHER_LINES),
  "demo-song-glass-harbor": buildLyrics("demo-song-glass-harbor", OTHER_LINES),
  "demo-song-soft-static": buildLyrics("demo-song-soft-static", OTHER_LINES),
  "demo-song-paper-moons": buildLyrics("demo-song-paper-moons", OTHER_LINES),
};

export const DEMO_REVIEWS: Record<string, SongReview[]> = {
  "demo-song-midnight-drive": [
    {
      id: "demo-review-1",
      song_id: "demo-song-midnight-drive",
      user_id: "demo-user-1",
      rating: 5,
      comment: "The chorus is incredibly catchy. The second verse could be stronger.",
      created_at: "2026-08-20T00:00:00.000Z",
      updated_at: "2026-08-20T00:00:00.000Z",
      profile: {
        id: "demo-user-1",
        username: "listenerone",
        display_name: "Listener One",
        avatar_url: null,
        bio: null,
        created_at: "2026-01-01T00:00:00.000Z",
      },
    },
    {
      id: "demo-review-2",
      song_id: "demo-song-midnight-drive",
      user_id: "demo-user-2",
      rating: 4,
      comment: "Loved the line about every road remembering a name.",
      created_at: "2026-08-18T00:00:00.000Z",
      updated_at: "2026-08-18T00:00:00.000Z",
      profile: {
        id: "demo-user-2",
        username: "nightowl",
        display_name: "Night Owl",
        avatar_url: null,
        bio: null,
        created_at: "2026-01-01T00:00:00.000Z",
      },
    },
  ],
};

export function demoSongCards(): SongCardData[] {
  return DEMO_SONGS.map((s) => ({
    id: s.id,
    title: s.title,
    slug: s.slug,
    genre: s.genre,
    cover_url: s.cover_url,
    audio_url: s.audio_url,
    artist: {
      id: s.artist.id,
      username: s.artist.username,
      display_name: s.artist.display_name,
      avatar_url: s.artist.avatar_url,
    },
    average_rating: s.stats.average_rating,
    review_count: s.stats.review_count,
  }));
}

export function getDemoSongBySlug(slug: string): SongWithDetails | null {
  return DEMO_SONGS.find((s) => s.slug === slug) || null;
}

export function getDemoArtist(username: string): {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
} | null {
  const match = Object.values(ARTISTS).find((a) => a.username === username);
  return match
    ? {
        id: match.id,
        username: match.username,
        display_name: match.display_name,
        avatar_url: match.avatar_url,
        bio: match.bio,
        created_at: match.created_at,
      }
    : null;
}

export function isDemoId(id: string): boolean {
  return id.startsWith("demo-");
}
