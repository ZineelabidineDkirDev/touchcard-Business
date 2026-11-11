"use client";

import { CARD_MODULES, type ModuleConfigField } from "@/lib/cards/module-registry";

type Settings = Record<string, Record<string, string | boolean>>;

export function ModuleConfigurationEditor({ moduleIds, settings, onChange }: {
  moduleIds: string[];
  settings: Settings;
  onChange: (next: Settings) => void;
}) {
  const configured = CARD_MODULES.filter((module) => moduleIds.includes(module.id) && module.configurationFields.length);
  if (!configured.length) return null;

  function update(moduleId: string, field: ModuleConfigField, value: string | boolean) {
    onChange({
      ...settings,
      [moduleId]: {
        ...(settings[moduleId] ?? {}),
        [field.key]: value,
      },
    });
  }

  return (
    <section className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4">
      <div className="mb-4">
        <h3 className="text-sm font-black text-slate-900">Configuration des modules activés</h3>
        <p className="mt-1 text-xs leading-5 text-slate-500">Ces réglages sont enregistrés avec l'espace client. Seuls les modules sélectionnés apparaissent ici.</p>
      </div>
      <div className="space-y-4">
        {configured.map((module) => (
          <div key={module.id} className="rounded-xl border border-slate-200 bg-white p-4">
            <h4 className="text-sm font-bold text-slate-900">{module.label}</h4>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {module.configurationFields.map((field) => {
                const current = settings[module.id]?.[field.key] ?? field.defaultValue ?? (field.type === "checkbox" ? false : "");
                if (field.type === "checkbox") return (
                  <label key={field.key} className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <input type="checkbox" checked={Boolean(current)} onChange={(event) => update(module.id, field, event.target.checked)} />
                    {field.label}
                  </label>
                );
                if (field.type === "select") return (
                  <label key={field.key} className="block text-xs font-semibold text-slate-700">{field.label}
                    <select value={String(current)} onChange={(event) => update(module.id, field, event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm">
                      {(field.options ?? []).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </label>
                );
                if (field.type === "textarea") return (
                  <label key={field.key} className="block text-xs font-semibold text-slate-700 sm:col-span-2">{field.label}
                    <textarea value={String(current)} onChange={(event) => update(module.id, field, event.target.value)} placeholder={field.placeholder} rows={2} maxLength={500} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm" />
                  </label>
                );
                return (
                  <label key={field.key} className="block text-xs font-semibold text-slate-700">{field.label}
                    <input value={String(current)} onChange={(event) => update(module.id, field, event.target.value)} placeholder={field.placeholder} maxLength={160} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm" />
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
