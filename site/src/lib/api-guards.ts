import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey =
  process.env.SUPABASE_ANON_KEY || process.env.PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

let cachedClient: ReturnType<typeof createClient> | null = null;
let cachedRateLimitClient: ReturnType<typeof createClient> | null = null;

function getSupabaseClient() {
  if (cachedClient) return cachedClient;
  if (!supabaseUrl || !supabaseAnonKey) return null;
  cachedClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false }
  });
  return cachedClient;
}

function getRateLimitClient() {
  if (cachedRateLimitClient) return cachedRateLimitClient;
  if (!supabaseUrl || !supabaseServiceKey) return null;
  cachedRateLimitClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
  });
  return cachedRateLimitClient;
}

export function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() || "";
  return (
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    ""
  );
}

export async function getAuthUser(request: Request) {
  const header = request.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return null;
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function checkRateLimitInMemory(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number }
) {
  const now = Date.now();
  const existing = rateLimitStore.get(key);
  if (!existing || now > existing.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfter: 0 };
  }

  existing.count += 1;
  rateLimitStore.set(key, existing);

  if (existing.count <= limit) {
    return { allowed: true, retryAfter: 0 };
  }

  const retryAfter = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
  return { allowed: false, retryAfter };
}

export async function checkRateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number }
) {
  const client = getRateLimitClient();
  if (!client) {
    return checkRateLimitInMemory(key, { limit, windowMs });
  }

  const now = Date.now();

  try {
    const { data, error } = await client
      .from("api_rate_limits")
      .select("count, reset_at")
      .eq("key", key)
      .maybeSingle();

    if (error) {
      return checkRateLimitInMemory(key, { limit, windowMs });
    }

    const resetAt = data?.reset_at ? new Date(data.reset_at).getTime() : 0;
    if (!data || now > resetAt) {
      const nextReset = new Date(now + windowMs).toISOString();
      const { error: upsertError } = await client
        .from("api_rate_limits")
        .upsert({ key, count: 1, reset_at: nextReset }, { onConflict: "key" });
      if (upsertError) {
        return checkRateLimitInMemory(key, { limit, windowMs });
      }
      return { allowed: true, retryAfter: 0 };
    }

    const nextCount = (data?.count || 0) + 1;
    const { error: updateError } = await client
      .from("api_rate_limits")
      .update({ count: nextCount })
      .eq("key", key);
    if (updateError) {
      return checkRateLimitInMemory(key, { limit, windowMs });
    }

    if (nextCount <= limit) {
      return { allowed: true, retryAfter: 0 };
    }

    const retryAfter = Math.max(1, Math.ceil((resetAt - now) / 1000));
    return { allowed: false, retryAfter };
  } catch (error) {
    return checkRateLimitInMemory(key, { limit, windowMs });
  }
}
