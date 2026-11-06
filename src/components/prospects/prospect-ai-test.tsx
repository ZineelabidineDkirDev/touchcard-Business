"use client";

import Link from "next/link";
import { useState } from "react";
import { generateProspectWorkspaceAI } from "@/app/actions/prospects";

const labels: Record<string, string> = {
  dashboard: "Tableau de bord", digital_card: "Carte digitale", contact_profile: "Profil & coordonnées",
  social_links: "Réseaux sociaux", qr_nfc: "QR code & NFC", company_profile: "Présentation entreprise",
  service_catalog: "Catalogue de services", product_catalog: "Catalogue produits", orders: "Commandes",
  quote_requests: "Demandes de devis", bookings: "Réservations", availability_calendar: "Disponibilités",
  team: "Équipe", gallery: "Galerie", crm_contacts: "Contacts & CRM", analytics: "Statistiques", whatsapp: "WhatsApp",
};

export function ProspectAITest({ prospectId, cardType }: { prospectId: string; cardType: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<any>(null);

  async function runTest() {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const response = await generateProspectWorkspaceAI(prospectId);
      if (response.ok) setResult(response.suggestions);
      else setError(response.error);
    } catch {
      setError("Erreur inattendue pendant le test. Aucun compte client n'a été créé.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="text-xs font-black uppercase tracking-[.2em] text-violet-700">TouchCard · Test IA</p><h1 className="mt-2 text-3xl font-black text-slate-950">Tester Gemini sur un prospect validé</h1><p className="mt-2 text-sm text-slate-500">Type de carte : {cardType}</p></div>
        <Link href="/dashboard/prospects" className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700">← Retour aux prospects</Link>
      </header>

      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <p className="font-black text-amber-950">Mode test sans création</p>
        <p className="mt-2 text-sm leading-6 text-amber-900">Cette action lit la demande existante et demande une proposition à Gemini. Elle ne crée aucun compte, aucune organisation, aucune carte, n'envoie aucun e-mail et ne modifie pas la demande.</p>
        <p className="mt-2 text-xs font-semibold text-amber-800">Utilisation de l'API Gemini uniquement dans la limite du niveau gratuit. Si le quota est atteint, le test s'arrête.</p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div><h2 className="text-lg font-black text-slate-950">Génération de la proposition</h2><p className="mt-1 text-sm text-slate-500">Les données personnelles sont exclues du brief envoyé au modèle.</p></div>
          <button onClick={runTest} disabled={loading} className="rounded-xl bg-violet-700 px-5 py-3 text-sm font-bold text-white disabled:opacity-60">{loading ? "Gemini analyse la demande…" : "Lancer le test Gemini"}</button>
        </div>
        {error && <p role="alert" className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</p>}
      </section>

      {result && <div className="space-y-5">
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="text-xs font-black uppercase tracking-wider text-emerald-800">Réponse Gemini reçue</p>
          <p className="mt-2 text-sm text-emerald-900">Modèle proposé : <strong>{result.template}</strong> · Modules : <strong>{result.modules.length}</strong></p>
          <p className="mt-2 text-xs text-emerald-800">Brouillon uniquement — aucune donnée n'a été enregistrée.</p>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-black text-slate-950">Modules recommandés</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">{result.modules.map((module: string) => <div key={module} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-slate-800">{labels[module] || module}</div>)}</div>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-black text-slate-950">Brouillon du profil public</h2>
          <p className="mt-3 text-base font-bold text-slate-900">{result.profile_draft.tagline || "Aucune accroche proposée"}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">{result.profile_draft.description || "Aucune description proposée"}</p>
          {result.profile_draft.categories?.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{result.profile_draft.categories.map((item: string, i: number) => <span key={i} className="rounded-full bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-800">{item}</span>)}</div>}
          {result.profile_draft.catalog_items?.length > 0 && <div className="mt-5 space-y-2"><h3 className="text-sm font-bold text-slate-800">Éléments de catalogue suggérés</h3>{result.profile_draft.catalog_items.map((item: any, i: number) => <div key={i} className="rounded-xl border border-slate-100 p-3"><p className="text-sm font-bold">{item.name}</p><p className="mt-1 text-xs text-slate-500">{item.description}</p><p className="mt-1 text-xs font-semibold text-violet-700">{item.price || "Prix à renseigner"}</p></div>)}</div>}
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-6"><h2 className="text-lg font-black text-slate-950">Pourquoi ces choix ?</h2><p className="mt-2 text-sm leading-6 text-slate-600">{result.rationale}</p></section>
      </div>}
    </div>
  );
}
