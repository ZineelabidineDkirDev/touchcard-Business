import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const PLATFORM_SUPER_ADMIN_EMAIL = "zainmawada@gmail.com";
const PRODUCTION_ORIGIN = "https://touchcard-three.vercel.app";
const LEGACY_PRODUCTION_ORIGIN = "https://touchcard-zayn-dk.vercel.app";

function corsHeaders(req: Request) {
  const origin = req.headers.get("Origin") ?? "";
  const configured = Deno.env.get("SITE_URL")?.replace(/\/$/, "");
  const allowed = new Set([PRODUCTION_ORIGIN, LEGACY_PRODUCTION_ORIGIN, configured, "http://localhost:3000", "http://127.0.0.1:3000"].filter(Boolean));
  const safeOrigin = allowed.has(origin) ? origin : PRODUCTION_ORIGIN;
  return {
    "Access-Control-Allow-Origin": safeOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

function json(req: Request, data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders(req), "Content-Type": "application/json" },
  });
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("Origin") ?? "";
  const configured = Deno.env.get("SITE_URL")?.replace(/\/$/, "");
  const allowedOrigins = new Set([PRODUCTION_ORIGIN, configured, "http://localhost:3000", "http://127.0.0.1:3000"].filter(Boolean));
  if (origin && !allowedOrigins.has(origin)) return json(req, { error: "Origine non autorisée." }, 403);
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });
  if (req.method !== "POST") return json(req, { error: "Method not allowed" }, 405);

  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !serviceKey || !anonKey) return json(req, { error: "Server configuration error" }, 500);

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
    const brandName = String(prospect.brand_name ?? "").trim();

    if (!requestId || !fullName || !email || !phone || !city || !sector || !brandName || !["contact", "service", "e-business", "google-review"].includes(cardType)) {
      return json(req, { error: "Les informations obligatoires de la demande sont incomplètes." }, 400);
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json(req, { error: "Adresse e-mail invalide." }, 400);
    if (email === PLATFORM_SUPER_ADMIN_EMAIL) return json(req, { error: "Cette adresse est réservée au compte Super Admin." }, 403);
    if (password.length < 10 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      return json(req, { error: "Le mot de passe doit contenir au moins 10 caractères, avec des lettres et des chiffres." }, 400);
    }
    if (fullName.length > 160 || brandName.length > 160 || email.length > 254 || phone.length > 60 || city.length > 120 || sector.length > 160) {
      return json(req, { error: "Une information dépasse la longueur autorisée." }, 400);
    }

    // Rate limit by a one-way hash of the network address and normalized email.
    const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const clientIp = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-real-ip") ?? forwarded ?? "unknown";
    const ipHash = await sha256(clientIp + ":" + (Deno.env.get("RATE_LIMIT_SALT") ?? url));
    const emailHash = await sha256(email);
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const [{ count: ipCount, error: ipCountError }, { count: emailCount, error: emailCountError }] = await Promise.all([
      admin.from("prospect_request_attempts").select("id", { count: "exact", head: true }).eq("ip_hash", ipHash).gte("created_at", hourAgo),
      admin.from("prospect_request_attempts").select("id", { count: "exact", head: true }).eq("email_hash", emailHash).gte("created_at", dayAgo),
    ]);
    if (ipCountError || emailCountError) {
      console.error("Prospect rate-limit lookup failed", ipCountError ?? emailCountError);
      return json(req, { error: "La vérification de sécurité est temporairement indisponible. Réessayez plus tard." }, 503);
    }
    if ((ipCount ?? 0) >= 8 || (emailCount ?? 0) >= 3) {
      return json(req, { error: "Trop de demandes ont été envoyées. Veuillez patienter avant de réessayer." }, 429);
    }
    const { error: attemptError } = await admin.from("prospect_request_attempts").insert({ ip_hash: ipHash, email_hash: emailHash });
    if (attemptError) {
      console.error("Prospect rate-limit write failed", attemptError);
      return json(req, { error: "La vérification de sécurité est temporairement indisponible. Réessayez plus tard." }, 503);
    }

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
          return json(req, { error: "L'adresse e-mail de la demande doit correspondre au compte connecté." }, 403);
        }
        linkedUserId = user.id;
        const { error: passwordError } = await admin.auth.admin.updateUserById(user.id, { password });
        if (passwordError) return json(req, { error: "Impossible de mettre à jour le mot de passe du compte connecté." }, 400);
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
        return json(req, {
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
      brand_name: brandName.slice(0, 160),
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
      return json(req, { error: "La demande n'a pas pu être enregistrée. Aucun compte client n'a été conservé." }, 400);
    }

    return json(req, { ok: true, user_id: linkedUserId, request_id: requestId });
  } catch (error) {
    console.error("Prospect account creation failed", error);
    return json(req, { error: "Une erreur technique est survenue. Veuillez réessayer." }, 500);
  }
});
