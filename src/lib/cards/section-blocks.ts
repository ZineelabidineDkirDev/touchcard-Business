/**
 * Constructeur de sections (sans IA) : à la création de chaque espace client, des règles transforment la
 * demande (service choisi, secteur, mots-clés) en sections prêtes à remplir sur la carte.
 *
 * Trois types de blocs :
 *  - "list"   : liste d'éléments (plats, biens, véhicules, projets, équipe, sessions…) avec prix / date / lien ;
 *  - "fields" : champs typés (date, heure, nombre, texte, lien) ;
 *  - "action" : personnalise le bouton de demande déjà géré par les modules (réserver, rendez-vous, s'inscrire,
 *               chambre, véhicule, visite, commander, devis). Il ne crée pas de nouveau formulaire.
 * Les sections principales de la carte (identité, contact, réseaux, QR/NFC) ne sont jamais touchées.
 */

export type ListKind = "dishes" | "listings" | "vehicles" | "projects" | "team" | "sessions" | "offers" | "services";
export type ItemField = "price" | "date" | "link";
export type FieldType = "date" | "time" | "number" | "text" | "url";
export type ActionKind = "booking" | "order" | "quote";

export type ListItem = { id: string; title: string; description?: string; price?: string; date?: string; link?: string };
export type SectionField = { key: string; label: string; type: FieldType; value: string };

export type SectionBlock = {
  id: string;
  type: "list" | "fields" | "action";
  title: string;
  enabled: boolean;
  origin?: string;
  // list
  kind?: ListKind;
  item_fields?: ItemField[];
  items?: ListItem[];
  // fields
  fields?: SectionField[];
  // action
  action?: ActionKind;
  label?: string;
  hint?: string;
  date_mode?: "datetime" | "stay";
  start_label?: string;
  end_label?: string;
};

const list = (id: string, title: string, kind: ListKind, item_fields: ItemField[], origin: string): SectionBlock => ({ id, type: "list", title, enabled: true, origin, kind, item_fields, items: [] });
const fieldsBlock = (id: string, title: string, fields: { key: string; label: string; type: FieldType }[], origin: string): SectionBlock => ({ id, type: "fields", title, enabled: true, origin, fields: fields.map((field) => ({ ...field, value: "" })) });
const action = (id: string, title: string, kind: ActionKind, label: string, hint: string, origin: string, extra: Partial<SectionBlock> = {}): SectionBlock => ({ id, type: "action", title, enabled: true, origin, action: kind, label, hint, date_mode: "datetime", ...extra });

const STAY = { date_mode: "stay" as const, start_label: "Date d’arrivée", end_label: "Date de départ" };

