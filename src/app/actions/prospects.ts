"use server";

import { createClient } from "@/lib/supabase/server";
import { isPlatformSuperAdmin } from "@/lib/auth/platform-admin";
import { CARD_MODULES } from "@/lib/cards/module-registry";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { generateTemplateBlueprint } from "@/lib/cards/template-engine";

export type ProspectInput = {
  fullName: string;
  city: string;
  sector: string;
  sectorOther: string;
  email: string;
  phone: string;
  cardType: string;
  reason: string;
  customRequested: boolean;
  brandName: string;
  logoUrl: string;
  businessAddress: string;
  businessPhone: string;
  socialLinks: { platform: string; url: string }[];
  projectNeeds: string[];
  reservationMode: string;
  reservationChannels: string[];
  managementNeeds: string[];
};

export async function submitProspectRequest(input: ProspectInput, requestId: string) {
  const fullName = input.fullName.trim();
  const email = input.email.trim().toLowerCase();
  const phone = input.phone.trim();
  const isBusinessCard = ["e-business", "service"].includes(input.cardType);
  const isContactOrReviewCard = ["contact", "google-review"].includes(input.cardType);
  const activitySector = isContactOrReviewCard ? input.sector.trim() || (input.cardType === "contact" ? "Personnel" : "Avis Google") : input.sector === "Autre" ? input.sectorOther.trim() || "Autre" : input.sector.trim();
  const brandName = input.brandName.trim() || (isContactOrReviewCard ? fullName : "");
  const selectedProjectNeeds = isBusinessCard ? (input.projectNeeds ?? []).slice(0, 1) : [];

  if (!fullName || !input.city || (isBusinessCard && (!activitySector || !brandName)) || (isContactOrReviewCard && !input.businessAddress.trim()) || !email || !phone || !input.cardType) {
    return { ok: false as const, error: "Veuillez compléter tous les champs obligatoires." };
  }
  if (input.sector.includes("|")) {
    return { ok: false as const, error: "Un seul domaine professionnel peut être sélectionné." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false as const, error: "Veuillez saisir une adresse e-mail valide." };
  }
  const supabase = await createClient();
  const { data, error } = await supabase.functions.invoke("create-prospect-account", {
    body: {
      request_id: requestId,
      prospect: {
        full_name: fullName,
        city: input.city.trim(),
        activity_sector: activitySector,
        email,
        phone,
        card_type: input.cardType,
        reason: input.reason.trim() || null,
        customization_requested: input.customRequested,
        brand_name: brandName || null,
        logo_url: input.customRequested ? input.logoUrl.trim() || null : null,
        business_address: input.businessAddress.trim() || null,
        business_phone: input.businessPhone.trim() || null,
        social_links: (input.socialLinks ?? []).filter((item) => item.url.trim()).map((item) => ({ platform: item.platform, url: item.url.trim() })),
        project_needs: { selected: selectedProjectNeeds, reservation_mode: selectedProjectNeeds.length ? input.reservationMode || null : null, reservation_channels: selectedProjectNeeds.length ? (input.reservationChannels ?? []).slice(0, 10) : [], management_needs: selectedProjectNeeds.length ? (input.managementNeeds ?? []).slice(0, 20) : [] },
      },
    },
  });

  if (error || !data?.ok) {
    if (data?.code === "EMAIL_ALREADY_REGISTERED") {
      return { ok: false as const, error: "Cette adresse possède déjà un compte TouchCard. Connectez-vous avec ce compte avant de déposer une nouvelle demande." };
    }
    console.error("Prospect account creation failed", { requestId, error: error?.message, details: data?.error });
    return { ok: false as const, error: data?.error || "La création du compte et l'enregistrement de la demande ont échoué. Veuillez réessayer." };
  }

  return { ok: true as const, requestId, email, temporaryPassword: String(data.temporary_password ?? "") };
}

