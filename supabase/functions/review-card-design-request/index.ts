import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const ADMIN_EMAIL = "zainmawada@gmail.com";
const corsHeaders = {
  "Access-Control-Allow-Origin": "https://touchcard-three.vercel.app",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
const templateStyles: Record<string, { type: string; accent: string; layout: string }> = {
  midnight: { type: "contact", accent: "#a78bfa", layout: "midnight" },
  minimal: { type: "contact", accent: "#334155", layout: "minimal" },
  studio: { type: "contact", accent: "#d8b4fe", layout: "studio" },
  "service-pro": { type: "service", accent: "#38bdf8", layout: "service-pro" },
  atelier: { type: "service", accent: "#d6a56c", layout: "atelier" },
  business: { type: "e-business", accent: "#34d399", layout: "business" },
  market: { type: "e-business", accent: "#a5b4fc", layout: "market" },
  "google-review-pro": { type: "google-review", accent: "#34d399", layout: "review-pro" },
  "google-review-minimal": { type: "google-review", accent: "#16a34a", layout: "review-minimal" },
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const authorization = req.headers.get("Authorization");
    if (!authorization?.startsWith("Bearer ")) return json({ error: "Authentication required" }, 401);
    const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) return json({ error: "Invalid session" }, 401);
    if (user.email?.trim().toLowerCase() !== ADMIN_EMAIL) return json({ error: "Administrator access required" }, 403);

    const body = await req.json();
    const requestId = String(body.request_id ?? "").trim();
    const status = String(body.status ?? "");
    if (!requestId || !["approved", "revision_requested", "rejected"].includes(status)) {
      return json({ error: "Invalid design review request" }, 400);
    }

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: request, error: requestError } = await admin.from("card_design_requests")
      .select("id,organization_id,template_id,card_type,status")
      .eq("id", requestId).maybeSingle();
    if (requestError || !request) return json({ error: "Design request not found" }, 404);
    if (request.status === status) return json({ ok: true, status, unchanged: true });
    if (request.status !== "pending") return json({ error: "This design request has already been reviewed" }, 409);

    if (status === "approved") {
      const style = templateStyles[request.template_id];
      if (!style || style.type !== request.card_type) return json({ error: "The selected design does not match the card type" }, 400);
      const { data: card, error: cardError } = await admin.from("cards")
        .select("id,theme").eq("organization_id", request.organization_id)
        .order("created_at", { ascending: true }).limit(1).maybeSingle();
      if (cardError || !card) return json({ error: "No client card is available for this design yet" }, 409);
      const currentTheme = card.theme && typeof card.theme === "object" ? card.theme : {};
      const { error: cardUpdateError } = await admin.from("cards").update({
        theme: { ...currentTheme, template: request.card_type, design_id: request.template_id, accent: style.accent, layout: style.layout, schema_version: 1 },
        updated_at: new Date().toISOString(),
      }).eq("id", card.id);
      if (cardUpdateError) return json({ error: "The card design could not be applied" }, 500);
    }

    const { error: updateError } = await admin.from("card_design_requests").update({
      status,
      updated_at: new Date().toISOString(),
    }).eq("id", requestId).eq("status", "pending");
    if (updateError) return json({ error: "The design review status could not be saved" }, 500);
    return json({ ok: true, status, applied: status === "approved" });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unexpected error" }, 400);
  }
});