/** Pack de sections par service choisi dans la demande. */
const packs: Record<string, SectionBlock[]> = {
  restaurant: [
    list("sec_dishes", "Plats & spécialités", "dishes", ["price"], "restaurant"),
    action("sec_action_booking", "Réservation", "booking", "Réserver une table", "Choisir la date et l’heure", "restaurant"),
  ],
  real_estate: [
    list("sec_listings", "Biens à découvrir", "listings", ["price", "link"], "real_estate"),
    action("sec_action_booking", "Visites", "booking", "Demander une visite", "Choisir un créneau de visite", "real_estate"),
  ],
  accommodation: [
    list("sec_offers", "Offres & activités", "offers", ["price", "link"], "accommodation"),
    action("sec_action_booking", "Séjour", "booking", "Réserver une chambre", "Choisir les dates de votre séjour", "accommodation", STAY),
  ],
  beauty: [
    list("sec_team", "Notre équipe", "team", [], "beauty"),
    action("sec_action_booking", "Rendez-vous", "booking", "Prendre rendez-vous", "Choisir une prestation et une date", "beauty"),
  ],
  appointments: [
    fieldsBlock("sec_availability", "Disponibilités", [{ key: "next_available", label: "Prochaine date disponible", type: "date" }, { key: "opening_time", label: "Premier créneau", type: "time" }], "appointments"),
    action("sec_action_booking", "Rendez-vous", "booking", "Prendre rendez-vous", "Choisir une date", "appointments"),
  ],
  medical: [
    list("sec_acts", "Actes & consultations", "services", ["price"], "medical"),
    action("sec_action_booking", "Rendez-vous", "booking", "Prendre rendez-vous", "Choisir une date de consultation", "medical"),
  ],
  gym: [
    list("sec_coaches", "Nos coachs", "team", [], "gym"),
    list("sec_classes", "Cours à venir", "sessions", ["date"], "gym"),
    action("sec_action_booking", "Inscription", "booking", "S’inscrire", "Demander une inscription ou une séance d’essai", "gym"),
  ],
  school: [
    fieldsBlock("sec_key_dates", "Dates clés", [{ key: "school_start", label: "Date de rentrée", type: "date" }, { key: "enrollment_deadline", label: "Date limite d’inscription", type: "date" }], "school"),
    action("sec_action_booking", "Préinscription", "booking", "Demander une préinscription", "Indiquer le niveau ou la filière souhaitée", "school"),
  ],
  training: [
    list("sec_sessions", "Prochaines sessions", "sessions", ["date", "price", "link"], "training"),
    action("sec_action_booking", "Inscription", "booking", "S’inscrire", "Demander une inscription à une formation", "training"),
  ],
  professional_profile: [
    list("sec_projects", "Projets & réalisations", "projects", ["link"], "professional_profile"),
  ],
  service_catalog: [
    list("sec_projects", "Projets réalisés", "projects", ["link"], "service_catalog"),
    action("sec_action_quote", "Devis", "quote", "Demander un devis", "Décrire votre besoin", "service_catalog"),
  ],
  commerce: [
    list("sec_offers", "Promotions & nouveautés", "offers", ["price", "link"], "commerce"),
    action("sec_action_order", "Commande", "order", "Commander", "Passer une commande", "commerce"),
  ],
  online_store: [
    list("sec_offers", "Promotions & nouveautés", "offers", ["price", "link"], "online_store"),
    fieldsBlock("sec_promo", "Offre en cours", [{ key: "promo_end", label: "Fin de la promotion", type: "date" }], "online_store"),
    action("sec_action_order", "Commande", "order", "Commander", "Passer une commande", "online_store"),
  ],
};

const norm = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

/** Règles « si… alors… » sur le texte de la demande (service, secteur, motif). */
const rules: { id: string; when: RegExp; blocks: SectionBlock[] }[] = [
  {
    id: "vehicle_rental",
    when: /location de voiture|louer une voiture|location auto|car rental|vehicule|voiture de location/,
    blocks: [
      list("sec_vehicles", "Notre flotte", "vehicles", ["price", "link"], "rule:vehicle_rental"),
      action("sec_action_booking", "Location", "booking", "Réserver un véhicule", "Choisir les dates de location", "rule:vehicle_rental", { date_mode: "stay", start_label: "Prise en charge", end_label: "Retour" }),
    ],
  },
  {
    id: "events",
    when: /evenement|mariage|traiteur|salle des fetes|organisation de fete/,
    blocks: [list("sec_packs", "Formules & packs", "offers", ["price"], "rule:events"), action("sec_action_quote", "Devis", "quote", "Demander un devis", "Décrire votre événement (date, nombre d’invités)", "rule:events")],
  },
  {
    id: "portfolio",
    when: /portfolio|realisation|architecte|designer|photographe|graphiste/,
    blocks: [list("sec_projects", "Projets & réalisations", "projects", ["link"], "rule:portfolio")],
  },
  {
    id: "sessions",
    when: /formation|atelier|cours particuliers|coaching/,
    blocks: [list("sec_sessions", "Prochaines sessions", "sessions", ["date", "price", "link"], "rule:sessions")],
  },
];

export function buildSectionBlocks(input: { template: string; serviceId?: string; text?: string }): SectionBlock[] {
  if (input.template === "contact") return [];
  const text = norm(input.text ?? "");
  const blocks: SectionBlock[] = [...(packs[input.serviceId ?? ""] ?? [])].map((block) => ({ ...block, items: block.items ? [] : undefined }));
  for (const rule of rules) {
    if (!rule.when.test(text)) continue;
    for (const block of rule.blocks) {
      const index = blocks.findIndex((existing) => existing.id === block.id);
      if (index >= 0) { if (block.type === "action") blocks[index] = { ...block }; continue; } // la règle précise l'action existante
      blocks.push({ ...block, items: block.items ? [] : undefined });
    }
  }
  return blocks.slice(0, 12);
}

