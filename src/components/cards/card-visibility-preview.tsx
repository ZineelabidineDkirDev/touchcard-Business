"use client";

import { useState } from "react";

const sectionOptions = [
  ["show_about", "Présentation / À propos"],
  ["show_contact", "Coordonnées / Contact"],
  ["show_company_info", "Informations entreprise"],
  ["show_categories", "Domaines et spécialités"],
  ["show_info_fields", "Informations complémentaires"],
  ["show_google_reviews", "Avis Google"],
  ["show_catalog_pdf", "Catalogue PDF"],
  ["show_catalog", "Prestations / Menu / Produits"],
  ["show_request_forms", "Formulaires de demande (tout)"],
  ["show_orders", "Commandes boutique"],
  ["show_bookings", "Réservations"],
  ["show_quotes", "Demandes de devis"],
  ["show_social_links", "Réseaux sociaux"],
  ["show_featured_links", "Liens mis en avant"],
  ["show_faq", "Questions fréquentes (FAQ)"],
  ["show_videos", "Vidéos"],
  ["show_location", "Adresse et carte"],
] as const;

const contactOptions = [
  ["show_phone", "Téléphone"],
  ["show_email", "E-mail"],
  ["show_website", "Site web"],
] as const;

type Props = {
  cardId: string;
  action: (formData: FormData) => void | Promise<void>;
  initialSettings: Record<string, boolean> | null;
  cardName: string;
  companyName: string;
  jobTitle: string;
  bio: string;
  phone: string;
  email: string;
  website: string;
  accent: string;
  textColor: string;
  catalogLabel: string;
  catalogCount: number;
  hasCatalogPdf: boolean;
  socialCount: number;
  featuredCount: number;
};

