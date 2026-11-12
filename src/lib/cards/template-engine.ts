import { BASE_MODULES_BY_TEMPLATE } from "@/lib/cards/module-registry";
import { buildSectionBlocks, mergeSectionBlocks, type SectionBlock } from "@/lib/cards/section-blocks";
import { getServiceFields, getServiceModules } from "@/lib/cards/service-choice-registry";

export type CardTemplate = "contact" | "service" | "e-business" | "google-review";

export type TemplateNeeds = {
  selected?: string[];
  reservation_mode?: string | null;
  reservation_channels?: string[];
  management_needs?: string[];
};

export type TemplateProfileDraft = {
  tagline: string;
  description: string;
  categories: string[];
  catalog_items: { name: string; description: string; price: string }[];
  card_fields: { key: string; label: string; type: "text" | "textarea" | "url" | "phone" | "email"; visible: boolean; section?: string }[];
  sections?: SectionBlock[];
  suggested_buttons: { kind: string; label: string; enabled: boolean }[];
};

const baseModules: Record<CardTemplate, string[]> = BASE_MODULES_BY_TEMPLATE as Record<CardTemplate, string[]>;

const themes: Record<CardTemplate, { accent: string; background: string; layout: string }> = {
  contact: { accent: "#6366f1", background: "#0f172a", layout: "classic" },
  service: { accent: "#0ea5e9", background: "#082f49", layout: "service" },
  "e-business": { accent: "#10b981", background: "#022c22", layout: "commerce" },
  "google-review": { accent: "#16a34a", background: "#052e16", layout: "review" },
};

