import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

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

  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

  try {
    const body = await req.json();
    const requestId = String(body.request_id ?? "").trim();
    const password = String(body.password ?? "");
    const prospect = body.prospect ?? {};
    const fullName = String(prospect.full_name ?? "").trim();
    const email = String(prospect.email ?? "").trim().toLowerCase();
    const phone = String(prospect.phone ?? "").trim();
    const city = String(prospect.city ?? "").trim();
    const sector = String(prospect.activity_sector ?? "").trim();
    const cardType = String(prospect.card_type ?? "");

    if (!requestId || !fullName || !email || !phone || !city || !sector || !["contact", "service", "e-business"].includes(cardType)) {
      return json({ error: "Les informations obligatoires de la demande sont incomplètes." }, 400);
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "Adresse e-mail invalide." }, 400);
    if (password.length < 8) return json({ error: "Le mot de passe provisoire doit contenir au moins 8 caractères." }, 400);

    let linkedUserId: string | null = null;
    let createdUserId: string | null = null;
    const authorization = req.headers.get("Authorization");
    if (authorization?.startsWith("Bearer ")) {
      const userClient = createClient(url, anonKey, {
        global: { headers: { Authorization: authorization } },
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { data: { user } } = await userClient.auth.getUser();
      if (user) {
        if (user.email?.trim().toLowerCase() !== email) {
          return json({ error: "L'adresse e-mail de la demande doit correspondre au compte connecté." }, 403);
        }
        linkedUserId = user.id;
        const { error: passwordError } = await admin.auth.admin.updateUserById(user.id, { password });
        if (passwordError) return json({ error: "Impossible de mettre à jour le mot de passe du compte connecté." }, 400);
      }
    }

    if (!linkedUserId) {
      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName, prospect_request_id: requestId, account_state: "pending_admin_approval" },
      });
      if (createError || !created.user) {
        const alreadyExists = /already|registered|exists/i.test(createError?.message ?? "");
        return json({
          code: alreadyExists ? "EMAIL_ALREADY_REGISTERED" : "ACCOUNT_CREATION_FAILED",
          error: alreadyExists
            ? "Cette adresse possède déjà un compte TouchCard. Connectez-vous avec ce compte avant de déposer une nouvelle demande."
            : "La création du compte a échoué. Vérifiez les informations et réessayez.",
        }, alreadyExists ? 409 : 400);
      }
      linkedUserId = created.user.id;
      createdUserId = created.user.id;
    }

    const socialLinks = Array.isArray(prospect.social_links)
      ? prospect.social_links.filter((item: any) => item && typeof item.url === "string" && item.url.trim()).slice(0, 20)
        .map((item: any) => ({ platform: String(item.platform ?? "Autre").slice(0, 40), url: String(item.url).trim().slice(0, 500) }))
      : [];
    const projectNeeds = prospect.project_needs && typeof prospect.project_needs === "object"
      ? {
          selected: Array.isArray(prospect.project_needs.selected) ? prospect.project_needs.selected.slice(0, 1).map((v: unknown) => String(v).slice(0, 120)) : [],
          reservation_mode: String(prospect.project_needs.reservation_mode ?? "").slice(0, 80) || null,
          reservation_channels: [],
          management_needs: [],
        }
      : { selected: [], reservation_mode: null, reservation_channels: [], management_needs: [] };

    const { error: insertError } = await admin.from("prospect_requests").insert({
      id: requestId,
      user_id: linkedUserId,
      full_name: fullName.slice(0, 160),
      city: city.slice(0, 120),
      activity_sector: sector.slice(0, 160),
      email,
      phone: phone.slice(0, 60),
      card_type: cardType,
      reason: typeof prospect.reason === "string" ? prospect.reason.slice(0, 2000) : null,
      customization_requested: Boolean(prospect.customization_requested),
      brand_name: typeof prospect.brand_name === "string" ? prospect.brand_name.slice(0, 160) : null,
      logo_url: typeof prospect.logo_url === "string" ? prospect.logo_url.slice(0, 1000) : null,
      business_address: typeof prospect.business_address === "string" ? prospect.business_address.slice(0, 500) : null,
      business_phone: typeof prospect.business_phone === "string" ? prospect.business_phone.slice(0, 60) : null,
      social_links: socialLinks,
      project_needs: projectNeeds,
      status: "new",
      password_initialized: false,
      client_access_enabled: false,
    });

    if (insertError) {
      if (createdUserId) await admin.auth.admin.deleteUser(createdUserId);
      console.error("Prospect request insert failed", insertError);
      return json({ error: "La demande n'a pas pu être enregistrée. Aucun compte client n'a été conservé." }, 400);
    }

    return json({ ok: true, user_id: linkedUserId, request_id: requestId });
  } catch (error) {
    console.error("Prospect account creation failed", error);
    return json({ error: "Une erreur technique est survenue. Veuillez réessayer." }, 500);
  }
});
