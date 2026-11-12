"use client";

import { useMemo, useState } from "react";
import { PhysicalNfcCard, type CardColorTheme } from "@/components/cards/physical-nfc-card";

type Prospect = {
  id: string;
  user_id: string | null;
  full_name: string;
  email: string;
  phone: string;
  city: string;
  activity_sector: string;
  card_type: string;
  status: string;
  client_access_enabled: boolean;
  password_initialized: boolean;
  created_at: string;
  brand_name: string | null;
  reason: string | null;
  project_needs: { selected?: string[] } | string[] | null;
  organization_name: string | null;
  cards: ClientCard[];
  design_status: string | null;
  design_template: string | null;
};
type ClientCard = {
  id: string;
  slug: string;
  full_name: string;
  job_title: string | null;
  company_name: string | null;
  is_published: boolean;
  theme: Record<string, unknown> | null;
  created_at: string;
  links: { id: string; label: string; url: string; kind: string }[];
  views: number;
  nfc_scans: number;
  qr_scans: number;
  clicks: number;
  saves: number;
};
type Props = { prospects: Prospect[] };

const statusLabels: Record<string, string> = {
  new: "Nouveau", to_contact: "À contacter", in_discussion: "En discussion",
  quote_sent: "Devis envoyé", approved: "Validé", correction_requested: "Correction demandée",
  in_production: "En production", completed: "Terminé", rejected: "Refusé", cancelled: "Annulé",
};
const typeLabels: Record<string, string> = {
  contact: "Contact", service: "Personnalisée", "e-business": "E-Business", "google-review": "Avis Google",
};
const typeTitles: Record<string, string> = {
  contact: "Contact", service: "Service", "e-business": "E-Business", "google-review": "Avis Google",
};

function canShowCard(client: Prospect) {
  return Boolean(client.user_id && client.client_access_enabled && ["approved", "in_production", "completed"].includes(client.status));
}
function statusStyle(status: string) {
  if (["completed", "in_production"].includes(status)) return "bg-emerald-50 text-emerald-700";
  if (status === "approved") return "bg-indigo-50 text-indigo-700";
  if (["rejected", "cancelled"].includes(status)) return "bg-rose-50 text-rose-700";
  return "bg-amber-50 text-amber-800";
}
function formatDate(value: string) {
  return new Date(value).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}
function colorForType(type: string): CardColorTheme {
  void type;
  return "metallic-black"; // modèle TouchCard (noir, bleu néon) pour tous les types de carte
}

