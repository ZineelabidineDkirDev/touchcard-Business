"use client";

import { useState } from "react";

export type EditableCardField = { key: string; label: string; value: string; visible: boolean };

export function CustomCardFieldsEditor({ initialFields, showPortfolioActions = false }: { initialFields: EditableCardField[]; showPortfolioActions?: boolean }) {
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
  function remove(index: number) {
    setFields((current) => current.filter((_, i) => i !== index));
  }

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 p-4 sm:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h4 className="text-sm font-bold text-slate-900">{showPortfolioActions ? "Portfolio professionnel & CV" : "Personnaliser les informations"}</h4><p className="mt-1 text-xs text-slate-500">{showPortfolioActions ? "Ajoutez vos projets et votre CV directement depuis ce profil. Les éléments cochés seront visibles sur votre carte publique." : "Ajoutez les informations propres à votre activité. Pour une FAQ, commencez le nom par « FAQ : ». Les liens YouTube alimentent la section vidéos."}</p></div>
        <div className="flex flex-wrap gap-2"><button type="button" onClick={add} disabled={fields.length >= 20} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50">＋ Ajouter un champ</button></div>
      </div>
      <input type="hidden" name="custom_fields" value={JSON.stringify(fields)} />
      {showPortfolioActions && <div className="space-y-3 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><div><h5 className="text-sm font-bold text-indigo-950">Portfolio professionnel</h5><p className="mt-1 text-xs text-slate-600">Ajoutez vos réalisations séparément de vos informations de profil.</p></div><button type="button" onClick={addPortfolio} disabled={fields.length >= 20} className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">＋ Ajouter un projet</button></div>{fields.map((field,index)=>({field,index})).filter(({field})=>/portfolio/i.test(field.label)).map(({field,index})=><div key={field.key} className="grid gap-2 rounded-xl bg-white p-3 sm:grid-cols-[.8fr_1.2fr_auto] sm:items-end"><label className="text-xs font-semibold text-slate-600">Nom du projet<input value={field.label.replace(/^Portfolio\s*[—-]\s*/i,"")} onChange={event=>update(index,{label:"Portfolio — "+event.target.value})} placeholder="Ex. Identité visuelle" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm"/></label><label className="text-xs font-semibold text-slate-600">Image / visuel du projet (URL)<input value={field.value} onChange={event=>update(index,{value:event.target.value})} placeholder="https://..." className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm"/></label><div className="flex items-center justify-between gap-3"><label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={field.visible} onChange={event=>update(index,{visible:event.target.checked})}/> Publier</label><button type="button" onClick={()=>remove(index)} className="h-9 w-9 rounded-lg border border-rose-200 text-xl text-rose-600">−</button></div></div>)}</div>}
      {showPortfolioActions && <div className="space-y-3 rounded-xl border border-violet-100 bg-violet-50/50 p-4"><h5 className="text-sm font-bold text-violet-950">CV professionnel</h5><p className="text-xs text-slate-600">Importez directement votre CV au format PDF (3 Mo maximum). Aucun lien externe à saisir.</p><input type="file" name="cv_pdf" accept="application/pdf,.pdf" className="block w-full rounded-xl border border-violet-200 bg-white p-3 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-violet-100 file:px-3 file:py-2 file:text-xs file:font-bold file:text-violet-800"/>{fields.some(field=>/cv professionnel|^cv$/i.test(field.label.trim()) && field.value) && <p className="text-xs font-semibold text-emerald-700">Un CV est déjà enregistré. Importer un nouveau PDF le remplacera.</p>}</div>}
      <div className="grid gap-4">
        <div className="min-w-0 space-y-3">
          {fields.length === 0 && <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center"><p className="text-sm font-semibold text-slate-700">Aucun champ personnalisé</p><p className="mt-1 text-xs text-slate-500">Ajoutez par exemple : spécialités, numéro ICE, adresse d'agence ou horaires.</p></div>}
          {fields.map((field, index) => /portfolio|cv professionnel|^cv$/i.test(field.label.trim()) ? null : (
            <div key={field.key} className="grid gap-2 rounded-xl bg-slate-50 p-3 sm:grid-cols-[.8fr_1.2fr_auto] sm:items-end">
              <label className="text-xs font-semibold text-slate-600">Nom du champ<input value={field.label} onChange={(event) => update(index, { label: event.target.value })} placeholder="Ex. Spécialités" maxLength={80} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm"/></label>
              <label className="text-xs font-semibold text-slate-600">Contenu à afficher<input value={field.value} onChange={(event) => update(index, { value: event.target.value })} placeholder="Saisissez votre information" maxLength={500} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm"/></label>
              <div className="flex items-center justify-between gap-3 sm:pb-1">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-600"><input type="checkbox" checked={field.visible} onChange={(event) => update(index, { visible: event.target.checked })}/> Afficher</label>
                <button type="button" onClick={() => remove(index)} aria-label={"Retirer le champ " + (field.label || index + 1)} title="Retirer ce champ" className="flex h-9 w-9 items-center justify-center rounded-lg border border-rose-200 bg-white text-xl font-bold leading-none text-rose-600 transition hover:bg-rose-50">−</button>
              </div>
            </div>
          ))}
          <p className="text-[11px] text-slate-400">Maximum 20 rubriques au total. Les projets et le CV sont gérés dans leurs sections dédiées.</p>
        </div>

      </div>
    </section>
  );
}
