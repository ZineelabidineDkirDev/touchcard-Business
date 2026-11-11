"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function getWorkspace() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, organizationId: null };
  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  return { supabase, user, organizationId: membership?.organization_id ?? null };
}

async function hasWorkspaceModule(supabase: Awaited<ReturnType<typeof createClient>>, organizationId: string, moduleId: string) {
  const { data: organization } = await supabase.from("organizations")
    .select("workspace_config").eq("id", organizationId).maybeSingle();
  const config = (organization?.workspace_config ?? {}) as { version?: number; modules?: string[] };
  return !config.version || (Array.isArray(config.modules) && config.modules.includes(moduleId));
}

async function hasSectorCatalogAccess(supabase: Awaited<ReturnType<typeof createClient>>, organizationId: string) {
  const { data: organization } = await supabase.from("organizations").select("workspace_config").eq("id", organizationId).maybeSingle();
  const config = (organization?.workspace_config ?? {}) as { version?: number; template?: string; modules?: string[]; original_client_choices?: { activity_sector?: string; project_needs?: { selected?: string[] } } };
  const modules = Array.isArray(config.modules) ? config.modules : [];
  if (config.template === "contact") return false;
  const supportsBusinessCatalog = ["service", "e-business"].includes(config.template ?? "");
  const sector = String(config.original_client_choices?.activity_sector ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const needs = (config.original_client_choices?.project_needs?.selected ?? []).join(" ").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const beautyCatalog = supportsBusinessCatalog && /beaute|cosmetique?s?|cosmetics?|esthetique|spa|hammam|salon de coiffure|coiffure|onglerie|maquillage|institut de beaute|massage|barber|barbier|barbershop/.test(sector + " " + needs);
  const otherSectorCatalog = supportsBusinessCatalog && /immobilier|agence immobiliere|promotion immobiliere|location immobiliere|restaurant|restauration|cafe|coffee shop|snack|traiteur|pizzeria|boulangerie|patisserie/.test(sector + " " + needs);
  const sectorCatalog = beautyCatalog || otherSectorCatalog;
  return !config.version || modules.some((module) => ["product_catalog", "service_catalog"].includes(module)) || sectorCatalog;
}

function parseCsvRecords(input: string, delimiter: string) {
  const records: string[][] = [];
  let row: string[] = [], value = "", quoted = false;
  for (let index = 0; index < input.length; index++) {
    const char = input[index];
    if (char === '"' && quoted && input[index + 1] === '"') { value += '"'; index++; }
    else if (char === '"') quoted = !quoted;
    else if (char === delimiter && !quoted) { row.push(value.trim()); value = ""; }
    else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && input[index + 1] === "\n") index++;
      row.push(value.trim()); value = "";
      if (row.some((cell) => cell.length)) records.push(row);
      row = [];
    } else value += char;
  }
  row.push(value.trim());
  if (row.some((cell) => cell.length)) records.push(row);
  return records;
}

function detectCsvDelimiter(input: string) {
  let quoted = false, commas = 0, semicolons = 0;
  for (let index = 0; index < input.length; index++) {
    const char = input[index];
    if (char === '"' && quoted && input[index + 1] === '"') index++;
    else if (char === '"') quoted = !quoted;
    else if (!quoted && (char === "\n" || char === "\r")) break;
    else if (!quoted && char === ",") commas++;
    else if (!quoted && char === ";") semicolons++;
  }
  return semicolons > commas ? ";" : ",";
}

function safeHttpUrl(value: string, maxLength: number) {
  const raw = value.trim().slice(0, maxLength);
  if (!raw) return null;
  try {
    const parsed = new URL(raw);
    return ["https:", "http:"].includes(parsed.protocol) ? parsed.toString() : null;
  } catch { return null; }
}

function cleanSlug(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 36) || "carte";
}

