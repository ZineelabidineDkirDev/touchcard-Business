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
  return <section className="space-y-3 rounded-2xl border border-slate-200 p-4 sm:col-span-2">
    <div className="flex flex-wrap items-center justify-between gap-2"><div><h4 className="text-sm font-bold text-slate-900">Champs personnalisés</h4><p className="mt-1 text-xs text-slate-500">Ajoutez, modifiez, masquez ou supprimez les informations de votre carte.</p></div><button type="button" onClick={add} className="rounded-lg border border-indigo-200 px-3 py-2 text-xs font-bold text-indigo-700">+ Ajouter un champ</button></div>
    <input type="hidden" name="custom_fields" value={JSON.stringify(fields)} />
    {fields.length === 0 && <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500">Aucun champ personnalisé. Ajoutez une rubrique selon vos besoins.</p>}
    {fields.map((field, index) => <div key={field.key} className="grid gap-2 rounded-xl bg-slate-50 p-3 sm:grid-cols-[1fr_1.2fr_auto_auto] sm:items-end">
      <label className="text-xs font-semibold text-slate-600">Nom du champ<input value={field.label} onChange={(event) => update(index, { label: event.target.value })} placeholder="Ex. Spécialité" className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"/></label>
      <label className="text-xs font-semibold text-slate-600">Valeur<input value={field.value} onChange={(event) => update(index, { value: event.target.value })} placeholder="Votre information" className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"/></label>
      <label className="flex items-center gap-2 pb-2 text-xs font-semibold text-slate-600"><input type="checkbox" checked={field.visible} onChange={(event) => update(index, { visible: event.target.checked })}/> Visible</label>
      <button type="button" onClick={() => remove(index)} aria-label={"Retirer le champ " + (field.label || index + 1)} title="Retirer ce champ" className="flex items-center justify-center gap-1 rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs font-bold text-rose-600 transition hover:bg-rose-50"><span aria-hidden="true" className="text-base leading-none">−</span> Retirer</button>
    </div>)}
  </section>;
}
