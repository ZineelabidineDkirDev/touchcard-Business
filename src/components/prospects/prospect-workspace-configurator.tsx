"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { createProspectCustomer, generateProspectWorkspaceAI } from "@/app/actions/prospects";

type ProjectNeeds = {
  selected?: string[];
  reservation_mode?: string | null;
  reservation_channels?: string[];
  management_needs?: string[];
};

type Prospect = {
  id: string;
  full_name: string;
  city: string;
  activity_sector: string;
  email: string;
  phone: string;
  card_type: string;
  reason: string | null;
  brand_name: string | null;
  logo_url: string | null;
  business_address: string | null;
  business_phone: string | null;
  customization_requested: boolean;
  project_needs: ProjectNeeds | null;
};

const moduleCatalog = [
  { id: "dashboard", label: "Tableau de bord", description: "Vue d'ensemble de l'activité", group: "Essentiel" },
  { id: "digital_card", label: "Carte digitale", description: "Profil public, QR code et carte NFC", group: "Essentiel" },
  { id: "contact_profile", label: "Profil & coordonnées", description: "Coordonnées et présentation professionnelle", group: "Essentiel" },
  { id: "social_links", label: "Réseaux sociaux", description: "Liens Instagram, Facebook, LinkedIn…", group: "Essentiel" },
  { id: "qr_nfc", label: "QR code & NFC", description: "Partage et accès rapide à la carte", group: "Essentiel" },
  { id: "company_profile", label: "Présentation entreprise", description: "Identité, horaires et informations", group: "Vitrine" },
  { id: "service_catalog", label: "Catalogue de services", description: "Prestations, catégories et tarifs", group: "Vitrine" },
  { id: "product_catalog", label: "Catalogue produits", description: "Produits, descriptions et prix", group: "Commerce" },
  { id: "orders", label: "Commandes", description: "Réception et suivi des commandes", group: "Commerce" },
  { id: "quote_requests", label: "Demandes de devis", description: "Collecte et suivi des demandes", group: "Relation client" },
  { id: "bookings", label: "Réservations", description: "Demandes et gestion des réservations", group: "Relation client" },
  { id: "availability_calendar", label: "Calendrier de disponibilités", description: "Créneaux et disponibilités", group: "Relation client" },
  { id: "crm_contacts", label: "Contacts & CRM", description: "Centralisation des prospects et clients", group: "Relation client" },
  { id: "team", label: "Équipe & collaborateurs", description: "Gestion des membres de l'organisation", group: "Gestion" },
  { id: "gallery", label: "Galerie photos", description: "Images, réalisations et contenus", group: "Vitrine" },
  { id: "whatsapp", label: "Contact WhatsApp", description: "Accès direct à WhatsApp", group: "Relation client" },
  { id: "analytics", label: "Statistiques", description: "Vues, scans, clics et performances", group: "Pilotage" },
];

const defaults: Record<string, string[]> = {
  contact: ["dashboard", "digital_card", "contact_profile", "social_links", "qr_nfc", "whatsapp", "analytics"],
  service: ["dashboard", "digital_card", "company_profile", "service_catalog", "quote_requests", "bookings", "availability_calendar", "crm_contacts", "whatsapp", "analytics"],
  "e-business": ["dashboard", "digital_card", "company_profile", "product_catalog", "service_catalog", "orders", "quote_requests", "bookings", "team", "crm_contacts", "gallery", "whatsapp", "analytics"],
};

function suggestedModules(cardType: string, needs: ProjectNeeds | null) {
  const selected = new Set(defaults[cardType] ?? defaults.contact);
  const text = [...(needs?.selected ?? []), ...(needs?.management_needs ?? [])].join(" ").toLocaleLowerCase("fr");
  if (/commande|achat|vente|e-commerce/.test(text)) selected.add("orders");
  if (/catalogue|produit/.test(text)) selected.add("product_catalog");
  if (/réserv|rendez|calendrier|créneau/.test(text)) { selected.add("bookings"); selected.add("availability_calendar"); }
  if (/devis/.test(text)) selected.add("quote_requests");
  if (/équipe|collaborateur/.test(text)) selected.add("team");
  if (/photo|réalisation|contenu/.test(text)) selected.add("gallery");
  if (/statistique/.test(text)) selected.add("analytics");
  if (/coordonnée|horaire/.test(text)) selected.add("contact_profile");
  if (/service|tarif|prestation/.test(text)) selected.add("service_catalog");
  return [...selected];
}

