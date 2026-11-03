"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

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

  const { data: membership } = await supabase
    .from("organization_members")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "super_admin")
    .limit(1)
    .maybeSingle();
  if (!membership) return;

  const { error } = await supabase.from("prospect_requests").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
  if (!error) revalidatePath("/dashboard/prospects");
}


export async function createProspectCustomer(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: membership } = await supabase
    .from("organization_members")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "super_admin")
    .limit(1)
    .maybeSingle();
  if (!membership) return;

  const { error } = await supabase.functions.invoke("create-prospect-customer", {
    body: { request_id: id },
  });
  if (error) {
    console.error("Customer invitation failed", error);
    throw new Error("Impossible de créer le compte client. Vérifiez que la fonction Supabase est déployée et que la demande est validée.");
  }

  revalidatePath("/dashboard/prospects");
}
