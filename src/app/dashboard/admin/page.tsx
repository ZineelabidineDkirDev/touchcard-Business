import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isPlatformSuperAdmin } from "@/lib/auth/platform-admin";
import MoroccoProspectMap from "@/components/dashboard/morocco-prospect-map";

type Prospect = { id: string; city: string; status: string; card_type: string; created_at: string; activity_sector: string | null; project_needs: { selected?: string[] } | string[] | null };

const statusLabels: Record<string, string> = {
  new: "Nouvelles", to_contact: "À contacter", in_discussion: "En discussion",
  quote_sent: "Devis envoyés", approved: "Validées", in_production: "En production",
  completed: "Terminées", rejected: "Refusées", cancelled: "Annulées",
};

export default async function AdminDashboardPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string; card?: string; city?: string }> }) {
  await connection();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  if (!isPlatformSuperAdmin(user.email)) {
    return <main className="mx-auto max-w-3xl rounded-3xl border border-amber-200 bg-white p-8 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[.2em] text-indigo-600">TouchCard Business · Administration globale</p>
      <h1 className="mt-3 text-3xl font-black text-slate-950">Activation du Super Admin nécessaire</h1>
      <p className="mt-3 leading-7 text-slate-600">La vue globale est prête à être activée, mais ce compte n’est pas encore enregistré comme administrateur de la plateforme. Aucun accès n’est accordé automatiquement pour protéger les données des clients.</p>
      <p className="mt-4 text-sm text-slate-500">Connecté avec : <strong className="text-slate-800">{user.email}</strong></p>
    </main>;
  }

  const filters = await searchParams;
  const [prospectsResult, orgsResult, cardsResult, linksResult, eventsResult] = await Promise.all([
    supabase.from("prospect_requests").select("id,city,status,card_type,created_at,activity_sector,project_needs").order("created_at", { ascending: false }),
    supabase.from("organizations").select("id", { count: "exact", head: true }),
    supabase.from("cards").select("id,is_published", { count: "exact" }),
    supabase.from("card_links").select("id", { count: "exact", head: true }),
    supabase.from("card_events").select("id,event_type,created_at", { count: "exact" }),
  ]);

  const prospects = (prospectsResult.data ?? []) as Prospect[];
  const clients = orgsResult.count ?? 0;
  const allCities = [...new Set(prospects.map((p) => (p.city || "").trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "fr"));
  const fromDate = filters.from && /^\\d{4}-\\d{2}-\\d{2}$/.test(filters.from) ? filters.from : "";
  const toDate = filters.to && /^\\d{4}-\\d{2}-\\d{2}$/.test(filters.to) ? filters.to : "";
  const filteredProspects = prospects.filter((p) => {
    const date = p.created_at.slice(0, 10);
    return (!fromDate || date >= fromDate) && (!toDate || date <= toDate)
      && (!filters.card || p.card_type === filters.card)
      && (!filters.city || p.city.trim() === filters.city);
  });
  const cards = cardsResult.data ?? [];
  const totalCards = cardsResult.count ?? cards.length;
  const publishedCards = cards.filter((card) => card.is_published).length;
  const links = linksResult.count ?? 0;
  const events = eventsResult.count ?? 0;
  const openStatuses = ["new", "to_contact", "in_discussion", "quote_sent"];
  const openRequests = filteredProspects.filter((p) => openStatuses.includes(p.status)).length;
  const approved = filteredProspects.filter((p) => ["approved", "in_production", "completed"].includes(p.status)).length;
  const cityCounts = filteredProspects.reduce<Record<string, number>>((acc, p) => {
    const city = (p.city || "Non renseignée").trim();
    acc[city] = (acc[city] || 0) + 1;
    return acc;
  }, {});
  const topCities = Object.entries(cityCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const cardTypes = ["e-business", "contact", "service"].map((type) => ({
    label: type === "e-business" ? "E-Business" : type === "contact" ? "Contact" : "Service",
    count: filteredProspects.filter((p) => p.card_type === type).length,
  }));
  // Anchor the chart to the latest persisted prospect timestamp.
  // This avoids reading the wall clock during prerendering.
  const chartAnchor = new Date(filteredProspects[0]?.created_at ?? prospects[0]?.created_at ?? "2026-01-01T00:00:00.000Z");
  const monthStarts = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(chartAnchor.getFullYear(), chartAnchor.getMonth() - (5 - i), 1);
    return d;
  });
  const monthLabels = monthStarts.map((d) =>
    d.toLocaleDateString("fr-FR", { month: "short" })
  );
  const monthValues = monthStarts.map((d) =>
    filteredProspects.filter((p) => {
      const created = new Date(p.created_at);
      return created.getFullYear() === d.getFullYear() && created.getMonth() === d.getMonth();
    }).length
  );
  const maxMonth = Math.max(1, ...monthValues);
  const maxCity = Math.max(1, ...topCities.map(([, n]) => n));
  const serviceCounts = new Map<string, number>();
  filteredProspects.forEach((p) => {
    const needs = Array.isArray(p.project_needs) ? p.project_needs : p.project_needs?.selected ?? [];
    needs.forEach((need) => {
      const label = String(need).trim();
      if (label) serviceCounts.set(label, (serviceCounts.get(label) ?? 0) + 1);
    });
  });
  const sectorCounts = new Map<string, number>();
  filteredProspects.forEach((p) => (p.activity_sector ?? "").split(",").map((v) => v.trim()).filter(Boolean).forEach((sector) => sectorCounts.set(sector, (sectorCounts.get(sector) ?? 0) + 1)));
  const topSectors = [...sectorCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  const maxSector = Math.max(1, ...topSectors.map(([, count]) => count));
  const topServices = [...serviceCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  const maxService = Math.max(1, ...topServices.map(([, count]) => count));

  return <div className="mx-auto max-w-7xl space-y-7">
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-xs font-black uppercase tracking-[.2em] text-indigo-600">TouchCard Business · Super Admin</p><h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Vue globale</h1><p className="mt-2 text-slate-500">Pilotage des clients, demandes, cartes et performances commerciales.</p></div>
      <a href="/dashboard/prospects" className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700">Consulter les demandes ↗</a>
    </header>

    <form method="get" className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><div><h2 className="text-base font-black text-slate-950">Filtres d’analyse</h2><p className="mt-1 text-sm text-slate-500">Les graphiques, la carte et les classements suivent ces critères.</p></div><span className="rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700">{filteredProspects.length} / {prospects.length} demandes</span></div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <label className="text-xs font-bold text-slate-600">Du <input type="date" name="from" defaultValue={fromDate} max={toDate || undefined} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"/></label>
        <label className="text-xs font-bold text-slate-600">Au <input type="date" name="to" defaultValue={toDate} min={fromDate || undefined} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"/></label>
        <label className="text-xs font-bold text-slate-600">Type de carte <select name="card" defaultValue={filters.card ?? ""} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-900 outline-none focus:border-indigo-400"><option value="">Tous les types</option><option value="e-business">E-Business</option><option value="contact">Contact</option><option value="service">Service</option></select></label>
        <label className="text-xs font-bold text-slate-600">Ville <select name="city" defaultValue={filters.city ?? ""} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-900 outline-none focus:border-indigo-400"><option value="">Toutes les villes</option>{allCities.map((city) => <option key={city} value={city}>{city}</option>)}</select></label>
        <div className="flex items-end gap-2"><button type="submit" className="flex-1 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-indigo-700">Appliquer</button><a href="/dashboard/admin" className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50">Effacer</a></div>
      </div>
    </form>

    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Metric label="Clients / organisations" value={clients} note="Comptes clients créés" icon="◈"/>
      <Metric label="Demandes filtrées" value={filteredProspects.length} note={openRequests + " à traiter"} icon="▤"/>
      <Metric label="Cartes digitales" value={totalCards} note={publishedCards + " publiées"} icon="▣"/>
      <Metric label="Liens de cartes" value={links} note="Liens enregistrés" icon="↗"/>
    </section>
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Metric label="Demandes en cours" value={openRequests} note="Nouvelles, contact et devis" />
      <Metric label="Demandes validées" value={approved} note="Validées ou en production" />
      <Metric label="Interactions enregistrées" value={events} note="Vues, scans et clics" />
      <Metric label="Taux de validation" value={filteredProspects.length ? Math.round(approved / filteredProspects.length * 100) + "%" : "0%"} note="Sur toutes les demandes" />
    </section>

    <section className="grid gap-5 xl:grid-cols-[1.35fr_.9fr]">
      <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-black text-slate-950">Répartition géographique au Maroc</h2><p className="mt-1 text-sm text-slate-500">Localisation des demandes prospects par ville</p></div><span className="rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700">{filteredProspects.length} demandes</span></div>
        <div className="mt-5 grid gap-5 lg:grid-cols-[1.1fr_.8fr]">
          <MoroccoProspectMap cities={Object.entries(cityCounts).map(([city, count]) => ({ city, count }))} />
          <div><h3 className="text-sm font-bold text-slate-800">Villes les plus représentées</h3><div className="mt-4 space-y-4">{topCities.map(([city, count]) => <div key={city}><div className="mb-1.5 flex justify-between gap-3 text-sm"><span className="font-medium text-slate-700">{city}</span><strong className="text-slate-950">{count}</strong></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-indigo-600" style={{ width: (count / maxCity * 100) + "%" }}/></div></div>)}{!topCities.length && <p className="text-sm text-slate-400">Aucune ville enregistrée pour le moment.</p>}</div></div>
        </div>
      </article>
      <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-black text-slate-950">Évolution des demandes</h2><p className="mt-1 text-sm text-slate-500">Demandes reçues · période filtrée</p>
        <div className="mt-8 flex h-52 items-end justify-between gap-3 border-b border-slate-100 px-1">{monthValues.map((value, i) => <div key={monthLabels[i]} className="flex h-full flex-1 flex-col items-center justify-end gap-2"><span className="text-xs font-bold text-slate-600">{value}</span><div className="flex w-full flex-1 items-end"><div className="w-full rounded-t-lg bg-indigo-500 transition-all" style={{ height: Math.max(value ? 8 : 2, value / maxMonth * 100) + "%" }}/></div><span className="text-xs text-slate-400">{monthLabels[i]}</span></div>)}</div>
        <div className="mt-6 space-y-3"><div className="flex justify-between text-sm"><span className="text-slate-500">Validées / converties</span><strong className="text-slate-900">{approved}</strong></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500" style={{ width: (filteredProspects.length ? approved / filteredProspects.length * 100 : 0) + "%" }}/></div></div>
      </article>
    </section>

    <section className="grid gap-5 xl:grid-cols-2">
      <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-black text-slate-950">Secteurs d’activité demandés</h2><p className="mt-1 text-sm text-slate-500">Domaines déclarés par les prospects, classés par popularité.</p></div><span className="rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700">{sectorCounts.size} secteurs</span></div>
        {topSectors.length ? <div className="mt-6 space-y-4">{topSectors.map(([sector, count], index) => <div key={sector}><div className="mb-1.5 flex items-center justify-between gap-3 text-sm"><span className="font-semibold text-slate-700">{index + 1}. {sector}</span><strong className="text-slate-950">{count} <span className="font-medium text-slate-400">demande(s)</span></strong></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-indigo-600" style={{ width: (count / maxSector * 100) + "%" }}/></div></div>)}</div> : <p className="mt-6 rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-500">Aucun secteur renseigné pour cette sélection.</p>}
      </article>
      <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-black text-slate-950">Besoins & fonctionnalités demandés</h2><p className="mt-1 text-sm text-slate-500">Choix déclarés dans le formulaire de projet.</p></div><span className="rounded-full bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-700">{serviceCounts.size} besoins</span></div>
        {topServices.length ? <div className="mt-6 space-y-4">{topServices.map(([service, count], index) => <div key={service}><div className="mb-1.5 flex items-center justify-between gap-3 text-sm"><span className="font-semibold text-slate-700">{index + 1}. {service}</span><strong className="text-slate-950">{count} <span className="font-medium text-slate-400">demande(s)</span></strong></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-violet-600" style={{ width: (count / maxService * 100) + "%" }}/></div></div>)}</div> : <p className="mt-6 rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-500">Aucun besoin détaillé renseigné pour cette sélection.</p>}
      </article>
    </section>
    <section className="grid gap-5 xl:grid-cols-2">
      <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><h2 className="text-lg font-black text-slate-950">Demandes par type de carte</h2><p className="mt-1 text-sm text-slate-500">Préférences exprimées par les prospects</p><div className="mt-6 space-y-5">{cardTypes.map((item) => <div key={item.label}><div className="mb-2 flex justify-between text-sm"><span className="font-semibold text-slate-700">{item.label}</span><strong className="text-slate-950">{item.count}</strong></div><div className="h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-violet-500" style={{ width: (filteredProspects.length ? item.count / filteredProspects.length * 100 : 0) + "%" }}/></div></div>)}</div></article>
      <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><h2 className="text-lg font-black text-slate-950">Pipeline commercial</h2><p className="mt-1 text-sm text-slate-500">État actuel des demandes</p><div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">{Object.entries(statusLabels).map(([status, label]) => <div key={status} className="rounded-2xl bg-slate-50 p-3"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-2xl font-black text-slate-900">{filteredProspects.filter((p) => p.status === status).length}</p></div>)}</div></article>
    </section>
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-center justify-between gap-3"><div><h2 className="text-lg font-black text-slate-950">Demandes récentes</h2><p className="mt-1 text-sm text-slate-500">Les cinq dernières demandes reçues</p></div><a href="/dashboard/prospects" className="text-sm font-bold text-indigo-600 hover:text-indigo-800">Tout voir →</a></div><div className="mt-5 divide-y divide-slate-100">{filteredProspects.slice(0,5).map((p) => <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><p className="font-bold text-slate-800">{p.city}</p><p className="mt-1 text-xs text-slate-400">{new Date(p.created_at).toLocaleDateString("fr-FR")} · {p.card_type}</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{statusLabels[p.status] || p.status}</span></div>)}{!filteredProspects.length && <p className="py-8 text-center text-sm text-slate-400">Aucune demande pour ces filtres.</p>}</div></section>
    {(prospectsResult.error || orgsResult.error || cardsResult.error || linksResult.error || eventsResult.error) && <p className="text-xs text-amber-700">Certaines statistiques n’ont pas pu être chargées. Vérifiez les autorisations Supabase.</p>}
  </div>;
}

function Metric({ label, value, note, icon }: { label: string; value: number | string; note: string; icon?: string }) {
  return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold text-slate-500">{label}</p>{icon && <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-lg text-indigo-700">{icon}</span>}</div><p className="mt-3 text-3xl font-black tracking-tight text-slate-950">{value}</p><p className="mt-1 text-xs text-slate-400">{note}</p></article>;
}
