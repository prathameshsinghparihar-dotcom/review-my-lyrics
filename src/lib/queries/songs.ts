import type { createClient } from "@/lib/supabase/server";
import type {
  LyricLineWithReactions,
  Profile,
  ReactionType,
  SongCardData,
  SongReview,
  SongStats,
  SongWithDetails,
} from "@/types/database";

type Supabase = Awaited<ReturnType<typeof createClient>>;

const emptyStats = (songId: string): SongStats => ({
  song_id: songId,
  average_rating: 0,
  review_count: 0,
  play_count: 0,
  unique_listeners: 0,
  favorite_count: 0,
});

async function getStatsMap(
  supabase: Supabase,
  songIds: string[]
): Promise<Map<string, SongStats>> {
  const map = new Map<string, SongStats>();
  songIds.forEach((id) => map.set(id, emptyStats(id)));
  if (songIds.length === 0) return map;

  const { data: reviews } = await supabase
    .from("song_reviews")
    .select("song_id, rating")
    .in("song_id", songIds);

  const reviewAgg = new Map<string, { sum: number; count: number }>();
  for (const r of reviews || []) {
    const cur = reviewAgg.get(r.song_id) || { sum: 0, count: 0 };
    cur.sum += r.rating;
    cur.count += 1;
    reviewAgg.set(r.song_id, cur);
  }

  const { data: plays } = await supabase
    .from("play_events")
    .select("song_id")
    .in("song_id", songIds);

  const playCounts = new Map<string, number>();
  for (const p of plays || []) {
    playCounts.set(p.song_id, (playCounts.get(p.song_id) || 0) + 1);
  }

  const { data: favs } = await supabase
    .from("favorites")
    .select("song_id")
    .in("song_id", songIds);

  const favCounts = new Map<string, number>();
  for (const f of favs || []) {
    favCounts.set(f.song_id, (favCounts.get(f.song_id) || 0) + 1);
  }

  for (const id of songIds) {
    const rev = reviewAgg.get(id);
    map.set(id, {
      song_id: id,
      average_rating: rev ? Number((rev.sum / rev.count).toFixed(2)) : 0,
      review_count: rev?.count || 0,
      play_count: playCounts.get(id) || 0,
      unique_listeners: 0,
      favorite_count: favCounts.get(id) || 0,
    });
  }

  return map;
}

function toCard(
  song: {
    id: string;
    title: string;
    slug: string;
    genre: string | null;
    cover_url: string | null;
    audio_url: string | null;
    artist: Profile | Profile[] | null;
  },
  stats: SongStats
): SongCardData {
  const artist = Array.isArray(song.artist) ? song.artist[0] : song.artist;
  return {
    id: song.id,
    title: song.title,
    slug: song.slug,
    genre: song.genre,
    cover_url: song.cover_url,
    audio_url: song.audio_url,
    artist: {
      id: artist?.id || "",
      username: artist?.username || "unknown",
      display_name: artist?.display_name || "Unknown Artist",
      avatar_url: artist?.avatar_url || null,
    },
    average_rating: stats.average_rating,
    review_count: stats.review_count,
  };
}

export async function getCurrentProfile(supabase: Supabase): Promise<Profile | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return data;
}

export async function getProfileByUsername(
  supabase: Supabase,
  username: string
): Promise<Profile | null> {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username.toLowerCase())
    .maybeSingle();
  return data;
}

export async function getTrendingSongs(
  supabase: Supabase,
  limit = 8
): Promise<SongCardData[]> {
  const { data: songs } = await supabase
    .from("songs")
    .select(
      "id, title, slug, genre, cover_url, audio_url, artist:profiles!songs_artist_id_fkey(*)"
    )
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(40);

  if (!songs?.length) return [];

  const statsMap = await getStatsMap(
    supabase,
    songs.map((s) => s.id)
  );

  return songs
    .map((s) => toCard(s, statsMap.get(s.id)!))
    .sort((a, b) => {
      const scoreA = a.average_rating * a.review_count + a.review_count;
      const scoreB = b.average_rating * b.review_count + b.review_count;
      return scoreB - scoreA;
    })
    .slice(0, limit);
}