function normalizedText(needs: TemplateNeeds | null, sector: string, reason: string) {
  return [...(needs?.selected ?? []), ...(needs?.management_needs ?? []), needs?.reservation_mode ?? "", ...(needs?.reservation_channels ?? []), sector, reason]
    .join(" ").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export type RequestSocialLink = { platform?: string | null; url?: string | null };

const buttonKindByPlatform: Record<string, string> = {
  instagram: "instagram", facebook: "facebook", tiktok: "tiktok", linkedin: "linkedin", youtube: "youtube",
  whatsapp: "whatsapp", telegram: "telegram", "site web": "website", website: "website",
};
const buttonLabels: Record<string, string> = {
  instagram: "Instagram", facebook: "Facebook", tiktok: "TikTok", linkedin: "LinkedIn", youtube: "YouTube",
  whatsapp: "WhatsApp Business", telegram: "Telegram", website: "Site web",
};
const contactButtonKinds = new Set(["whatsapp", "telegram", "instagram", "facebook", "linkedin", "tiktok", "youtube", "website"]);

function plain(value: unknown) {
  return String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

/**
 * Active tout ce que le client a demandé : un bouton est activé dès que le client a fourni le lien
 * correspondant (ou un numéro pour WhatsApp), et un champ de profil est affiché dès que le module
 * lié à son choix est activé. Ne désactive jamais rien.
 */
export function activateRequestChoices(
  draft: TemplateProfileDraft,
  ctx: { template: string; modules: string[]; socialLinks?: RequestSocialLink[] | null; businessPhone?: string | null; needsText?: string },
): TemplateProfileDraft {
  const links = (Array.isArray(ctx.socialLinks) ? ctx.socialLinks : []).filter((link) => link && String(link.url ?? "").trim());
  const providedKinds = new Set(links.map((link) => buttonKindByPlatform[plain(link.platform)]).filter(Boolean));
  if (String(ctx.businessPhone ?? "").trim()) providedKinds.add("whatsapp");

  const buttons = draft.suggested_buttons.map((button) => ({ ...button, enabled: button.enabled || providedKinds.has(button.kind) }));
  for (const kind of providedKinds) {
    if (buttons.some((button) => button.kind === kind)) continue;
    if (ctx.template === "contact" && !contactButtonKinds.has(kind)) continue;
    buttons.push({ kind, label: buttonLabels[kind] ?? kind, enabled: true });
  }

  const has = (module: string) => ctx.modules.includes(module);
  const needs = plain(ctx.needsText);
  const hasOtherLink = links.some((link) => !buttonKindByPlatform[plain(link.platform)]);
  const showByKey: Record<string, boolean> = {
    portfolio_url: hasOtherLink || has("gallery") && /portfolio|cv|galerie|realisation/.test(needs),
    booking_url: has("bookings") || has("availability_calendar"),
    return_policy: has("orders") || has("product_catalog"),
    delivery: has("orders") || has("product_catalog"),
    service_area: has("service_catalog") || has("bookings"),
    google_review_url: has("google_reviews"),
    review_message: has("google_reviews"),
  };
  const card_fields = draft.card_fields.map((field) => ({ ...field, visible: field.visible || showByKey[field.key] === true }));
  return { ...draft, suggested_buttons: buttons.slice(0, 8), card_fields };
}

/**
 * Ajoute les champs propres au service choisi par le client (ex. restaurant : type de cuisine, capacité…).
 * Ils s'ajoutent aux champs classiques, sans jamais en retirer. L'E-Contact reste limité à son profil standard.
 */
export function withServiceFields(draft: TemplateProfileDraft, serviceId: string, template: string): TemplateProfileDraft {
  if (!serviceId || template === "contact") return draft;
  const known = new Set(draft.card_fields.map((field) => field.key));
  const extra = getServiceFields(serviceId)
    .filter((field) => !known.has(field.key))
    .map((field) => ({ key: field.key, label: field.label, type: field.type, visible: true, section: field.section }));
  return extra.length ? { ...draft, card_fields: [...draft.card_fields, ...extra].slice(0, 40) } : draft;
}

/** Ajoute les sections métier (listes, champs typés, boutons d'action) propres au service et au secteur demandés. */
export function withSections(draft: TemplateProfileDraft, serviceId: string, template: string, text: string): TemplateProfileDraft {
  const proposed = buildSectionBlocks({ template, serviceId, text });
  return { ...draft, sections: mergeSectionBlocks(draft.sections ?? [], proposed) };
}

export function generateTemplateBlueprint(input: {
  template: string;
  needs?: TemplateNeeds | null;
  sector?: string;
  reason?: string;
  socialLinks?: RequestSocialLink[] | null;
  businessPhone?: string | null;
}) {
  const template: CardTemplate = input.template in baseModules ? input.template as CardTemplate : "contact";
  const text = normalizedText(input.needs ?? null, input.sector ?? "", input.reason ?? "");
  const modules = new Set(baseModules[template]);
  const selectedServiceId = input.needs?.selected?.[0] ?? "";
  for (const moduleId of getServiceModules(selectedServiceId)) modules.add(moduleId);
  const sectorText = (input.sector ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const isCommerce = /e.?commerce|commerce en ligne|boutique en ligne|vente en ligne/.test(sectorText)
    || /boutique en ligne|vente en ligne|e.?commerce|commerce en ligne|catalogue de produits|commande de produits/.test(text);
  const isRealEstate = /immobilier|agence immobiliere|promotion immobiliere|location immobiliere/.test(sectorText);
  const isTraining = /formation|centre de formation|ecole|enseignement|coaching|cours/.test(sectorText);
  const isHealth = /sante|medical|medecin|dentiste|clinique|cabinet medical|kinesitherapie|bien.?etre/.test(sectorText);
  const isHospitality = /hotel|riad|maison d.?hotes|hebergement|residence touristique|auberge/.test(sectorText);
  const isBeautySector = /beaute|cosmetique?s?|cosmetics?|esthetique|spa|hammam|salon de coiffure|coiffure|onglerie|maquillage|institut de beaute|massage/.test(sectorText) || /beaute|cosmetique|esthetique|spa|hammam|onglerie|maquillage|massage/.test(text);
  // E-Contact reste strictement personnel. Les règles commerciales ne s’appliquent qu’aux modèles E-Service et E-Business.
  const isBeauty = isBeautySector && ["service", "e-business"].includes(template);
  const isRestaurant = template !== "contact" && (/restaurant|restauration|cafe|coffee shop|snack|traiteur|pizzeria|boulangerie|patisserie/.test(sectorText) || /restaurant|restauration|menu|plats|cuisine|traiteur|pizzeria/.test(text));
  const explicitlyRequestsCommerce = /boutique en ligne|vente en ligne|e.?commerce|catalogue de produits|commande de produits/.test(text);
  const portfolioProfessional = /developpeur|developer|developpement web|freelance|marketer|marketing digital|media buyer|media buying|photographe|photography|photographer|graphiste|graphic designer|designer|community manager|consultant independant/.test(sectorText + " " + text);

  if (template !== "contact") {
    if (template === "e-business" && (isCommerce || explicitlyRequestsCommerce)) { modules.add("product_catalog"); modules.add("orders"); }
    if (template === "e-business" && isRealEstate) { modules.add("gallery"); modules.add("quote_requests"); modules.add("crm_contacts"); }
    if (template === "e-business" && isTraining) { modules.add("gallery"); modules.add("bookings"); modules.add("availability_calendar"); modules.add("crm_contacts"); }
    if (template === "e-business" && isHealth) { modules.add("gallery"); modules.add("bookings"); modules.add("availability_calendar"); }
    if (isBeauty || isRestaurant || isRealEstate) modules.add("service_catalog");
    if (isBeauty) { modules.add("bookings"); modules.add("availability_calendar"); modules.add("whatsapp"); }
    if (template === "e-business" && isHospitality) { modules.add("room_catalog"); modules.add("bookings"); modules.add("availability_calendar"); modules.add("crm_contacts"); }
    if (template !== "e-business" && /commande|achat|vente|e-commerce|boutique/.test(text)) { modules.add("product_catalog"); modules.add("orders"); }
    if (template !== "e-business" && /catalogue|produit/.test(text)) modules.add("product_catalog");
    if (/reserv|rendez|calendrier|creneau/.test(text) || isHealth || isHospitality || isTraining) { modules.add("bookings"); modules.add("availability_calendar"); }
    if (/devis/.test(text) || isRealEstate) modules.add("quote_requests");
    if (/equipe|collaborateur/.test(text)) modules.add("team");
    if (/photo|realisation|contenu|portfolio|galerie|gallery|cv/.test(text) || isRealEstate || isTraining || isHealth || isHospitality) modules.add("gallery");
    if (/prospect|client|contact/.test(text) || isRealEstate) modules.add("crm_contacts");
    if (/service|tarif|prestation/.test(text) || template === "service" || isBeauty || isRestaurant) modules.add("service_catalog");
    if (template === "google-review") { modules.add("google_reviews"); modules.add("company_profile"); modules.add("qr_nfc"); }
  }

  if (portfolioProfessional) modules.add("gallery");

  // E-Contact is intentionally limited to its standard personal-profile sections.
  // Sector keywords and old saved service choices must never activate business modules on it.
  if (template === "contact") {
    modules.clear();
    for (const moduleId of baseModules.contact) modules.add(moduleId);
  }

  const sector = (input.sector ?? "").trim();
  const profileFields: TemplateProfileDraft["card_fields"] = template === "contact"
    ? [
        { key: "tagline", label: "Accroche personnelle", type: "text", visible: true },
        { key: "expertise", label: "Présentation / compétences", type: "textarea", visible: true },
        { key: "portfolio_url", label: "Lien CV / portfolio", type: "url", visible: false },
      ]
    : [
        { key: "tagline", label: "Accroche professionnelle", type: "text", visible: true },
        { key: "location", label: "Adresse ou zone desservie", type: "text", visible: true },
        { key: "hours", label: "Horaires d’ouverture", type: "text", visible: true },
      ];
  if (template === "service") profileFields.push(
    { key: "service_area", label: "Zone d'intervention", type: "text", visible: true },
    { key: "booking_url", label: "Lien de réservation", type: "url", visible: false },
  );
  if (template === "e-business") profileFields.push(
    { key: "delivery", label: "Livraison et retrait", type: "textarea", visible: true },
    { key: "return_policy", label: "Conditions de retour", type: "textarea", visible: false },
  );
  if (template === "google-review") profileFields.push(
    { key: "google_review_url", label: "Lien officiel des avis Google", type: "url", visible: true },
    { key: "review_message", label: "Message de remerciement", type: "textarea", visible: true },
  );
  if (portfolioProfessional) profileFields.push(
    { key: "portfolio_project_1", label: "Portfolio — Projet 1 (URL image ou réalisation)", type: "url", visible: true },
    { key: "cv_url", label: "CV professionnel (lien PDF)", type: "url", visible: true },
  );

  const labels: Record<CardTemplate, { tagline: string; description: string }> = {
    contact: { tagline: isBeauty ? "Révélez votre beauté" : isRestaurant ? "Découvrez notre carte" : "Restons en contact", description: "Retrouvez vos coordonnées, votre portfolio et vos réseaux sociaux sur une carte digitale personnelle." },
    service: { tagline: "Des services adaptés à vos besoins", description: "Découvrez les prestations, les informations pratiques et les moyens de demander un devis ou un rendez-vous." },
    "e-business": {
      tagline: isCommerce ? "Votre boutique en ligne" : isRealEstate ? "Découvrez nos biens immobiliers" : isTraining ? "Développez vos compétences" : isHealth ? "Votre santé, notre priorité" : isHospitality ? "Préparez votre séjour" : "Découvrez notre activité",
      description: isCommerce ? "Consultez les articles disponibles et passez commande directement." : isRealEstate ? "Découvrez nos biens, nos réalisations et contactez notre équipe pour organiser une visite ou demander des informations." : isTraining ? "Découvrez nos formations et inscrivez-vous aux prochaines sessions." : isHealth ? "Découvrez notre établissement et prenez rendez-vous avec notre équipe." : isHospitality ? "Découvrez nos chambres et envoyez une demande de réservation pour votre séjour." : "Découvrez nos services, nos réalisations et contactez notre équipe.",
    },
    "google-review": { tagline: "Votre avis compte", description: "Retrouvez nos informations et accédez directement à notre page officielle pour partager votre expérience." },
  };

  const categories = template === "contact" ? [] : sector ? [sector] : [];
  const profileDraft: TemplateProfileDraft = {
    ...labels[template],
    categories,
    catalog_items: [],
    card_fields: profileFields,
    suggested_buttons: [
      ...(template !== "contact" ? [{ kind: "whatsapp", label: "WhatsApp Business", enabled: true }] : []),
      ...(isBeauty ? [{ kind: "calendly", label: "Prendre rendez-vous", enabled: true }] : []),
      { kind: "instagram", label: "Instagram", enabled: false },
      { kind: "website", label: "Site web", enabled: false },
      ...(template === "e-business" && isCommerce ? [{ kind: "store", label: "Boutique en ligne", enabled: true }] : []),
      ...(template === "google-review" ? [{ kind: "website", label: "Avis Google", enabled: true }] : []),
    ],
  };

  return {
    template,
    modules: [...modules],
    theme: { ...themes[template], schema_version: 1 },
    profile_draft: activateRequestChoices(withSections(withServiceFields(profileDraft, selectedServiceId, template), selectedServiceId, template, text), { template, modules: [...modules], socialLinks: input.socialLinks, businessPhone: input.businessPhone, needsText: text }),
    rationale: "Configuration initiale générée localement à partir du type de carte et des besoins déclarés. Les champs et modules restent modifiables et doivent être vérifiés avant validation.",
    generated_by: "touchcard-template-engine-v1",
    reviewed_by_super_admin: false,
  };
}
