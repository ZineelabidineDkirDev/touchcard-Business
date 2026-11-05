"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

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

function cleanSlug(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 36) || "carte";
}

export async function createClientCard(formData: FormData) {
  const { supabase, user, organizationId } = await getWorkspace();
  if (!user || !organizationId) return;
  const fullName = String(formData.get("full_name") ?? "").trim().slice(0, 120);
  if (!fullName) return;
  const suffix = crypto.randomUUID().slice(0, 7);
  const { error } = await supabase.from("cards").insert({
    organization_id: organizationId,
    created_by: user.id,
    slug: cleanSlug(fullName) + "-" + suffix,
    full_name: fullName,
    company_name: String(formData.get("company_name") ?? "").trim().slice(0, 120) || null,
    job_title: String(formData.get("job_title") ?? "").trim().slice(0, 120) || null,
    is_published: false,
  });
  if (!error) revalidatePath("/dashboard");
}

export async function saveClientCardProfile(formData: FormData) {
  const { supabase, user, organizationId } = await getWorkspace();
  if (!user || !organizationId) return;
  const cardId = String(formData.get("card_id") ?? "");
  let customFields: { key: string; label: string; value: string; visible: boolean }[] = [];
  try {
    const parsed = JSON.parse(String(formData.get("custom_fields") ?? "[]"));
    if (Array.isArray(parsed)) customFields = parsed.slice(0, 20).map((field) => ({
      key: String(field.key ?? "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 48),
      label: String(field.label ?? "").trim().slice(0, 80),
      value: String(field.value ?? "").trim().slice(0, 500),
      visible: Boolean(field.visible),
    })).filter((field) => field.key && field.label);
  } catch { customFields = []; }
  const fields = {
    tagline: String(formData.get("tagline") ?? "").trim().slice(0, 180),
    location: String(formData.get("location") ?? "").trim().slice(0, 180),
    hours: String(formData.get("hours") ?? "").trim().slice(0, 180),
    whatsapp: String(formData.get("whatsapp") ?? "").trim().replace(/[^+\d]/g, "").slice(0, 20),
  };
  const { error } = await supabase.from("cards").update({
    full_name: String(formData.get("full_name") ?? "").trim().slice(0, 120),
    job_title: String(formData.get("job_title") ?? "").trim().slice(0, 120) || null,
    company_name: String(formData.get("company_name") ?? "").trim().slice(0, 120) || null,
    bio: String(formData.get("bio") ?? "").trim().slice(0, 1200) || null,
    email: String(formData.get("email") ?? "").trim().slice(0, 180) || null,
    phone: String(formData.get("phone") ?? "").trim().slice(0, 30) || null,
    website: String(formData.get("website") ?? "").trim().slice(0, 500) || null,
    avatar_url: String(formData.get("avatar_url") ?? "").trim().slice(0, 1000) || null,
    public_fields: fields,
    updated_at: new Date().toISOString(),
  }).eq("id", cardId).eq("organization_id", organizationId);
  if (!error) revalidatePath("/dashboard/cards");
}

export async function addClientCardLink(formData: FormData) {
  const { supabase, user, organizationId } = await getWorkspace();
  if (!user || !organizationId) return;
  const cardId = String(formData.get("card_id") ?? "");
  const label = String(formData.get("label") ?? "").trim().slice(0, 60);
  const rawUrl = String(formData.get("url") ?? "").trim().slice(0, 500);
  const kind = String(formData.get("kind") ?? "website");
  const allowedKinds = ["website", "whatsapp", "telegram", "instagram", "facebook", "linkedin", "store", "other"];
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
  if (!user || !organizationId) return;
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
  if (!user || !organizationId) return;
  const cardId = String(formData.get("card_id") ?? "");
  const publish = String(formData.get("publish") ?? "") === "true";
  const { error } = await supabase.from("cards").update({
    is_published: publish, updated_at: new Date().toISOString(),
  }).eq("id", cardId).eq("organization_id", organizationId);
  if (!error) revalidatePath("/dashboard/cards");
}
