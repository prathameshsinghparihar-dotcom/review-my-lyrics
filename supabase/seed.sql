-- LyricPulse fictional seed data
-- Run AFTER 001_initial_schema.sql
-- Creates 5 artists, 10 songs, lyrics, reviews, and reactions.
-- Demo password for all seeded auth users: Password123!

create extension if not exists "pgcrypto";

do $$
declare
  pwd text := crypt('Password123!', gen_salt('bf'));
  ids uuid[] := array[
    '11111111-1111-1111-1111-111111111111'::uuid,
    '22222222-2222-2222-2222-222222222222'::uuid,
    '33333333-3333-3333-3333-333333333333'::uuid,
    '44444444-4444-4444-4444-444444444444'::uuid,
    '55555555-5555-5555-5555-555555555555'::uuid
  ];
  emails text[] := array[
    'alex@lyricpulse.demo',
    'maya@lyricpulse.demo',
    'jordan@lyricpulse.demo',
    'sam@lyricpulse.demo',
    'riley@lyricpulse.demo'
  ];
  usernames text[] := array['alexcarter','mayavale','jordanlee','samokoro','rileyquinn'];
  names text[] := array['Alex Carter','Maya Vale','Jordan Lee','Sam Okoro','Riley Quinn'];
  i int;
  song_ids uuid[] := array[
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1'::uuid,
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2'::uuid,
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3'::uuid,
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4'::uuid,
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5'::uuid,
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa6'::uuid,
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa7'::uuid,
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa8'::uuid,
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa9'::uuid,
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa10'::uuid
  ];
  titles text[] := array[
    'Midnight Drive','Neon Letters','Glass Harbor','Soft Static','Paper Moons',
    'Quiet Fire','Blue Corridor','Echo Atlas','Silver Thread','Afterlight'
  ];
  genres text[] := array[
    'Indie','Pop','R&B','Electronic','Acoustic',
    'Rock','Hip-Hop','Indie','Pop','Other'
  ];
  artist_for int[] := array[1,1,2,2,3,3,4,4,5,5];
  sid uuid;
  lid uuid;
  line_texts text[];
  ln int;
  uid uuid;
  rtypes text[] := array['heart','like','dislike'];
