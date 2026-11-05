import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const PLATFORM_SUPER_ADMIN_EMAIL = "zainmawada@gmail.com";
const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("SITE_URL") ?? "https://touchcard-zayn-dk.vercel.app",
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

  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !serviceKey || !anonKey) return json({ error: "Server configuration error" }, 500);

  const authorization = req.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return json({ error: "Authentication required" }, 401);

  const userClient = createClient(url, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user || user.email?.trim().toLowerCase() !== PLATFORM_SUPER_ADMIN_EMAIL) {
    return json({ error: "Administrator access required" }, 403);
  }

  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  try {
    const body = await req.json();
    const requestId = String(body.request_id ?? "").trim();
    if (!requestId) return json({ error: "Missing prospect request ID" }, 400);

    const { data: prospect, error: lookupError } = await admin
      .from("prospect_requests")
      .select("id,user_id,status")
      .eq("id", requestId)
      .maybeSingle();

    if (lookupError || !prospect?.user_id) return json({ error: "Compte client introuvable pour cette demande." }, 404);
    if (["rejected", "cancelled"].includes(prospect.status)) return json({ error: "Cette demande est refusée ou annulée." }, 409);

    const random = new Uint8Array(18);
    crypto.getRandomValues(random);
    const temporaryPassword = "TC-" + Array.from(random, (value) => value.toString(16).padStart(2, "0")).join("") + "a!";
    const { error: passwordError } = await admin.auth.admin.updateUserById(prospect.user_id, { password: temporaryPassword });
    if (passwordError) return json({ error: "La réinitialisation du mot de passe a échoué." }, 400);

    const { error: updateError } = await admin.from("prospect_requests")
      .update({ password_initialized: false, client_access_enabled: false, updated_at: new Date().toISOString() })
      .eq("id", prospect.id)
      .eq("user_id", prospect.user_id);

    if (updateError) return json({ error: "Le mot de passe a été changé, mais le verrouillage de sécurité n'a pas été mis à jour. Contactez le support technique." }, 500);

    return json({ ok: true, temporary_password: temporaryPassword });
  } catch (error) {
    console.error("Manual client password reset failed", error);
    return json({ error: "Une erreur technique est survenue." }, 500);
  }
});