export async function updateProspectStatus(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  const adminNotes = String(formData.get("admin_notes") ?? "").trim().slice(0, 2000);
  const allowed = ["new", "to_contact", "in_discussion", "quote_sent", "approved", "correction_requested", "in_production", "completed", "rejected", "cancelled"];
  if (!id || !allowed.includes(status)) return;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  if (!isPlatformSuperAdmin(user.email)) return;

  const { data: prospect, error: lookupError } = await supabase.from("prospect_requests")
    .select("id,user_id,full_name,city,activity_sector,reason,email,phone,brand_name,logo_url,business_address,business_phone,social_links,card_type,project_needs,status")
    .eq("id", id).maybeSingle();
  if (lookupError || !prospect) return;

  const { error } = await supabase.from("prospect_requests")
    .update({ status, ...(adminNotes ? { admin_notes: adminNotes } : {}), ...(status === "rejected" || status === "cancelled" ? { client_access_enabled: false } : {}), updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return;

  // Dès l'approbation, générer et créer automatiquement l'espace avec le moteur local.
  // Le client peut encore définir son mot de passe après coup ; l'accès reste verrouillé jusque-là.
  if (status === "approved" && prospect.user_id) {
    const { data: existingWorkspace, error: workspaceLookupError } = await supabase
      .from("organizations").select("id").eq("owner_id", prospect.user_id).maybeSingle();
    if (workspaceLookupError) {
      console.error("Approved prospect workspace lookup failed", { id, workspaceLookupError });
      redirect("/dashboard/prospects?provision_error=1");
    }
    if (!existingWorkspace) {
      const blueprint = generateTemplateBlueprint({
        template: prospect.card_type,
        needs: (prospect.project_needs ?? {}) as { selected?: string[]; reservation_mode?: string | null; reservation_channels?: string[]; management_needs?: string[] },
        sector: prospect.activity_sector,
        reason: prospect.reason ?? "",
      });
      const { data: provisioned, error: provisionError } = await supabase.functions.invoke("create-prospect-customer", {
        body: {
          request_id: id,
          workspace_config: {
            version: 2,
            template: blueprint.template,
            modules: blueprint.modules,
            plan_code: "to_define",
            ai_suggestions: {
              profile_draft: blueprint.profile_draft,
              rationale: blueprint.rationale,
              generated_by: blueprint.generated_by,
            },
          },
        },
      });
      if (provisionError || !provisioned?.ok || !provisioned?.verified) {
        console.error("Automatic prospect workspace provisioning failed", { id, message: provisionError?.message, details: provisioned?.error });
        await supabase.from("prospect_requests").update({
          admin_notes: [adminNotes, "Création automatique de l'espace client à relancer : " + String(provisioned?.error ?? provisionError?.message ?? "erreur technique").slice(0, 300)].filter(Boolean).join("\n"),
          updated_at: new Date().toISOString(),
        }).eq("id", id);
        redirect("/dashboard/prospects?provision_error=1");
      }
    }
  }
  revalidatePath("/dashboard/prospects");
  revalidatePath("/dashboard");
}

export async function activateProspectClientAccess(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isPlatformSuperAdmin(user.email)) return;

  const { data, error } = await supabase
    .from("prospect_requests")
    .update({ client_access_enabled: true, updated_at: new Date().toISOString() })
    .eq("id", id)
    .not("user_id", "is", null)
    .eq("password_initialized", true)
    .in("status", ["in_production", "completed"])
    .select("id")
    .maybeSingle();

  if (error || !data) {
    console.error("Client access activation failed", { id, error });
    return;
  }

  revalidatePath("/dashboard/prospects");
  revalidatePath("/dashboard");
}


export async function createProspectCustomer(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const rawConfig = String(formData.get("workspace_config") ?? "");
  if (!id || !rawConfig) return;

  let workspaceConfig: { version?: number; template: string; modules: string[]; module_settings?: Record<string, Record<string, string | boolean>>; plan_code?: string };
  try {
    workspaceConfig = JSON.parse(rawConfig);
  } catch {
    redirect(`/dashboard/prospects/${id}/configure?error=${encodeURIComponent("Configuration invalide. Veuillez recommencer.")}`);
  }

  workspaceConfig.version = 2;\n  const allowedTemplates = ["e-business", "contact", "service", "google-review"];
  const allowedModules = CARD_MODULES.map((module) => module.id);
  if (!allowedTemplates.includes(workspaceConfig.template) || !Array.isArray(workspaceConfig.modules)
    || workspaceConfig.modules.some((module) => !allowedModules.includes(module))) {
    redirect(`/dashboard/prospects/${id}/configure?error=${encodeURIComponent("Les options sélectionnées ne sont pas valides.")}`);
  }

  if (workspaceConfig.template === "contact") {
    const contactModules = new Set(["dashboard", "digital_card", "contact_profile", "social_links", "qr_nfc", "gallery", "analytics"]);
    workspaceConfig.modules = [...new Set([...workspaceConfig.modules.filter((module) => contactModules.has(module)), "dashboard", "digital_card", "contact_profile", "social_links", "qr_nfc", "gallery", "analytics"])];
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isPlatformSuperAdmin(user.email)) return;

  const { data, error } = await supabase.functions.invoke("create-prospect-customer", {
    body: { request_id: id, workspace_config: workspaceConfig },
  });
  if (error || !data?.ok || !data?.verified) {
    const message = error?.message || data?.error || "La création n’a pas passé la vérification finale de l’espace client.";
    console.error("Customer workspace provisioning failed", { id, message });
    redirect(`/dashboard/prospects/${id}/configure?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/dashboard/prospects");
  revalidatePath("/dashboard/admin");
  redirect("/dashboard/prospects?created=1&verified=1");
}


export type ProspectWorkspaceAISuggestions = {
  template: "contact" | "service" | "e-business" | "google-review";
  modules: string[];
  profile_draft: {
    tagline: string;
    description: string;
    categories: string[];
    catalog_items: { name: string; description: string; price: string }[];
    card_fields: { key: string; label: string; type: string; visible: boolean }[];
    suggested_buttons: { kind: string; label: string; enabled: boolean }[];
  };
  rationale: string;
};

export async function generateProspectWorkspaceAI(prospectId: string) {
  const id = String(prospectId ?? "").trim();
  if (!id) return { ok: false as const, error: "Demande introuvable." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isPlatformSuperAdmin(user.email)) {
    return { ok: false as const, error: "Accès réservé au Super Admin." };
  }

  const { data: prospect, error: prospectError } = await supabase
    .from("prospect_requests")
    .select("card_type, activity_sector, reason, project_needs, customization_requested, brand_name, status")
    .eq("id", id)
    .single();

  if (prospectError || !prospect) {
    return { ok: false as const, error: "Impossible de charger cette demande." };
  }
  if (!["approved", "in_production"].includes(prospect.status)) {
    return { ok: false as const, error: "L'IA est disponible après validation de la demande par le Super Admin." };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { ok: false as const, error: "La clé Gemini est absente de l'environnement serveur. Vérifie GEMINI_API_KEY dans Vercel." };
  }

  const allowedTemplates = ["e-business", "contact", "service", "google-review"];
  const allowedModules = [
    "dashboard", "digital_card", "contact_profile", "social_links", "qr_nfc",
    "company_profile", "service_catalog", "product_catalog", "orders", "google_reviews",
    "quote_requests", "bookings", "availability_calendar", "team",
    "gallery", "room_catalog", "crm_contacts", "analytics", "whatsapp",
  ];
  const template = allowedTemplates.includes(prospect.card_type) ? prospect.card_type : "contact";
  const needs = (prospect.project_needs ?? {}) as {
    selected?: string[];
    reservation_mode?: string | null;
    reservation_channels?: string[];
    management_needs?: string[];
  };

  // Send only non-identifying project information to Google.
  const brief = {
    card_type: template,
    activity_sector: String(prospect.activity_sector ?? "").slice(0, 160),
    project_description: String(prospect.reason ?? "")
      .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email masqué]")
      .replace(/(?:\+?\d[\d\s().-]{7,}\d)/g, "[téléphone masqué]")
      .replace(/https?:\/\/\S+/gi, "[lien masqué]")
      .slice(0, 1200),
    customization_requested: Boolean(prospect.customization_requested),
    selected_needs: Array.isArray(needs.selected) ? needs.selected.slice(0, 30) : [],
    reservation_mode: String(needs.reservation_mode ?? ""),
    reservation_channels: Array.isArray(needs.reservation_channels) ? needs.reservation_channels.slice(0, 10) : [],
    management_needs: Array.isArray(needs.management_needs) ? needs.management_needs.slice(0, 30) : [],
  };

  const schema = {
    type: "OBJECT",
    properties: {
      template: { type: "STRING", enum: allowedTemplates },
      modules: { type: "ARRAY", items: { type: "STRING", enum: allowedModules } },
      profile_draft: {
        type: "OBJECT",
        properties: {
          tagline: { type: "STRING" },
          description: { type: "STRING" },
          categories: { type: "ARRAY", items: { type: "STRING" } },
          card_fields: {
            type: "ARRAY",
            items: { type: "OBJECT", properties: { key: { type: "STRING" }, label: { type: "STRING" }, type: { type: "STRING", enum: ["text", "textarea", "url", "phone", "email"] }, visible: { type: "BOOLEAN" } }, required: ["key", "label", "type", "visible"] },
          },
          suggested_buttons: {
            type: "ARRAY",
            items: { type: "OBJECT", properties: { kind: { type: "STRING", enum: ["whatsapp", "telegram", "instagram", "facebook", "linkedin", "website", "store"] }, label: { type: "STRING" }, enabled: { type: "BOOLEAN" } }, required: ["kind", "label", "enabled"] },
          },
          catalog_items: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                name: { type: "STRING" },
                description: { type: "STRING" },
                price: { type: "STRING" },
              },
              required: ["name", "description", "price"],
            },
          },
        },
        required: ["tagline", "description", "categories", "catalog_items", "card_fields", "suggested_buttons"],
      },
      rationale: { type: "STRING" },
    },
    required: ["template", "modules", "profile_draft", "rationale"],
  };

  try {
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [{
          role: "user",
          parts: [{
            text: [
              "Tu es l'architecte produit IA de TouchCard Business. Analyse le brief et prépare une configuration initiale réellement utile.",
              "Respecte strictement le type de carte demandé, le secteur d'activité et la formule unique choisie par le client dans selected_needs. Cette liste contient une seule formule : elle est la source de vérité. Ne confonds jamais E-Business avec e-commerce : product_catalog et orders sont réservés aux activités de vente en ligne ou aux formules qui demandent explicitement une boutique. Immobilier : gallery + quote_requests + crm_contacts, sans Shop. Formation : gallery + bookings pour les inscriptions. Santé : bookings + availability_calendar pour les rendez-vous. Hôtel/hébergement : room_catalog + bookings + availability_calendar, avec demande de séjour. Si elle contient prestations, active service_catalog; si le type est google-review, active google_reviews et company_profile; si elle contient plusieurs collaborateurs, active team.",
              "Sélectionne uniquement les modules autorisés. N'invente jamais de tarifs, d'adresses, de numéros, de certifications ou de faits. Laisse price vide si le tarif n'est pas fourni.",
              "Rédige tagline et description en français. Prépare aussi card_fields : champs de profil utiles et modifiables adaptés au secteur, sans champs personnels non nécessaires. Prépare suggested_buttons parmi WhatsApp, Telegram, réseaux sociaux, site et boutique ; enabled indique si le bouton est pertinent, sans inventer son URL ou ses coordonnées. Les catégories et éléments de catalogue sont des propositions à valider, pas des faits confirmés.",
              "Retourne un JSON conforme au schéma. Ne crée aucun compte, ne contacte personne et n'effectue aucune action externe.",
              "BRIEF ANONYMISÉ :",
              JSON.stringify(brief),
            ].join("\n"),
          }],
        }],
        generationConfig: {
          responseMimeType: "application/json",
          responseJsonSchema: schema,
          // Gemini 3.8 Flash no longer accepts legacy sampling parameters such as temperature.
          maxOutputTokens: 1800,
        },
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      const providerBody = await response.text();
      let providerMessage = "";
      try {
        const parsedError = JSON.parse(providerBody);
        providerMessage = String(parsedError?.error?.message ?? "");
      } catch {
        providerMessage = providerBody;
      }
      console.error("Gemini generation failed", {
        status: response.status,
        statusText: response.statusText,
        providerMessage: providerMessage.slice(0, 1200),
      });

      if (response.status === 429) {
        return { ok: false as const, error: "Quota gratuit Gemini atteint ou temporairement limité (HTTP 429). Réessaie plus tard ou continue la configuration manuellement. Aucun autre fournisseur payant ne sera utilisé." };
      }
      if (response.status === 401 || response.status === 403) {
        return { ok: false as const, error: "Gemini a refusé la clé API ou l'accès au modèle (HTTP " + response.status + "). Vérifie la clé et l'activation de Gemini API dans Google AI Studio." };
      }
      if (response.status === 404) {
        return { ok: false as const, error: "Le modèle Gemini demandé est introuvable ou indisponible pour cette clé (HTTP 404)." };
      }
      return {
        ok: false as const,
        error: "Gemini a refusé la génération (HTTP " + response.status + "). " +
          (providerMessage ? providerMessage.slice(0, 320) : "Consulte les journaux serveur pour le détail.") +
          " Tu peux continuer manuellement.",
      };
    }

    const payload = await response.json();
    const rawText = payload?.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text ?? "").join("");
    if (!rawText) return { ok: false as const, error: "Gemini a renvoyé une réponse vide. Réessaie." };

    const parsed = JSON.parse(rawText) as ProspectWorkspaceAISuggestions;
    if (parsed.template !== template || !Array.isArray(parsed.modules) || !parsed.profile_draft) {
      return { ok: false as const, error: "La proposition IA ne respecte pas le modèle demandé. Réessaie." };
    }

    const contactModules = new Set(["dashboard", "digital_card", "contact_profile", "social_links", "qr_nfc", "gallery", "analytics"]);
    const safeModules = [...new Set(parsed.modules.filter((module) => allowedModules.includes(module) && (template !== "contact" || contactModules.has(module))))];
    const formula = String(needs.selected?.[0] ?? "").toLocaleLowerCase("fr");
    const normalizedSector = String(prospect.activity_sector ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const normalizedNeed = [...(needs.selected ?? []), ...(needs.management_needs ?? [])].join(" ").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const isBeautyBusiness = /beaute|cosmetique?s?|cosmetics?|esthetique|spa|hammam|coiffure|onglerie|maquillage|institut de beaute|massage/.test(normalizedSector + " " + normalizedNeed);
    const isRestaurantBusiness = /restaurant|restauration|cafe|coffee shop|snack|traiteur|pizzeria|boulangerie|patisserie/.test(normalizedSector + " " + normalizedNeed);
    const requiredModules = ["dashboard", "digital_card", "analytics"];
    if (template === "contact") requiredModules.push("contact_profile", "social_links", "qr_nfc", "gallery");
    if (template === "google-review") requiredModules.push("company_profile", "google_reviews", "qr_nfc");
    if (formula.includes("contact") || template === "contact") requiredModules.push("contact_profile");
    if (formula.includes("entreprise")) requiredModules.push("company_profile");
    if (formula.includes("prospect")) requiredModules.push("crm_contacts");
    if (formula.includes("prestation") || template === "service" || isBeautyBusiness || isRestaurantBusiness) requiredModules.push("service_catalog");
    if (isBeautyBusiness) requiredModules.push("bookings", "availability_calendar", "whatsapp");
    if (formula.includes("boutique") || formula.includes("vente en ligne") || formula.includes("e-commerce")) requiredModules.push("product_catalog", "orders");
    if (formula.includes("réservation") || formula.includes("reservation")) requiredModules.push("bookings", "availability_calendar");
    if (formula.includes("équipe") || formula.includes("collaborateur") || needs.reservation_mode === "team") requiredModules.push("team");
    for (const module of requiredModules) if (!safeModules.includes(module)) safeModules.push(module);
    const finalModules = template === "contact" ? safeModules.filter((module) => contactModules.has(module)) : safeModules;

    return {
      ok: true as const,
      suggestions: {
        template,
        modules: finalModules,
        profile_draft: {
          tagline: String(parsed.profile_draft.tagline ?? "").slice(0, 180),
          description: String(parsed.profile_draft.description ?? "").slice(0, 1200),
          categories: template === "contact" ? [] : Array.isArray(parsed.profile_draft.categories) ? parsed.profile_draft.categories.slice(0, 12).map((v) => String(v).slice(0, 80)) : [],
          card_fields: Array.isArray(parsed.profile_draft.card_fields) ? parsed.profile_draft.card_fields.filter((field) => template !== "contact" || !/appointment|booking|reservation|service|catalog|company|store|price/i.test(String(field.key ?? "") + " " + String(field.label ?? ""))).slice(0, 12).map((field) => ({ key: String(field.key ?? "").toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 40), label: String(field.label ?? "").slice(0, 80), type: ["text", "textarea", "url", "phone", "email"].includes(field.type) ? field.type : "text", visible: Boolean(field.visible) })) : [],
          suggested_buttons: Array.isArray(parsed.profile_draft.suggested_buttons) ? parsed.profile_draft.suggested_buttons.filter((button) => template !== "contact" || ["whatsapp", "telegram", "instagram", "facebook", "linkedin", "tiktok", "youtube", "website"].includes(button.kind)).slice(0, 8).map((button) => ({ kind: ["whatsapp", "telegram", "instagram", "facebook", "linkedin", "tiktok", "youtube", "x", "pinterest", "website", "store"].includes(button.kind) ? button.kind : "website", label: String(button.label ?? "").slice(0, 60), enabled: Boolean(button.enabled) })) : [],
          catalog_items: template === "contact" ? [] : Array.isArray(parsed.profile_draft.catalog_items) ? parsed.profile_draft.catalog_items.slice(0, 12).map((item) => ({
            name: String(item.name ?? "").slice(0, 100),
            description: String(item.description ?? "").slice(0, 240),
            price: String(item.price ?? "").slice(0, 40),
          })) : [],
        },
        rationale: String(parsed.rationale ?? "").slice(0, 600),
        generated_by: "gemini-3.8-flash",
        reviewed_by_super_admin: false,
      },
    };
  } catch (error) {
    console.error("Gemini request/response parsing error", error);
    return {
      ok: false as const,
      error: error instanceof SyntaxError
        ? "Gemini a répondu, mais sa proposition JSON est invalide. Relance le test."
        : "Erreur de communication avec Gemini. Vérifie la connexion et les journaux serveur, puis réessaie.",
    };
  }
}


export async function resetProspectClientPassword(requestId: string) {
  const id = String(requestId ?? "").trim();
  if (!id) return { ok: false as const, error: "Demande introuvable." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isPlatformSuperAdmin(user.email)) {
    return { ok: false as const, error: "Action réservée au Super Admin." };
  }

  const { data, error } = await supabase.functions.invoke("admin-reset-prospect-password", {
    body: { request_id: id },
  });
  if (error || !data?.ok || !data?.temporary_password) {
    return { ok: false as const, error: data?.error || "La réinitialisation a échoué." };
  }

  revalidatePath("/dashboard/prospects");
  return { ok: true as const, temporaryPassword: String(data.temporary_password) };
}
