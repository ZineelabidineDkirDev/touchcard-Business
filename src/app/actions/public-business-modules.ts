"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

function field(data: FormData, key: string, max = 500) {
  return String(data.get(key) ?? "").trim().slice(0, max);
}

async function getPublishedCard(slug: string, requiredModule: string) {
  if (!slug || !/^[a-z0-9-]{2,100}$/i.test(slug)) return null;
  const supabase = await createClient();
  const { data: card } = await supabase.from("cards")
    .select("id,organization_id,slug,is_published").eq("slug", slug).eq("is_published", true).maybeSingle();
  if (!card) return null;
  const { data: organization } = await supabase.from("organizations")
    .select("workspace_config").eq("id", card.organization_id).maybeSingle();
  const config = (organization?.workspace_config ?? {}) as { version?: number; modules?: string[] };
  if (config.version && !config.modules?.includes(requiredModule)) return null;
  return { supabase, card };
}

export async function submitPublicAppointment(data: FormData) {
  const slug = field(data, "card_slug", 100);
  const ctx = await getPublishedCard(slug, "doctor_appointments");
  if (!ctx) return;
  const name = field(data, "customer_name", 140);
  const phone = field(data, "customer_phone", 40);
  const startsAt = field(data, "starts_at", 40);
  const reason = field(data, "message", 1000);
  const parsed = new Date(startsAt);
  if (!name || !phone || !startsAt || Number.isNaN(parsed.getTime()) || parsed.getTime() < Date.now()) return;
  const { error } = await ctx.supabase.from("business_appointments").insert({
    organization_id: ctx.card.organization_id, card_id: ctx.card.id,
    appointment_type: "consultation", customer_name: name,
    customer_email: field(data, "customer_email", 180) || null,
    customer_phone: phone, starts_at: parsed.toISOString(),
    message: reason || null, status: "pending", source: "public_card",
  });
  if (error) console.error("Public appointment submission failed", error);
  revalidatePath("/dashboard/modules");
}

export async function submitPublicGymRegistration(data: FormData) {
  const ctx = await getPublishedCard(field(data, "card_slug", 100), "gym_registration");
  if (!ctx) return;
  const fullName = field(data, "full_name", 140);
  const phone = field(data, "phone", 40);
  if (!fullName || !phone) return;
  const planId = field(data, "membership_plan_id", 80);
  if (planId) {
    const { data: plan } = await ctx.supabase.from("gym_membership_plans").select("id")
      .eq("id", planId).eq("organization_id", ctx.card.organization_id).eq("is_active", true).maybeSingle();
    if (!plan) return;
  }
  const { error } = await ctx.supabase.from("gym_registrations").insert({
    organization_id: ctx.card.organization_id, card_id: ctx.card.id,
    membership_plan_id: planId || null, full_name: fullName,
    email: field(data, "email", 180) || null, phone,
    preferred_start_date: field(data, "preferred_start_date", 10) || null,
    fitness_goals: field(data, "fitness_goals", 1000) || null,
    status: "pending",
  });
  if (error) console.error("Public gym registration failed", error);
  revalidatePath("/dashboard/modules");
}

export async function submitPublicSchoolEnrollment(data: FormData) {
  const ctx = await getPublishedCard(field(data, "card_slug", 100), "school_registration");
  if (!ctx) return;
  const studentName = field(data, "student_name", 140);
  const guardianPhone = field(data, "guardian_phone", 40);
  if (!studentName || !guardianPhone) return;
  const programId = field(data, "program_id", 80);
  if (programId) {
    const { data: program } = await ctx.supabase.from("school_programs").select("id")
      .eq("id", programId).eq("organization_id", ctx.card.organization_id).eq("is_active", true).maybeSingle();
    if (!program) return;
  }
  const { error } = await ctx.supabase.from("school_enrollments").insert({
    organization_id: ctx.card.organization_id, card_id: ctx.card.id,
    program_id: programId || null, student_name: studentName,
    student_birth_date: field(data, "student_birth_date", 10) || null,
    student_email: field(data, "student_email", 180) || null,
    student_phone: field(data, "student_phone", 40) || null,
    guardian_name: field(data, "guardian_name", 140) || null,
    guardian_email: field(data, "guardian_email", 180) || null,
    guardian_phone: guardianPhone,
    previous_education: field(data, "previous_education", 500) || null,
    message: field(data, "message", 1000) || null,
    status: "pending",
  });
  if (error) console.error("Public school enrollment failed", error);
  revalidatePath("/dashboard/modules");
}