export async function createClientCard(formData: FormData) {
  const { supabase, user, organizationId } = await getWorkspace();
  if (!user) redirect("/login?next=/dashboard/cards");
  if (!organizationId) redirect("/dashboard/cards?card_error=workspace");
  if (!(await hasWorkspaceModule(supabase, organizationId, "digital_card"))) {
    redirect("/dashboard/cards?card_error=module");
  }
  const fullName = String(formData.get("full_name") ?? "").trim().slice(0, 120);
  if (!fullName) redirect("/dashboard/cards?card_error=missing");
  const { data: organization } = await supabase.from("organizations")
    .select("workspace_config").eq("id", organizationId).maybeSingle();
  const config = (organization?.workspace_config ?? {}) as { version?: number; template?: string; modules?: string[] };
  const modules = Array.isArray(config.modules) ? config.modules : [];
  if (config.version && !modules.includes("digital_card")) redirect("/dashboard/cards?card_error=module");
  const template = config.template ?? "contact";
  const accent = template === "google-review" ? "#16a34a" : template === "service" ? "#0ea5e9" : template === "e-business" ? "#10b981" : "#6366f1";
  const suffix = crypto.randomUUID().slice(0, 7);
  const { error } = await supabase.from("cards").insert({
    organization_id: organizationId,
    created_by: user.id,
    slug: cleanSlug(fullName) + "-" + suffix,
    full_name: fullName,
    company_name: String(formData.get("company_name") ?? "").trim().slice(0, 120) || null,
    theme: { template, accent, layout: "classic", schema_version: 1 },
    job_title: String(formData.get("job_title") ?? "").trim().slice(0, 120) || null,
    is_published: false,
  });
  if (error) {
    console.error("Client NFC card creation failed", { userId: user.id, organizationId, code: error.code, message: error.message });
    redirect("/dashboard/cards?card_error=database");
  }
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/cards");
  redirect("/dashboard/cards?card_created=1");
}

export async function saveClientCardVisibility(formData: FormData) {
  const { supabase, user, organizationId } = await getWorkspace();
  if (!user) redirect("/login?next=/dashboard/cards");
  if (!organizationId) redirect("/dashboard/cards?card_error=workspace");
  if (!(await hasWorkspaceModule(supabase, organizationId, "digital_card"))) redirect("/dashboard/cards?card_error=module");

  const cardId = String(formData.get("card_id") ?? "").trim();
  if (!cardId) redirect("/dashboard/cards?card_error=missing");
  const { data: card, error: readError } = await supabase.from("cards")
    .select("slug,public_settings").eq("id", cardId).eq("organization_id", organizationId).maybeSingle();
  if (readError || !card) redirect("/dashboard/cards?card_error=not_found");

  const keys = ["show_phone", "show_email", "show_website", "show_about", "show_contact", "show_company_info", "show_categories", "show_info_fields", "show_google_reviews", "show_catalog_pdf", "show_catalog", "show_request_forms", "show_orders", "show_bookings", "show_quotes", "show_social_links", "show_featured_links", "show_faq", "show_videos", "show_location"];
  const current = (card.public_settings ?? {}) as Record<string, boolean>;
  const nextSettings: Record<string, boolean> = { ...current, show_save_contact: true };
  for (const key of keys) nextSettings[key] = formData.get(key) === "on";

  const { error } = await supabase.from("cards").update({ public_settings: nextSettings, updated_at: new Date().toISOString() })
    .eq("id", cardId).eq("organization_id", organizationId);
  if (error) {
    console.error("Client card visibility update failed", { cardId, code: error.code, message: error.message });
    redirect("/dashboard/cards?card_error=database");
  }
  revalidatePath("/dashboard/cards");
  revalidatePath("/p/" + card.slug);
  redirect("/dashboard/cards?visibility_saved=1");
}