export function AdminClientCards({ prospects }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => prospects.filter((client) => {
    const query = search.trim().toLocaleLowerCase("fr");
    const matchesSearch = !query || [client.full_name, client.email, client.phone, client.city, client.brand_name ?? ""].some((v) => v.toLocaleLowerCase("fr").includes(query));
    const active = canShowCard(client);
    const matchesFilter = filter === "all" || (filter === "active" && active) || (filter === "pending" && !active && !["rejected", "cancelled"].includes(client.status)) || (filter === "blocked" && ["rejected", "cancelled"].includes(client.status));
    return matchesSearch && matchesFilter;
  }), [prospects, filter, search]);
  const selected = (selectedId ? filtered.find((client) => client.id === selectedId) : null) ?? null;
  const activeCount = prospects.filter(canShowCard).length;
  const pendingCount = prospects.filter((p) => !canShowCard(p) && !["rejected", "cancelled"].includes(p.status)).length;
  const totalCards = prospects.filter(canShowCard).reduce((sum, p) => sum + p.cards.length, 0);

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[.2em] text-indigo-600">TouchCard Business · Super Admin</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Portefeuille clients</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">Gérez les comptes clients validés, leurs cartes NFC 3D, leurs accès et leurs performances depuis une seule vue.</p>
        </div>
        <a href="/dashboard/prospects" className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">Gérer les demandes ↗</a>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Comptes clients" value={prospects.filter((p) => Boolean(p.user_id)).length} note="Comptes associés à une demande"/>
        <Metric label="Clients actifs" value={activeCount} note="Accès client ouvert"/>
        <Metric label="En attente / verrouillés" value={pendingCount} note="Carte masquée jusqu'à activation"/>
        <Metric label="Cartes digitales" value={totalCards} note="Cartes des clients actifs"/>
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><h2 className="text-lg font-black text-slate-950">Répertoire clients & cartes</h2><p className="mt-1 text-sm text-slate-500">Cliquez sur une ligne pour ouvrir la fiche complète du client.</p></div>
            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">{filtered.length} résultat(s)</span>
          </div>
          <div className="mt-4 flex flex-col gap-3 md:flex-row">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un client, e-mail, ville…" className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"/>
            <div className="flex flex-wrap gap-2">
              {[["all","Tous"],["active","Actifs"],["pending","En attente"],["blocked","Refusés"]].map(([key,label]) => <button key={key} type="button" onClick={() => setFilter(key)} className={"rounded-xl px-3 py-2.5 text-xs font-bold transition " + (filter === key ? "bg-indigo-600 text-white" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50")}>{label}</button>)}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-left text-sm">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-3">Client</th><th className="px-5 py-3">Carte choisie</th><th className="px-5 py-3">Ville</th><th className="px-5 py-3">Compte</th><th className="px-5 py-3">Statut</th><th className="px-5 py-3">Date</th><th className="px-5 py-3 text-right">Détails</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((client) => {
                const active = canShowCard(client);
                const selectedRow = selected?.id === client.id;
                return <tr key={client.id} onClick={() => setSelectedId(client.id)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelectedId(client.id); } }} tabIndex={0} role="button" className={"cursor-pointer transition " + (selectedRow ? "bg-indigo-50/70" : "hover:bg-slate-50")}>
                  <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 font-black text-indigo-700">{client.full_name.split(/\s+/).slice(0,2).map((part) => part[0]).join("").toUpperCase()}</div><div className="min-w-0"><p className="font-bold text-slate-900">{client.full_name}</p><p className="mt-0.5 max-w-[220px] truncate text-xs text-slate-500">{client.email}</p></div></div></td>
                  <td className="px-5 py-4"><span className="font-semibold text-slate-800">{typeLabels[client.card_type] ?? client.card_type}</span><p className="mt-0.5 text-xs text-slate-400">{active ? client.cards.length + " carte(s) configurée(s)" : "Aperçu masqué"}</p></td>
                  <td className="px-5 py-4 text-slate-600">{client.city || "—"}</td>
                  <td className="px-5 py-4"><span className={"rounded-full px-2.5 py-1 text-xs font-bold " + (client.user_id ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500")}>{client.user_id ? "Créé" : "Non créé"}</span></td>
                  <td className="px-5 py-4"><span className={"rounded-full px-2.5 py-1 text-xs font-bold " + statusStyle(client.status)}>{statusLabels[client.status] ?? client.status}</span>{!active && client.user_id && <p className="mt-1 text-[10px] text-amber-700">Accès non activé</p>}</td>
                  <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-500">{formatDate(client.created_at)}</td>
                  <td className="px-5 py-4 text-right"><span className="font-bold text-indigo-600">{selectedRow ? "Sélectionné" : "Ouvrir →"}</span></td>
                </tr>;
              })}
              {!filtered.length && <tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-slate-500">Aucun client ne correspond à cette recherche.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {selected && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/65 p-3 backdrop-blur-sm sm:p-6" onClick={() => setSelectedId(null)}>
        <section role="dialog" aria-modal="true" aria-labelledby="client-detail-title" onClick={(event) => event.stopPropagation()} className="relative max-h-[92vh] w-full max-w-6xl space-y-5 overflow-y-auto rounded-3xl border border-white/70 bg-white p-5 shadow-2xl sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-5">
            <div><p className="text-xs font-black uppercase tracking-[.18em] text-indigo-600">Fiche client · {selected.organization_name || "Organisation non configurée"}</p><h2 id="client-detail-title" className="mt-2 text-2xl font-black text-slate-950">{selected.full_name}</h2><p className="mt-1 text-sm text-slate-500">{selected.brand_name || selected.activity_sector} · {selected.city}</p></div>
            <div className="flex items-center gap-2"><span className={"rounded-full px-3 py-1.5 text-xs font-bold " + (canShowCard(selected) ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800")}>{canShowCard(selected) ? "Espace client actif" : "Espace verrouillé"}</span><button type="button" onClick={() => setSelectedId(null)} aria-label="Fermer la fiche client" className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900">×</button></div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Info label="E-mail" value={selected.email}/>
            <Info label="Téléphone" value={selected.phone}/>
            <Info label="Secteur" value={selected.activity_sector}/>
            <Info label="Compte" value={selected.user_id ? (selected.password_initialized ? "Mot de passe initialisé" : "En attente du premier mot de passe") : "Aucun compte lié"}/>
            <Info label="Organisation" value={selected.organization_name || "Non créée"}/>
            <Info label="Type de carte" value={typeLabels[selected.card_type] ?? selected.card_type}/>
            <Info label="Modèle demandé" value={selected.design_status ? ((selected.design_template ? selected.design_template + " · " : "") + (selected.design_status === "approved" ? "Modèle approuvé" : selected.design_status === "pending" ? "Modèle en attente" : selected.design_status)) : "Aucune demande de modèle"}/>
            <Info label="Demande reçue" value={formatDate(selected.created_at)}/>
          </div>

          {selected.reason && <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Projet du client</p><p className="mt-2 text-sm leading-6 text-slate-700">{selected.reason}</p></div>}
          <div className="rounded-2xl border border-slate-100 p-4"><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Besoins sélectionnés</p><p className="mt-2 text-sm text-slate-700">{(Array.isArray(selected.project_needs) ? selected.project_needs : selected.project_needs?.selected ?? []).join(" · ") || "Aucun détail renseigné"}</p></div>

          {canShowCard(selected) ? (
            <div>
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><h3 className="text-lg font-black text-slate-950">Cartes du client</h3><p className="mt-1 text-sm text-slate-500">Aperçus 3D et état de publication.</p></div><span className="text-xs font-semibold text-slate-500">{selected.cards.length} carte(s)</span></div>
              {selected.cards.length ? <div className="grid gap-5 lg:grid-cols-2">{selected.cards.map((card) => <article key={card.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mx-auto aspect-[1.586/1] w-full max-w-[420px]"><PhysicalNfcCard title={typeTitles[selected.card_type] ?? "Contact"} clientName={card.full_name || selected.full_name} cardType={selected.card_type} colorTheme={colorForType(selected.card_type)}/></div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2"><div><p className="font-bold text-slate-900">{card.full_name}</p><p className="text-xs text-slate-500">{card.company_name || selected.brand_name || "Carte professionnelle"} · {card.slug}</p></div><span className={"rounded-full px-2.5 py-1 text-xs font-bold " + (card.is_published ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800")}>{card.is_published ? "Publiée" : "Brouillon"}</span></div>
                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">{[["Visites",card.views],["Scans NFC",card.nfc_scans],["Scans QR",card.qr_scans],["Clics",card.clicks]].map(([label,value]) => <div key={String(label)} className="rounded-xl bg-white p-3"><p className="text-lg font-black text-slate-950">{value}</p><p className="text-[11px] text-slate-500">{label}</p></div>)}</div>
                <div className="mt-3 rounded-xl bg-white p-3"><p className="text-xs font-bold text-slate-700">Liens configurés · {card.links.length}</p>{card.links.length ? <div className="mt-2 flex flex-wrap gap-2">{card.links.map((link) => <span key={link.id} className="rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-600">{link.label}</span>)}</div> : <p className="mt-1 text-xs text-slate-400">Aucun lien configuré.</p>}</div>
              </article>)}</div> : <div className="rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/50 p-8 text-center"><p className="font-bold text-slate-800">Espace activé, carte pas encore créée</p><p className="mt-1 text-sm text-slate-500">Le client peut maintenant configurer sa carte dans son espace.</p></div>}
            </div>
          ) : (
            <div className="flex flex-col items-center rounded-2xl border border-dashed border-amber-200 bg-amber-50/70 px-5 py-9 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">🔒</div>
              <h3 className="mt-4 text-lg font-black text-slate-900">Aperçu de la carte masqué</h3>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">La carte 3D et les données de l'espace client apparaîtront ici uniquement après validation de la demande, création du compte et activation de l'accès par le Super Admin.</p>
            </div>
          )}
        </section>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, note }: { label: string; value: number; note: string }) {
  return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm font-semibold text-slate-500">{label}</p><p className="mt-3 text-3xl font-black tracking-tight text-slate-950">{value}</p><p className="mt-1 text-xs text-slate-400">{note}</p></article>;
}
function Info({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0 rounded-xl bg-slate-50 p-3"><p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1 break-words text-sm font-semibold text-slate-800">{value || "—"}</p></div>;
}
