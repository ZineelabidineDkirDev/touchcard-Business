import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const PLATFORM_SUPER_ADMIN_EMAIL = "zainmawada@gmail.com";
const allowedModules = new Set([
  "dashboard", "digital_card", "contact_profile", "social_links", "qr_nfc", "google_reviews",
  "company_profile", "service_catalog", "product_catalog", "orders",
  "quote_requests", "bookings", "availability_calendar", "team",
  "gallery", "room_catalog", "crm_contacts", "analytics", "whatsapp",
  "edit_business_details", "manage_services_prices", "manage_bookings",
  "manage_content", "view_analytics", "manage_team",
]);
const allowedButtonKinds = new Set(["whatsapp", "telegram", "instagram", "facebook", "linkedin", "website", "store"]);
const allowedFieldTypes = new Set(["text", "textarea", "url", "phone", "email"]);
const corsHeaders = {
  "Access-Control-Allow-Origin": "https://touchcard-three.vercel.app",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
function normalizeText(value: unknown) { return String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(); }
function isBeautySector(sector: unknown, needs: unknown) {
  const selected = Array.isArray((needs as any)?.selected) ? (needs as any).selected.join(" ") : "";
  return /beaute|cosmetique?s?|cosmetics?|esthetique|spa|hammam|salon de coiffure|coiffure|onglerie|maquillage|institut de beaute|massage/.test(normalizeText(String(sector ?? "") + " " + selected));
}
function safeHttpUrl(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const url = new URL(value.trim());
    return ["https:", "http:"].includes(url.protocol) ? url.toString() : null;
  } catch { return null; }
}
function safeProfileDraft(raw: any) {
  if (!raw || typeof raw !== "object") return null;
  const cardFields = Array.isArray(raw.card_fields) ? raw.card_fields.slice(0, 20).map((field: any, index: number) => ({
    key: String(field.key ?? "custom_" + index).toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 48),
    label: String(field.label ?? "").trim().slice(0, 80),
    type: allowedFieldTypes.has(field.type) ? field.type : "text",
    visible: field.visible !== false,
  })).filter((field: any) => field.key && field.label) : [];
  const suggestedButtons = Array.isArray(raw.suggested_buttons) ? raw.suggested_buttons.slice(0, 8).map((button: any) => ({
    kind: allowedButtonKinds.has(button.kind) ? button.kind : "website",
    label: String(button.label ?? "").trim().slice(0, 60),
    enabled: Boolean(button.enabled),
  })).filter((button: any) => button.label) : [];
  const catalogItems = Array.isArray(raw.catalog_items) ? raw.catalog_items.slice(0, 12).map((item: any) => ({
    name: String(item.name ?? "").slice(0, 100),
    description: String(item.description ?? "").slice(0, 240),
    price: String(item.price ?? "").slice(0, 40),
  })) : [];
  return {
    tagline: String(raw.tagline ?? "").slice(0, 180),
    description: String(raw.description ?? "").slice(0, 1200),
    categories: Array.isArray(raw.categories) ? raw.categories.slice(0, 12).map((value: unknown) => String(value).slice(0, 80)) : [],
    catalog_items: catalogItems,
    card_fields: cardFields,
    suggested_buttons: suggestedButtons,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  let organizationId: string | null = null;
  let createdCardId: string | null = null;
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    const authorization = req.headers.get("Authorization");
    if (!authorization?.startsWith("Bearer ")) return json({ error: "Authentication required" }, 401);
    const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) return json({ error: "Invalid session" }, 401);
    if (user.email?.trim().toLowerCase() !== PLATFORM_SUPER_ADMIN_EMAIL) return json({ error: "Administrator access required" }, 403);

    const body = await req.json();
    const requestId = String(body.request_id ?? "");
    if (!requestId) return json({ error: "Missing prospect request ID" }, 400);
    const submitted = body.workspace_config ?? {};
    const cardType = String(submitted.template ?? "");
    if (!["e-business", "contact", "service", "google-review"].includes(cardType)) return json({ error: "Invalid card template" }, 400);
    let selectedModules = Array.isArray(submitted.modules) ? [...new Set(submitted.modules.map((value: unknown) => String(value)))] : [];
    if (selectedModules.some((module) => !allowedModules.has(module))) return json({ error: "Unknown workspace module" }, 400);
    if (!selectedModules.includes("dashboard")) selectedModules.unshift("dashboard");
    if (!selectedModules.includes("digital_card")) return json({ error: "The public digital card module is required" }, 400);
    if (cardType === "contact") {
      const contactModules = new Set(["dashboard", "digital_card", "contact_profile", "social_links", "qr_nfc", "gallery", "analytics"]);
      selectedModules = [...new Set([...selectedModules.filter((module) => contactModules.has(module)), "dashboard", "digital_card", "contact_profile", "social_links", "qr_nfc", "gallery", "analytics"])];
    }

    const { data: prospect, error: prospectError } = await admin.from("prospect_requests")
      .select("id,user_id,full_name,email,phone,city,status,brand_name,logo_url,business_address,business_phone,social_links,card_type,activity_sector,project_needs,client_access_enabled,password_initialized")
      .eq("id", requestId).maybeSingle();
    if (prospectError || !prospect) return json({ error: "Prospect not found" }, 404);
    if (!["approved", "in_production", "completed"].includes(prospect.status)) return json({ error: "Validez la demande avant de configurer l’espace client." }, 409);
    if (!prospect.user_id) return json({ error: "The customer account must be created when the prospect submits the request" }, 409);
    if (prospect.card_type !== cardType) return json({ error: "The selected template must match the prospect's original card choice" }, 400);

    // Les règles Beauté/Cosmétique s’appliquent à E-Service et E-Business, jamais à E-Contact.
    const beautyWorkspace = ["service", "e-business"].includes(cardType) && isBeautySector(prospect.activity_sector, prospect.project_needs);
    const requiredBeautyModules = beautyWorkspace ? ["service_catalog", "bookings", "availability_calendar", "whatsapp"] : [];
    selectedModules = [...new Set([...selectedModules, ...requiredBeautyModules])];

    const profileDraft = safeProfileDraft(submitted.ai_suggestions?.profile_draft);
    const aiSuggestions = profileDraft ? {
      template: cardType,
      modules: selectedModules,
      profile_draft: profileDraft,
      rationale: String(submitted.ai_suggestions?.rationale ?? "").slice(0, 600),
      generated_by: String(submitted.ai_suggestions?.generated_by ?? "manual-super-admin").slice(0, 80),
      reviewed_by_super_admin: true,
    } : null;

    const siteUrl = "https://touchcard-three.vercel.app";
    const customerUserId = prospect.user_id;
    const { data: existingWorkspace } = await admin.from("organizations")
      .select("id").eq("owner_id", customerUserId).maybeSingle();
    if (existingWorkspace) {
      return json({ error: "Ce compte possède déjà un espace client. Ouvrez sa configuration existante au lieu de créer un doublon." }, 409);
    }

    const organizationName = String(prospect.brand_name || prospect.full_name).trim();
    const slugBase = organizationName.normalize("NFD").toLowerCase()
      .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 36) || "client";
    const uniqueSuffix = crypto.randomUUID().slice(0, 8);
    const organizationSlug = `${slugBase}-${uniqueSuffix}`;
    const workspaceConfig = {
      version: 1,
      template: cardType,
      modules: selectedModules,
      plan: { code: String(submitted.plan_code ?? "to_define"), status: "pending" },
      ai_suggestions: aiSuggestions,
      generator: { engine: "touchcard-template-engine", schema_version: 1, state: "draft" },
      original_client_choices: {
        card_type: prospect.card_type,
        activity_sector: prospect.activity_sector,
        project_needs: prospect.project_needs,
        city: prospect.city,
      },
      approved_by: user.id,
      approved_at: new Date().toISOString(),
    };

    const logoUrl = safeHttpUrl(prospect.logo_url);
    const { data: organization, error: organizationError } = await admin.from("organizations").insert({
      name: organizationName,
      slug: organizationSlug,
      owner_id: customerUserId,
      phone: prospect.business_phone || prospect.phone,
      logo_url: logoUrl,
      workspace_config: workspaceConfig,
    }).select("id").single();
    if (organizationError || !organization) {
      console.error("Prospect workspace organization insert failed", { code: organizationError?.code, message: organizationError?.message, details: organizationError?.details, hint: organizationError?.hint });
      throw new Error(organizationError?.message || "The customer workspace could not be created.");
    }
    organizationId = organization.id;

    // The database trigger on organizations automatically creates the owner membership.
    // Do not insert it again here: the (organization_id, user_id) primary key would conflict.

    const cardSlug = `${slugBase}-${crypto.randomUUID().slice(0, 8)}`;
    const submittedSocialLinks = Array.isArray(prospect.social_links) ? prospect.social_links : [];
    const websiteLink = submittedSocialLinks.find((item: any) =>
      normalizeText(item?.platform) === "site web" || normalizeText(item?.platform) === "website"
    );
    const socialLinkRows = submittedSocialLinks.flatMap((item: any, index: number) => {
      const platform = String(item?.platform ?? "").trim();
      const url = safeHttpUrl(item?.url);
      if (!platform || !url) return [];
      const normalizedPlatform = normalizeText(platform);
      const kindByPlatform: Record<string, string> = {
        instagram: "instagram", facebook: "facebook", tiktok: "tiktok",
        linkedin: "linkedin", youtube: "youtube", whatsapp: "whatsapp",
        "site web": "website", website: "website", "cv / portfolio": "other", "portfolio / cv": "other", cv: "other", portfolio: "other", autre: "other",
      };
      return [{ label: platform.slice(0, 60), url, kind: kindByPlatform[normalizedPlatform] ?? "other", position: index }];
    });
    const businessAddress = String(prospect.business_address ?? "").trim();
    const displayAddress = businessAddress && !safeHttpUrl(businessAddress) ? businessAddress : (prospect.city || "");
    const businessPhone = String(prospect.business_phone ?? "").trim();
    const publicFields = {
      tagline: profileDraft?.tagline ?? "",
      location: displayAddress,
      hours: "",
      whatsapp: businessPhone,
      company_phone: businessPhone,
      company_email: prospect.email ?? "",
      company_address: displayAddress,
      industry: prospect.activity_sector ?? "",
      google_review_url: "",
      custom_fields: (profileDraft?.card_fields ?? [])
        .filter((field: any) => !["tagline", "location", "hours", "whatsapp", "google_review_url", "company_phone", "company_email", "company_address", "industry"].includes(field.key))
        .map((field: any) => ({
          key: field.key, label: field.label, value: "", visible: field.visible,
        })),
    };
    const { data: card, error: cardError } = await admin.from("cards").insert({
      organization_id: organization.id,
      created_by: customerUserId,
      slug: cardSlug,
      full_name: cardType === "contact" ? prospect.full_name : organizationName,
      company_name: organizationName,
      email: prospect.email ?? null,
      phone: prospect.phone ?? null,
      website: safeHttpUrl(websiteLink?.url),
      bio: profileDraft?.description || null,
      avatar_url: logoUrl,
      theme: {
        accent: cardType === "google-review" ? "#16a34a" : cardType === "service" ? "#0ea5e9" : cardType === "e-business" ? "#10b981" : "#6366f1",
        layout: cardType === "google-review" ? "review" : cardType === "e-business" ? "commerce" : cardType === "service" ? "service" : "classic",
        template: cardType,
        design_id: "default-" + cardType,
        schema_version: 1,
      },
      public_fields: publicFields,
      is_published: false,
    }).select("id,slug").single();
    if (cardError || !card) {
      console.error("Prospect first card insert failed", { code: cardError?.code, message: cardError?.message, details: cardError?.details, hint: cardError?.hint });
      throw new Error(cardError?.message || "The first NFC card draft could not be created.");
    }
    createdCardId = card.id;

    if (socialLinkRows.length) {
      const { error: socialLinksError } = await admin.from("card_links").insert(
        socialLinkRows.map((link: any) => ({ card_id: card.id, ...link }))
      );
      if (socialLinksError) {
        console.error("Prospect social links seed failed", { code: socialLinksError.code, message: socialLinksError.message });
        throw new Error("Les liens professionnels fournis dans la demande n'ont pas pu être ajoutés à la carte.");
      }
    }

    const { error: nfcError } = await admin.from("nfc_tags").insert({
      card_id: card.id,
      public_url: `${siteUrl}/p/${card.slug}?source=nfc`,
      is_active: false,
    });
    if (nfcError) {
      console.error("Prospect NFC tag insert failed", { code: nfcError.code, message: nfcError.message, details: nfcError.details, hint: nfcError.hint });
      throw new Error(nfcError.message || "The NFC link could not be prepared.");
    }

    // Post-creation verification: never report success unless every required relation exists.
    const [{ data: verifiedOrganization, error: verifyOrganizationError },
      { data: verifiedMembership, error: verifyMembershipError },
      { data: verifiedCard, error: verifyCardError },
      { data: verifiedTag, error: verifyTagError }] = await Promise.all([
      admin.from("organizations").select("id,owner_id,workspace_config").eq("id", organization.id).maybeSingle(),
      admin.from("organization_members").select("organization_id,user_id,role").eq("organization_id", organization.id).eq("user_id", customerUserId).maybeSingle(),
      admin.from("cards").select("id,organization_id,created_by,slug").eq("id", card.id).maybeSingle(),
      admin.from("nfc_tags").select("id,card_id,is_active").eq("card_id", card.id).maybeSingle(),
    ]);
    const verifiedConfig = (verifiedOrganization?.workspace_config ?? {}) as { template?: string; modules?: string[] };
    const verifiedModules = Array.isArray(verifiedConfig.modules) ? verifiedConfig.modules : [];
    const missingBeautyModules = requiredBeautyModules.filter((module) => !verifiedModules.includes(module));
    const verificationOk = !verifyOrganizationError && !verifyMembershipError && !verifyCardError && !verifyTagError
      && verifiedOrganization?.owner_id === customerUserId
      && verifiedMembership?.user_id === customerUserId
      && verifiedMembership?.organization_id === organization.id
      && verifiedCard?.organization_id === organization.id
      && verifiedCard?.created_by === customerUserId
      && verifiedTag?.card_id === card.id
      && verifiedConfig.template === cardType
      && prospect.client_access_enabled === true
      && prospect.password_initialized === true
      && verifiedModules.includes("dashboard")
      && verifiedModules.includes("digital_card")
      && missingBeautyModules.length === 0;
    if (!verificationOk) {
      console.error("Prospect workspace verification failed", { verifyOrganizationError, verifyMembershipError, verifyCardError, verifyTagError, hasOrganization: Boolean(verifiedOrganization), hasMembership: Boolean(verifiedMembership), hasCard: Boolean(verifiedCard), hasTag: Boolean(verifiedTag), missingBeautyModules, verifiedTemplate: verifiedConfig.template, verifiedModules });
      throw new Error("La vérification après création a échoué : espace, adhésion, carte NFC ou modules requis incomplets.");
    }

    const { data: linked, error: linkError } = await admin.from("prospect_requests")
      .update({ status: "in_production", updated_at: new Date().toISOString() })
      .eq("id", prospect.id).eq("user_id", customerUserId).select("id,status").maybeSingle();
    if (linkError || !linked || linked.status !== "in_production") throw new Error("L’espace client a été créé mais le rattachement de la demande n’a pas pu être vérifié.");

    return json({
      ok: true,
      verified: true,
      verification: {
        account_exists: Boolean(prospect.user_id),
        client_access_enabled: Boolean(prospect.client_access_enabled),
        password_initialized: Boolean(prospect.password_initialized),
        organization_linked: true,
        membership_linked: true,
        card_created: true,
        beauty_modules: beautyWorkspace ? requiredBeautyModules : [],
        beauty_modules_verified: missingBeautyModules.length === 0,
      },
      user_id: customerUserId,
      organization_id: organization.id,
      card_id: card.id,
      card_slug: card.slug,
      published: false,
    });
  } catch (error) {
    console.error("create-prospect-customer failed", { message: error instanceof Error ? error.message : String(error), organizationId, createdCardId });
    if (createdCardId) {
      await admin.from("nfc_tags").delete().eq("card_id", createdCardId);
      await admin.from("cards").delete().eq("id", createdCardId);
    }
    if (organizationId) {
      await admin.from("organization_members").delete().eq("organization_id", organizationId);
      await admin.from("organizations").delete().eq("id", organizationId);
    }
    return json({ error: error instanceof Error ? error.message : "Unexpected error" }, 400);
  }
});
