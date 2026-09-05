-- LyricPulse Database Schema
-- Run this in Supabase SQL Editor or via migrations

-- Extensions
create extension if not exists "pgcrypto";

-- Profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text not null,
  avatar_url text,
  bio text,
  created_at timestamptz not null default now(),
  constraint username_format check (username ~ '^[a-z0-9_]{3,30}$')
);

-- Songs
create table if not exists public.songs (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  slug text unique not null,
  description text,
  genre text,
  cover_url text,
  audio_url text,
  status text not null default 'draft'
    check (status in ('draft', 'published', 'unpublished')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists songs_artist_id_idx on public.songs(artist_id);
create index if not exists songs_status_idx on public.songs(status);
create index if not exists songs_genre_idx on public.songs(genre);
create index if not exists songs_published_at_idx on public.songs(published_at desc);

-- Lyric lines
create table if not exists public.lyric_lines (
  id uuid primary key default gen_random_uuid(),
  song_id uuid not null references public.songs(id) on delete cascade,
  line_number integer not null,
  text text not null,
  section_label text,
  start_time numeric,
  end_time numeric,
  created_at timestamptz not null default now(),
  unique (song_id, line_number)
);

create index if not exists lyric_lines_song_id_idx on public.lyric_lines(song_id);

-- Lyric reactions
create table if not exists public.lyric_reactions (
  id uuid primary key default gen_random_uuid(),
  lyric_line_id uuid not null references public.lyric_lines(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reaction_type text not null check (reaction_type in ('heart', 'like', 'dislike')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, lyric_line_id)
);

create index if not exists lyric_reactions_line_id_idx on public.lyric_reactions(lyric_line_id);

-- Song reviews
create table if not exists public.song_reviews (
  id uuid primary key default gen_random_uuid(),
  song_id uuid not null references public.songs(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (song_id, user_id)
);

create index if not exists song_reviews_song_id_idx on public.song_reviews(song_id);

-- Play events
create table if not exists public.play_events (
  id uuid primary key default gen_random_uuid(),
  song_id uuid not null references public.songs(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  played_at timestamptz not null default now()
);

create index if not exists play_events_song_id_idx on public.play_events(song_id);
create index if not exists play_events_played_at_idx on public.play_events(played_at desc);

-- Favorites
create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  song_id uuid not null references public.songs(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, song_id)
);

create index if not exists favorites_user_id_idx on public.favorites(user_id);

-- Updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists songs_updated_at on public.songs;
create trigger songs_updated_at
  before update on public.songs
  for each row execute function public.set_updated_at();

drop trigger if exists lyric_reactions_updated_at on public.lyric_reactions;
create trigger lyric_reactions_updated_at
  before update on public.lyric_reactions
  for each row execute function public.set_updated_at();

drop trigger if exists song_reviews_updated_at on public.song_reviews;
create trigger song_reviews_updated_at
  before update on public.song_reviews
  for each row execute function public.set_updated_at();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  uname text;
  dname text;
begin
  uname := coalesce(
    new.raw_user_meta_data->>'username',
    'user_' || substr(replace(new.id::text, '-', ''), 1, 10)
  );
  dname := coalesce(
    new.raw_user_meta_data->>'display_name',
    uname
  );

  insert into public.profiles (id, username, display_name)
  values (new.id, lower(uname), dname)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helper: is song owner
create or replace function public.is_song_owner(song uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.songs s
    where s.id = song and s.artist_id = auth.uid()
  );
$$;

-- Helper: is published song
create or replace function public.is_published_song(song uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.songs s
    where s.id = song and s.status = 'published'
  );
$$;

-- Views for aggregates
create or replace view public.song_stats as
select
  s.id as song_id,
  coalesce(avg(r.rating), 0)::numeric(3,2) as average_rating,
  count(r.id)::integer as review_count,
  (select count(*)::integer from public.play_events pe where pe.song_id = s.id) as play_count,
  (select count(distinct pe.user_id)::integer from public.play_events pe where pe.song_id = s.id and pe.user_id is not null) as unique_listeners,
  (select count(*)::integer from public.favorites f where f.song_id = s.id) as favorite_count
from public.songs s
left join public.song_reviews r on r.song_id = s.id
group by s.id;

create or replace view public.lyric_reaction_counts as
select
  ll.id as lyric_line_id,
  ll.song_id,
  ll.line_number,
  ll.text,
  ll.section_label,
  ll.start_time,
  ll.end_time,
  count(*) filter (where lr.reaction_type = 'heart')::integer as heart_count,
  count(*) filter (where lr.reaction_type = 'like')::integer as like_count,
  count(*) filter (where lr.reaction_type = 'dislike')::integer as dislike_count
from public.lyric_lines ll
left join public.lyric_reactions lr on lr.lyric_line_id = ll.id
group by ll.id;

-- RLS
alter table public.profiles enable row level security;
alter table public.songs enable row level security;
alter table public.lyric_lines enable row level security;
alter table public.lyric_reactions enable row level security;
alter table public.song_reviews enable row level security;
alter table public.play_events enable row level security;
alter table public.favorites enable row level security;

-- Profiles policies
drop policy if exists "Profiles are viewable by everyone" on public.profiles;
create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- Songs policies
drop policy if exists "Published songs are public" on public.songs;
create policy "Published songs are public"
  on public.songs for select
  using (status = 'published' or artist_id = auth.uid());

drop policy if exists "Artists can insert songs" on public.songs;
create policy "Artists can insert songs"
  on public.songs for insert
  with check (auth.uid() = artist_id);

drop policy if exists "Artists can update own songs" on public.songs;
create policy "Artists can update own songs"
  on public.songs for update
  using (auth.uid() = artist_id);

drop policy if exists "Artists can delete own songs" on public.songs;
create policy "Artists can delete own songs"
  on public.songs for delete
  using (auth.uid() = artist_id);

-- Lyric lines policies
drop policy if exists "Lyrics of published/own songs readable" on public.lyric_lines;
create policy "Lyrics of published/own songs readable"
  on public.lyric_lines for select
  using (
    public.is_published_song(song_id) or public.is_song_owner(song_id)
  );

drop policy if exists "Owners can insert lyrics" on public.lyric_lines;
create policy "Owners can insert lyrics"
  on public.lyric_lines for insert
  with check (public.is_song_owner(song_id));

drop policy if exists "Owners can update lyrics" on public.lyric_lines;
create policy "Owners can update lyrics"
  on public.lyric_lines for update
  using (public.is_song_owner(song_id));

drop policy if exists "Owners can delete lyrics" on public.lyric_lines;
create policy "Owners can delete lyrics"
  on public.lyric_lines for delete
  using (public.is_song_owner(song_id));

-- Reactions policies
drop policy if exists "Reactions readable for published/own" on public.lyric_reactions;
create policy "Reactions readable for published/own"
  on public.lyric_reactions for select
  using (
    exists (
      select 1 from public.lyric_lines ll
      where ll.id = lyric_line_id
        and (public.is_published_song(ll.song_id) or public.is_song_owner(ll.song_id))
    )
  );

drop policy if exists "Users can insert own reactions" on public.lyric_reactions;
create policy "Users can insert own reactions"
  on public.lyric_reactions for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.lyric_lines ll
      where ll.id = lyric_line_id and public.is_published_song(ll.song_id)
    )
  );

drop policy if exists "Users can update own reactions" on public.lyric_reactions;
create policy "Users can update own reactions"
  on public.lyric_reactions for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own reactions" on public.lyric_reactions;
create policy "Users can delete own reactions"
  on public.lyric_reactions for delete
  using (auth.uid() = user_id);

-- Reviews policies
drop policy if exists "Reviews readable for published/own" on public.song_reviews;
create policy "Reviews readable for published/own"
  on public.song_reviews for select
  using (
    public.is_published_song(song_id) or public.is_song_owner(song_id)
  );

drop policy if exists "Users can insert own reviews" on public.song_reviews;
create policy "Users can insert own reviews"
  on public.song_reviews for insert
  with check (
    auth.uid() = user_id and public.is_published_song(song_id)
  );

drop policy if exists "Users can update own reviews" on public.song_reviews;
create policy "Users can update own reviews"
  on public.song_reviews for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own reviews" on public.song_reviews;
create policy "Users can delete own reviews"
  on public.song_reviews for delete
  using (auth.uid() = user_id);

-- Play events
drop policy if exists "Anyone can insert play events" on public.play_events;
create policy "Anyone can insert play events"
  on public.play_events for insert
  with check (
    public.is_published_song(song_id)
    and (user_id is null or user_id = auth.uid())
  );

drop policy if exists "Owners can read play events" on public.play_events;
create policy "Owners can read play events"
  on public.play_events for select
  using (
    public.is_song_owner(song_id) or user_id = auth.uid()
  );

-- Favorites
drop policy if exists "Favorites readable" on public.favorites;
create policy "Favorites readable"
  on public.favorites for select
  using (true);

drop policy if exists "Users can insert own favorites" on public.favorites;
create policy "Users can insert own favorites"
  on public.favorites for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own favorites" on public.favorites;
create policy "Users can delete own favorites"
  on public.favorites for delete
  using (auth.uid() = user_id);

-- Storage buckets (run in dashboard or via API)
-- insert into storage.buckets (id, name, public) values
--   ('avatars', 'avatars', true),
--   ('song-covers', 'song-covers', true),
--   ('song-audio', 'song-audio', true);