export function CardVisibilityPreview(props: Props) {
  const [visibility, setVisibility] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const [key] of [...sectionOptions, ...contactOptions]) {
      initial[key] = props.initialSettings?.[key] !== false;
    }
    return initial;
  });

  const toggle = (key: string, checked: boolean) => {
    setVisibility((current) => ({ ...current, [key]: checked }));
  };

  const visibleSections = [
    { key: "show_about", title: "À propos", detail: props.bio || "Votre présentation apparaîtra ici.", available: Boolean(props.bio) },
    { key: "show_contact", title: "Restons en contact", detail: [visibility.show_phone && props.phone ? "Téléphone" : "", visibility.show_email && props.email ? "E-mail" : "", visibility.show_website && props.website ? "Site web" : ""].filter(Boolean).join(" · ") || "Vos coordonnées seront affichées ici.", available: Boolean(props.phone || props.email || props.website) },
    { key: "show_company_info", title: "Informations entreprise", detail: "Téléphone, adresse et informations professionnelles", available: Boolean(props.companyName) },
    { key: "show_categories", title: "Domaines et spécialités", detail: "Vos activités et expertises", available: true },
    { key: "show_info_fields", title: "Informations complémentaires", detail: "Champs personnalisés de votre carte", available: true },
    { key: "show_google_reviews", title: "Avis Google", detail: "Votre espace d’avis et recommandations", available: true },
    { key: "show_catalog_pdf", title: "Catalogue PDF", detail: props.hasCatalogPdf ? "Document PDF disponible" : "Le catalogue PDF apparaîtra après son ajout", available: props.hasCatalogPdf },
    { key: "show_catalog", title: props.catalogLabel, detail: props.catalogCount ? props.catalogCount + " élément(s) dans votre catalogue" : "Vos prestations ou produits", available: true },
    { key: "show_request_forms", title: "Réservation / Commande", detail: "Formulaire de demande pour vos visiteurs", available: true },
    { key: "show_social_links", title: "Réseaux sociaux", detail: props.socialCount ? props.socialCount + " réseau(x) connecté(s)" : "Vos liens sociaux", available: true },
    { key: "show_featured_links", title: "Liens mis en avant", detail: props.featuredCount ? props.featuredCount + " lien(s) ajouté(s)" : "Vos liens importants", available: true },
    { key: "show_faq", title: "Questions fréquentes", detail: "Réponses aux questions de vos visiteurs", available: true },
    { key: "show_videos", title: "Vidéos", detail: "Vos vidéos et présentations", available: true },
    { key: "show_location", title: "Adresse et carte", detail: "Votre adresse et itinéraire", available: true },
  ].filter((section) => visibility[section.key] && section.available);

  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div>
        <h3 className="text-sm font-black text-slate-900">Modules visibles dans ma carte</h3>
        <p className="mt-1 text-xs leading-5 text-slate-500">Activez ou désactivez les rubriques de votre carte. L’aperçu se met à jour immédiatement ; cliquez sur « Enregistrer » pour appliquer le choix à la carte publique.</p>
      </div>
      <form action={props.action}>
      <input type="hidden" name="card_id" value={props.cardId}/>
      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_.82fr]">
        <div>
          <div className="grid gap-2 sm:grid-cols-2">
            {sectionOptions.map(([key, label]) => (
              <label key={key} className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 transition hover:border-indigo-300">
                <input type="checkbox" name={key} checked={visibility[key]} onChange={(event) => toggle(key, event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"/>
                <span className="flex-1">{label}</span>
                <span className={visibility[key] ? "text-emerald-600" : "text-slate-400"}>{visibility[key] ? "Visible" : "Masquée"}</span>
              </label>
            ))}
          </div>
          <div className="mt-4 border-t border-slate-200 pt-3">
            <p className="mb-2 text-xs font-bold text-slate-700">Visibilité des coordonnées</p>
            <div className="flex flex-wrap gap-3">
              {contactOptions.map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs">
                  <input type="checkbox" name={key} checked={visibility[key]} onChange={(event) => toggle(key, event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-indigo-600"/>
                  {label}
                </label>
              ))}
            </div>
          </div>
        </div>

        <aside className="mx-auto w-full max-w-[330px]">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-wider text-slate-600">Aperçu en direct</p>
            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-700">Non enregistré</span>
          </div>
          <div className="overflow-hidden rounded-[2rem] border-[6px] border-slate-900 bg-slate-100 shadow-xl">
            <div className="h-2.5 bg-slate-900"/>
            <div className="bg-white">
              <div className="h-20" style={{ background: `linear-gradient(120deg, ${props.accent}, #111827)` }}/>
              <div className="-mt-8 px-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-4 border-white bg-slate-100 text-2xl font-black text-slate-500 shadow-sm">{props.cardName.trim().charAt(0).toUpperCase() || "T"}</div>
                <h4 className="mt-2 text-base font-black" style={{ color: props.textColor }}>{props.cardName}</h4>
                {props.jobTitle && <p className="text-[11px]" style={{ color: props.textColor }}>{props.jobTitle}</p>}
                {props.companyName && <p className="text-[11px] font-semibold" style={{ color: props.textColor }}>{props.companyName}</p>}
                <div className="mt-3 rounded-xl px-3 py-2 text-center text-[11px] font-bold text-white" style={{ backgroundColor: props.accent }}>Enregistrer le contact</div>
                <div className="mt-3 space-y-2 pb-4">
                  {visibleSections.map((section) => (
                    <div key={section.key} className="rounded-xl border border-slate-200 bg-white p-3">
                      <p className="text-xs font-extrabold" style={{ color: props.textColor }}>{section.title}</p>
                      <p className="mt-1 line-clamp-2 text-[10px] leading-4" style={{ color: props.textColor }}>{section.detail}</p>
                    </div>
                  ))}
                  {visibleSections.length === 0 && <div className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-[10px] text-slate-500">Aucune section activée.</div>}
                </div>
              </div>
            </div>
            <div className="h-2.5 bg-slate-900"/>
          </div>
          <p className="mt-2 text-center text-[10px] leading-4 text-slate-500">Aperçu indicatif : les modifications seront appliquées après enregistrement.</p>
        </aside>
      </div>
      <div className="mt-4 flex flex-col gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs text-slate-500">Un module non inclus dans votre formule reste indisponible, même si vous l’affichez ici.</p><button type="submit" className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700">Enregistrer les modules visibles</button></div>
      </form>
    </section>
  );
}
