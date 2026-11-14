"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

type IndustryContext = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  organizationId: string;
  cardId: string;
  canManage: boolean;
};

const managers = ["organization_admin", "manager", "super_admin"];

async function industryContext(moduleId: "car_rental" | "doctor_appointments"): Promise<IndustryContext | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: membership } = await supabase.from("organization_members")
    .select("organization_id,role").eq("user_id", user.id).limit(1).maybeSingle();
  if (!membership?.organization_id) return null;
  const { data: organization } = await supabase.from("organizations")
    .select("workspace_config").eq("id", membership.organization_id).maybeSingle();
  const config = (organization?.workspace_config ?? {}) as { version?: number; modules?: string[] };
  if (config.version && !config.modules?.includes(moduleId)) return null;
  const { data: card } = await supabase.from("cards").select("id")
    .eq("organization_id", membership.organization_id).order("created_at").limit(1).maybeSingle();
  if (!card?.id) return null;
  return {
    supabase,
    organizationId: membership.organization_id,
    cardId: card.id,
    canManage: managers.includes(String(membership.role)),
  };
}

function field(data: FormData, key: string, max = 500) {
  return String(data.get(key) ?? "").trim().slice(0, max);
}
function amount(data: FormData, key: string, fallback = 0) {
  const n = Number(field(data, key));
  return Number.isFinite(n) ? n : fallback;
}
function imageUrl(raw: string) {
  try {
    const url = new URL(raw);
    return ["https:", "http:"].includes(url.protocol) ? url.toString() : null;
  } catch { return null; }
}
function refresh(path: string) {
  revalidatePath(path);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/cards");
}

export async function createRentalLocation(data: FormData) {
  const ctx = await industryContext("car_rental");
  if (!ctx?.canManage) return;
  const name = field(data, "name", 160);
  if (!name) return;
  const { error } = await ctx.supabase.from("rental_locations").insert({
    organization_id: ctx.organizationId, name, address: field(data, "address", 300) || null,
    city: field(data, "city", 100) || null, region: field(data, "region", 100) || null,
    country: field(data, "country", 2).toUpperCase() || "MA",
    phone: field(data, "phone", 40) || null, is_primary: field(data, "is_primary") === "on",
  });
  if (error) console.error("Rental location creation failed", error);
  refresh("/dashboard/rentals");
}

export async function createRentalVehicle(data: FormData) {
  const ctx = await industryContext("car_rental");
  if (!ctx?.canManage) return;
  const brand = field(data, "brand", 80);
  const model = field(data, "model", 100);
  const dailyRate = Math.max(0, amount(data, "daily_rate"));
  if (!brand || !model) return;
  const { data: vehicle, error } = await ctx.supabase.from("rental_vehicles").insert({
    organization_id: ctx.organizationId, card_id: ctx.cardId,
    brand, model, category: field(data, "category", 60) || "economy",
    model_year: amount(data, "model_year") || null,
    seats: Math.max(1, Math.min(60, amount(data, "seats", 5))),
    transmission: ["manual", "automatic", "other"].includes(field(data, "transmission")) ? field(data, "transmission") : "manual",
    fuel_type: ["petrol", "diesel", "hybrid", "electric", "other"].includes(field(data, "fuel_type")) ? field(data, "fuel_type") : "petrol",
    daily_rate: dailyRate, currency: field(data, "currency", 3).toUpperCase() || "MAD",
    description: field(data, "description", 1200) || null,
    image_url: imageUrl(field(data, "image_url", 1000)),
    base_location_id: field(data, "base_location_id") || null,
  }).select("id").single();
  if (error) console.error("Rental vehicle creation failed", error);
  const registration = field(data, "registration_number", 40);
  const vin = field(data, "vin", 80);
  if (vehicle?.id && (registration || vin || field(data, "current_mileage"))) {
    const { error: privateError } = await ctx.supabase.from("rental_vehicle_private").insert({
      vehicle_id: vehicle.id, organization_id: ctx.organizationId,
      registration_number: registration || null, vin: vin || null,
      current_mileage: amount(data, "current_mileage") || null,
    });
    if (privateError) console.error("Private vehicle details creation failed", privateError);
  }
  refresh("/dashboard/rentals");
}

export async function setRentalVehiclePublished(data: FormData) {
  const ctx = await industryContext("car_rental");
  if (!ctx?.canManage) return;
  const id = field(data, "id", 80);
  if (!id) return;
  const { error } = await ctx.supabase.from("rental_vehicles").update({
    is_published: field(data, "is_published") === "true", updated_at: new Date().toISOString(),
  }).eq("id", id).eq("organization_id", ctx.organizationId);
  if (error) console.error("Rental vehicle publication update failed", error);
  refresh("/dashboard/rentals");
}

export async function createRentalMaintenance(data: FormData) {
  const ctx = await industryContext("car_rental");
  if (!ctx?.canManage) return;
  const vehicleId = field(data, "vehicle_id", 80);
  const title = field(data, "title", 180);
  const start = field(data, "scheduled_start", 10);
  const end = field(data, "scheduled_end", 10);
  if (!vehicleId || !title || !start || !end || end < start) return;
  const { error } = await ctx.supabase.from("rental_maintenance").insert({
    organization_id: ctx.organizationId, vehicle_id: vehicleId,
    maintenance_type: field(data, "maintenance_type", 30) || "service", title,
    description: field(data, "description", 1000) || null,
    scheduled_start: start, scheduled_end: end,
    current_mileage: amount(data, "current_mileage") || null,
    next_due_date: field(data, "next_due_date", 10) || null,
    next_due_mileage: amount(data, "next_due_mileage") || null,
    cost: amount(data, "cost") || null, status: "planned",
  });
  if (error) console.error("Rental maintenance creation failed", error);
  refresh("/dashboard/rentals");
}