export async function saveClientCardProfile(formData: FormData) {
  const { supabase, user, organizationId } = await getWorkspace();
  if (!user) redirect("/login?next=/dashboard/cards");
  if (!organizationId) redirect("/dashboard/cards?card_error=workspace");
  if (!(await hasWorkspaceModule(supabase, organizationId, "digital_card"))) {
    redirect("/dashboard/cards?card_error=module");
  }

  const cardId = String(formData.get("card_id") ?? "").trim();
  if (!cardId) redirect("/dashboard/cards?card_error=missing");

  let customFields: { key: string; label: string; value: string; visible: boolean }[] = [];
  try {
    const parsed = JSON.parse(String(formData.get("custom_fields") ?? "[]"));
    if (Array.isArray(parsed)) customFields = parsed.slice(0, 20).map((field) => ({
      key: String(field.key ?? "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 48),
      label: String(field.label ?? "").trim().slice(0, 80),
      value: String(field.value ?? "").trim().slice(0, 500),
      visible: Boolean(field.visible),
    })).filter((field) => field.key && field.label);
  } catch {
    redirect("/dashboard/cards?card_error=fields");
  }

  const fields = {
    tagline: String(formData.get("tagline") ?? "").trim().slice(0, 180),
    nfc_display_code: String(formData.get("nfc_display_code") ?? "").trim().replace(/[^a-zA-Z0-9-]/g, "").slice(0, 24),
    location: String(formData.get("location") ?? "").trim().slice(0, 180),
    hours: String(formData.get("hours") ?? "").trim().slice(0, 180),
    whatsapp: String(formData.get("whatsapp") ?? "").trim().replace(/[^+\d]/g, "").slice(0, 20),
    company_phone: String(formData.get("company_phone") ?? "").trim().slice(0, 30),
    company_email: String(formData.get("company_email") ?? "").trim().slice(0, 180),
    company_address: String(formData.get("company_address") ?? "").trim().slice(0, 240),
    industry: String(formData.get("industry") ?? "").trim().slice(0, 120),
    contact_person_name: String(formData.get("contact_person_name") ?? "").trim().slice(0, 120),
    google_review_url: safeHttpUrl(String(formData.get("google_review_url") ?? ""), 1000) ?? "",
    custom_fields: customFields,
    intake_profile_synced: true,
  };

  const { data: existingCard } = await supabase.from("cards").select("theme").eq("id", cardId).eq("organization_id", organizationId).maybeSingle();
  const existingTheme = (existingCard?.theme ?? {}) as Record<string, unknown>;
  const allowedAccents = ["#2563EB", "#1D4ED8", "#0891B2", "#16A34A", "#059669", "#7C3AED", "#DB2777", "#DC2626", "#EA580C", "#171717"];
  const requestedAccent = String(formData.get("accent_color") ?? "").toUpperCase();
  const allowedTextColors = ["#111827", "#1F2937", "#334155", "#1E3A8A", "#312E81", "#14532D", "#7F1D1D", "#7C2D12"];
  const requestedTextColor = String(formData.get("text_color") ?? "").toUpperCase();
  const nextTheme = {
    ...existingTheme,
    ...(allowedAccents.includes(requestedAccent) ? { accent: requestedAccent } : {}),
    ...(allowedTextColors.includes(requestedTextColor) ? { text_color: requestedTextColor } : {}),
  };

  const { data: updatedCard, error } = await supabase.from("cards").update({
    theme: nextTheme,
    full_name: String(formData.get("full_name") ?? "").trim().slice(0, 120),
    job_title: String(formData.get("job_title") ?? "").trim().slice(0, 120) || null,
    company_name: String(formData.get("company_name") ?? "").trim().slice(0, 120) || null,
    bio: String(formData.get("bio") ?? "").trim().slice(0, 1200) || null,
    email: String(formData.get("email") ?? "").trim().slice(0, 180) || null,
    phone: String(formData.get("phone") ?? "").trim().slice(0, 30) || null,
    website: safeHttpUrl(String(formData.get("website") ?? ""), 500),
    avatar_url: safeHttpUrl(String(formData.get("avatar_url") ?? ""), 1000),
    cover_url: safeHttpUrl(String(formData.get("cover_url") ?? ""), 1000),
    public_fields: fields,
    updated_at: new Date().toISOString(),
  }).eq("id", cardId).eq("organization_id", organizationId).select("id,slug").maybeSingle();

  if (error) {
    console.error("Client card profile update failed", { cardId, code: error.code, message: error.message, details: error.details });
    redirect("/dashboard/cards?card_error=database");
  }
  if (!updatedCard) {
    console.error("Client card profile update affected no row", { cardId, organizationId });
    redirect("/dashboard/cards?card_error=permission");
  }

  revalidatePath("/dashboard/cards");
  revalidatePath("/p/" + updatedCard.slug);
  redirect("/dashboard/cards?card_saved=1");
}

export async function addClientCardLink(formData: FormData) {
  const { supabase, user, organizationId } = await getWorkspace();
  if (!user || !organizationId || !(await hasWorkspaceModule(supabase, organizationId, "digital_card"))) return;
  const cardId = String(formData.get("card_id") ?? "");
  const label = String(formData.get("label") ?? "").trim().slice(0, 60);
  const rawUrl = String(formData.get("url") ?? "").trim().slice(0, 500);
  const kind = String(formData.get("kind") ?? "website");
  const allowedKinds = ["website", "whatsapp", "telegram", "instagram", "facebook", "linkedin", "tiktok", "youtube", "x", "pinterest", "calendly", "store", "other"];
  if (!cardId || !label || !rawUrl || !allowedKinds.includes(kind)) return;
  let url: URL;
  try { url = new URL(rawUrl); } catch { return; }
  if (!["https:", "http:"].includes(url.protocol)) return;
  const { data: card } = await supabase.from("cards").select("id")
    .eq("id", cardId).eq("organization_id", organizationId).maybeSingle();
  if (!card) return;
  const { data: existing } = await supabase.from("card_links").select("position")
    .eq("card_id", cardId).order("position", { ascending: false }).limit(1).maybeSingle();
  const { error } = await supabase.from("card_links").insert({
    card_id: cardId, label, url: url.toString(), kind, position: (existing?.position ?? -1) + 1,
  });
  if (!error) revalidatePath("/dashboard/cards");
}

export async function deleteClientCardLink(formData: FormData) {
  const { supabase, user, organizationId } = await getWorkspace();
  if (!user || !organizationId || !(await hasWorkspaceModule(supabase, organizationId, "digital_card"))) return;
  const cardId = String(formData.get("card_id") ?? "");
  const linkId = String(formData.get("link_id") ?? "");
  const { data: card } = await supabase.from("cards").select("id")
    .eq("id", cardId).eq("organization_id", organizationId).maybeSingle();
  if (!card) return;
  const { error } = await supabase.from("card_links").delete().eq("id", linkId).eq("card_id", cardId);
  if (!error) revalidatePath("/dashboard/cards");
}

export async function toggleClientCardPublication(formData: FormData) {
  const { supabase, user, organizationId } = await getWorkspace();
  if (!user || !organizationId || !(await hasWorkspaceModule(supabase, organizationId, "digital_card"))) return;
  const cardId = String(formData.get("card_id") ?? "");
  const publish = String(formData.get("publish") ?? "") === "true";
  const { data: card } = await supabase.from("cards").select("id,slug")
    .eq("id", cardId).eq("organization_id", organizationId).maybeSingle();
  if (!card) return;

  const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://touchcard-three.vercel.app";
  const siteUrl = rawSiteUrl.endsWith("/") ? rawSiteUrl.slice(0, -1) : rawSiteUrl;
  if (publish) {
    const { data: existingTag } = await supabase.from("nfc_tags").select("id")
      .eq("card_id", cardId).limit(1).maybeSingle();
    if (existingTag) {
      const { error: tagError } = await supabase.from("nfc_tags").update({
        public_url: siteUrl + "/p/" + card.slug + "?source=nfc", is_active: true,
      }).eq("id", existingTag.id);
      if (tagError) return;
    } else {
      const { error: tagError } = await supabase.from("nfc_tags").insert({
        card_id: cardId, public_url: siteUrl + "/p/" + card.slug + "?source=nfc", is_active: true,
      });
      if (tagError) return;
    }
  }

  const { error } = await supabase.from("cards").update({
    is_published: publish, updated_at: new Date().toISOString(),
  }).eq("id", cardId).eq("organization_id", organizationId);
  if (!error && !publish) {
    await supabase.from("nfc_tags").update({ is_active: false }).eq("card_id", cardId);
  }
  if (!error) revalidatePath("/dashboard/cards");
}


export async function submitCardDesignRequest(templateId: string, notes: string) {
 const allowed=["midnight","minimal","studio","service-pro","atelier","business","market","google-review-pro","google-review-minimal"];
 if(!allowed.includes(templateId)) return {ok:false as const,error:"Modèle non reconnu."};
 const {supabase,user,organizationId}=await getWorkspace();
 if(!user||!organizationId) return {ok:false as const,error:"Connectez-vous à votre espace client."};
 const {data:organization}=await supabase.from("organizations").select("workspace_config").eq("id",organizationId).maybeSingle();
 const config=(organization?.workspace_config??{}) as {template?:string;modules?:string[]};
 const {data:prospect}=await supabase.from("prospect_requests").select("card_type,status").eq("user_id",user.id).maybeSingle();
 if(!prospect||!["in_production","completed"].includes(prospect.status)) return {ok:false as const,error:"Votre espace doit être activé avant de choisir un modèle."};
 const type=config.template||prospect.card_type;
 const compatible:Record<string,string[]>={contact:["midnight","minimal","studio"],service:["service-pro","atelier"],"e-business":["business","market"],"google-review":["google-review-pro","google-review-minimal"]};
 if(!compatible[type]?.includes(templateId)) return {ok:false as const,error:"Ce modèle ne correspond pas au type de carte de votre espace."};
 const {data:pending}=await supabase.from("card_design_requests").select("id").eq("user_id",user.id).eq("status","pending").limit(1).maybeSingle();
 if(pending) return {ok:false as const,error:"Vous avez déjà une demande en attente de validation."};
 const {error}=await supabase.from("card_design_requests").insert({user_id:user.id,organization_id:organizationId,template_id:templateId,card_type:type,notes:String(notes??"").trim().slice(0,700)});
 if(error){console.error("Card design request failed",error);return {ok:false as const,error:"La demande n'a pas pu être enregistrée. Vérifiez que la migration des modèles est appliquée."};}
 revalidatePath("/dashboard/cards");revalidatePath("/dashboard/prospects");return {ok:true as const};
}


export async function reviewCardDesignRequest(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const status = String(formData.get("status") ?? "");
  if (!id || !["approved", "revision_requested", "rejected"].includes(status)) return;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await import("@/lib/auth/platform-admin")).isPlatformSuperAdmin(user.email)) return;

  const { data, error } = await supabase.functions.invoke("review-card-design-request", {
    body: { request_id: id, status },
  });
  if (error || !data?.ok) {
    console.error("Card design review failed", { id, error: error?.message, details: data?.error });
    return;
  }
  revalidatePath("/dashboard/prospects");
  revalidatePath("/dashboard/cards");
}


