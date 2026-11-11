import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://touchcard-three.vercel.app",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authorization = req.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return json({ error: "Authentication required" }, 401);

  const token = authorization.slice("Bearer ".length);
  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !serviceKey || !anonKey) return json({ error: "Server configuration error" }, 500);

  const userClient = createClient(url, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: { user }, error: authError } = await userClient.auth.getUser(token);
  if (authError || !user) return json({ error: "Invalid session" }, 401);

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: prospect, error: lookupError } = await admin
    .from("prospect_requests")
    .select("id,status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (lookupError || !prospect) return json({ error: "Client request not found" }, 404);

  const { error: updateError } = await admin
    .from("prospect_requests")
    .update({ password_initialized: true, client_access_enabled: ["in_production", "completed"].includes(prospect.status), updated_at: new Date().toISOString() })
    .eq("id", prospect.id)
    .eq("user_id", user.id);

  if (updateError) return json({ error: "Unable to confirm password setup" }, 500);
  return json({ ok: true });
});
