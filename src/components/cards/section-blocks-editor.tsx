"use client";

import { useState } from "react";
import type { ListItem, SectionBlock, SectionField } from "@/lib/cards/section-blocks";

const kindLabels: Record<string, string> = { dishes: "plat", listings: "bien", vehicles: "véhicule", projects: "projet", team: "membre", sessions: "session", offers: "offre", services: "prestation" };
const input = "mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal text-slate-900 outline-none focus:border-cyan-400";

/** Sections métier du client : listes (plats, biens, projets…), champs typés (date…) et libellés des boutons d'action. */
export function SectionBlocksEditor({ initialSections }: { initialSections: SectionBlock[] }) {
  const [sections, setSections] = useState<SectionBlock[]>(initialSections);
  if (!initialSections.length) return null;
  const patch = (id: string, change: Partial<SectionBlock>) => setSections((current) => current.map((section) => section.id === id ? { ...section, ...change } : section));
  const patchItem = (id: string, itemId: string, change: Partial<ListItem>) => setSections((current) => current.map((section) => section.id === id ? { ...section, items: (section.items ?? []).map((item) => item.id === itemId ? { ...item, ...change } : item) } : section));
  const addItem = (id: string) => setSections((current) => current.map((section) => section.id === id && (section.items?.length ?? 0) < 30 ? { ...section, items: [...(section.items ?? []), { id: "i" + crypto.randomUUID().slice(0, 8), title: "" }] } : section));
  const removeItem = (id: string, itemId: string) => setSections((current) => current.map((section) => section.id === id ? { ...section, items: (section.items ?? []).filter((item) => item.id !== itemId) } : section));
  const patchField = (id: string, key: string, change: Partial<SectionField>) => setSections((current) => current.map((section) => section.id === id ? { ...section, fields: (section.fields ?? []).map((field) => field.key === key ? { ...field, ...change } : field) } : section));

  return (
    <section className="tc-revert-font space-y-4 rounded-2xl border border-cyan-300/50 bg-cyan-50/30 p-4 sm:col-span-2">
      <input type="hidden" name="sections_json" value={JSON.stringify(sections)} />
      <div><h4 className="text-sm font-bold text-slate-900">Sections de votre activité</h4><p className="mt-1 text-xs text-slate-500">Préparées selon le service choisi dans votre demande. Remplissez-les : elles s’affichent sur votre carte publique. Décochez « Afficher » pour masquer une section.</p></div>
      {sections.map((section) => (
        <div key={section.id} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="min-w-0 flex-1 text-xs font-semibold text-slate-600">Titre de la section<input value={section.title} maxLength={80} onChange={(event) => patch(section.id, { title: event.target.value })} className={input} /></label>
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-600"><input type="checkbox" checked={section.enabled} onChange={(event) => patch(section.id, { enabled: event.target.checked })} /> Afficher</label>
          </div>

          {section.type === "list" && (
            <div className="space-y-3">
              {(section.items ?? []).map((item) => (
                <div key={item.id} className="grid gap-2 rounded-lg bg-slate-50 p-3 sm:grid-cols-2">
                  <label className="text-xs font-semibold text-slate-600">Nom<input value={item.title} maxLength={100} onChange={(event) => patchItem(section.id, item.id, { title: event.target.value })} className={input} /></label>
                  {section.item_fields?.includes("price") && <label className="text-xs font-semibold text-slate-600">Prix<input value={item.price ?? ""} maxLength={40} placeholder="Ex. 120 MAD" onChange={(event) => patchItem(section.id, item.id, { price: event.target.value })} className={input} /></label>}
                  {section.item_fields?.includes("date") && <label className="text-xs font-semibold text-slate-600">Date<input type="date" value={item.date ?? ""} onChange={(event) => patchItem(section.id, item.id, { date: event.target.value })} className={input} /></label>}
                  {section.item_fields?.includes("link") && <label className="text-xs font-semibold text-slate-600">Lien<input type="url" value={item.link ?? ""} placeholder="https://" onChange={(event) => patchItem(section.id, item.id, { link: event.target.value })} className={input} /></label>}
                  <label className="text-xs font-semibold text-slate-600 sm:col-span-2">Description<textarea value={item.description ?? ""} maxLength={400} rows={2} onChange={(event) => patchItem(section.id, item.id, { description: event.target.value })} className={input} /></label>
                  <button type="button" onClick={() => removeItem(section.id, item.id)} className="justify-self-start text-xs font-bold text-rose-600">Supprimer</button>
                </div>
              ))}
              <button type="button" onClick={() => addItem(section.id)} className="rounded-lg border border-cyan-300 bg-cyan-50 px-3 py-2 text-xs font-bold text-cyan-800">+ Ajouter {section.kind ? "un(e) " + kindLabels[section.kind] : "un élément"}</button>
            </div>
          )}

          {section.type === "fields" && (
            <div className="grid gap-3 sm:grid-cols-2">
              {(section.fields ?? []).map((field) => (
                <label key={field.key} className="text-xs font-semibold text-slate-600">{field.label}
                  <input type={field.type === "date" ? "date" : field.type === "time" ? "time" : field.type === "number" ? "number" : field.type === "url" ? "url" : "text"} value={field.value} onChange={(event) => patchField(section.id, field.key, { value: event.target.value })} className={input} />
                </label>
              ))}
            </div>
          )}

          {section.type === "action" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-semibold text-slate-600">Texte du bouton<input value={section.label ?? ""} maxLength={40} onChange={(event) => patch(section.id, { label: event.target.value })} className={input} /></label>
              <label className="text-xs font-semibold text-slate-600">Aide sous le bouton<input value={section.hint ?? ""} maxLength={120} onChange={(event) => patch(section.id, { hint: event.target.value })} className={input} /></label>
              <p className="text-[11px] text-slate-500 sm:col-span-2">Les demandes envoyées par vos visiteurs arrivent dans « Demandes reçues ».</p>
            </div>
          )}
        </div>
      ))}
    </section>
  );
}
