"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

type ModuleContext = { supabase: Awaited<ReturnType<typeof createClient>>; organizationId: string; modules: string[] };

async function getModuleContext(required: string[]): Promise<ModuleContext | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: membership } = await supabase.from("organization_members")
    .select("organization_id").eq("user_id", user.id).limit(1).maybeSingle();
  if (!membership?.organization_id) return null;
  const { data: organization } = await supabase.from("organizations")
    .select("workspace_config").eq("id", membership.organization_id).maybeSingle();
  const config = (organization?.workspace_config ?? {}) as { version?: number; modules?: string[] };
  const modules = Array.isArray(config.modules) ? config.modules : [];
  if (config.version && !required.every((id) => modules.includes(id))) return null;
  return { supabase, organizationId: membership.organization_id, modules };
}

function value(data: FormData, key: string, max = 500) {
  return String(data.get(key) ?? "").trim().slice(0, max);
}
function numeric(data: FormData, key: string, fallback = 0) {
  const n = Number(value(data, key));
  return Number.isFinite(n) ? n : fallback;
}

export async function createBusinessCatalogItem(data: FormData) {
  const itemType = value(data, "item_type");
  const moduleId = itemType === "room" ? "room_catalog" : "service_catalog";
  const ctx = await getModuleContext([moduleId]);
  if (!ctx) return;
  const name = value(data, "name", 140);
  if (!name) return;
  const { error } = await ctx.supabase.from("business_catalog_items").insert({
    organization_id: ctx.organizationId, item_type: itemType, name,
    description: value(data, "description"), price: numeric(data, "price"),
    currency: value(data, "currency", 3) || "MAD",
    duration_minutes: numeric(data, "duration_minutes") || null,
    capacity: numeric(data, "capacity") || null,
  });
  if (error) console.error("Catalog item creation failed", error);
  revalidatePath("/dashboard/modules");
}

export async function createAvailabilityRule(data: FormData) {
  const ctx = await getModuleContext(["availability_calendar"]);
  if (!ctx) return;
  const day = value(data, "day_of_week");
  const specificDate = value(data, "specific_date");
  const startsAt = value(data, "starts_at", 5);
  const endsAt = value(data, "ends_at", 5);
  if ((!specificDate && day === "") || !startsAt || !endsAt || startsAt >= endsAt) return;
  const { error } = await ctx.supabase.from("business_availability_rules").insert({
    organization_id: ctx.organizationId,
    day_of_week: specificDate ? null : Number(day),
    specific_date: specificDate || null,
    starts_at: startsAt, ends_at: endsAt,
    slot_minutes: Math.max(5, Math.min(240, numeric(data, "slot_minutes", 30))),
    capacity: Math.max(1, Math.min(500, numeric(data, "capacity", 1))),
    is_available: true,
  });
  if (error) console.error("Availability rule creation failed", error);
  revalidatePath("/dashboard/modules");
}

export async function createGymPlan(data: FormData) {
  const ctx = await getModuleContext(["gym_registration"]);
  if (!ctx) return;
  const name = value(data, "name", 140);
  if (!name) return;
  const benefits = value(data, "benefits").split("\n").map((x) => x.trim()).filter(Boolean).slice(0, 12);
  const { error } = await ctx.supabase.from("gym_membership_plans").insert({
    organization_id: ctx.organizationId, name, description: value(data, "description"),
    price: numeric(data, "price"), currency: value(data, "currency", 3) || "MAD",
    duration_days: Math.max(1, Math.min(3650, numeric(data, "duration_days", 30))), benefits,
  });
  if (error) console.error("Gym plan creation failed", error);
  revalidatePath("/dashboard/modules");
}

export async function createSchoolProgram(data: FormData) {
  const ctx = await getModuleContext(["school_registration"]);
  if (!ctx) return;
  const title = value(data, "title", 160);
  if (!title) return;
  const { error } = await ctx.supabase.from("school_programs").insert({
    organization_id: ctx.organizationId, title, description: value(data, "description"),
    duration_label: value(data, "duration_label", 100),
    price: value(data, "price") === "" ? null : numeric(data, "price"),
    currency: value(data, "currency", 3) || "MAD",
    capacity: numeric(data, "capacity") || null,
    start_date: value(data, "start_date") || null, end_date: value(data, "end_date") || null,
  });
  if (error) console.error("School program creation failed", error);
  revalidatePath("/dashboard/modules");
}

async function updateStatus(table: string, id: string, status: string, modules: string[]) {
  const ctx = await getModuleContext(modules);
  if (!ctx || !id || !["pending", "confirmed", "in_progress", "completed", "rejected", "cancelled", "active"].includes(status)) return;
  const { error } = await ctx.supabase.from(table).update({ status, updated_at: new Date().toISOString() })
    .eq("id", id).eq("organization_id", ctx.organizationId);
  if (error) console.error("Business module status update failed", error);
  revalidatePath("/dashboard/modules");
}

export async function updateAppointmentStatus(data: FormData) {
  await updateStatus("business_appointments", value(data, "id"), value(data, "status"), ["bookings"]);
}
export async function updateGymRegistrationStatus(data: FormData) {
  await updateStatus("gym_registrations", value(data, "id"), value(data, "status"), ["gym_registration"]);
}
export async function updateSchoolEnrollmentStatus(data: FormData) {
  await updateStatus("school_enrollments", value(data, "id"), value(data, "status"), ["school_registration"]);
}
