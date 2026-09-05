-- Public library bucket for song media (audio, covers, song.json)
-- Run in Supabase SQL Editor

insert into storage.buckets (id, name, public)
values ('library', 'library', true)
on conflict (id) do update set public = true;

-- Public read for all library objects
drop policy if exists "Library files are publicly readable" on storage.objects;
create policy "Library files are publicly readable"
  on storage.objects for select
  using (bucket_id = 'library');

-- Optional: allow authenticated uploads (for dashboard/scripts using user JWT)
-- Prefer uploading with the service role key from a local script.

drop policy if exists "Authenticated users can upload library files" on storage.objects;
create policy "Authenticated users can upload library files"
  on storage.objects for insert
  with check (
    bucket_id = 'library'
    and auth.role() = 'authenticated'
  );

drop policy if exists "Authenticated users can update library files" on storage.objects;
create policy "Authenticated users can update library files"
  on storage.objects for update
  using (
    bucket_id = 'library'
    and auth.role() = 'authenticated'
  );

drop policy if exists "Authenticated users can delete library files" on storage.objects;
create policy "Authenticated users can delete library files"
  on storage.objects for delete
  using (
    bucket_id = 'library'
    and auth.role() = 'authenticated'
  );
