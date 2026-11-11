import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  createAvailabilityRule, createBusinessCatalogItem, createGymPlan, createSchoolProgram,
  updateAppointmentStatus, updateGymRegistrationStatus, updateSchoolEnrollmentStatus,
} from "@/app/actions/business-modules";

const statusLabels: Record<string, string> = {
  pending: "En attente", confirmed: "Confirmée", in_progress: "En cours",
  completed: "Terminée", rejected: "Refusée", cancelled: "Annulée",
};

export default async function BusinessModulesPage() {
  await connection();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: membership } = await supabase.from("organization_members")
    .select("organization_id").eq("user_id", user.id).limit(1).maybeSingle();
  if (!membership?.organization_id) notFound();
  const organizationId = membership.organization_id;
  const { data: organization } = await supabase.from("organizations")
    .select("name,workspace_config").eq("id", organizationId).maybeSingle();
  const config = (organization?.workspace_config ?? {}) as { version?: number; modules?: string[] };
  const modules = Array.isArray(config.modules) ? config.modules : [];
  const enabled = (id: string) => !config.version || modules.includes(id);
  const canCatalog = enabled("service_catalog") || enabled("room_catalog");
  const canAppointments = enabled("bookings") || enabled("doctor_appointments");
  const canGym = enabled("gym_registration");
  const canSchool = enabled("school_registration");
  const canAvailability = enabled("availability_calendar");
  if (!canCatalog && !canAppointments && !canGym && !canSchool && !canAvailability) notFound();

  const [catalog, rules, appointments, plans, gymRegistrations, programs, enrollments] = await Promise.all([
    canCatalog ? supabase.from("business_catalog_items").select("*").eq("organization_id", organizationId).order("display_order").order("created_at", { ascending: false }) : Promise.resolve({ data: [] }),
    canAvailability ? supabase.from("business_availability_rules").select("*").eq("organization_id", organizationId).order("day_of_week").order("starts_at") : Promise.resolve({ data: [] }),
    canAppointments ? supabase.from("business_appointments").select("*").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(100) : Promise.resolve({ data: [] }),
    canGym ? supabase.from("gym_membership_plans").select("*").eq("organization_id", organizationId).order("display_order").order("created_at", { ascending: false }) : Promise.resolve({ data: [] }),
    canGym ? supabase.from("gym_registrations").select("*").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(100) : Promise.resolve({ data: [] }),
    canSchool ? supabase.from("school_programs").select("*").eq("organization_id", organizationId).order("display_order").order("created_at", { ascending: false }) : Promise.resolve({ data: [] }),
    canSchool ? supabase.from("school_enrollments").select("*").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(100) : Promise.resolve({ data: [] }),
  ]);
  const dayNames = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

  return <div className="mx-auto max-w-7xl space-y-8">
    <header><p className="text-xs font-black uppercase tracking-[.18em] text-indigo-600">Espace client · {organization?.name || "TouchCard"}</p><h1 className="mt-2 text-3xl font-black text-slate-950">Mes modules métier</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">Gérez vos prestations, disponibilités, rendez-vous, abonnements et inscriptions depuis un espace unique. Seuls les modules activés par TouchCard apparaissent ici.</p></header>

    {canCatalog && <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <SectionTitle title="Prestations, menus & chambres" description="Ajoutez les éléments qui seront présentés sur votre carte publique."/>
      <form action={createBusinessCatalogItem} className="grid gap-3 rounded-2xl bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-6">
        <select name="item_type" className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm"><option value="service">Prestation / menu</option><option value="room">Chambre</option></select>
        <input name="name" required maxLength={140} placeholder="Nom" className="rounded-xl border border-slate-200 px-3 py-3 text-sm"/>
        <input name="price" type="number" min="0" step="0.01" placeholder="Prix (MAD)" className="rounded-xl border border-slate-200 px-3 py-3 text-sm"/>
        <input name="duration_minutes" type="number" min="0" placeholder="Durée (min)" className="rounded-xl border border-slate-200 px-3 py-3 text-sm"/>
        <input name="capacity" type="number" min="0" placeholder="Capacité" className="rounded-xl border border-slate-200 px-3 py-3 text-sm"/>
        <button className="rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white">Ajouter</button>
        <textarea name="description" placeholder="Description" rows={2} className="rounded-xl border border-slate-200 px-3 py-3 text-sm sm:col-span-2 lg:col-span-6"/>
      </form>
      <div className="grid gap-3 md:grid-cols-2">{(catalog.data ?? []).map((item: any) => <article key={item.id} className="rounded-2xl border border-slate-200 p-4"><div className="flex justify-between gap-3"><div><h3 className="font-bold text-slate-900">{item.name}</h3><p className="mt-1 text-xs text-slate-500">{item.item_type === "room" ? "Chambre" : "Prestation / menu"}</p></div><strong className="text-indigo-700">{Number(item.price).toLocaleString("fr-MA")} {item.currency}</strong></div>{item.description && <p className="mt-2 text-sm text-slate-600">{item.description}</p>}</article>)}{!(catalog.data?.length) && <Empty text="Aucun élément ajouté pour le moment."/>}</div>
    </section>}

    {canAvailability && <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <SectionTitle title="Calendrier de disponibilités" description="Définissez les plages horaires et la capacité de réservation."/>
      <form action={createAvailabilityRule} className="grid gap-3 rounded-2xl bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-6">
        <select name="day_of_week" className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm">{dayNames.map((day, index) => <option key={day} value={index}>{day}</option>)}</select>
        <input name="specific_date" type="date" aria-label="Ou date précise" className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm"/>
        <input name="starts_at" type="time" required defaultValue="09:00" className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm"/>
        <input name="ends_at" type="time" required defaultValue="17:00" className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm"/>
        <input name="slot_minutes" type="number" min="5" max="240" defaultValue="30" placeholder="Durée créneau" className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm"/>
        <button className="rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white">Ajouter plage</button>
      </form>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{(rules.data ?? []).map((rule: any) => <div key={rule.id} className="rounded-xl border border-slate-200 p-3 text-sm"><strong>{rule.specific_date || dayNames[rule.day_of_week ?? 0]}</strong><p className="mt-1 text-slate-500">{String(rule.starts_at).slice(0,5)} – {String(rule.ends_at).slice(0,5)} · créneau {rule.slot_minutes} min · capacité {rule.capacity}</p></div>)}{!(rules.data?.length) && <Empty text="Aucune disponibilité configurée."/>}</div>
    </section>}

    {canAppointments && <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <SectionTitle title="Rendez-vous & réservations" description="Consultez les demandes privées reçues depuis votre carte NFC et mettez leur statut à jour."/>
      <div className="grid gap-3 sm:grid-cols-3"><Metric label="Total" value={appointments.data?.length ?? 0}/><Metric label="En attente" value={(appointments.data ?? []).filter((x: any) => x.status === "pending").length}/><Metric label="Confirmés" value={(appointments.data ?? []).filter((x: any) => x.status === "confirmed").length}/></div>
      <div className="space-y-3">{(appointments.data ?? []).map((item: any) => <RequestCard key={item.id} item={item} action={updateAppointmentStatus} title={item.appointment_type === "consultation" ? "Consultation" : item.appointment_type === "restaurant_booking" ? "Réservation restaurant" : "Rendez-vous"} date={item.starts_at}/>) }{!(appointments.data?.length) && <Empty text="Aucune demande de rendez-vous reçue."/>}</div>
    </section>}

    {canGym && <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <SectionTitle title="Salle de sport · abonnements" description="Créez vos formules et suivez les demandes d'inscription."/>
      <form action={createGymPlan} className="grid gap-3 rounded-2xl bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-5">
        <input name="name" required placeholder="Nom de la formule" className="rounded-xl border border-slate-200 px-3 py-3 text-sm"/>
        <input name="price" required type="number" min="0" step="0.01" placeholder="Prix (MAD)" className="rounded-xl border border-slate-200 px-3 py-3 text-sm"/>
        <input name="duration_days" required type="number" min="1" defaultValue="30" placeholder="Durée (jours)" className="rounded-xl border border-slate-200 px-3 py-3 text-sm"/>
        <input name="currency" defaultValue="MAD" maxLength={3} className="rounded-xl border border-slate-200 px-3 py-3 text-sm"/>
        <button className="rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white">Créer formule</button>
        <textarea name="description" placeholder="Description" rows={2} className="rounded-xl border border-slate-200 px-3 py-3 text-sm"/>
        <textarea name="benefits" placeholder="Avantages (un par ligne)" rows={2} className="rounded-xl border border-slate-200 px-3 py-3 text-sm"/>
      </form>
      <div className="grid gap-3 md:grid-cols-2">{(plans.data ?? []).map((plan: any) => <article key={plan.id} className="rounded-2xl border border-slate-200 p-4"><h3 className="font-bold text-slate-900">{plan.name}</h3><p className="mt-1 text-sm text-slate-500">{plan.duration_days} jours · {(plan.benefits ?? []).join(" · ")}</p><p className="mt-2 font-black text-indigo-700">{Number(plan.price).toLocaleString("fr-MA")} {plan.currency}</p></article>)}{!(plans.data?.length) && <Empty text="Aucune formule d'abonnement créée."/>}</div>
      <h3 className="pt-3 text-lg font-black text-slate-900">Demandes d'inscription</h3>
      <div className="space-y-3">{(gymRegistrations.data ?? []).map((item: any) => <RequestCard key={item.id} item={item} action={updateGymRegistrationStatus} title="Inscription sport" date={item.created_at} detail={item.fitness_goals}/>) }{!(gymRegistrations.data?.length) && <Empty text="Aucune inscription reçue."/>}</div>
    </section>}

    {canSchool && <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <SectionTitle title="École & formation · programmes" description="Publiez vos programmes et gérez les préinscriptions des élèves."/>
      <form action={createSchoolProgram} className="grid gap-3 rounded-2xl bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <input name="title" required placeholder="Nom du programme" className="rounded-xl border border-slate-200 px-3 py-3 text-sm"/>
        <input name="duration_label" placeholder="Durée (ex. 3 mois)" className="rounded-xl border border-slate-200 px-3 py-3 text-sm"/>
        <input name="price" type="number" min="0" step="0.01" placeholder="Prix (MAD)" className="rounded-xl border border-slate-200 px-3 py-3 text-sm"/>
        <button className="rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white">Publier programme</button>
        <textarea name="description" placeholder="Description" rows={2} className="rounded-xl border border-slate-200 px-3 py-3 text-sm"/>
        <input name="start_date" type="date" aria-label="Date début" className="rounded-xl border border-slate-200 px-3 py-3 text-sm"/>
        <input name="end_date" type="date" aria-label="Date fin" className="rounded-xl border border-slate-200 px-3 py-3 text-sm"/>
        <input name="capacity" type="number" min="1" placeholder="Places disponibles" className="rounded-xl border border-slate-200 px-3 py-3 text-sm"/>
      </form>
      <div className="grid gap-3 md:grid-cols-2">{(programs.data ?? []).map((program: any) => <article key={program.id} className="rounded-2xl border border-slate-200 p-4"><h3 className="font-bold text-slate-900">{program.title}</h3><p className="mt-1 text-sm text-slate-500">{program.duration_label || "Durée à préciser"} · {program.start_date || "Date à définir"}</p>{program.description && <p className="mt-2 text-sm text-slate-600">{program.description}</p>}</article>)}{!(programs.data?.length) && <Empty text="Aucun programme publié."/>}</div>
      <h3 className="pt-3 text-lg font-black text-slate-900">Préinscriptions reçues</h3>
      <div className="space-y-3">{(enrollments.data ?? []).map((item: any) => <RequestCard key={item.id} item={item} action={updateSchoolEnrollmentStatus} title="Préinscription" date={item.created_at} detail={item.message}/>) }{!(enrollments.data?.length) && <Empty text="Aucune préinscription reçue."/>}</div>
    </section>}
  </div>;
}