export async function getRecentSongs(
  supabase: Supabase,
  limit = 8
): Promise<SongCardData[]> {
  const { data: songs } = await supabase
    .from("songs")
    .select(
      "id, title, slug, genre, cover_url, audio_url, artist:profiles!songs_artist_id_fkey(*)"
    )
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(limit);

  if (!songs?.length) return [];
  const statsMap = await getStatsMap(
    supabase,
    songs.map((s) => s.id)
  );
  return songs.map((s) => toCard(s, statsMap.get(s.id)!));
}

export type DiscoverSort = "trending" | "newest" | "most_reviewed" | "highest_rated";

export async function discoverSongs(
  supabase: Supabase,
  opts: {
    genre?: string | null;
    sort?: DiscoverSort;
    page?: number;
    pageSize?: number;
    q?: string | null;
  }
): Promise<{ songs: SongCardData[]; total: number }> {
  const page = opts.page || 1;
  const pageSize = opts.pageSize || 12;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("songs")
    .select(
      "id, title, slug, genre, cover_url, audio_url, published_at, artist:profiles!songs_artist_id_fkey(*)",
      { count: "exact" }
    )
    .eq("status", "published");

  if (opts.genre && opts.genre !== "All") {
    query = query.eq("genre", opts.genre);
  }

  if (opts.q) {
    query = query.or(
      `title.ilike.%${opts.q}%,description.ilike.%${opts.q}%`
    );
  }

  const sort = opts.sort || "trending";
  if (sort === "newest") {
    query = query.order("published_at", { ascending: false });
  } else {
    query = query.order("published_at", { ascending: false });
  }

  // For trending/rated we fetch a larger set then sort in memory for simplicity
  const fetchLimit = sort === "newest" ? undefined : 100;
  if (fetchLimit) {
    const { data, count } = await query.range(0, fetchLimit - 1);
    if (!data?.length) return { songs: [], total: 0 };
    const statsMap = await getStatsMap(
      supabase,
      data.map((s) => s.id)
    );
    let cards = data.map((s) => toCard(s, statsMap.get(s.id)!));
    if (sort === "trending") {
      cards = [...cards].sort(
        (a, b) =>
          b.review_count * b.average_rating +
          b.review_count -
          (a.review_count * a.average_rating + a.review_count)
      );
    } else if (sort === "most_reviewed") {
      cards = [...cards].sort((a, b) => b.review_count - a.review_count);
    } else if (sort === "highest_rated") {
      cards = [...cards].sort((a, b) => b.average_rating - a.average_rating);
    }
    return {
      songs: cards.slice(from, from + pageSize),
      total: count || cards.length,
    };
  }

  const { data, count } = await query.range(from, to);
  if (!data?.length) return { songs: [], total: count || 0 };
  const statsMap = await getStatsMap(
    supabase,
    data.map((s) => s.id)
  );
  return {
    songs: data.map((s) => toCard(s, statsMap.get(s.id)!)),
    total: count || 0,
  };
}

export async function getSongBySlug(
  supabase: Supabase,
  slug: string,
  userId?: string | null
): Promise<SongWithDetails | null> {
  const { data: song } = await supabase
    .from("songs")
    .select("*, artist:profiles!songs_artist_id_fkey(*)")
    .eq("slug", slug)
    .maybeSingle();

  if (!song) return null;

  const artist = Array.isArray(song.artist) ? song.artist[0] : song.artist;
  const statsMap = await getStatsMap(supabase, [song.id]);
  let is_favorited = false;

  if (userId) {
    const { data: fav } = await supabase
      .from("favorites")
      .select("id")
      .eq("user_id", userId)
      .eq("song_id", song.id)
      .maybeSingle();
    is_favorited = !!fav;
  }

  const { id: _a, artist: _b, ...songFields } = song;
  void _a;
  void _b;

  return {
    ...songFields,
    artist: artist!,
    stats: statsMap.get(song.id)!,
    is_favorited,
  };
}