export async function createCatalogItem(formData: FormData) {
  const { supabase, user, organizationId } = await getWorkspace();
  if (!user || !organizationId) return;

  const name = String(formData.get("name") ?? "").trim().slice(0, 120);
  const description = String(formData.get("description") ?? "").trim().slice(0, 1200);
  const price = Number(String(formData.get("price") ?? "").replace(",", "."));
  const imageUrl = safeHttpUrl(String(formData.get("image_url") ?? ""), 1000);
  if (!name || !Number.isFinite(price) || price < 0 || price > 100000000) return;

  if (!(await hasSectorCatalogAccess(supabase, organizationId))) return;

  const { error } = await supabase.from("products").insert({
    organization_id: organizationId,
    name,
    description: description || null,
    price,
    currency: "MAD",
    image_url: imageUrl,
    is_active: true,
  });
  if (error) {
    console.error("Catalog item creation failed", error);
    return;
  }
  revalidatePath("/dashboard/cards");
}

export async function updateCatalogItem(formData: FormData) {
  const { supabase, user, organizationId } = await getWorkspace();
  if (!user || !organizationId) return;
  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim().slice(0, 120);
  const description = String(formData.get("description") ?? "").trim().slice(0, 1200) || null;
  const price = Number(String(formData.get("price") ?? "").replace(",", "."));
  const imageUrl = safeHttpUrl(String(formData.get("image_url") ?? ""), 1000);
  if (!id || !name || !Number.isFinite(price) || price < 0 || price > 100000000) return;
  if (!(await hasSectorCatalogAccess(supabase, organizationId))) return;
  const { error } = await supabase.from("products").update({
    name, description, price, image_url: imageUrl, updated_at: new Date().toISOString(),
  }).eq("id", id).eq("organization_id", organizationId);
  if (error) { console.error("Catalog item update failed", error); return; }
  revalidatePath("/dashboard/cards");
}

