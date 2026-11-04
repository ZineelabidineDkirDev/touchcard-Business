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
