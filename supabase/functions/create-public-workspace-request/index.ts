import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://touchcard-three.vercel.app",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
function validEmail(value: string) {
  return !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const rawBody = await req.text();
    if (rawBody.length > 12000) return json({ error: "La demande est trop volumineuse." }, 413);
    const body = JSON.parse(rawBody);
    const requestType = String(body.request_type ?? "");
    if (!["order", "booking", "quote"].includes(requestType)) return json({ error: "Type de demande invalide." }, 400);

    const customerName = String(body.customer_name ?? "").trim().slice(0, 160);
    const customerPhone = String(body.customer_phone ?? "").trim().slice(0, 40);
    const customerEmail = String(body.customer_email ?? "").trim().toLowerCase().slice(0, 254);
    const message = String(body.message ?? "").trim().slice(0, 2000);
    const cardSlug = String(body.card_slug ?? "").trim().slice(0, 80);
    if (customerName.length < 2 || customerPhone.length < 6 || !validEmail(customerEmail) || !cardSlug) {
      return json({ error: "Veuillez renseigner votre nom, un téléphone valide et une adresse e-mail correcte." }, 400);
    }
    if (requestType === "quote" && message.length < 8) return json({ error: "Décrivez brièvement votre besoin pour demander un devis." }, 400);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

    const forwardedFor = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
    const clientIp = forwardedFor || req.headers.get("x-real-ip") || "unknown";
    const ipHash = await sha256(clientIp + ":" + (Deno.env.get("SUPABASE_ANON_KEY") ?? ""));
    const { data: allowed, error: rateError } = await admin.rpc("consume_workspace_request_rate_limit", {
      p_ip_hash: ipHash, p_limit: 12, p_window_seconds: 3600,
    });
    if (rateError || allowed !== true) return json({ error: "Trop de demandes ont été envoyées depuis cette connexion. Réessayez plus tard." }, 429);

    const { data: card, error: cardError } = await admin.from("cards")
      .select("id,organization_id,slug,is_published")
      .eq("slug", cardSlug).eq("is_published", true).maybeSingle();
    if (cardError || !card) return json({ error: "Cette carte n'est pas disponible." }, 404);

    const { data: organization, error: organizationError } = await admin.from("organizations")
      .select("workspace_config").eq("id", card.organization_id).maybeSingle();
    if (organizationError || !organization) return json({ error: "Espace client introuvable." }, 404);
    const config = (organization.workspace_config ?? {}) as { version?: number; modules?: string[] };
    const modules = Array.isArray(config.modules) ? config.modules : [];
    const requiredModule = requestType === "order" ? "orders" : requestType === "booking" ? "bookings" : "quote_requests";
    if (config.version && !modules.includes(requiredModule)) return json({ error: "Cette fonctionnalité n'est pas activée pour cette carte." }, 403);

    let requestedAt: string | null = null;
    if (requestType === "booking") {
      const date = new Date(String(body.requested_at ?? ""));
      if (!Number.isFinite(date.getTime()) || date.getTime() <= Date.now() || date.getTime() > Date.now() + 365 * 24 * 60 * 60 * 1000) {
        return json({ error: "Choisissez une date de rendez-vous future valide." }, 400);
      }
      requestedAt = date.toISOString();
    }

    const requestedItems = Array.isArray(body.items) ? body.items.slice(0, 20) : [];
    let snapshots: { product_id: string; name: string; quantity: number; unit_price: number; line_total: number }[] = [];
    let total = 0;
    if (requestType === "order" || (requestType === "booking" && requestedItems.length > 0)) {
      if (!requestedItems.length) return json({ error: "Ajoutez au moins un élément." }, 400);
      const quantities = new Map<string, number>();
      for (const item of requestedItems) {
        const id = String(item.product_id ?? "");
        const quantity = Number(item.quantity);
        if (!id || !Number.isInteger(quantity) || quantity < 1 || quantity > 20) return json({ error: "Quantité ou article invalide." }, 400);
        quantities.set(id, Math.min(20, (quantities.get(id) ?? 0) + quantity));
      }
      const { data: products, error: productsError } = await admin.from("products")
        .select("id,name,price,currency").eq("organization_id", card.organization_id).eq("is_active", true).in("id", [...quantities.keys()]);
      if (productsError || !products || products.length !== quantities.size) return json({ error: "Un article sélectionné n'est plus disponible." }, 409);
      snapshots = products.map((product) => {
        const quantity = quantities.get(product.id) ?? 1;
        const unitPrice = Number(product.price);
        const lineTotal = Math.round(unitPrice * quantity * 100) / 100;
        total += lineTotal;
        return { product_id: product.id, name: product.name, quantity, unit_price: unitPrice, line_total: lineTotal };
      });
      total = Math.round(total * 100) / 100;
    }

    const { data: request, error: insertError } = await admin.from("workspace_requests").insert({
      organization_id: card.organization_id,
      card_id: card.id,
      request_type: requestType,
      customer_name: customerName,
      customer_email: customerEmail || null,
      customer_phone: customerPhone,
      message,
      requested_at: requestedAt,
      items: snapshots,
      total,
      currency: "MAD",
      status: "pending",
      source: "public_card",
    }).select("id,created_at").single();
    if (insertError || !request) return json({ error: "La demande n'a pas pu être enregistrée. Réessayez." }, 500);
    return json({ ok: true, request_id: request.id, created_at: request.created_at, total, currency: "MAD" });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unexpected error" }, 400);
  }
});
