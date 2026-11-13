"use client";

import type { EditableCardField } from "@/components/cards/custom-card-fields-editor";
import type { SectionBlock } from "@/lib/cards/section-blocks";
import { StudioIcon } from "@/components/cards/studio/studio-icons";

export type PreviewLink = { id: string; label: string; url: string; kind: string };
export type PreviewCatalogItem = { id: string; name: string; description: string | null; price: number; currency: string; image_url: string | null };

/** Données qui ne changent pas pendant l'édition (chargées par le serveur). */
export type PreviewBase = {
  template: string;
  links: PreviewLink[];
  catalog: PreviewCatalogItem[];
  catalogLabel: string;
  catalogEnabled: boolean;
  requestButtons: { label: string; kind: "booking" | "order" | "quote" }[];
  settings: Record<string, boolean>;
  visibilityKeys: string[];
};

/** Données lues en direct dans les formulaires. */
export type PreviewValues = {
  full_name: string; job_title: string; company_name: string; avatar_url: string; cover_url: string;
  accent_color: string; text_color: string; email: string; phone: string; website: string; tagline: string; bio: string;
  location: string; hours: string; company_phone: string; company_email: string; company_address: string; whatsapp: string;
  custom_fields: EditableCardField[]; sections: SectionBlock[]; show: Record<string, boolean>;
};

