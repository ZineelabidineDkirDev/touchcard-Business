"use client";

import { useState } from "react";

export type EditableCardField = { key: string; label: string; value: string; visible: boolean };

export function CustomCardFieldsEditor({ initialFields }: { initialFields: EditableCardField[] }) {
  const [fields, setFields] = useState(initialFields);
  function update(index: number, patch: Partial<EditableCardField>) {
    setFields((current) => current.map((field, i) => i === index ? { ...field, ...patch } : field));
  }
  function add() {
    setFields((current) => [...current, { key: "custom_" + crypto.randomUUID().slice(0, 8), label: "", value: "", visible: true }]);
  }
  function remove(index: number) {
    setFields((current) => current.filter((_, i) => i !== index));
  }
  const visibleFields = fields.filter((field) => field.visible && field.label.trim() && field.value.trim());

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 p-4 sm:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h4 className="text-sm font-bold text-slate-900">Personnaliser les informations</h4><p className="mt-1 text-xs text-slate-500">Ajoutez les rubriques propres à votre activité. Pour une question fréquente, commencez le nom par « FAQ : ». Les liens YouTube alimentent la section vidéos ; les images de vos produits/prestations alimentent la galerie.</p></div>
        <button type="button" onClick={add} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3.5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-700"><span className="text-base leading-none">+</span> Ajouter un champ</button>
      </div>
      <input type="hidden" name="custom_fields" value={JSON.stringify(fields)} />
      <div className="grid gap-4 xl:grid-cols-[1.3fr_.7fr]">
        <div className="min-w-0 space-y-3">
          {fields.length === 0 && <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center"><p className="text-sm font-semibold text-slate-700">Aucun champ personnalisé</p><p className="mt-1 text-xs text-slate-500">Ajoutez par exemple : spécialités, numéro ICE, adresse d'agence ou horaires.</p></div>}
          {fields.map((field, index) => (
            <div key={field.key} className="grid gap-2 rounded-xl bg-slate-50 p-3 sm:grid-cols-[.8fr_1.2fr_auto] sm:items-end">
              <label className="text-xs font-semibold text-slate-600">Nom du champ<input value={field.label} onChange={(event) => update(index, { label: event.target.value })} placeholder="Ex. Spécialités" maxLength={80} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm"/></label>
              <label className="text-xs font-semibold text-slate-600">Contenu à afficher<input value={field.value} onChange={(event) => update(index, { value: event.target.value })} placeholder="Saisissez votre information" maxLength={500} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm"/></label>
              <div className="flex items-center justify-between gap-3 sm:pb-1">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-600"><input type="checkbox" checked={field.visible} onChange={(event) => update(index, { visible: event.target.checked })}/> Afficher</label>
                <button type="button" onClick={() => remove(index)} aria-label={"Retirer le champ " + (field.label || index + 1)} title="Retirer ce champ" className="flex h-9 w-9 items-center justify-center rounded-lg border border-rose-200 bg-white text-xl font-bold leading-none text-rose-600 transition hover:bg-rose-50">−</button>
              </div>
            </div>
          ))}
          <p className="text-[11px] text-slate-400">Maximum 20 rubriques. Décochez « Afficher » pour conserver une information sans la montrer sur votre carte publique.</p>
        </div>

        <aside className="rounded-[1.6rem] bg-slate-950 p-3 text-white shadow-xl">
          <div className="rounded-[1.25rem] bg-white p-4 text-slate-900">
            <div className="flex items-center justify-between"><span className="text-[9px] font-black uppercase tracking-[.2em] text-indigo-600">TouchCard · Aperçu</span><span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-bold text-emerald-700">En direct</span></div>
            <div className="mt-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-lg font-black text-indigo-700">T</div>
            <h5 className="mt-3 text-base font-black">Votre carte professionnelle</h5>
            <p className="mt-1 text-[11px] text-slate-500">Les informations personnalisées apparaîtront ici après enregistrement.</p>
            <div className="mt-4 space-y-2">
              {visibleFields.map((field) => <div key={field.key} className="rounded-xl bg-slate-50 px-3 py-2.5"><p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">{field.label}</p><p className="mt-1 whitespace-pre-line break-words text-xs font-semibold text-slate-800">{field.value}</p></div>)}
              {visibleFields.length === 0 && <div className="rounded-xl border border-dashed border-slate-200 px-3 py-5 text-center text-[11px] text-slate-400">Vos champs visibles s'afficheront ici.</div>}
            </div>
            <div className="mt-4 rounded-xl bg-indigo-600 px-3 py-2.5 text-center text-[11px] font-bold text-white">Enregistrer le contact</div>
          </div>
          <p className="px-2 pt-3 text-center text-[10px] leading-4 text-slate-400">Aperçu des rubriques personnalisées · le rendu public complet reste consultable via « Voir la carte ».</p>
        </aside>
      </div>
    </section>
  );
}