export async function deleteCatalogItem(formData: FormData) {
  const { supabase, user, organizationId } = await getWorkspace();
  if (!user || !organizationId) return;
  if (!(await hasSectorCatalogAccess(supabase, organizationId))) return;
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;
  const { error } = await supabase.from("products").delete().eq("id", id).eq("organization_id", organizationId);
  if (error) {
    console.error("Catalog item deletion failed", error);
    return;
  }
  revalidatePath("/dashboard/cards");
}


export async function uploadCatalogPdf(formData: FormData) {
  const { supabase, user, organizationId } = await getWorkspace();
  if (!user || !organizationId || !(await hasSectorCatalogAccess(supabase, organizationId))) return;
  const file = formData.get("catalog_pdf");
  if (!(file instanceof File) || file.size === 0 || file.size > 15 * 1024 * 1024 || file.type !== "application/pdf" || !file.name.toLowerCase().endsWith(".pdf")) return;

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-100) || "catalogue.pdf";
  const storagePath = organizationId + "/catalogues/" + crypto.randomUUID() + "-" + safeName;
  const { error: uploadError } = await supabase.storage.from("client-media").upload(storagePath, file, {
    cacheControl: "3600", contentType: "application/pdf", upsert: false,
  });
  if (uploadError) {
    console.error("Catalog PDF upload failed", uploadError);
    return;
  }
  const { data: publicUrl } = supabase.storage.from("client-media").getPublicUrl(storagePath);
  const { error: saveError } = await supabase.from("organization_catalog_documents").upsert({
    organization_id: organizationId,
    file_url: publicUrl.publicUrl,
    file_name: safeName,
    updated_at: new Date().toISOString(),
  }, { onConflict: "organization_id" });
  if (saveError) {
    console.error("Catalog PDF metadata save failed", saveError);
    return;
  }
  revalidatePath("/dashboard/cards");
}

