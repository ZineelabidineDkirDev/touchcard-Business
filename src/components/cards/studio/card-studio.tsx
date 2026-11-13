"use client";

import { useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import type { EditableCardField } from "@/components/cards/custom-card-fields-editor";
import { sanitizeSectionBlocks } from "@/lib/cards/section-blocks";
import { LiveCardPreview, type PreviewBase, type PreviewValues } from "@/components/cards/studio/live-card-preview";
import { StudioIcon, type StudioIconName } from "@/components/cards/studio/studio-icons";
import { studioFormId, studioVisibilityFormId } from "@/components/cards/studio/studio-ui";

export type StudioTab = { id: string; label: string; icon: StudioIconName; kind: "form" | "standalone"; panel: ReactNode };

type Props = {
  cardId: string;
  slug: string;
  title: string;
  subtitle: string;
  isPublished: boolean;
  publicUrl: string;
  formAction: (formData: FormData) => void | Promise<void>;
  tabs: StudioTab[];
  base: PreviewBase;
  initial: PreviewValues;
  headerActions: ReactNode;
  stats: { views: number; nfc: number };
};

const text = (data: FormData, key: string, fallback: string) => (data.has(key) ? String(data.get(key) ?? "") : fallback);

function readValues(formId: string, visId: string, base: PreviewBase, initial: PreviewValues): PreviewValues {
  const form = typeof document !== "undefined" ? (document.getElementById(formId) as HTMLFormElement | null) : null;
  const vis = typeof document !== "undefined" ? (document.getElementById(visId) as HTMLFormElement | null) : null;
  const data = form ? new FormData(form) : null;
  const visData = vis ? new FormData(vis) : null;
  let custom: EditableCardField[] = initial.custom_fields;
  let sections = initial.sections;
  if (data) {
    try { const parsed = JSON.parse(String(data.get("custom_fields") ?? "[]")); if (Array.isArray(parsed)) custom = parsed; } catch { /* conserve les valeurs initiales */ }
    try { if (data.has("sections_json")) sections = sanitizeSectionBlocks(JSON.parse(String(data.get("sections_json") ?? "[]"))); } catch { /* idem */ }
  }
  const show: Record<string, boolean> = { ...base.settings };
  if (visData) for (const key of base.visibilityKeys) show[key] = visData.has(key);
  const get = (key: keyof PreviewValues) => data ? text(data, key, String(initial[key] ?? "")) : String(initial[key] ?? "");
  return {
    full_name: get("full_name"), job_title: get("job_title"), company_name: get("company_name"), avatar_url: get("avatar_url"), cover_url: get("cover_url"),
    accent_color: get("accent_color"), text_color: get("text_color"), email: get("email"), phone: get("phone"), website: get("website"), tagline: get("tagline"), bio: get("bio"),
    location: get("location"), hours: get("hours"), company_phone: get("company_phone"), company_email: get("company_email"), company_address: get("company_address"), whatsapp: get("whatsapp"),
    custom_fields: custom, sections, show,
  };
}

const subscribe = (callback: () => void) => { window.addEventListener("tc-studio-tab", callback); return () => window.removeEventListener("tc-studio-tab", callback); };

export function CardStudio({ cardId, slug, title, subtitle, isPublished, publicUrl, formAction, tabs, base, initial, headerActions, stats }: Props) {
  const formId = studioFormId(cardId);
  const visId = studioVisibilityFormId(cardId);
  const storageKey = `tc_studio_tab_${cardId}`;
  const stored = useSyncExternalStore(subscribe, () => { try { return window.sessionStorage.getItem(storageKey) ?? ""; } catch { return ""; } }, () => "");
  const active = tabs.some((tab) => tab.id === stored) ? stored : tabs[0].id;
  const activeKind = tabs.find((tab) => tab.id === active)?.kind ?? "form";
  const setActive = (id: string) => { try { window.sessionStorage.setItem(storageKey, id); } catch { /* stockage indisponible */ } window.dispatchEvent(new Event("tc-studio-tab")); };

  const [values, setValues] = useState<PreviewValues>(initial);
  const [mode, setMode] = useState<"live" | "published">("live");
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    const read = () => setValues((current) => { const next = readValues(formId, visId, base, initial); return JSON.stringify(next) === JSON.stringify(current) ? current : next; });
    const targets = [document.getElementById(formId), document.getElementById(visId)].filter((node): node is HTMLElement => Boolean(node));
    for (const node of targets) { node.addEventListener("input", read); node.addEventListener("change", read); }
    const timer = window.setInterval(read, 400);
    return () => { window.clearInterval(timer); for (const node of targets) { node.removeEventListener("input", read); node.removeEventListener("change", read); } };
  }, [formId, visId, base, initial]);

  const checklist = useMemo(() => {
    const has = (id: string) => tabs.some((tab) => tab.id === id);
    const filledSections = values.sections.some((section) => section.enabled && ((section.items ?? []).some((item) => item.title) || (section.fields ?? []).some((field) => field.value)));
    const filledFields = values.custom_fields.some((field) => field.visible && field.value.trim());
    return [
      { id: "avatar", label: "Ajouter une photo de profil", done: Boolean(values.avatar_url), tab: "identity" },
      { id: "cover", label: "Ajouter une image de couverture", done: Boolean(values.cover_url), tab: "identity" },
      { id: "tagline", label: "Écrire une accroche", done: Boolean(values.tagline.trim()), tab: "identity" },
      { id: "bio", label: "Présenter votre activité", done: values.bio.trim().length >= 20, tab: "identity" },
      { id: "phone", label: "Ajouter un téléphone ou WhatsApp", done: Boolean(values.phone || values.company_phone || values.whatsapp), tab: "contact" },
      { id: "links", label: "Ajouter un réseau social ou un lien", done: base.links.length > 0, tab: "links" },
      { id: "content", label: base.catalogEnabled ? `Ajouter vos ${base.catalogLabel.toLowerCase()}` : "Remplir vos sections", done: (base.catalogEnabled && base.catalog.length > 0) || filledSections || filledFields, tab: base.catalogEnabled && has("catalog") ? "catalog" : "sections" },
    ].map((item) => ({ ...item, tab: has(item.tab) ? item.tab : tabs[0].id }));
  }, [values, base, tabs]);
  const done = checklist.filter((item) => item.done).length;
  const percent = Math.round((done / checklist.length) * 100);
  const missing = checklist.filter((item) => !item.done);
  const missingTabs = new Set(missing.map((item) => item.tab));

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
      <div className="min-w-0 space-y-4">
        <header className="tc-revert-font rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2"><h2 className="truncate text-2xl font-black text-slate-950">{title}</h2><span className={"rounded-full px-3 py-1 text-xs font-bold " + (isPublished ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700")}>{isPublished ? "Publiée" : "Brouillon"}</span></div>
              <p className="mt-1 text-xs text-slate-500">{subtitle} · /p/{slug} · {stats.views} visite(s) · {stats.nfc} scan(s) NFC</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-cyan-400"><StudioIcon name="external" className="h-4 w-4" />Voir la carte publique</a>
              <a href="#studio-preview" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 xl:hidden"><StudioIcon name="eye" className="h-4 w-4" />Aperçu</a>
              {headerActions}
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs font-bold text-slate-600"><span>Carte complète à {percent} %</span><span>{done}/{checklist.length}</span></div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}><div className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-600 transition-all duration-500" style={{ width: `${percent}%` }} /></div>
            {missing.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{missing.slice(0, 4).map((item) => <button key={item.id} type="button" onClick={() => setActive(item.tab)} className="inline-flex items-center gap-1.5 rounded-full border border-cyan-300/60 bg-cyan-50 px-3 py-1.5 text-xs font-bold text-cyan-800 hover:bg-cyan-100"><StudioIcon name="spark" className="h-3.5 w-3.5" />{item.label}</button>)}</div>}
          </div>
        </header>

        <nav role="tablist" aria-label="Rubriques de la carte" className="tc-revert-font flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm [scrollbar-width:none]">
          {tabs.map((tab) => (
            <button key={tab.id} type="button" role="tab" aria-selected={active === tab.id} aria-controls={`studio-panel-${tab.id}`} onClick={() => setActive(tab.id)}
              className={"relative flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-bold transition " + (active === tab.id ? "bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-600 text-white shadow-md shadow-blue-500/30" : "text-slate-600 hover:bg-slate-100")}>
              <StudioIcon name={tab.icon} className="h-[18px] w-[18px]" /><span>{tab.label}</span>
              {missingTabs.has(tab.id) && active !== tab.id && <span aria-label="À compléter" className="h-2 w-2 rounded-full bg-amber-400" />}
            </button>
          ))}
        </nav>

        <form id={formId} action={formAction} className="space-y-4">
          <input type="hidden" name="card_id" value={cardId} />
          {tabs.filter((tab) => tab.kind === "form").map((tab) => <section key={tab.id} id={`studio-panel-${tab.id}`} role="tabpanel" hidden={active !== tab.id} className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">{tab.panel}</section>)}
          <div className={activeKind === "form" ? "tc-revert-font sticky bottom-3 z-10 flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur" : "hidden"}>
            <p className="text-xs text-slate-500">L’aperçu se met à jour tout de suite. Les visiteurs voient vos changements après l’enregistrement.</p>
            <button className="btn-primary shrink-0 rounded-full px-6 py-3 text-sm"><span className="mr-2 inline-flex"><StudioIcon name="check" className="h-4 w-4" /></span>Enregistrer</button>
          </div>
        </form>

        {tabs.filter((tab) => tab.kind === "standalone").map((tab) => <section key={tab.id} id={`studio-panel-${tab.id}`} role="tabpanel" hidden={active !== tab.id} className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">{tab.panel}</section>)}
      </div>

      <aside id="studio-preview" className="tc-revert-font scroll-mt-24 space-y-3 xl:sticky xl:top-20 xl:self-start">
        <div className="flex items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
          <div className="flex gap-1">
            <button type="button" onClick={() => setMode("live")} className={"rounded-xl px-3 py-2 text-xs font-bold " + (mode === "live" ? "bg-slate-900 text-white" : "text-slate-600")}>Aperçu en direct</button>
            <button type="button" onClick={() => { setMode("published"); setNonce((value) => value + 1); }} className={"rounded-xl px-3 py-2 text-xs font-bold " + (mode === "published" ? "bg-slate-900 text-white" : "text-slate-600")}>Carte publiée</button>
          </div>
          <span className="flex items-center gap-1.5 pr-2 text-[11px] font-bold text-emerald-600"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />{mode === "live" ? "En direct" : "Enregistré"}</span>
        </div>
        {mode === "live" ? <LiveCardPreview values={values} base={base} /> : isPublished ? (
          <div className="mx-auto w-full max-w-[340px] overflow-hidden rounded-[2.4rem] border-[7px] border-slate-900 bg-white shadow-2xl">
            <iframe key={nonce} title="Carte publiée" src={`${publicUrl}?preview=${nonce}`} className="h-[640px] w-full" loading="lazy" />
          </div>
        ) : <p className="rounded-2xl border border-dashed border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">Votre carte est encore en brouillon : elle n’est pas visible publiquement. Publiez-la pour afficher ici la version en ligne.</p>}
        <p className="text-center text-[11px] leading-4 text-slate-500">{mode === "live" ? "Aperçu fidèle de votre page : les formulaires de demande s’affichent aussi sur la carte publiée." : "Version actuellement en ligne (dernier enregistrement)."}</p>
        {mode === "published" && <button type="button" onClick={() => setNonce((value) => value + 1)} className="mx-auto flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700">Actualiser</button>}
      </aside>
    </div>
  );
}
