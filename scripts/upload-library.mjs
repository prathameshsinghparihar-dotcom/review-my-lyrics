/**
 * Upload local public/library/songs/* to Supabase Storage bucket "library".
 *
 * Usage:
 *   set SUPABASE_SERVICE_ROLE_KEY=...   (Project Settings → API → service_role)
 *   npm run upload:library
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL in .env.local
 */
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const text = fs.readFileSync(filePath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(path.join(process.cwd(), ".env.local"));
loadEnvFile(path.join(process.cwd(), ".env"));

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (preferred) or anon key."
  );
  process.exit(1);
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn(
    "Warning: using anon/publishable key. Upload may fail unless Storage policies allow it. Prefer SUPABASE_SERVICE_ROLE_KEY."
  );
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const BUCKET = "library";
const ROOT = path.join(process.cwd(), "public", "library", "songs");
const SKIP = new Set([
  "ADD_YOUR_FILES.txt",
  "song_lyrics.txt",
  ".DS_Store",
]);

function contentType(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  const map = {
    ".json": "application/json",
    ".mp3": "audio/mpeg",
    ".m4a": "audio/mp4",
    ".wav": "audio/wav",
    ".ogg": "audio/ogg",
    ".webm": "audio/webm",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
  };
  return map[ext] || "application/octet-stream";
}

async function ensureBucket() {
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some((b) => b.id === BUCKET || b.name === BUCKET);
  if (exists) return;
  const { error } = await supabase.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: "100MB",
  });
  if (error && !error.message.toLowerCase().includes("already")) {
    console.warn("Could not create bucket automatically:", error.message);
    console.warn("Create a public bucket named 'library' in the Supabase dashboard, or run 003_library_bucket.sql");
  } else {
    console.log("Created public bucket:", BUCKET);
  }
}

async function uploadSongFolder(slug) {
  const dir = path.join(ROOT, slug);
  const files = fs
    .readdirSync(dir)
    .filter((f) => fs.statSync(path.join(dir, f)).isFile())
    .filter((f) => !SKIP.has(f))
    // Prefer clean names; still upload oddly named media if no audio.* exists
    .filter((f) => !f.startsWith("(") || true);

  const preferred = files.filter(
    (f) =>
      /^(song\.json|audio\.|cover\.|song\.|track\.|artwork\.|art\.|image\.)/i.test(f) ||
      f === "song.json"
  );
  const toUpload = preferred.length
    ? preferred
    : files.filter((f) => /\.(json|mp3|m4a|wav|ogg|webm|jpg|jpeg|png|webp)$/i.test(f));

  // Always include song.json + standard audio/cover if present
  const must = ["song.json", "audio.m4a", "audio.mp3", "cover.png", "cover.jpg"];
  const set = new Set([...toUpload, ...must.filter((m) => files.includes(m))]);

  for (const file of set) {
    if (!files.includes(file)) continue;
    if (SKIP.has(file)) continue;
    const full = path.join(dir, file);
    const storagePath = `songs/${slug}/${file}`;
    const body = fs.readFileSync(full);
    const { error } = await supabase.storage.from(BUCKET).upload(storagePath, body, {
      upsert: true,
      contentType: contentType(file),
    });
    if (error) {
      console.error(`  ✗ ${storagePath}: ${error.message}`);
    } else {
      console.log(`  ✓ ${storagePath}`);
    }
  }
}

async function main() {
  if (!fs.existsSync(ROOT)) {
    console.error("No local library at", ROOT);
    process.exit(1);
  }

  await ensureBucket();

  const folders = fs
    .readdirSync(ROOT, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  console.log(`Uploading ${folders.length} song folder(s) to ${BUCKET}/songs/ …`);

  for (const slug of folders) {
    console.log(`\n${slug}`);
    await uploadSongFolder(slug);
  }

  console.log("\nDone. Refresh the site — Supabase songs take priority over local copies.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