export async function getSongLyricsWithReactions(
  supabase: Supabase,
  songId: string,
  userId?: string | null
): Promise<LyricLineWithReactions[]> {
  const { data: lines } = await supabase
    .from("lyric_lines")
    .select("*")
    .eq("song_id", songId)
    .order("line_number", { ascending: true });

  if (!lines?.length) return [];

  const lineIds = lines.map((l) => l.id);

  const { data: reactions } = await supabase
    .from("lyric_reactions")
    .select("lyric_line_id, reaction_type, user_id")
    .in("lyric_line_id", lineIds);

  const counts = new Map<
    string,
    { heart: number; like: number; dislike: number; user: ReactionType | null }
  >();

  for (const id of lineIds) {
    counts.set(id, { heart: 0, like: 0, dislike: 0, user: null });
  }

  for (const r of reactions || []) {
    const c = counts.get(r.lyric_line_id);
    if (!c) continue;
    if (r.reaction_type === "heart") c.heart += 1;
    if (r.reaction_type === "like") c.like += 1;
    if (r.reaction_type === "dislike") c.dislike += 1;
    if (userId && r.user_id === userId) {
      c.user = r.reaction_type as ReactionType;
    }
  }

  return lines.map((l) => {
    const c = counts.get(l.id)!;
    return {
      ...l,
      heart_count: c.heart,
      like_count: c.like,
      dislike_count: c.dislike,
      user_reaction: c.user,
    };
  });
}

export async function getSongReviews(
  supabase: Supabase,
  songId: string,
  sort: "newest" | "highest" | "lowest" = "newest"
): Promise<SongReview[]> {
  let query = supabase
    .from("song_reviews")
    .select("*, profile:profiles!song_reviews_user_id_fkey(*)")
    .eq("song_id", songId);

  if (sort === "newest") query = query.order("created_at", { ascending: false });
  if (sort === "highest") query = query.order("rating", { ascending: false });
  if (sort === "lowest") query = query.order("rating", { ascending: true });

  const { data } = await query;
  return (data || []).map((r) => ({
    ...r,
    profile: Array.isArray(r.profile) ? r.profile[0] : r.profile,
  }));
}

export async function getRatingDistribution(
  supabase: Supabase,
  songId: string
): Promise<Record<1 | 2 | 3 | 4 | 5, number>> {
  const dist: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const { data } = await supabase
    .from("song_reviews")
    .select("rating")
    .eq("song_id", songId);

  for (const r of data || []) {
    const rating = r.rating as 1 | 2 | 3 | 4 | 5;
    if (rating >= 1 && rating <= 5) dist[rating] += 1;
  }
  return dist;
}

export async function searchAll(supabase: Supabase, q: string) {
  const term = q.trim();
  if (!term) return { songs: [], artists: [], lyrics: [] };

  const [{ data: songs }, { data: artists }, { data: lyricHits }] =
    await Promise.all([
      supabase
        .from("songs")
        .select(
          "id, title, slug, genre, cover_url, audio_url, artist:profiles!songs_artist_id_fkey(*)"
        )
        .eq("status", "published")
        .or(`title.ilike.%${term}%,description.ilike.%${term}%`)
        .limit(20),
      supabase
        .from("profiles")
        .select("*")
        .or(`username.ilike.%${term}%,display_name.ilike.%${term}%`)
        .limit(20),
      supabase
        .from("lyric_lines")
        .select("id, text, song_id, songs!inner(id, title, slug, status, cover_url)")
        .ilike("text", `%${term}%`)
        .eq("songs.status", "published")
        .limit(20),
    ]);

  const songIds = (songs || []).map((s) => s.id);
  const statsMap = await getStatsMap(supabase, songIds);

  return {
    songs: (songs || []).map((s) => toCard(s, statsMap.get(s.id)!)),
    artists: artists || [],
    lyrics: (lyricHits || []).map((l) => {
      const song = Array.isArray(l.songs) ? l.songs[0] : l.songs;
      return {
        id: l.id,
        text: l.text,
        song_id: l.song_id,
        song_title: song?.title || "",
        song_slug: song?.slug || "",
        cover_url: song?.cover_url || null,
      };
    }),
  };
}

