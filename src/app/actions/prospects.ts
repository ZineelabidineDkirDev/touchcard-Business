"use server";

import { createClient } from "@/lib/supabase/server";
import { isPlatformSuperAdmin } from "@/lib/auth/platform-admin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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

  if (!fullName || !input.city || !input.sector || !email || !phone || !input.cardType) {
    return { ok: false as const, error: "Veuillez compléter tous les champs obligatoires." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false as const, error: "Veuillez saisir une adresse e-mail valide." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("prospect_requests")
    .insert({
      id: requestId,
      full_name: fullName,
      city: input.city.trim(),
      activity_sector: input.sector.split("|").map((sector) => sector === "Autre" ? input.sectorOther.trim() || "Autre" : sector).join(", "),
      email,
      phone,
      card_type: input.cardType,
      reason: input.reason.trim() || null,
      customization_requested: input.customRequested,
      brand_name: input.customRequested ? input.brandName.trim() || null : null,
      logo_url: input.customRequested ? input.logoUrl.trim() || null : null,
      business_address: input.customRequested ? input.businessAddress.trim() || null : null,
      business_phone: input.customRequested ? input.businessPhone.trim() || null : null,
      social_links: (input.socialLinks ?? []).filter((item) => item.url.trim()).map((item) => ({ platform: item.platform, url: item.url.trim() })),
      project_needs: { selected: input.projectNeeds ?? [], reservation_mode: input.reservationMode || null, reservation_channels: input.reservationChannels ?? [], management_needs: input.managementNeeds ?? [] },
      user_id: user?.id ?? null,
      status: "new",
    });

  if (error) {
    console.error("Prospect request insert failed", error);
    return { ok: false as const, error: "Votre demande n'a pas pu être enregistrée. Veuillez réessayer." };
  }

  return { ok: true as const, requestId, email };
}

export async function updateProspectStatus(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  const allowed = ["new", "to_contact", "in_discussion", "quote_sent", "approved", "in_production", "completed", "rejected", "cancelled"];
  if (!id || !allowed.includes(status)) return;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  if (!isPlatformSuperAdmin(user.email)) return;

  const { error } = await supabase.from("prospect_requests").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
  if (!error) revalidatePath("/dashboard/prospects");
}


export async function createProspectCustomer(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const rawConfig = String(formData.get("workspace_config") ?? "");
  if (!id || !rawConfig) return;

  let workspaceConfig: { template: string; modules: string[]; plan_code?: string };
  try {
    workspaceConfig = JSON.parse(rawConfig);
  } catch {
    redirect(`/dashboard/prospects/${id}/configure?error=${encodeURIComponent("Configuration invalide. Veuillez recommencer.")}`);
  }

  const allowedTemplates = ["e-business", "contact", "service"];
  const allowedModules = [
    "dashboard", "digital_card", "contact_profile", "social_links", "qr_nfc",
    "company_profile", "service_catalog", "product_catalog", "orders",
    "quote_requests", "bookings", "availability_calendar", "team",
    "gallery", "crm_contacts", "analytics", "whatsapp",
  ];
  if (!allowedTemplates.includes(workspaceConfig.template) || !Array.isArray(workspaceConfig.modules)
    || workspaceConfig.modules.some((module) => !allowedModules.includes(module))) {
    redirect(`/dashboard/prospects/${id}/configure?error=${encodeURIComponent("Les options sélectionnées ne sont pas valides.")}`);
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isPlatformSuperAdmin(user.email)) return;

  const { data, error } = await supabase.functions.invoke("create-prospect-customer", {
    body: { request_id: id, workspace_config: workspaceConfig },
  });
  if (error || !data?.ok) {
    const message = error?.message || data?.error || "La création du compte a échoué.";
    console.error("Customer workspace provisioning failed", { id, message });
    redirect(`/dashboard/prospects/${id}/configure?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/dashboard/prospects");
  revalidatePath("/dashboard/admin");
  redirect("/dashboard/prospects?created=1");
}


export type ProspectWorkspaceAISuggestions = {
  template: "contact" | "service" | "e-business";
  modules: string[];
  profile_draft: {
    tagline: string;
    description: string;
    categories: string[];
    catalog_items: { name: string; description: string; price: string }[];
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
    .select("card_type, activity_sector, reason, project_needs, customization_requested, brand_name")
    .eq("id", id)
    .single();

  if (prospectError || !prospect) {
    return { ok: false as const, error: "Impossible de charger cette demande." };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { ok: false as const, error: "La clé Gemini est absente de l'environnement serveur. Vérifie GEMINI_API_KEY dans Vercel." };
  }

  const allowedTemplates = ["e-business", "contact", "service"];
  const allowedModules = [
    "dashboard", "digital_card", "contact_profile", "social_links", "qr_nfc",
    "company_profile", "service_catalog", "product_catalog", "orders",
    "quote_requests", "bookings", "availability_calendar", "team",
    "gallery", "crm_contacts", "analytics", "whatsapp",
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
      .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}/gi, "[email masqué]")
      .replace(/(?:\\+?\\d[\\d\\s().-]{7,}\\d)/g, "[téléphone masqué]")
      .replace(/https?:\\/\\/\\S+/gi, "[lien masqué]")
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
        required: ["tagline", "description", "categories", "catalog_items"],
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
              "Respecte strictement le type de carte demandé. Contact = carte professionnelle et coordonnées; service = vitrine de prestations et demandes/réservations; e-business = boutique avec catalogue produits, commandes et gestion commerciale.",
              "Sélectionne uniquement les modules autorisés. N'invente jamais de tarifs, d'adresses, de numéros, de certifications ou de faits. Laisse price vide si le tarif n'est pas fourni.",
              "Rédige tagline et description en français. Les catégories et éléments de catalogue sont des propositions à valider, pas des faits confirmés.",
              "Retourne un JSON conforme au schéma. Ne crée aucun compte, ne contacte personne et n'effectue aucune action externe.",
              "BRIEF ANONYMISÉ :",
              JSON.stringify(brief),
            ].join("\n"),
          }],
        }],
        generationConfig: {
          responseMimeType: "application/json",
          responseJsonSchema: schema,
          temperature: 0.25,
          maxOutputTokens: 1800,
        },
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      if (response.status === 429) {
        return { ok: false as const, error: "Quota gratuit Gemini atteint ou temporairement limité. Réessaie plus tard ou continue la configuration manuellement. Aucun autre fournisseur payant ne sera utilisé." };
      }
      if (response.status === 401 || response.status === 403) {
        return { ok: false as const, error: "Gemini a refusé la clé API. Vérifie la clé et l'activation de Gemini API dans Google AI Studio." };
      }
      console.error("Gemini generation failed", { status: response.status });
      return { ok: false as const, error: "Gemini n'a pas pu générer la configuration. Tu peux continuer manuellement." };
    }

    const payload = await response.json();
    const rawText = payload?.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text ?? "").join("");
    if (!rawText) return { ok: false as const, error: "Gemini a renvoyé une réponse vide. Réessaie." };

    const parsed = JSON.parse(rawText) as ProspectWorkspaceAISuggestions;
    if (parsed.template !== template || !Array.isArray(parsed.modules) || !parsed.profile_draft) {
      return { ok: false as const, error: "La proposition IA ne respecte pas le modèle demandé. Réessaie." };
    }

    const safeModules = [...new Set(parsed.modules.filter((module) => allowedModules.includes(module)))];
    if (!safeModules.includes("dashboard")) safeModules.unshift("dashboard");

    return {
      ok: true as const,
      suggestions: {
        template,
        modules: safeModules,
        profile_draft: {
          tagline: String(parsed.profile_draft.tagline ?? "").slice(0, 180),
          description: String(parsed.profile_draft.description ?? "").slice(0, 1200),
          categories: Array.isArray(parsed.profile_draft.categories) ? parsed.profile_draft.categories.slice(0, 12).map((v) => String(v).slice(0, 80)) : [],
          catalog_items: Array.isArray(parsed.profile_draft.catalog_items) ? parsed.profile_draft.catalog_items.slice(0, 12).map((item) => ({
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
    console.error("Gemini request error", error);
    return { ok: false as const, error: "Erreur de communication avec Gemini. Vérifie ta connexion et réessaie." };
  }
}
