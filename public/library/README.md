# Song library

Songs can live here for local development, and/or in **Supabase Storage**
bucket `library` (see project README — `npm run upload:library`).

## Folder layout

```
public/library/songs/
  my-song-name/
    song.json      (required)
    audio.mp3      (required — also .wav .m4a .ogg)
    cover.jpg      (optional — also .png .webp .jpeg)
```

Only folders that contain **both** `song.json` and an audio file are shown.

## song.json example

```json
{
  "title": "Midnight Drive",
  "artist": "Alex Carter",
  "genre": "Indie",
  "description": "Optional short description",
  "lyrics": [
    { "section": "VERSE 1", "text": "I drove through the city lights", "start": 0, "end": 4.2 },
    { "text": "Trying to find my way back home", "start": 4.2, "end": 8.4 }
  ]
}
```
