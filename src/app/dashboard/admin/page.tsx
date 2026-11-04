import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Prospect = { id: string; city: string; status: string; card_type: string; created_at: string };

const cityPoints: Record<string, { x: number; y: number }> = {
  "Tanger": { x: 47, y: 12 }, "Tétouan": { x: 57, y: 17 }, "Oujda": { x: 84, y: 25 },
  "Fès": { x: 65, y: 35 }, "Meknès": { x: 57, y: 34 }, "Rabat": { x: 47, y: 43 },
  "Casablanca": { x: 43, y: 51 }, "El Jadida": { x: 38, y: 58 }, "Marrakech": { x: 51, y: 68 },
  "Agadir": { x: 39, y: 81 }, "Laâyoune": { x: 34, y: 93 }, "Béni Mellal": { x: 62, y: 57 },
  "Ouarzazate": { x: 68, y: 76 }, "Errachidia": { x: 80, y: 57 }, "Safi": { x: 34, y: 66 },
};

const statusLabels: Record<string, string> = {
  new: "Nouvelles", to_contact: "À contacter", in_discussion: "En discussion",
  quote_sent: "Devis envoyés", approved: "Validées", in_production: "En production",
  completed: "Terminées", rejected: "Refusées", cancelled: "Annulées",
};

export default async function AdminDashboardPage() {
  await connection();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership } = await supabase.from("organization_members")
    .select("role").eq("user_id", user.id).eq("role", "super_admin").limit(1).maybeSingle();

  if (!membership) {
    return <main className="mx-auto max-w-3xl rounded-3xl border border-amber-200 bg-white p-8 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[.2em] text-indigo-600">TouchCard Business · Administration globale</p>
      <h1 className="mt-3 text-3xl font-black text-slate-950">Activation du Super Admin nécessaire</h1>
      <p className="mt-3 leading-7 text-slate-600">La vue globale est prête à être activée, mais ce compte n’est pas encore enregistré comme administrateur de la plateforme. Aucun accès n’est accordé automatiquement pour protéger les données des clients.</p>
      <p className="mt-4 text-sm text-slate-500">Connecté avec : <strong className="text-slate-800">{user.email}</strong></p>
    </main>;
  }

  const [prospectsResult, orgsResult, cardsResult, linksResult, eventsResult] = await Promise.all([
    supabase.from("prospect_requests").select("id,city,status,card_type,created_at").order("created_at", { ascending: false }),
    supabase.from("organizations").select("id", { count: "exact", head: true }),
    supabase.from("cards").select("id,is_published", { count: "exact" }),
    supabase.from("card_links").select("id", { count: "exact", head: true }),
    supabase.from("card_events").select("id,event_type,created_at", { count: "exact" }),
  ]);

  const prospects = (prospectsResult.data ?? []) as Prospect[];
  const clients = orgsResult.count ?? 0;
  const cards = cardsResult.data ?? [];
  const totalCards = cardsResult.count ?? cards.length;
  const publishedCards = cards.filter((card) => card.is_published).length;
  const links = linksResult.count ?? 0;
  const events = eventsResult.count ?? 0;
  const openStatuses = ["new", "to_contact", "in_discussion", "quote_sent"];
  const openRequests = prospects.filter((p) => openStatuses.includes(p.status)).length;
  const approved = prospects.filter((p) => ["approved", "in_production", "completed"].includes(p.status)).length;
  const cityCounts = prospects.reduce<Record<string, number>>((acc, p) => {
    const city = (p.city || "Non renseignée").trim();
    acc[city] = (acc[city] || 0) + 1;
    return acc;
  }, {});
  const topCities = Object.entries(cityCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const cardTypes = ["e-business", "contact", "service"].map((type) => ({
    label: type === "e-business" ? "E-Business" : type === "contact" ? "Contact" : "Service",
    count: prospects.filter((p) => p.card_type === type).length,
  }));
  const monthLabels = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - (5 - i)); d.setDate(1);
    return d.toLocaleDateString("fr-FR", { month: "short" });
  });
  const monthValues = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - (5 - i)); d.setDate(1);
    return prospects.filter((p) => {
      const created = new Date(p.created_at);
      return created.getFullYear() === d.getFullYear() && created.getMonth() === d.getMonth();
    }).length;
  });
  const maxMonth = Math.max(1, ...monthValues);
  const maxCity = Math.max(1, ...topCities.map(([, n]) => n));

  return <div className="mx-auto max-w-7xl space-y-7">
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-xs font-black uppercase tracking-[.2em] text-indigo-600">TouchCard Business · Super Admin</p><h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Vue globale</h1><p className="mt-2 text-slate-500">Pilotage des clients, demandes, cartes et performances commerciales.</p></div>
      <a href="/dashboard/prospects" className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700">Consulter les demandes ↗</a>
    </header>

    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Metric label="Clients / organisations" value={clients} note="Comptes clients créés" icon="◈"/>
      <Metric label="Demandes reçues" value={prospects.length} note={openRequests + " à traiter"} icon="▤"/>
      <Metric label="Cartes digitales" value={totalCards} note={publishedCards + " publiées"} icon="▣"/>
      <Metric label="Liens de cartes" value={links} note="Liens enregistrés" icon="↗"/>
    </section>
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Metric label="Demandes en cours" value={openRequests} note="Nouvelles, contact et devis" />
      <Metric label="Demandes validées" value={approved} note="Validées ou en production" />
      <Metric label="Interactions enregistrées" value={events} note="Vues, scans et clics" />
      <Metric label="Taux de validation" value={prospects.length ? Math.round(approved / prospects.length * 100) + "%" : "0%"} note="Sur toutes les demandes" />
    </section>

    <section className="grid gap-5 xl:grid-cols-[1.35fr_.9fr]">
      <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-black text-slate-950">Répartition géographique au Maroc</h2><p className="mt-1 text-sm text-slate-500">Localisation des demandes prospects par ville</p></div><span className="rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700">{prospects.length} demandes</span></div>
        <div className="mt-5 grid gap-5 lg:grid-cols-[1.1fr_.8fr]">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-50 via-slate-50 to-violet-50 p-3">
            <svg viewBox="0 0 100 110" role="img" aria-label="Carte schématique du Maroc avec les villes des prospects" className="mx-auto h-[330px] w-full max-w-[330px]">
              <path d="M30 3 L49 6 L58 12 L72 13 L86 23 L91 32 L82 40 L78 49 L82 57 L75 66 L72 76 L61 83 L55 96 L44 105 L30 101 L27 88 L20 78 L22 65 L14 55 L18 44 L13 32 L21 20 Z" fill="#dbeafe" stroke="#6366f1" strokeWidth="1.4" strokeLinejoin="round"/>
              <path d="M22 20 L42 22 L58 12 M18 44 L47 43 L78 49 M22 65 L51 68 L72 76 M27 88 L44 83 L55 96" fill="none" stroke="#a5b4fc" strokeWidth=".55" strokeDasharray="1.5 1.5"/>
              {Object.entries(cityCounts).map(([city, count]) => {
                const point = cityPoints[city];
                if (!point) return null;
                return <g key={city}><circle cx={point.x} cy={point.y} r={3.2 + count * .8} fill="#4f46e5" fillOpacity=".18"/><circle cx={point.x} cy={point.y} r="1.8" fill="#4338ca" stroke="white" strokeWidth=".8"/><title>{city}: {count} demande(s)</title></g>;
              })}
            </svg>
            <p className="text-center text-[11px] text-slate-500">Carte schématique · les points représentent les villes renseignées</p>
          </div>
          <div><h3 className="text-sm font-bold text-slate-800">Zones les plus représentées</h3><div className="mt-4 space-y-4">{topCities.map(([city, count]) => <div key={city}><div className="mb-1.5 flex justify-between gap-3 text-sm"><span className="font-medium text-slate-700">{city}</span><strong className="text-slate-950">{count}</strong></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-indigo-600" style={{ width: (count / maxCity * 100) + "%" }}/></div></div>)}{!topCities.length && <p className="text-sm text-slate-400">Aucune ville enregistrée pour le moment.</p>}</div></div>
        </div>
      </article>
      <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-black text-slate-950">Évolution des demandes</h2><p className="mt-1 text-sm text-slate-500">Demandes reçues · 6 derniers mois</p>
        <div className="mt-8 flex h-52 items-end justify-between gap-3 border-b border-slate-100 px-1">{monthValues.map((value, i) => <div key={monthLabels[i]} className="flex h-full flex-1 flex-col items-center justify-end gap-2"><span className="text-xs font-bold text-slate-600">{value}</span><div className="flex w-full flex-1 items-end"><div className="w-full rounded-t-lg bg-indigo-500 transition-all" style={{ height: Math.max(value ? 8 : 2, value / maxMonth * 100) + "%" }}/></div><span className="text-xs text-slate-400">{monthLabels[i]}</span></div>)}</div>
        <div className="mt-6 space-y-3"><div className="flex justify-between text-sm"><span className="text-slate-500">Validées / converties</span><strong className="text-slate-900">{approved}</strong></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500" style={{ width: (prospects.length ? approved / prospects.length * 100 : 0) + "%" }}/></div></div>
      </article>
    </section>

    <section className="grid gap-5 xl:grid-cols-2">
      <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><h2 className="text-lg font-black text-slate-950">Demandes par type de carte</h2><p className="mt-1 text-sm text-slate-500">Préférences exprimées par les prospects</p><div className="mt-6 space-y-5">{cardTypes.map((item) => <div key={item.label}><div className="mb-2 flex justify-between text-sm"><span className="font-semibold text-slate-700">{item.label}</span><strong className="text-slate-950">{item.count}</strong></div><div className="h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-violet-500" style={{ width: (prospects.length ? item.count / prospects.length * 100 : 0) + "%" }}/></div></div>)}</div></article>
      <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><h2 className="text-lg font-black text-slate-950">Pipeline commercial</h2><p className="mt-1 text-sm text-slate-500">État actuel des demandes</p><div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">{Object.entries(statusLabels).map(([status, label]) => <div key={status} className="rounded-2xl bg-slate-50 p-3"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-2xl font-black text-slate-900">{prospects.filter((p) => p.status === status).length}</p></div>)}</div></article>
    </section>
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-center justify-between gap-3"><div><h2 className="text-lg font-black text-slate-950">Demandes récentes</h2><p className="mt-1 text-sm text-slate-500">Les cinq dernières demandes reçues</p></div><a href="/dashboard/prospects" className="text-sm font-bold text-indigo-600 hover:text-indigo-800">Tout voir →</a></div><div className="mt-5 divide-y divide-slate-100">{prospects.slice(0,5).map((p) => <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><p className="font-bold text-slate-800">{p.city}</p><p className="mt-1 text-xs text-slate-400">{new Date(p.created_at).toLocaleDateString("fr-FR")} · {p.card_type}</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{statusLabels[p.status] || p.status}</span></div>)}{!prospects.length && <p className="py-8 text-center text-sm text-slate-400">Aucune demande enregistrée.</p>}</div></section>
    {(prospectsResult.error || orgsResult.error || cardsResult.error || linksResult.error || eventsResult.error) && <p className="text-xs text-amber-700">Certaines statistiques n’ont pas pu être chargées. Vérifiez les autorisations Supabase.</p>}
  </div>;
}

function Metric({ label, value, note, icon }: { label: string; value: number | string; note: string; icon?: string }) {
  return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold text-slate-500">{label}</p>{icon && <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-lg text-indigo-700">{icon}</span>}</div><p className="mt-3 text-3xl font-black tracking-tight text-slate-950">{value}</p><p className="mt-1 text-xs text-slate-400">{note}</p></article>;
}
