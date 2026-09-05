export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  if (!url || !key) return false;
  if (url.includes("placeholder") || url.includes("your-project")) return false;
  if (key.includes("placeholder") || key.includes("your-anon-key")) return false;
  return true;
}

export function getAuthErrorMessage(err: unknown): string {
  const message =
    err instanceof Error
      ? err.message
      : typeof err === "object" && err && "message" in err
        ? String((err as { message: unknown }).message)
        : "Something went wrong. Please try again.";

  const lower = message.toLowerCase();
  if (
    lower.includes("failed to fetch") ||
    lower.includes("networkerror") ||
    lower.includes("network error") ||
    lower.includes("fetch failed") ||
    lower.includes("load failed")
  ) {
    return "Can't reach Supabase. Add your real project URL and anon key to .env.local, then restart the server.";
  }

  if (
    lower.includes("invalid login") ||
    lower.includes("invalid credentials") ||
    lower.includes("email not confirmed")
  ) {
    return "Invalid login credentials. If you just signed up, confirm your email — or disable Confirm email in Supabase Auth settings for local testing.";
  }

  return message;
}
