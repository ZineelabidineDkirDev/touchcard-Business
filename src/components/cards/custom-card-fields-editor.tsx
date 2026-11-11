"use client";

import { useState } from "react";

export type EditableCardField = { key: string; label: string; value: string; visible: boolean };

export function CustomCardFieldsEditor({ initialFields }: { initialFields: EditableCardField[] }) {
  const [fields, setFields] = useState(initialFields);
  function update(index: number, patch: Partial<EditableCardField>) {
    setFields((current) => current.map((field, i) => i === index ? { ...field, ...patch } : field));
  }
  function add() {
    setFields((current) => current.length >= 20 ? current : [...current, { key: "custom_" + crypto.randomUUID().slice(0, 8), label: "", value: "", visible: true }]);
  }
  function addPortfolio() {
    setFields((current) => {
      if (current.length >= 20) return current;
      const count = current.filter((field) => /portfolio/i.test(field.label)).length + 1;
      return [...current, { key: "portfolio_" + crypto.randomUUID().slice(0, 8), label: "Portfolio — Projet " + count, value: "", visible: true }];
    });
  }
  function addCv() {
    setFields((current) => {
      if (current.length >= 20 || current.some((field) => /cv professionnel|^cv$/i.test(field.label.trim()))) return current;
      return [...current, { key: "cv_" + crypto.randomUUID().slice(0, 8), label: "CV professionnel", value: "", visible: true }];
    });
  }
  function remove(index: number) {
    setFields((current) => current.filter((_, i) => i !== index));
  }

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 p-4 sm:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h4 className="text-sm font-bold text-slate-900">Portfolio professionnel & CV</h4><p className="mt-1 text-xs text-slate-500">Ajoutez vos projets et votre CV directement depuis ce profil. Les éléments cochés seront visibles sur votre carte publique.</p></div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={addPortfolio} disabled={fields.length >= 20} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3.5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50">＋ Ajouter portfolio</button>
          <button type="button" onClick={addCv} disabled={fields.length >= 20 || fields.some((field) => /cv professionnel|^cv$/i.test(field.label.trim()))} className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2.5 text-xs font-bold text-indigo-700 transition hover:bg-indigo-100 disabled:opacity-50">＋ Ajouter CV</button>
          <button type="button" onClick={add} disabled={fields.length >= 20} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50">＋ Autre champ</button>
        </div>
      </div>
      <input type="hidden" name="custom_fields" value={JSON.stringify(fields)} />
      <div className="grid gap-4">
        <div className="min-w-0 space-y-3">
          {fields.length === 0 && <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center"><p className="text-sm font-semibold text-slate-700">Aucun champ personnalisé</p><p className="mt-1 text-xs text-slate-500">Ajoutez par exemple : spécialités, numéro ICE, adresse d'agence ou horaires.</p></div>}
          {fields.map((field, index) => (
            <div key={field.key} className="grid gap-2 rounded-xl bg-slate-50 p-3 sm:grid-cols-[.8fr_1.2fr_auto] sm:items-end">
              <label className="text-xs font-semibold text-slate-600">Nom du champ<input value={field.label} onChange={(event) => update(index, { label: event.target.value })} placeholder="Ex. Spécialités" maxLength={80} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm"/></label>
              <label className="text-xs font-semibold text-slate-600">Contenu à afficher<input value={field.value} onChange={(event) => update(index, { value: event.target.value })} placeholder={/cv professionnel|^cv$/i.test(field.label.trim()) ? "Lien public du CV au format PDF (https://…)" : /portfolio/i.test(field.label) ? "Lien direct vers l’image ou le projet (https://…)" : "Saisissez votre information"} maxLength={500} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm"/></label>
              <div className="flex items-center justify-between gap-3 sm:pb-1">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-600"><input type="checkbox" checked={field.visible} onChange={(event) => update(index, { visible: event.target.checked })}/> Afficher</label>
                <button type="button" onClick={() => remove(index)} aria-label={"Retirer le champ " + (field.label || index + 1)} title="Retirer ce champ" className="flex h-9 w-9 items-center justify-center rounded-lg border border-rose-200 bg-white text-xl font-bold leading-none text-rose-600 transition hover:bg-rose-50">−</button>
              </div>
            </div>
          ))}
          <p className="text-[11px] text-slate-400">Maximum 20 rubriques. Décochez « Afficher » pour conserver une information sans la montrer sur votre carte publique.</p>
        </div>

      </div>
    </section>
  );
}