export async function getArtistSongs(
  supabase: Supabase,
  artistId: string
): Promise<SongCardData[]> {
  const { data: songs } = await supabase
    .from("songs")
    .select(
      "id, title, slug, genre, cover_url, audio_url, artist:profiles!songs_artist_id_fkey(*)"
    )
    .eq("artist_id", artistId)
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (!songs?.length) return [];
  const statsMap = await getStatsMap(
    supabase,
    songs.map((s) => s.id)
  );
  return songs.map((s) => toCard(s, statsMap.get(s.id)!));
}

export async function getUserFavorites(
  supabase: Supabase,
  userId: string
): Promise<SongCardData[]> {
  const { data } = await supabase
    .from("favorites")
    .select(
      "song:songs(id, title, slug, genre, cover_url, audio_url, status, artist:profiles!songs_artist_id_fkey(*))"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const songs = (data || [])
    .map((f) => (Array.isArray(f.song) ? f.song[0] : f.song))
    .filter((s): s is NonNullable<typeof s> => !!s && s.status === "published");

  if (!songs.length) return [];
  const statsMap = await getStatsMap(
    supabase,
    songs.map((s) => s.id)
  );
  return songs.map((s) => toCard(s, statsMap.get(s.id)!));
}

export async function getDashboardData(supabase: Supabase, artistId: string) {
  const { data: songs } = await supabase
    .from("songs")
    .select("*")
    .eq("artist_id", artistId)
    .order("updated_at", { ascending: false });

  const songList = songs || [];
  const statsMap = await getStatsMap(
    supabase,
    songList.map((s) => s.id)
  );

  const published = songList.filter((s) => s.status === "published");
  let totalPlays = 0;
  let totalReviews = 0;
  let ratingSum = 0;
  let ratingCount = 0;

  for (const s of published) {
    const st = statsMap.get(s.id)!;
    totalPlays += st.play_count;
    totalReviews += st.review_count;
    if (st.review_count > 0) {
      ratingSum += st.average_rating * st.review_count;
      ratingCount += st.review_count;
    }
  }

  return {
    songs: songList.map((s) => ({
      ...s,
      stats: statsMap.get(s.id)!,
    })),
    totals: {
      plays: totalPlays,
      reviews: totalReviews,
      averageRating: ratingCount ? Number((ratingSum / ratingCount).toFixed(2)) : 0,
      publishedCount: published.length,
    },
  };
}

export async function getSongAnalytics(supabase: Supabase, songId: string) {
  const { data: song } = await supabase
    .from("songs")
    .select("*, artist:profiles!songs_artist_id_fkey(*)")
    .eq("id", songId)
    .maybeSingle();

  if (!song) return null;

  const statsMap = await getStatsMap(supabase, [songId]);
  const lyrics = await getSongLyricsWithReactions(supabase, songId);

  const { count: uniqueListeners } = await supabase
    .from("play_events")
    .select("user_id", { count: "exact", head: true })
    .eq("song_id", songId)
    .not("user_id", "is", null);

  const stats = {
    ...statsMap.get(songId)!,
    unique_listeners: uniqueListeners || 0,
  };

  const lines = lyrics.map((l) => ({
    ...l,
    positive_pct: (() => {
      const t = l.heart_count + l.like_count + l.dislike_count;
      return t ? Math.round(((l.heart_count + l.like_count) / t) * 100) : 0;
    })(),
    dislike_pct: (() => {
      const t = l.heart_count + l.like_count + l.dislike_count;
      return t ? Math.round((l.dislike_count / t) * 100) : 0;
    })(),
    total_reactions: l.heart_count + l.like_count + l.dislike_count,
  }));

  return { song, stats, lines };
}
