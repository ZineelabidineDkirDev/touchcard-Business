"use client";

import { useEffect, useState, type ReactNode } from "react";

export function PopupDialog({ title, description, triggerLabel, children, triggerClassName, dialogClassName }: {
  title: string;
  description?: string;
  triggerLabel: string;
  children: ReactNode;
  triggerClassName?: string;
  dialogClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) { if (event.key === "Escape") setOpen(false); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);
  return <>
    <button type="button" onClick={() => setOpen(true)} className={triggerClassName || "rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700"}>{triggerLabel}</button>
    {open && <div role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }} className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-sm sm:p-6">
      <section role="dialog" aria-modal="true" aria-label={title} className={`flex max-h-[94vh] w-full ${dialogClassName || "max-w-3xl"} flex-col overflow-hidden rounded-3xl bg-white shadow-2xl`}>
        <header className="flex items-start justify-between gap-4 bg-gradient-to-r from-indigo-700 to-violet-700 px-5 py-4 text-white sm:px-7">
          <div><h2 className="text-lg font-black">{title}</h2>{description && <p className="mt-1 text-xs text-indigo-100">{description}</p>}</div>
          <button type="button" onClick={() => setOpen(false)} aria-label="Fermer" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 text-xl hover:bg-white/25">×</button>
        </header>
        <div className="overflow-y-auto p-5 sm:p-7">{children}</div>
      </section>
    </div>}
  </>;
}
