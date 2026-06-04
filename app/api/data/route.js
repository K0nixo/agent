// Cloud storage proxy (Supabase). Drží Supabase klíče na serveru, gated heslem.
// Tabulka: app_data (key text primary key, value jsonb, updated_at timestamptz)
import { createClient } from "@supabase/supabase-js";

function supa() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}
function authed(req) {
  const pw = process.env.APP_PASSWORD;
  return !pw || req.headers.get("x-app-password") === pw;
}
function ready() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export async function GET(req) {
  if (!authed(req)) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (!ready()) return Response.json({ error: "Supabase env not set" }, { status: 500 });
  const key = new URL(req.url).searchParams.get("key");
  if (!key) return Response.json({ error: "key required" }, { status: 400 });
  const { data, error } = await supa().from("app_data").select("value").eq("key", key).maybeSingle();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ value: data ? data.value : null });
}

export async function POST(req) {
  if (!authed(req)) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (!ready()) return Response.json({ error: "Supabase env not set" }, { status: 500 });
  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "bad request" }, { status: 400 }); }
  const { key, value } = body;
  if (!key) return Response.json({ error: "key required" }, { status: 400 });
  const { error } = await supa().from("app_data").upsert({ key, value, updated_at: new Date().toISOString() });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
