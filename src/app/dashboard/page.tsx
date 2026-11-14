import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isPlatformSuperAdmin } from "@/lib/auth/platform-admin";
import { I18nText } from "@/i18n/provider";

const moduleNames: Record<string, string> = {
  digital_card: "Carte digitale",
  company_profile: "Profil entreprise",
  contact_profile: "Profil contact",
  product_catalog: "Catalogue produits",
  service_catalog: "Prestations / menu",
  room_catalog: "Chambres",
  bookings: "Réservations",
  availability_calendar: "Disponibilités",
  crm: "Contacts & prospects",
  orders: "Commandes",
  quotes: "Demandes de devis",
};

export default async function DashboardPage() {
  await connection();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (isPlatformSuperAdmin(user.email)) redirect("/dashboard/admin");

  const fullName = String(user.user_metadata.full_name || user.user_metadata.name || "").trim();
  const { data: membership } = await supabase.from("organization_members")
    .select("organization_id").eq("user_id", user.id).limit(1).maybeSingle();
  const organizationId = membership?.organization_id;
  const [{ data: organization }, { data: cards }] = await Promise.all([
    organizationId ? supabase.from("organizations").select("name,workspace_config").eq("id", organizationId).maybeSingle() : Promise.resolve({ data: null }),
    organizationId ? supabase.from("cards").select("id,is_published,full_name,company_name,phone,email,avatar_url,bio").eq("organization_id", organizationId) : Promise.resolve({ data: [] as {id:string;is_published:boolean;full_name:string;company_name:string|null;phone:string|null;email:string|null;avatar_url:string|null;bio:string|null}[] }),
  ]);
  const config = (organization?.workspace_config ?? {}) as { version?: number; modules?: string[]; template?: string; original_client_choices?: { activity_sector?: string } };
  const hasWorkspaceConfig = Boolean(config.version);
  const enabledModules = Array.isArray(config.modules) ? config.modules : [];
  const canUseCards = !hasWorkspaceConfig || enabledModules.includes("digital_card");
  const cardIds = (cards ?? []).map((card) => card.id);
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const [{ data: events }, { count: contactCount }, { count: pendingRequests }, { count: pendingAppointments }, { count: pendingRentalBookings }, { count: pendingHealthAppointments }, { count: catalogCount }] = await Promise.all([
    cardIds.length ? supabase.from("card_events").select("event_type").in("card_id", cardIds).gte("created_at", since) : Promise.resolve({ data: [] as {event_type:string}[] }),
    organizationId ? supabase.from("contacts").select("id", { count: "exact", head: true }).eq("organization_id", organizationId) : Promise.resolve({ count: 0 }),
    organizationId ? supabase.from("workspace_requests").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("status", "pending") : Promise.resolve({ count: 0 }),
    organizationId ? supabase.from("business_appointments").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("status", "pending") : Promise.resolve({ count: 0 }),
    organizationId && enabledModules.includes("car_rental") ? supabase.from("rental_bookings").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("status", "pending") : Promise.resolve({ count: 0 }),
    organizationId && enabledModules.includes("doctor_appointments") ? supabase.from("healthcare_appointments").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("status", "pending") : Promise.resolve({ count: 0 }),
    organizationId && enabledModules.some((id) => ["product_catalog", "service_catalog", "room_catalog"].includes(id)) ? supabase.from("business_catalog_items").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("is_active", true) : Promise.resolve({ count: 0 }),
  ]);
  const views = (events ?? []).filter((event) => ["view", "qr_scan", "nfc_scan"].includes(event.event_type)).length;
  const stats = [
    { label: "Cartes NFC", value: String(cards?.length ?? 0), note: (cards ?? []).filter((card) => card.is_published).length + " publiée(s)" },
    { label: "Visites & scans", value: String(views), note: "30 derniers jours" },
    { label: "Contacts collectés", value: String(contactCount ?? 0), note: "Contacts enregistrés" },
    { label: "Demandes en attente", value: String((pendingRequests ?? 0) + (pendingAppointments ?? 0) + (pendingRentalBookings ?? 0) + (pendingHealthAppointments ?? 0)), note: "À traiter dans votre espace" },
  ];

  const published = (cards ?? []).some((card) => card.is_published);
  const hasCard = (cards ?? []).length > 0;
  const catalogRequired = enabledModules.some((id) => ["product_catalog", "service_catalog", "room_catalog"].includes(id));
  const profileReady = (cards ?? []).some((card) => Boolean(card.phone || card.email) && Boolean(card.avatar_url || card.bio || card.company_name));
  const checklist = [
    { label: "Découvrir votre espace client", done: true, href: "/dashboard" },
    { label: "Créer votre carte NFC", done: hasCard, href: "/dashboard/cards" },
    { label: "Compléter vos coordonnées et votre présentation", done: profileReady, href: "/dashboard/cards" },
    { label: "Ajouter vos premiers éléments au catalogue", done: !catalogRequired || (catalogCount ?? 0) > 0, href: "/dashboard/modules" },
    { label: "Publier votre carte", done: published, href: "/dashboard/cards" },
  ];
  const progress = Math.round(checklist.filter((item) => item.done).length / checklist.length * 100);
  const sector = String(config.original_client_choices?.activity_sector ?? "").trim();
  const sectorLabel = sector || (config.template === "e-business" ? "Commerce & services" : config.template === "service" ? "Services" : "Votre activité");
  const activeModules = enabledModules.filter((id) => moduleNames[id]);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-indigo-950 to-blue-900 px-6 py-8 text-white shadow-xl sm:px-9 sm:py-10">
        <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-cyan-400/15 blur-3xl"/>
        <div className="relative flex flex-wrap items-end justify-between gap-5">
          <div className="max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[.2em] text-cyan-300">Votre espace professionnel · TouchCard Business</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl"><I18nText message="hello" />{fullName ? " " + fullName : ""} 👋</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">Bienvenue dans votre espace {organization?.name ? "« " + organization.name + " »" : "client"}. Retrouvez ici vos outils, vos demandes et les prochaines étapes pour lancer votre présence digitale.</p>
            <div className="mt-5 flex flex-wrap gap-2"><span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white">{sectorLabel}</span><span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1.5 text-xs font-semibold text-emerald-200">Espace activé</span></div>
          </div>
          {canUseCards && <Link href="/dashboard/cards" className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-black text-slate-950 shadow-lg transition hover:-translate-y-0.5 hover:bg-cyan-50">Personnaliser ma carte <span aria-hidden="true">→</span></Link>}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((metric) => <article key={metric.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm font-semibold text-slate-500">{metric.label}</p><p className="mt-3 text-3xl font-black tracking-tight text-slate-950">{metric.value}</p><p className="mt-2 text-xs text-slate-400">{metric.note}</p></article>)}
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_.75fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><p className="text-xs font-black uppercase tracking-[.16em] text-indigo-600">Démarrage</p><h2 className="mt-2 text-xl font-black text-slate-950">Préparons votre espace</h2><p className="mt-1 text-sm text-slate-500">Quelques étapes simples pour présenter votre activité aux futurs clients.</p></div>
            <span className="rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-black text-indigo-700">{progress}% terminé</span>
          </div>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-indigo-600 transition-all" style={{width: progress + "%"}}/></div>
          <div className="mt-5 space-y-2">
            {checklist.map((item, index) => <Link key={item.label} href={item.href} className="group flex items-center gap-3 rounded-2xl border border-slate-100 p-3.5 transition hover:border-indigo-200 hover:bg-indigo-50/50">
              <span className={"flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black " + (item.done ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500")}>{item.done ? "✓" : index + 1}</span>
              <span className={"min-w-0 flex-1 text-sm font-semibold " + (item.done ? "text-slate-500" : "text-slate-800")}>{item.label}</span>
              <span className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-indigo-600">→</span>
            </Link>)}
          </div>
        </section>

        <section className="space-y-5">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[.16em] text-indigo-600">Vos outils activés</p>
            <h2 className="mt-2 text-xl font-black text-slate-950">Un espace adapté à votre activité</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">Les modules ci-dessous correspondent aux fonctionnalités configurées pour votre compte.</p>
            <div className="mt-4 flex flex-wrap gap-2">{activeModules.length ? activeModules.map((id) => <span key={id} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700">{moduleNames[id]}</span>) : <span className="text-sm text-slate-400">Configuration standard</span>}</div>
            {enabledModules.some((id) => ["product_catalog", "service_catalog", "room_catalog", "bookings", "availability_calendar"].includes(id)) && <Link href="/dashboard/modules" className="mt-5 inline-flex text-sm font-bold text-indigo-700 hover:underline">Gérer mes modules métier →</Link>}
          </div>
          <div className="rounded-3xl bg-slate-950 p-6 text-white shadow-sm">
            <p className="text-xs font-black uppercase tracking-[.16em] text-cyan-300">Besoin d'aide ?</p><h2 className="mt-2 text-xl font-black">Votre réussite commence ici.</h2><p className="mt-2 text-sm leading-6 text-slate-300">Configurez votre carte, vérifiez son aperçu puis publiez-la lorsque tout est prêt.</p><Link href="/dashboard/cards" className="mt-4 inline-flex rounded-xl bg-white/10 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/15">Ouvrir le studio NFC →</Link>
          </div>
        </section>
      </div>
    </div>
  );
}