/** Ajoute les sections proposées qui manquent, sans écraser ce que le client a déjà rempli. */
export function mergeSectionBlocks(existing: SectionBlock[], proposed: SectionBlock[]): SectionBlock[] {
  const known = new Set(existing.map((block) => block.id));
  return [...existing, ...proposed.filter((block) => !known.has(block.id))].slice(0, 12);
}

const clean = (value: unknown, max: number) => String(value ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max);
const safeUrl = (value: unknown) => { const url = clean(value, 500); return /^https?:\/\//i.test(url) ? url : ""; };
const kinds: ListKind[] = ["dishes", "listings", "vehicles", "projects", "team", "sessions", "offers", "services"];
const itemFieldList: ItemField[] = ["price", "date", "link"];
const fieldTypes: FieldType[] = ["date", "time", "number", "text", "url"];
const actionKinds: ActionKind[] = ["booking", "order", "quote"];

/** Valide et nettoie des sections venant d'un formulaire, de la base ou d'un brouillon. */
export function sanitizeSectionBlocks(raw: unknown, max = 12): SectionBlock[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: SectionBlock[] = [];
  for (const entry of raw.slice(0, max)) {
    if (!entry || typeof entry !== "object") continue;
    const block = entry as Record<string, unknown>;
    const id = clean(block.id, 48).replace(/[^a-zA-Z0-9_-]/g, "");
    const type = block.type;
    const title = clean(block.title, 80);
    if (!id || !title || seen.has(id) || (type !== "list" && type !== "fields" && type !== "action")) continue;
    seen.add(id);
    const base = { id, type, title, enabled: block.enabled !== false, origin: clean(block.origin, 60) || undefined } as SectionBlock;
    if (type === "list") {
      base.kind = kinds.includes(block.kind as ListKind) ? (block.kind as ListKind) : "offers";
      base.item_fields = (Array.isArray(block.item_fields) ? block.item_fields : []).filter((field): field is ItemField => itemFieldList.includes(field as ItemField));
      base.items = (Array.isArray(block.items) ? block.items : []).slice(0, 30).map((item, index) => {
        const value = (item ?? {}) as Record<string, unknown>;
        return { id: clean(value.id, 40).replace(/[^a-zA-Z0-9_-]/g, "") || `i${index + 1}`, title: clean(value.title, 100), description: clean(value.description, 400) || undefined, price: clean(value.price, 40) || undefined, date: clean(value.date, 40) || undefined, link: safeUrl(value.link) || undefined };
      }).filter((item) => item.title);
    } else if (type === "fields") {
      base.fields = (Array.isArray(block.fields) ? block.fields : []).slice(0, 12).map((field) => {
        const value = (field ?? {}) as Record<string, unknown>;
        const fieldType = fieldTypes.includes(value.type as FieldType) ? (value.type as FieldType) : "text";
        const raw = clean(value.value, 300);
        return { key: clean(value.key, 40).replace(/[^a-zA-Z0-9_-]/g, ""), label: clean(value.label, 80), type: fieldType, value: fieldType === "url" ? safeUrl(raw) : raw };
      }).filter((field) => field.key && field.label);
    } else {
      base.action = actionKinds.includes(block.action as ActionKind) ? (block.action as ActionKind) : "booking";
      base.label = clean(block.label, 40) || title;
      base.hint = clean(block.hint, 120) || undefined;
      base.date_mode = block.date_mode === "stay" ? "stay" : "datetime";
      base.start_label = clean(block.start_label, 40) || undefined;
      base.end_label = clean(block.end_label, 40) || undefined;
    }
    out.push(base);
  }
  return out;
}

/** Réglages du bouton de réservation déduits de la première section d'action « réserver » activée. */
export function bookingUiFromSections(sections: SectionBlock[] | undefined) {
  const block = (sections ?? []).find((item) => item.type === "action" && item.action === "booking" && item.enabled);
  if (!block) return null;
  return { label: block.label, hint: block.hint, dateMode: block.date_mode, startLabel: block.start_label, endLabel: block.end_label };
}
