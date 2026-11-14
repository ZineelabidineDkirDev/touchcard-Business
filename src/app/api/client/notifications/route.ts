import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";


export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: membership } = await supabase.from("organization_members")
    .select("organization_id").eq("user_id", user.id).limit(1).maybeSingle();
  if (!membership?.organization_id) return NextResponse.json({ notifications: [], count: 0 });

  const organizationId = membership.organization_id;
  const [requests, appointments, rentalBookings, healthcareAppointments, requestCount, appointmentCount, rentalCount, healthcareCount] = await Promise.all([
    supabase.from("workspace_requests")
      .select("id,request_type,customer_name,created_at,status")
      .eq("organization_id", organizationId).eq("status", "pending")
      .order("created_at", { ascending: false }).limit(15),
    supabase.from("business_appointments")
      .select("id,appointment_type,customer_name,starts_at,created_at,status")
      .eq("organization_id", organizationId).eq("status", "pending")
      .order("created_at", { ascending: false }).limit(15),
    supabase.from("rental_bookings")
      .select("id,customer_name,pickup_date,return_date,created_at,status")
      .eq("organization_id", organizationId).eq("status", "pending")
      .order("created_at", { ascending: false }).limit(15),
    supabase.from("healthcare_appointments")
      .select("id,patient_name,starts_at,created_at,status")
      .eq("organization_id", organizationId).eq("status", "pending")
      .order("created_at", { ascending: false }).limit(15),
    supabase.from("workspace_requests").select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId).eq("status", "pending"),
    supabase.from("business_appointments").select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId).eq("status", "pending"),
    supabase.from("rental_bookings").select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId).eq("status", "pending"),
    supabase.from("healthcare_appointments").select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId).eq("status", "pending"),
  ]);

  if (requests.error || appointments.error || rentalBookings.error || healthcareAppointments.error || requestCount.error || appointmentCount.error || rentalCount.error || healthcareCount.error) {
    console.error("Client notifications query failed", {
      requests: requests.error?.code,
      appointments: appointments.error?.code,
      rentalBookings: rentalBookings.error?.code,
      healthcareAppointments: healthcareAppointments.error?.code,
      requestCount: requestCount.error?.code,
      appointmentCount: appointmentCount.error?.code,
      rentalCount: rentalCount.error?.code,
      healthcareCount: healthcareCount.error?.code,
    });
    return NextResponse.json({ error: "Unable to load notifications" }, { status: 500 });
  }

  const requestItems = (requests.data ?? []).map((item) => ({
    id: "request-" + item.id,
    title: item.request_type === "order" ? "Nouvelle commande" : item.request_type === "booking" ? "Nouvelle réservation" : "Nouvelle demande de devis",
    description: item.customer_name + " · À traiter",
    created_at: item.created_at,
    href: "/dashboard/requests",
    kind: item.request_type,
  }));
  const appointmentItems = (appointments.data ?? []).map((item) => ({
    id: "appointment-" + item.id,
    title: item.appointment_type === "restaurant_booking" ? "Réservation restaurant" : item.appointment_type === "consultation" ? "Nouvelle consultation" : "Nouveau rendez-vous",
    description: item.customer_name + (item.starts_at ? " · " + new Date(item.starts_at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }) : "") + " · À confirmer",
    created_at: item.created_at,
    href: "/dashboard/modules",
    kind: item.appointment_type,
  }));

  const rentalItems = (rentalBookings.data ?? []).map((item) => ({
    id: "rental-" + item.id,
    title: "Nouvelle demande de location",
    description: item.customer_name + " · " + new Date(item.pickup_date + "T12:00:00").toLocaleDateString("fr-FR") + " – " + new Date(item.return_date + "T12:00:00").toLocaleDateString("fr-FR"),
    created_at: item.created_at,
    href: "/dashboard/rentals",
    kind: "rental_booking",
  }));
  const healthcareItems = (healthcareAppointments.data ?? []).map((item) => ({
    id: "healthcare-" + item.id,
    title: "Nouveau rendez-vous santé",
    description: item.patient_name + " · " + new Date(item.starts_at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }),
    created_at: item.created_at,
    href: "/dashboard/healthcare",
    kind: "healthcare_appointment",
  }));

  const notifications = [...requestItems, ...appointmentItems, ...rentalItems, ...healthcareItems]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 20);

  return NextResponse.json({
    notifications,
    count: (requestCount.count ?? 0) + (appointmentCount.count ?? 0) + (rentalCount.count ?? 0) + (healthcareCount.count ?? 0),
  }, { headers: { "Cache-Control": "no-store, max-age=0" } });
}
