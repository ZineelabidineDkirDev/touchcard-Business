"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const CRM_PATH = "/dashboard/contacts";
const statuses = ["new", "to_contact", "qualified", "negotiation", "won", "lost"];
const priorities = ["low", "normal", "high", "urgent"];
const activityTypes = ["call", "email", "meeting", "note", "whatsapp", "follow_up"];

async function getWorkspace() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Session expirée. Reconnectez-vous." } as const;
  const { data: membership } = await supabase.from("organization_members")
    .select("organization_id, role").eq("user_id", user.id).limit(1).maybeSingle();
  if (!membership?.organization_id) return { error: "Aucun espace entreprise n'est associé à ce compte." } as const;
  if (!["organization_admin", "manager", "staff", "super_admin"].includes(membership.role)) {
    return { error: "Votre rôle ne permet pas de gérer le CRM." } as const;
  }
  return { supabase, user, organizationId: membership.organization_id } as const;
}

export async function createContact(formData: FormData) {
  const workspace = await getWorkspace();
  if ("error" in workspace) return;
  const full_name = String(formData.get("full_name") ?? "").trim().slice(0, 140);
  const email = String(formData.get("email") ?? "").trim().toLowerCase().slice(0, 180) || null;
  const phone = String(formData.get("phone") ?? "").trim().slice(0, 40) || null;
  const company = String(formData.get("company") ?? "").trim().slice(0, 140) || null;
  const job_title = String(formData.get("job_title") ?? "").trim().slice(0, 100) || null;
  const city = String(formData.get("city") ?? "").trim().slice(0, 100) || null;
  const source = String(formData.get("source") ?? "manual");
  const notes = String(formData.get("notes") ?? "").trim().slice(0, 2000) || null;
  const priority = String(formData.get("priority") ?? "normal");
  const cardId = String(formData.get("card_id") ?? "").trim() || null;
  if (!full_name || (!email && !phone)) return;
  if (!priorities.includes(priority)) return;
  if (cardId) {
    const { data: card } = await workspace.supabase.from("cards").select("id")
      .eq("id", cardId).eq("organization_id", workspace.organizationId).maybeSingle();
    if (!card) return;
  }
  const allowedSources = ["manual", "nfc_form", "qr_form", "website", "whatsapp", "referral", "import"];
  const safeSource = allowedSources.includes(source) ? source : "manual";
  const { data, error } = await workspace.supabase.from("contacts").insert({
    organization_id: workspace.organizationId, card_id: cardId, full_name, email, phone,
    company, job_title, city, source: safeSource, notes, priority, status: "new",
  }).select("id").single();
  if (error || !data) {
    console.error("CRM contact creation failed", error);
    return;
  }
  await workspace.supabase.from("contact_activities").insert({
    organization_id: workspace.organizationId, contact_id: data.id, activity_type: "note",
    subject: "Contact ajouté au CRM", description: "Fiche créée manuellement.", created_by: workspace.user.id,
  });
  revalidatePath(CRM_PATH);
}

export async function updateContact(formData: FormData) {
  const workspace = await getWorkspace();
  if ("error" in workspace) return;
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "new");
  const priority = String(formData.get("priority") ?? "normal");
  const nextFollowUp = String(formData.get("next_follow_up_at") ?? "").trim();
  if (!id || !statuses.includes(status) || !priorities.includes(priority)) return;
  const { data: existing } = await workspace.supabase.from("contacts").select("status")
    .eq("id", id).eq("organization_id", workspace.organizationId).maybeSingle();
  if (!existing) return;
  const { error } = await workspace.supabase.from("contacts").update({
    status, priority, next_follow_up_at: nextFollowUp ? new Date(nextFollowUp).toISOString() : null,
    updated_at: new Date().toISOString(),
    ...(status !== existing.status ? { last_contacted_at: new Date().toISOString() } : {}),
  }).eq("id", id).eq("organization_id", workspace.organizationId);
  if (error) {
    console.error("CRM contact update failed", error);
    return;
  }
  if (status !== existing.status) {
    await workspace.supabase.from("contact_activities").insert({
      organization_id: workspace.organizationId, contact_id: id, activity_type: "status_change",
      subject: "Statut modifié", description: "Nouveau statut : " + status, created_by: workspace.user.id,
    });
  }
  revalidatePath(CRM_PATH);
}

export async function addContactActivity(formData: FormData) {
  const workspace = await getWorkspace();
  if ("error" in workspace) return;
  const contactId = String(formData.get("contact_id") ?? "");
  const activityType = String(formData.get("activity_type") ?? "note");
  const subject = String(formData.get("subject") ?? "").trim().slice(0, 160);
  const description = String(formData.get("description") ?? "").trim().slice(0, 2000) || null;
  const dueAt = String(formData.get("due_at") ?? "").trim();
  if (!contactId || !subject || !activityTypes.includes(activityType)) return;
  const { data: contact } = await workspace.supabase.from("contacts").select("id")
    .eq("id", contactId).eq("organization_id", workspace.organizationId).maybeSingle();
  if (!contact) return;
  const { error } = await workspace.supabase.from("contact_activities").insert({
    organization_id: workspace.organizationId, contact_id: contactId, activity_type: activityType,
    subject, description, due_at: dueAt ? new Date(dueAt).toISOString() : null, created_by: workspace.user.id,
  });
  if (error) console.error("CRM activity creation failed", error);
  revalidatePath(CRM_PATH);
}

export async function completeContactActivity(formData: FormData) {
  const workspace = await getWorkspace();
  if ("error" in workspace) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const { error } = await workspace.supabase.from("contact_activities").update({ completed_at: new Date().toISOString() })
    .eq("id", id).eq("organization_id", workspace.organizationId).is("completed_at", null);
  if (error) console.error("CRM activity completion failed", error);
  revalidatePath(CRM_PATH);
}
