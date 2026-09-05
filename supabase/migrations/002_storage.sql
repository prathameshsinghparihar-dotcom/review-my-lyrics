-- Storage buckets + policies for LyricPulse
insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', true),
  ('song-covers', 'song-covers', true),
  ('song-audio', 'song-audio', true)
on conflict (id) do nothing;

-- Avatars: public read, owner write
drop policy if exists "Avatar images are publicly accessible" on storage.objects;
create policy "Avatar images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "Users can upload own avatar" on storage.objects;
create policy "Users can upload own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users can update own avatar" on storage.objects;
create policy "Users can update own avatar"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Covers
drop policy if exists "Covers are publicly accessible" on storage.objects;
create policy "Covers are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'song-covers');

drop policy if exists "Users can upload covers" on storage.objects;
create policy "Users can upload covers"
  on storage.objects for insert
  with check (
    bucket_id = 'song-covers'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users can update covers" on storage.objects;
create policy "Users can update covers"
  on storage.objects for update
  using (
    bucket_id = 'song-covers'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Audio
drop policy if exists "Audio is publicly accessible" on storage.objects;
create policy "Audio is publicly accessible"
  on storage.objects for select
  using (bucket_id = 'song-audio');

drop policy if exists "Users can upload audio" on storage.objects;
create policy "Users can upload audio"
  on storage.objects for insert
  with check (
    bucket_id = 'song-audio'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users can update audio" on storage.objects;
create policy "Users can update audio"
  on storage.objects for update
  using (
    bucket_id = 'song-audio'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
