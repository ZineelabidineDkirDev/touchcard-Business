import type { ReactNode } from "react";
import { StudioIcon, type StudioIconName } from "@/components/cards/studio/studio-icons";

export const studioInput = "mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm";

export function PanelHeading({ icon, title, hint }: { icon: StudioIconName; title: string; hint: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 text-white shadow-md shadow-blue-500/30"><StudioIcon name={icon} /></span>
      <div><h3 className="text-lg font-black text-slate-950">{title}</h3><p className="mt-0.5 text-sm leading-5 text-slate-500">{hint}</p></div>
    </div>
  );
}

export function StudioCard({ title, hint, children }: { title?: string; hint?: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      {title && <div className="mb-4"><h4 className="text-sm font-bold text-slate-900">{title}</h4>{hint && <p className="mt-1 text-xs leading-5 text-slate-500">{hint}</p>}</div>}
      {children}
    </div>
  );
}

export const studioFormId = (cardId: string) => `studio-form-${cardId}`;
export const studioVisibilityFormId = (cardId: string) => `studio-vis-${cardId}`;
