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
  card_fields: { key: string; label: string; type: "text" | "textarea" | "url" | "phone" | "email"; visible: boolean }[];
  suggested_buttons: { kind: string; label: string; enabled: boolean }[];
};

const baseModules: Record<CardTemplate, string[]> = {
  contact: ["dashboard", "digital_card", "contact_profile", "social_links", "qr_nfc", "whatsapp", "analytics"],
  service: ["dashboard", "digital_card", "company_profile", "service_catalog", "quote_requests", "bookings", "availability_calendar", "crm_contacts", "whatsapp", "analytics"],
  "e-business": ["dashboard", "digital_card", "company_profile", "product_catalog", "service_catalog", "orders", "quote_requests", "bookings", "team", "crm_contacts", "gallery", "whatsapp", "analytics"],
  "google-review": ["dashboard", "digital_card", "company_profile", "qr_nfc", "google_reviews", "analytics"],
};

const themes: Record<CardTemplate, { accent: string; background: string; layout: string }> = {
  contact: { accent: "#6366f1", background: "#0f172a", layout: "classic" },
  service: { accent: "#0ea5e9", background: "#082f49", layout: "service" },
  "e-business": { accent: "#10b981", background: "#022c22", layout: "commerce" },
  "google-review": { accent: "#16a34a", background: "#052e16", layout: "review" },
};

function normalizedText(needs: TemplateNeeds | null, sector: string, reason: string) {
  return [...(needs?.selected ?? []), ...(needs?.management_needs ?? []), sector, reason]
    .join(" ").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export function generateTemplateBlueprint(input: {
  template: string;
  needs?: TemplateNeeds | null;
  sector?: string;
  reason?: string;
}) {
  const template: CardTemplate = input.template in baseModules ? input.template as CardTemplate : "contact";
  const text = normalizedText(input.needs ?? null, input.sector ?? "", input.reason ?? "");
  const modules = new Set(baseModules[template]);

  if (/commande|achat|vente|e-commerce|boutique/.test(text)) {
    modules.add("product_catalog"); modules.add("orders");
  }
  if (/catalogue|produit/.test(text)) modules.add("product_catalog");
  if (/reserv|rendez|calendrier|creneau/.test(text)) {
    modules.add("bookings"); modules.add("availability_calendar");
  }
  if (/devis/.test(text)) modules.add("quote_requests");
  if (/equipe|collaborateur/.test(text)) modules.add("team");
  if (/photo|realisation|contenu/.test(text)) modules.add("gallery");
  if (/prospect|client|contact/.test(text)) modules.add("crm_contacts");
  if (/service|tarif|prestation/.test(text)) modules.add("service_catalog");
  if (template === "google-review") {
    modules.add("google_reviews"); modules.add("company_profile"); modules.add("qr_nfc");
  }
  if (template === "service") modules.add("service_catalog");
  if (template === "e-business") { modules.add("product_catalog"); modules.add("orders"); }

  const sector = (input.sector ?? "").trim();
  const profileFields: TemplateProfileDraft["card_fields"] = [
    { key: "tagline", label: "Accroche professionnelle", type: "text", visible: true },
    { key: "location", label: "Adresse ou zone desservie", type: "text", visible: true },
    { key: "hours", label: "Horaires d'ouverture", type: "text", visible: true },
  ];
  if (template === "contact") profileFields.push(
    { key: "expertise", label: "Expertises principales", type: "textarea", visible: true },
    { key: "appointment", label: "Lien de prise de rendez-vous", type: "url", visible: false },
  );
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

  const labels: Record<CardTemplate, { tagline: string; description: string }> = {
    contact: { tagline: "Restons en contact", description: "Retrouvez les coordonnées, les informations professionnelles et les liens utiles sur cette carte digitale." },
    service: { tagline: "Des services adaptés à vos besoins", description: "Découvrez les prestations, les informations pratiques et les moyens de demander un devis ou un rendez-vous." },
    "e-business": { tagline: "Votre boutique en ligne", description: "Découvrez le catalogue, consultez les informations produits et transmettez vos demandes de commande." },
    "google-review": { tagline: "Votre avis compte", description: "Retrouvez nos informations et accédez directement à notre page officielle pour partager votre expérience." },
  };

  const categories = sector ? [sector] : [];
  const profileDraft: TemplateProfileDraft = {
    ...labels[template],
    categories,
    catalog_items: [],
    card_fields: profileFields,
    suggested_buttons: [
      { kind: "whatsapp", label: "WhatsApp Business", enabled: true },
      { kind: "instagram", label: "Instagram", enabled: false },
      { kind: "website", label: "Site web", enabled: false },
      ...(template === "e-business" ? [{ kind: "store", label: "Boutique en ligne", enabled: true }] : []),
      ...(template === "google-review" ? [{ kind: "website", label: "Avis Google", enabled: true }] : []),
    ],
  };

  return {
    template,
    modules: [...modules],
    theme: { ...themes[template], schema_version: 1 },
    profile_draft: profileDraft,
    rationale: "Configuration initiale générée localement à partir du type de carte et des besoins déclarés. Les champs et modules restent modifiables et doivent être vérifiés avant validation.",
    generated_by: "touchcard-template-engine-v1",
    reviewed_by_super_admin: false,
  };
}
