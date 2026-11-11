"use client";

import { useState } from "react";

type Props = {
  name: string;
  label: string;
  defaultValue: string;
  presets: string[];
};

export function CardColorPicker({ name, label, defaultValue, presets }: Props) {
  const [color, setColor] = useState(/^#[0-9a-fA-F]{6}$/.test(defaultValue) ? defaultValue.toUpperCase() : "#2563EB");
  const [draft, setDraft] = useState(color);
  const valid = /^#[0-9a-fA-F]{6}$/.test(draft);

  const choose = (value: string) => {
    const next = value.toUpperCase();
    setColor(next);
    setDraft(next);
  };

  return (
    <div className="min-w-0">
      <p className="text-xs font-bold text-slate-700">{label}</p>
      <div className="mt-2 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
        <label className="relative h-12 w-12 shrink-0 cursor-pointer overflow-hidden rounded-xl border-2 border-white shadow ring-1 ring-slate-200" title="Ouvrir la palette de couleurs">
          <span className="absolute inset-0" style={{ backgroundColor: color }} />
          <input aria-label={label} type="color" value={color} onChange={(event) => choose(event.target.value)} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
        </label>
        <div className="min-w-0 flex-1">
          <label className="block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Code couleur HEX</label>
          <input name={name} value={draft} onChange={(event) => setDraft(event.target.value.toUpperCase())} onBlur={() => { if (valid) choose(draft); else setDraft(color); }} spellCheck={false} maxLength={7} aria-invalid={!valid} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm font-bold uppercase text-slate-800 outline-none focus:border-indigo-400" />
        </div>
        <span className="h-9 w-9 shrink-0 rounded-full border border-slate-200" style={{ backgroundColor: valid ? draft : color }} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {presets.map((preset) => (
          <button key={preset} type="button" onClick={() => choose(preset)} aria-label={`Choisir la couleur ${preset}`} aria-pressed={color === preset} title={preset} className={`h-7 w-7 rounded-full border-2 transition ${color === preset ? "scale-110 border-slate-900 ring-2 ring-slate-300" : "border-white ring-1 ring-slate-200 hover:scale-110"}`} style={{ backgroundColor: preset }} />
        ))}
      </div>
      <p className="mt-2 text-[10px] text-slate-500">Choisissez une pastille, ouvrez la palette ou collez votre propre code HEX.</p>
    </div>
  );
}