const date = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(value + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : value;

export function LiveCardPreview({ values, base }: { values: PreviewValues; base: PreviewBase }) {
  const accent = /^#[0-9a-fA-F]{6}$/.test(values.accent_color) ? values.accent_color : "#2563EB";
  const text = /^#[0-9a-fA-F]{6}$/.test(values.text_color) ? values.text_color : "#111827";
  const show = (key: string) => values.show[key] !== false;
  const phone = values.company_phone || values.phone;
  const email = values.company_email || values.email;
  const address = values.company_address || values.location;
  const sections = values.sections.filter((section) => section.enabled);
  const infoFields = values.custom_fields.filter((field) => field.visible && field.label && field.value && !field.section && !/portfolio|^cv$|cv professionnel/i.test(field.key + " " + field.label));
  const specificFields = values.custom_fields.filter((field) => field.visible && field.label && field.value && field.section);
  const buttons = [
    show("show_contact") && show("show_phone") && phone ? { icon: "phone" as const, label: "Appeler" } : null,
    values.whatsapp ? { icon: "chat" as const, label: "WhatsApp" } : null,
    show("show_contact") && show("show_email") && email ? { icon: "mail" as const, label: "E-mail" } : null,
    show("show_website") && values.website ? { icon: "globe" as const, label: "Site web" } : null,
  ].filter((item): item is NonNullable<typeof item> => Boolean(item));
  const requestButtons = [...base.requestButtons];
  for (const section of sections) if (section.type === "action" && section.label) { const index = requestButtons.findIndex((button) => button.kind === section.action); if (index >= 0) requestButtons[index] = { ...requestButtons[index], label: section.label }; }
  const showRequests = show("show_request_forms") && ((show("show_bookings") && requestButtons.some((b) => b.kind === "booking")) || (show("show_orders") && requestButtons.some((b) => b.kind === "order")) || (show("show_quotes") && requestButtons.some((b) => b.kind === "quote")));

  return (
    <div className="mx-auto w-full max-w-[340px] rounded-[2.4rem] border-[7px] border-slate-900 bg-slate-900 shadow-2xl shadow-blue-900/30">
      <div className="mx-auto -mb-3 h-5 w-24 rounded-b-2xl bg-slate-900" aria-hidden="true" />
      <div className="max-h-[620px] overflow-y-auto rounded-[1.9rem] bg-slate-100 pb-6" style={{ color: text }}>
        <div className="relative h-28" style={{ background: values.cover_url ? undefined : `linear-gradient(135deg, ${accent}, ${accent}99)` }}>
          {values.cover_url && <img src={values.cover_url} alt="" className="h-full w-full object-cover" />}
        </div>
        <div className="-mt-10 px-4">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl border-4 border-white bg-white text-2xl font-black shadow-lg" style={{ color: accent }}>
            {values.avatar_url ? <img src={values.avatar_url} alt="" className="h-full w-full object-cover" /> : (values.full_name || "?").slice(0, 1).toUpperCase()}
          </div>
          <h2 className="mt-3 text-xl font-black leading-tight">{values.full_name || "Votre nom"}</h2>
          <p className="text-sm font-semibold opacity-80">{[values.job_title, values.company_name].filter(Boolean).join(" · ") || "Votre activité"}</p>
          {values.tagline && <p className="mt-1 text-xs leading-5 opacity-70">{values.tagline}</p>}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 px-4">
          {buttons.map((button) => <span key={button.label} className="flex items-center justify-center gap-2 rounded-2xl px-3 py-2.5 text-xs font-bold text-white shadow-sm" style={{ backgroundColor: accent }}><StudioIcon name={button.icon} className="h-4 w-4" />{button.label}</span>)}
          <span className="col-span-2 flex items-center justify-center gap-2 rounded-2xl border bg-white px-3 py-2.5 text-xs font-bold" style={{ color: accent, borderColor: accent }}><StudioIcon name="plus" className="h-4 w-4" />Enregistrer le contact</span>
        </div>

        {showRequests && <div className="mt-3 space-y-2 px-4">{requestButtons.filter((button) => (button.kind === "booking" && show("show_bookings")) || (button.kind === "order" && show("show_orders")) || (button.kind === "quote" && show("show_quotes"))).map((button) => <span key={button.kind} className="flex items-center justify-center gap-2 rounded-2xl bg-white px-3 py-3 text-xs font-extrabold shadow-sm ring-1 ring-slate-200" style={{ color: accent }}><StudioIcon name="spark" className="h-4 w-4" />{button.label}</span>)}</div>}

        {show("show_social_links") && base.links.length > 0 && <div className="mt-3 flex flex-wrap gap-2 px-4">{base.links.map((link) => <span key={link.id} className="rounded-full bg-white px-3 py-1.5 text-[11px] font-bold shadow-sm ring-1 ring-slate-200">{link.label}</span>)}</div>}

        {show("show_about") && values.bio && <section className="mx-4 mt-3 rounded-2xl bg-white p-3"><h3 className="text-xs font-black">À propos</h3><p className="mt-1 text-xs leading-5 opacity-80">{values.bio}</p></section>}

        {show("show_company_info") && (address || values.hours) && <section className="mx-4 mt-3 space-y-1 rounded-2xl bg-white p-3 text-xs">{address && <p><strong>Adresse :</strong> {address}</p>}{values.hours && <p><strong>Horaires :</strong> {values.hours}</p>}</section>}

        {base.catalogEnabled && show("show_catalog") && base.catalog.length > 0 && <section className="mx-4 mt-3 rounded-2xl bg-white p-3"><h3 className="text-xs font-black">{base.catalogLabel}</h3><div className="mt-2 space-y-2">{base.catalog.slice(0, 3).map((item) => <div key={item.id} className="flex items-center gap-2"><div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-slate-100">{item.image_url && <img src={item.image_url} alt="" className="h-full w-full object-cover" />}</div><div className="min-w-0 flex-1"><p className="truncate text-xs font-bold">{item.name}</p></div><span className="text-xs font-black" style={{ color: accent }}>{Number(item.price).toLocaleString("fr-MA")} {item.currency}</span></div>)}</div></section>}

        {sections.filter((section) => section.type === "list" && (section.items ?? []).some((item) => item.title)).map((section) => <section key={section.id} className="mx-4 mt-3 rounded-2xl bg-white p-3"><h3 className="text-xs font-black">{section.title}</h3><div className="mt-2 space-y-2">{(section.items ?? []).filter((item) => item.title).slice(0, 3).map((item) => <div key={item.id} className="rounded-xl bg-slate-50 p-2"><p className="text-xs font-bold">{item.title}</p>{item.description && <p className="mt-0.5 line-clamp-2 text-[11px] opacity-70">{item.description}</p>}<p className="mt-1 flex justify-between text-[11px] font-bold" style={{ color: accent }}><span>{item.date ? date(item.date) : ""}</span><span>{item.price ?? ""}</span></p></div>)}</div></section>)}

        {sections.filter((section) => section.type === "fields" && (section.fields ?? []).some((field) => field.value)).map((section) => <section key={section.id} className="mx-4 mt-3 rounded-2xl bg-white p-3"><h3 className="text-xs font-black">{section.title}</h3><dl className="mt-2 space-y-1 text-xs">{(section.fields ?? []).filter((field) => field.value).map((field) => <div key={field.key} className="flex justify-between gap-2"><dt className="opacity-70">{field.label}</dt><dd className="font-bold">{field.type === "date" ? date(field.value) : field.value}</dd></div>)}</dl></section>)}

        {show("show_info_fields") && (infoFields.length > 0 || specificFields.length > 0) && <section className="mx-4 mt-3 rounded-2xl bg-white p-3"><h3 className="text-xs font-black">Informations</h3><dl className="mt-2 space-y-1 text-xs">{[...specificFields, ...infoFields].slice(0, 8).map((field) => <div key={field.key} className="flex justify-between gap-2"><dt className="opacity-70">{field.label}</dt><dd className="max-w-[55%] truncate text-right font-bold">{field.value}</dd></div>)}</dl></section>}
      </div>
    </div>
  );
}