export async function importCatalogItems(formData: FormData) {
  const { supabase, user, organizationId } = await getWorkspace();
  if (!user) redirect("/login?next=/dashboard/cards");
  if (!organizationId) redirect("/dashboard/cards?catalog_import=workspace");
  if (!(await hasSectorCatalogAccess(supabase, organizationId))) redirect("/dashboard/cards?catalog_import=access");

  const file = formData.get("catalog_file");
  if (!(file instanceof File) || file.size === 0) redirect("/dashboard/cards?catalog_import=file");
  if (file.size > 2 * 1024 * 1024 || !file.name.toLowerCase().endsWith(".csv")) redirect("/dashboard/cards?catalog_import=format");

  const raw = (await file.text()).replace(/^\uFEFF/, "");
  const records = parseCsvRecords(raw, detectCsvDelimiter(raw));
  if (records.length < 2) redirect("/dashboard/cards?catalog_import=empty");
  const headers = records[0].map((value) => value.replace(/^\uFEFF/, "").trim().toLowerCase());
  const nameIndex = headers.findIndex((value) => ["name", "nom", "prestation", "produit"].includes(value));
  const descriptionIndex = headers.findIndex((value) => ["description", "details", "détails"].includes(value));
  const priceIndex = headers.findIndex((value) => ["price", "prix", "tarif"].includes(value));
  const imageIndex = headers.findIndex((value) => ["image_url", "image", "photo"].includes(value));
  if (nameIndex < 0 || descriptionIndex < 0 || priceIndex < 0 || imageIndex < 0) {
    redirect("/dashboard/cards?catalog_import=headers");
  }

  const dataRecords = records.slice(1).filter((row) => row.some((cell) => cell.trim()));
  if (dataRecords.length > 250) redirect("/dashboard/cards?catalog_import=limit");
  const rows = dataRecords.map((values) => {
    const name = String(values[nameIndex] ?? "").trim().slice(0, 120);
    const description = String(values[descriptionIndex] ?? "").trim().slice(0, 1200);
    const rawPrice = String(values[priceIndex] ?? "").replace(/[\s\u00a0]/g, "").replace(",", ".");
    const price = Number(rawPrice);
    const imageUrl = safeHttpUrl(String(values[imageIndex] ?? ""), 1000);
    return { organization_id: organizationId, name, description: description || null, price, currency: "MAD", image_url: imageUrl, is_active: true };
  });
  const validRows = rows.filter((item) => item.name && Number.isFinite(item.price) && item.price >= 0 && item.price <= 100000000);
  if (!validRows.length) redirect("/dashboard/cards?catalog_import=invalid");
  const { error } = await supabase.from("products").insert(validRows);
  if (error) {
    console.error("Catalog CSV import failed", { code: error.code, message: error.message, details: error.details, organizationId });
    redirect("/dashboard/cards?catalog_import=database");
  }
  revalidatePath("/dashboard/cards");
  redirect("/dashboard/cards?catalog_import=success&imported=" + validRows.length + "&skipped=" + (rows.length - validRows.length));
}