function SectionTitle({ title, description }: { title: string; description: string }) {
  return <header><h2 className="text-xl font-black text-slate-950">{title}</h2><p className="mt-1 text-sm text-slate-500">{description}</p></header>;
}
function Empty({ text }: { text: string }) { return <p className="rounded-xl border border-dashed border-slate-200 p-5 text-center text-sm text-slate-500">{text}</p>; }
function Metric({ label, value }: { label: string; value: number }) { return <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-2xl font-black text-slate-900">{value}</p></div>; }
function RequestCard({ item, action, title, date, detail }: { item: any; action: (data: FormData) => Promise<void>; title: string; date: string; detail?: string | null }) {
  return <article className="rounded-2xl border border-slate-200 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-bold text-slate-900">{item.customer_name || item.full_name || item.student_name} · {title}</h3><p className="mt-1 text-xs text-slate-500">{new Date(date).toLocaleString("fr-FR")}</p><p className="mt-2 text-sm text-slate-600">{item.customer_phone || item.phone || item.guardian_phone || "Téléphone non renseigné"}{item.customer_email || item.email || item.student_email ? " · " + (item.customer_email || item.email || item.student_email) : ""}</p>{detail && <p className="mt-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">{detail}</p>}</div><span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">{statusLabels[item.status] || item.status}</span></div><form action={action} className="mt-4 flex gap-2 border-t border-slate-100 pt-3"><input type="hidden" name="id" value={item.id}/><select name="status" defaultValue={item.status} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">{Object.entries(statusLabels).map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select><button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white">Enregistrer</button></form></article>;
}
