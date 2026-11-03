"use server";

import { createClient } from "@/lib/supabase/server";

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
};

export async function submitProspectRequest(input: ProspectInput) {
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
      full_name: fullName,
      city: input.city.trim(),
      activity_sector: input.sector === "Autre" ? input.sectorOther.trim() || "Autre" : input.sector,
      email,
      phone,
      card_type: input.cardType,
      reason: input.reason.trim() || null,
      customization_requested: input.customRequested,
      brand_name: input.customRequested ? input.brandName.trim() || null : null,
      logo_url: input.customRequested ? input.logoUrl.trim() || null : null,
      business_address: input.customRequested ? input.businessAddress.trim() || null : null,
      business_phone: input.customRequested ? input.businessPhone.trim() || null : null,
      user_id: user?.id ?? null,
      status: "new",
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("Prospect request insert failed", error);
    return { ok: false as const, error: "Votre demande n'a pas pu être enregistrée. Veuillez réessayer." };
  }

  return { ok: true as const, requestId: data.id, email };
}