begin
  for i in 1..5 loop
    insert into auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at
    ) values (
      ids[i],
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      emails[i],
      pwd,
      now(),
      '{"provider":"email","providers":["email"]}',
      json_build_object('username', usernames[i], 'display_name', names[i])::jsonb,
      now(),
      now()
    ) on conflict (id) do nothing;

    insert into public.profiles (id, username, display_name, bio, avatar_url)
    values (
      ids[i],
      usernames[i],
      names[i],
      'Fictional songwriter on LyricPulse.',
      'https://picsum.photos/seed/' || usernames[i] || '/200'
    ) on conflict (id) do update
      set display_name = excluded.display_name,
          bio = excluded.bio,
          avatar_url = excluded.avatar_url;
  end loop;

  for i in 1..10 loop
    sid := song_ids[i];
    insert into public.songs (
      id, artist_id, title, slug, description, genre, cover_url, audio_url,
      status, published_at, created_at, updated_at
    ) values (
      sid,
      ids[artist_for[i]],
      titles[i],
      lower(replace(titles[i], ' ', '-')),
      'A fictional demo track for LyricPulse line-by-line feedback.',
      genres[i],
      'https://picsum.photos/seed/' || lower(replace(titles[i], ' ', '')) || '/600',
      'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-' || ((i - 1) % 8 + 1)::text || '.mp3',
      'published',
      now() - (i || ' days')::interval,
      now() - (i || ' days')::interval,
      now()
    ) on conflict (id) do update
      set title = excluded.title,
          cover_url = excluded.cover_url,
          audio_url = excluded.audio_url,
          status = 'published';

    delete from public.lyric_lines where song_id = sid;

    if i = 1 then
      line_texts := array[
        'I drove through the city lights',
        'Trying to find my way back home',
        'Every road remembers your name',
        'The dashboard glows like open flame',
        'Take me where the stars don''t fade',
        'Take me where we can begin again',
        'Radio hums a borrowed tune',
        'Windows down beneath the moon',
        'Your laughter lives in every lane',
        'I chase the quiet through the rain',
        'Maps unfold but never stay',
        'Still I follow yesterday',
        'Hold the wheel and let it bend',
        'This midnight drive might never end',
        'Sing the chorus soft and slow',
        'Tell the night what we both know',
        'City veins of gold and gray',
        'Carry all we couldn''t say'
      ];
    else
      line_texts := array[
        'Counting echoes in the dark',
        'Folding silence into sparks',
        'Write your name across the sky',
        'Teach the quiet how to fly',
        'Broken compass, steady heart',
        'We were unfinished works of art',
        'Harbor lights and borrowed time',
        'Keep the rhythm, keep the rhyme',
        'Paper moons and velvet rain',
        'Something soft beneath the pain',
        'Hold the chorus, let it breathe',
        'Promise less than we believe',
        'Static kisses on the wire',
        'Turning longing into fire',
        'If the morning finds us gone',
        'Leave the melody turned on',
        'Every lyric learns your face',
        'Every silence fills the space',
        'Stay until the outro fades',
        'Stay for all the words we made'
      ];
    end if;

    for ln in 1..array_length(line_texts, 1) loop
      insert into public.lyric_lines (
        song_id, line_number, text, section_label, start_time, end_time
      ) values (
        sid,
        ln,
        line_texts[ln],
        case
          when ln = 1 then 'VERSE 1'
          when ln = 5 then 'CHORUS'
          when ln = 9 then 'VERSE 2'
          when ln = 13 then 'BRIDGE'
          else null
        end,
        case when i <= 3 then (ln * 4.2)::numeric else null end,
        case when i <= 3 then ((ln + 1) * 4.2)::numeric else null end
      );
    end loop;
  end loop;

  -- Reviews
  insert into public.song_reviews (song_id, user_id, rating, comment)
  values
    (song_ids[1], ids[2], 5, 'The chorus is incredibly catchy. The second verse could be stronger.'),
    (song_ids[1], ids[3], 4, 'Loved the line about every road remembering a name.'),
    (song_ids[1], ids[4], 5, 'Perfect late-night drive song.'),
    (song_ids[2], ids[1], 4, 'Neon imagery works so well with the melody.'),
    (song_ids[3], ids[5], 5, 'Harbor metaphor lands hard.'),
    (song_ids[4], ids[1], 3, 'Interesting concept, some lines feel unfinished.'),
    (song_ids[5], ids[2], 4, 'Soft and intimate.'),
    (song_ids[6], ids[3], 5, 'Quiet Fire is aptly named.'),
    (song_ids[7], ids[4], 4, 'Great groove.'),
    (song_ids[8], ids[5], 5, 'Atlas imagery is clever.'),
    (song_ids[9], ids[1], 4, 'Silver Thread sticks with you.'),
    (song_ids[10], ids[2], 5, 'Beautiful closing track.')
  on conflict (song_id, user_id) do nothing;

  -- Reactions on Midnight Drive and a few others
  for sid in select unnest(song_ids[1:4]) loop
    for lid in select id from public.lyric_lines where song_id = sid loop
      for i in 1..5 loop
        uid := ids[i];
        insert into public.lyric_reactions (lyric_line_id, user_id, reaction_type)
        values (
          lid,
          uid,
          rtypes[1 + ((i + abs(hashtext(lid::text))) % 3)]
        )
        on conflict (user_id, lyric_line_id) do nothing;
      end loop;
    end loop;
  end loop;

  -- Play events
  insert into public.play_events (song_id, user_id, played_at)
  select song_ids[1 + (g % 10)], ids[1 + (g % 5)], now() - (g || ' hours')::interval
  from generate_series(1, 80) g;
end $$;