export function ProspectWorkspaceConfigurator({ prospect, errorMessage }: { prospect: Prospect; errorMessage?: string }) {
  const initial = useMemo(() => suggestedModules(prospect.card_type, prospect.project_needs), [prospect]);
  const [modules, setModules] = useState<string[]>(initial);
  const [step, setStep] = useState(0);
  const [planCode, setPlanCode] = useState("to_define");
  const [aiSuggestions, setAiSuggestions] = useState<any>(null);
  const [aiError, setAiError] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const title = prospect.card_type === "e-business" ? "E-Business" : prospect.card_type === "contact" ? "Contact" : "E-Service";
  const config = { template: prospect.card_type, modules, plan_code: planCode, ai_suggestions: aiSuggestions };

  async function generateWithAI() {
    setAiLoading(true);
    setAiError("");
    const result = await generateProspectWorkspaceAI(prospect.id);
    if (result.ok) {
      setAiSuggestions(result.suggestions);
      setModules(result.suggestions.modules);
    } else {
      setAiError(result.error);
    }
    setAiLoading(false);
  }

  function toggle(id: string) {
    if (id === "dashboard") return;
    setModules((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  const groups = [...new Set(moduleCatalog.map((item) => item.group))];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="text-xs font-black uppercase tracking-[.2em] text-indigo-600">TouchCard Business · Assistant de création</p><h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Configurer l'espace client</h1><p className="mt-2 text-sm text-slate-500">Les choix initiaux du prospect sont conservés et servent de base à la configuration.</p></div>
        <Link href="/dashboard/prospects" className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50">← Retour aux demandes</Link>
      </header>

      {errorMessage && <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">{errorMessage}</div>}

      <div className="grid gap-5 lg:grid-cols-[.85fr_1.15fr]">
        <aside className="space-y-4">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Prospect validé</p><h2 className="mt-1 text-xl font-black text-slate-950">{prospect.full_name}</h2><p className="mt-1 text-sm text-slate-500">{prospect.activity_sector} · {prospect.city}</p></div><span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">Validé</span></div>
            <div className="mt-5 space-y-3 border-t border-slate-100 pt-4 text-sm">
              <Info label="E-mail" value={prospect.email}/><Info label="Téléphone" value={prospect.phone}/><Info label="Carte demandée" value={title}/><Info label="Personnalisation" value={prospect.customization_requested ? "Oui" : "Non"}/>
              {prospect.brand_name && <Info label="Marque" value={prospect.brand_name}/>}
              {prospect.reason && <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-bold text-slate-400">Projet du client</p><p className="mt-1 leading-6 text-slate-700">{prospect.reason}</p></div>}
            </div>
          </section>
          <section className="rounded-3xl border border-violet-100 bg-violet-50/60 p-5">
            <p className="text-xs font-black uppercase tracking-wider text-violet-700">Choix d'origine du client</p>
            <p className="mt-3 text-sm font-bold text-slate-800">Objectifs</p><div className="mt-2 flex flex-wrap gap-2">{(prospect.project_needs?.selected ?? []).length ? prospect.project_needs!.selected!.map((v) => <span key={v} className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-700">{v}</span>) : <span className="text-sm text-slate-500">Aucun objectif détaillé.</span>}</div>
            <p className="mt-4 text-sm font-bold text-slate-800">Gestion souhaitée</p><div className="mt-2 flex flex-wrap gap-2">{(prospect.project_needs?.management_needs ?? []).map((v) => <span key={v} className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-700">{v}</span>)}</div>
            <p className="mt-4 text-xs leading-5 text-violet-800">Ces réponses originales seront enregistrées dans la configuration du nouvel espace pour garder une trace de la demande initiale.</p>
          </section>
        </aside>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400"><span className={step === 0 ? "rounded-full bg-indigo-600 px-3 py-1.5 text-white" : "rounded-full bg-slate-100 px-3 py-1.5"}>1 · Modèle</span><span className="h-px flex-1 bg-slate-200"/><span className={step === 1 ? "rounded-full bg-indigo-600 px-3 py-1.5 text-white" : "rounded-full bg-slate-100 px-3 py-1.5"}>2 · Modules</span><span className="h-px flex-1 bg-slate-200"/><span className={step === 2 ? "rounded-full bg-indigo-600 px-3 py-1.5 text-white" : "rounded-full bg-slate-100 px-3 py-1.5"}>3 · Validation</span></div>

          {step === 0 && <div className="mt-7 space-y-5"><div><h2 className="text-xl font-black text-slate-950">Modèle d'espace</h2><p className="mt-1 text-sm text-slate-500">Le modèle reste conforme au type de carte demandé par le client.</p></div><div className="rounded-2xl border-2 border-indigo-200 bg-indigo-50/60 p-5"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-indigo-700">Modèle sélectionné</p><p className="mt-2 text-2xl font-black text-slate-950">{title}</p></div><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-xl font-black text-indigo-700">{prospect.card_type === "e-business" ? "E" : prospect.card_type === "contact" ? "C" : "S"}</span></div><p className="mt-3 text-sm text-slate-600">Conservé depuis la demande originale. Pour éviter toute incohérence, le modèle ne peut pas être changé ici.</p></div><div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600"><strong className="text-slate-900">Personnalisation :</strong> {prospect.customization_requested ? "Le client a demandé une personnalisation." : "Le modèle standard sera utilisé."}{prospect.brand_name ? " Marque : " + prospect.brand_name + "." : ""}</div></div>}

          {step === 1 && <div className="mt-7 space-y-6"><div><h2 className="text-xl font-black text-slate-950">Modules et fonctionnalités</h2><p className="mt-1 text-sm text-slate-500">Pré-sélectionnés à partir de la carte et des besoins exprimés. Tu gardes le contrôle.</p></div><div className="rounded-2xl border border-violet-200 bg-violet-50/70 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-black text-violet-950">Assistant IA Gemini</p><p className="mt-1 text-xs leading-5 text-violet-800">Analyse les besoins et propose les modules ainsi qu’un brouillon de profil. Rien n’est créé sans ta validation.</p></div><button type="button" onClick={generateWithAI} disabled={aiLoading} className="rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-violet-800 disabled:cursor-wait disabled:opacity-60">{aiLoading ? "Analyse IA en cours…" : aiSuggestions ? "Régénérer avec Gemini" : "Générer avec Gemini"}</button></div>{aiError && <p role="alert" className="mt-3 rounded-xl bg-white p-3 text-xs font-medium text-rose-700">{aiError}</p>}{aiSuggestions && <div className="mt-4 space-y-3 border-t border-violet-200 pt-3"><div><p className="text-xs font-black uppercase tracking-wide text-violet-700">Brouillon proposé · à vérifier</p><p className="mt-1 text-sm font-bold text-slate-900">{aiSuggestions.profile_draft.tagline || "Accroche non proposée"}</p><p className="mt-1 text-sm leading-6 text-slate-600">{aiSuggestions.profile_draft.description || "Description non proposée"}</p></div>{aiSuggestions.profile_draft.card_fields?.length > 0 && <div><p className="mb-2 text-xs font-bold text-slate-700">Champs de carte proposés par l’IA</p><div className="flex flex-wrap gap-2">{aiSuggestions.profile_draft.card_fields.map((field: {key:string;label:string;type:string;visible:boolean}, index: number) => <span key={index} className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-violet-800">{field.label} · {field.type}{field.visible ? "" : " · masqué"}</span>)}</div></div>}{aiSuggestions.profile_draft.suggested_buttons?.length > 0 && <div><p className="mb-2 text-xs font-bold text-slate-700">Boutons recommandés</p><div className="flex flex-wrap gap-2">{aiSuggestions.profile_draft.suggested_buttons.map((button: {kind:string;label:string;enabled:boolean}, index: number) => <span key={index} className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-violet-800">{button.label} · {button.enabled ? "à configurer" : "optionnel"}</span>)}</div></div>}{aiSuggestions.profile_draft.categories.length > 0 && <div className="flex flex-wrap gap-2">{aiSuggestions.profile_draft.categories.map((category: string, index: number) => <span key={index} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-violet-800">{category}</span>)}</div>}{aiSuggestions.profile_draft.catalog_items.length > 0 && <div className="space-y-2"><p className="text-xs font-bold text-slate-700">Éléments de catalogue suggérés (prix non inventés)</p>{aiSuggestions.profile_draft.catalog_items.map((item: {name:string;description:string;price:string}, index: number) => <div key={index} className="rounded-xl bg-white p-3"><p className="text-sm font-bold text-slate-800">{item.name}</p><p className="mt-1 text-xs text-slate-500">{item.description}</p><p className="mt-1 text-xs font-semibold text-violet-700">{item.price || "Prix à renseigner"}</p></div>)}</div>}<p className="text-xs leading-5 text-violet-800">{aiSuggestions.rationale}</p><p className="text-[11px] text-violet-700">Proposition générée par Gemini · non publiée · validation Super Admin requise.</p></div>}</div>{groups.map((group) => <div key={group}><h3 className="mb-3 text-xs font-black uppercase tracking-wider text-slate-400">{group}</h3><div className="grid gap-2 sm:grid-cols-2">{moduleCatalog.filter((item) => item.group === group).map((item) => { const active = modules.includes(item.id); return <button key={item.id} type="button" aria-pressed={active} onClick={() => toggle(item.id)} disabled={item.id === "dashboard"} className={`flex items-start gap-3 rounded-2xl border p-3 text-left transition ${active ? "border-indigo-300 bg-indigo-50/70" : "border-slate-200 bg-white hover:border-indigo-200"} disabled:cursor-not-allowed`}><span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-xs font-black ${active ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-300 text-transparent"}`}>✓</span><span><span className="block text-sm font-bold text-slate-800">{item.label}</span><span className="mt-1 block text-xs leading-5 text-slate-500">{item.description}</span></span></button>; })}</div></div>)}</div>}

          {step === 2 && <div className="mt-7 space-y-5"><div><h2 className="text-xl font-black text-slate-950">Vérification avant création</h2><p className="mt-1 text-sm text-slate-500">Aucun compte ne sera créé avant ta confirmation.</p></div><div className="rounded-2xl border border-slate-200 p-4"><div className="flex justify-between gap-3"><span className="text-sm text-slate-500">Client</span><strong className="text-sm text-slate-900">{prospect.full_name}</strong></div><div className="mt-3 flex justify-between gap-3"><span className="text-sm text-slate-500">Modèle</span><strong className="text-sm text-slate-900">{title}</strong></div><div className="mt-3 flex justify-between gap-3"><span className="text-sm text-slate-500">Modules sélectionnés</span><strong className="text-sm text-slate-900">{modules.length}</strong></div><div className="mt-3 flex flex-wrap gap-2">{moduleCatalog.filter((item) => modules.includes(item.id)).map((item) => <span key={item.id} className="rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">{item.label}</span>)}</div></div><label className="block text-sm font-bold text-slate-700">Abonnement <select value={planCode} onChange={(event) => setPlanCode(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm"><option value="to_define">À définir ultérieurement</option></select></label><div className="rounded-xl bg-amber-50 p-4 text-xs leading-5 text-amber-800">L'abonnement reste à définir : aucun tarif ni aucune durée ne seront inventés. L'invitation créera le compte et l'espace client avec cette configuration.</div></div>}

          <div className="mt-8 flex flex-wrap justify-between gap-3 border-t border-slate-100 pt-5"><button type="button" disabled={step === 0} onClick={() => setStep((v) => Math.max(0, v - 1))} className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 disabled:opacity-30">Précédent</button>{step < 2 ? <button type="button" onClick={() => setStep((v) => Math.min(2, v + 1))} className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-700">Continuer →</button> : <form action={createProspectCustomer} className="flex flex-wrap gap-2"><input type="hidden" name="id" value={prospect.id}/><input type="hidden" name="workspace_config" value={JSON.stringify(config)}/><button type="submit" className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-emerald-700">Confirmer et créer le compte client</button></form>}</div>
        </section>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="flex flex-wrap justify-between gap-2"><span className="text-slate-400">{label}</span><strong className="max-w-[65%] break-words text-right text-slate-800">{value || "—"}</strong></div>;
}