export async function updateRentalBookingStatus(data: FormData) {
  const ctx = await industryContext("car_rental");
  if (!ctx?.canManage) return;
  const id = field(data, "id", 80);
  const status = field(data, "status", 20);
  if (!id || !["pending", "confirmed", "active", "cancelled", "completed", "rejected"].includes(status)) return;
  const { error } = await ctx.supabase.from("rental_bookings").update({
    status, updated_at: new Date().toISOString(),
  }).eq("id", id).eq("organization_id", ctx.organizationId);
  if (error) console.error("Rental booking status update failed", error);
  refresh("/dashboard/rentals");
}

export async function createHealthcarePractitioner(data: FormData) {
  const ctx = await industryContext("doctor_appointments");
  if (!ctx?.canManage) return;
  const fullName = field(data, "full_name", 180);
  if (!fullName) return;
  const languages = field(data, "languages", 200).split(",").map((v) => v.trim()).filter(Boolean).slice(0, 8);
  const { error } = await ctx.supabase.from("healthcare_practitioners").insert({
    organization_id: ctx.organizationId, full_name: fullName,
    professional_title: field(data, "professional_title", 120) || null,
    specialty: field(data, "specialty", 120) || null,
    biography: field(data, "biography", 1200) || null,
    avatar_url: imageUrl(field(data, "avatar_url", 1000)),
    languages,
  });
  if (error) console.error("Healthcare practitioner creation failed", error);
  refresh("/dashboard/healthcare");
}

export async function createHealthcareLocation(data: FormData) {
  const ctx = await industryContext("doctor_appointments");
  if (!ctx?.canManage) return;
  const name = field(data, "name", 160);
  if (!name) return;
  const { error } = await ctx.supabase.from("healthcare_locations").insert({
    organization_id: ctx.organizationId, name,
    address: field(data, "address", 300) || null, city: field(data, "city", 100) || null,
    region: field(data, "region", 100) || null, country: field(data, "country", 2).toUpperCase() || "MA",
    phone: field(data, "phone", 40) || null, is_primary: field(data, "is_primary") === "on",
  });
  if (error) console.error("Healthcare location creation failed", error);
  refresh("/dashboard/healthcare");
}

export async function createHealthcareService(data: FormData) {
  const ctx = await industryContext("doctor_appointments");
  if (!ctx?.canManage) return;
  const name = field(data, "name", 180);
  if (!name) return;
  const { error } = await ctx.supabase.from("healthcare_services").insert({
    organization_id: ctx.organizationId, practitioner_id: field(data, "practitioner_id") || null,
    name, specialty: field(data, "specialty", 120) || null,
    description: field(data, "description", 1200) || null,
    duration_minutes: Math.max(5, Math.min(720, amount(data, "duration_minutes", 30))),
    price: field(data, "price") === "" ? null : Math.max(0, amount(data, "price")),
    currency: field(data, "currency", 3).toUpperCase() || "MAD",
    consultation_mode: ["in_person", "teleconsultation", "home_visit"].includes(field(data, "consultation_mode")) ? field(data, "consultation_mode") : "in_person",
    image_url: imageUrl(field(data, "image_url", 1000)),
  });
  if (error) console.error("Healthcare service creation failed", error);
  refresh("/dashboard/healthcare");
}

export async function createHealthcareAvailability(data: FormData) {
  const ctx = await industryContext("doctor_appointments");
  if (!ctx?.canManage) return;
  const practitionerId = field(data, "practitioner_id", 80);
  const start = field(data, "starts_at", 5);
  const end = field(data, "ends_at", 5);
  const date = field(data, "specific_date", 10);
  const day = field(data, "day_of_week");
  if (!practitionerId || !start || !end || start >= end || (!date && day === "")) return;
  const { error } = await ctx.supabase.from("healthcare_availability_rules").insert({
    organization_id: ctx.organizationId, practitioner_id: practitionerId,
    location_id: field(data, "location_id") || null,
    day_of_week: date ? null : Number(day), specific_date: date || null,
    starts_at: start, ends_at: end, slot_minutes: Math.max(5, Math.min(720, amount(data, "slot_minutes", 30))),
    is_available: true,
  });
  if (error) console.error("Healthcare availability creation failed", error);
  refresh("/dashboard/healthcare");
}

export async function updateHealthcareAppointmentStatus(data: FormData) {
  const ctx = await industryContext("doctor_appointments");
  if (!ctx?.canManage) return;
  const id = field(data, "id", 80);
  const status = field(data, "status", 20);
  if (!id || !["pending", "confirmed", "cancelled", "completed", "rejected"].includes(status)) return;
  const { error } = await ctx.supabase.from("healthcare_appointments").update({
    status, updated_at: new Date().toISOString(),
  }).eq("id", id).eq("organization_id", ctx.organizationId);
  if (error) console.error("Healthcare appointment status update failed", error);
  refresh("/dashboard/healthcare");
}
