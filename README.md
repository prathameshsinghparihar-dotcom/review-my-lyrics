# LyricPulse

Listen, react to every lyric line, and review — **no accounts**.

Songs load from **Supabase Storage** (production) with a **local folder fallback** for development.

## Local library (dev)

```
public/library/songs/<slug>/
  song.json      required
  audio.mp3|m4a  required
  cover.jpg|png  optional
```

See `public/library/README.md`.

## Supabase Storage (recommended for Vercel)

1. In Supabase SQL Editor, run:
   - `supabase/migrations/003_library_bucket.sql`
2. Put the same folder layout in the public bucket `library`:

```
library/
  songs/
    midnight-drive/
      song.json
      audio.m4a
      cover.png
```

3. Upload from your machine:

```bash
# Project Settings → API → service_role → add to .env.local
SUPABASE_SERVICE_ROLE_KEY=...

npm run upload:library
```

## Environment

Copy `.env.example` → `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=...   # upload script only
```

## Run locally

```bash
npm install
npm run dev
```

http://localhost:3000

## Deploy on Vercel (free)

1. Push this repo to GitHub
2. Import the project on [vercel.com](https://vercel.com)
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy
5. Run `npm run upload:library` once so Storage has your songs

Large audio should live in Supabase Storage (not only in `public/`) so Vercel deploy size stays small.

## Notes

- Reviews / line reactions are stored in the browser (localStorage) on each device
- When a song exists in both places, **Supabase wins**
