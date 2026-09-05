export type ReactionType = "heart" | "like" | "dislike";

export type SongStatus = "draft" | "published" | "unpublished";

export type Genre =
  | "Pop"
  | "Hip-Hop"
  | "Rap"
  | "Rock"
  | "R&B"
  | "Indie"
  | "Electronic"
  | "Acoustic"
  | "Other";

export const GENRES: Genre[] = [
  "Pop",
  "Hip-Hop",
  "Rap",
  "Rock",
  "R&B",
  "Indie",
  "Electronic",
  "Acoustic",
  "Other",
];

export interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
}

export interface Song {
  id: string;
  artist_id: string;
  title: string;
  slug: string;
  description: string | null;
  genre: string | null;
  cover_url: string | null;
  audio_url: string | null;
  status: SongStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LyricLine {
  id: string;
  song_id: string;
  line_number: number;
  text: string;
  section_label: string | null;
  start_time: number | null;
  end_time: number | null;
  created_at: string;
}

export interface LyricLineWithReactions extends LyricLine {
  heart_count: number;
  like_count: number;
  dislike_count: number;
  user_reaction: ReactionType | null;
}

export interface SongReview {
  id: string;
  song_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
  profile?: Profile;
}

export interface SongStats {
  song_id: string;
  average_rating: number;
  review_count: number;
  play_count: number;
  unique_listeners: number;
  favorite_count: number;
}

export interface SongWithDetails extends Song {
  artist: Profile;
  stats: SongStats;
  is_favorited?: boolean;
}

export interface SongCardData {
  id: string;
  title: string;
  slug: string;
  genre: string | null;
  cover_url: string | null;
  audio_url: string | null;
  artist: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
  average_rating: number;
  review_count: number;
}

type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: {
          id: string;
          username: string;
          display_name: string;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          display_name?: string;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      songs: {
        Row: Song;
        Insert: {
          id?: string;
          artist_id: string;
          title: string;
          slug: string;
          description?: string | null;
          genre?: string | null;
          cover_url?: string | null;
          audio_url?: string | null;
          status?: SongStatus;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          artist_id?: string;
          title?: string;
          slug?: string;
          description?: string | null;
          genre?: string | null;
          cover_url?: string | null;
          audio_url?: string | null;
          status?: SongStatus;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      lyric_lines: {
        Row: LyricLine;
        Insert: {
          id?: string;
          song_id: string;
          line_number: number;
          text: string;
          section_label?: string | null;
          start_time?: number | null;
          end_time?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          song_id?: string;
          line_number?: number;
          text?: string;
          section_label?: string | null;
          start_time?: number | null;
          end_time?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      lyric_reactions: {
        Row: {
          id: string;
          lyric_line_id: string;
          user_id: string;
          reaction_type: ReactionType;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          lyric_line_id: string;
          user_id: string;
          reaction_type: ReactionType;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          lyric_line_id?: string;
          user_id?: string;
          reaction_type?: ReactionType;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      song_reviews: {
        Row: {
          id: string;
          song_id: string;
          user_id: string;
          rating: number;
          comment: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          song_id: string;
          user_id: string;
          rating: number;
          comment?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          song_id?: string;
          user_id?: string;
          rating?: number;
          comment?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      play_events: {
        Row: {
          id: string;
          song_id: string;
          user_id: string | null;
          played_at: string;
        };
        Insert: {
          id?: string;
          song_id: string;
          user_id?: string | null;
          played_at?: string;
        };
        Update: {
          id?: string;
          song_id?: string;
          user_id?: string | null;
          played_at?: string;
        };
        Relationships: [];
      };
      favorites: {
        Row: {
          id: string;
          user_id: string;
          song_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          song_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          song_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type { Json };
