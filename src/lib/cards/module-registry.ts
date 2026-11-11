export type ModuleConfigField = {
  key: string;
  label: string;
  type: "text" | "textarea" | "select" | "checkbox";
  placeholder?: string;
  options?: { label: string; value: string }[];
  help?: string;
  defaultValue?: string | boolean;
};

export type CardModuleDefinition = {
  id: string;
  label: string;
  description: string;
  group: string;
  templates: ("contact" | "service" | "e-business" | "google-review")[];
  configurationFields: ModuleConfigField[];
};

const allTemplates: CardModuleDefinition["templates"] = ["contact", "service", "e-business", "google-review"];
const businessTemplates: CardModuleDefinition["templates"] = ["service", "e-business"];
const commerceTemplates: CardModuleDefinition["templates"] = ["service", "e-business"];
const accommodationTemplates: CardModuleDefinition["templates"] = ["e-business"];

export const CARD_MODULES: CardModuleDefinition[] = [
  { id: "dashboard", label: "Tableau de bord", description: "Vue d'ensemble de l'activité", group: "Essentiel", templates: allTemplates, configurationFields: [] },
  { id: "digital_card", label: "Carte digitale", description: "Profil public, QR code et carte NFC", group: "Essentiel", templates: allTemplates, configurationFields: [] },
  { id: "contact_profile", label: "Identité professionnelle commune", description: "Nom, fonction, entreprise, logo, couverture, coordonnées, adresse et présentation", group: "Essentiel", templates: allTemplates, configurationFields: [] },
  { id: "social_links", label: "Réseaux sociaux", description: "Liens Instagram, Facebook, LinkedIn…", group: "Essentiel", templates: allTemplates, configurationFields: [] },
  { id: "qr_nfc", label: "QR code & NFC", description: "Partage et accès rapide à la carte", group: "Essentiel", templates: allTemplates, configurationFields: [] },
  { id: "company_profile", label: "Présentation entreprise", description: "Identité, horaires et informations pratiques", group: "Vitrine", templates: businessTemplates, configurationFields: [
    { key: "section_title", label: "Titre de la section publique", type: "text", defaultValue: "À propos de notre activité", placeholder: "Ex. Notre établissement" },
    { key: "show_hours", label: "Afficher les horaires", type: "checkbox", defaultValue: true },
    { key: "show_map", label: "Afficher l'adresse et la carte", type: "checkbox", defaultValue: true },
  ] },
  { id: "service_catalog", label: "Prestations / menu de services", description: "Services, tarifs, menu de restaurant ou prestations professionnelles", group: "Vitrine", templates: businessTemplates, configurationFields: [
    { key: "section_title", label: "Titre public", type: "text", defaultValue: "Nos prestations", placeholder: "Ex. Notre menu" },
    { key: "price_display", label: "Affichage des prix", type: "select", defaultValue: "visible", options: [{ label: "Afficher les prix", value: "visible" }, { label: "Sur demande", value: "on_request" }, { label: "Masquer les prix", value: "hidden" }] },
    { key: "currency", label: "Devise", type: "select", defaultValue: "MAD", options: [{ label: "MAD — Dirham", value: "MAD" }, { label: "EUR — Euro", value: "EUR" }, { label: "USD — Dollar", value: "USD" }] },
  ] },
  { id: "product_catalog", label: "Catalogue produits", description: "Produits, descriptions, photos et prix", group: "Commerce", templates: commerceTemplates, configurationFields: [
    { key: "section_title", label: "Titre public", type: "text", defaultValue: "Nos produits" },
    { key: "price_display", label: "Affichage des prix", type: "select", defaultValue: "visible", options: [{ label: "Afficher les prix", value: "visible" }, { label: "Sur demande", value: "on_request" }, { label: "Masquer les prix", value: "hidden" }] },
    { key: "currency", label: "Devise", type: "select", defaultValue: "MAD", options: [{ label: "MAD — Dirham", value: "MAD" }, { label: "EUR — Euro", value: "EUR" }, { label: "USD — Dollar", value: "USD" }] },
    { key: "show_stock", label: "Afficher la disponibilité", type: "checkbox", defaultValue: true },
  ] },
  { id: "orders", label: "Commandes", description: "Réception et suivi des commandes", group: "Commerce", templates: commerceTemplates, configurationFields: [
    { key: "submit_label", label: "Libellé du bouton", type: "text", defaultValue: "Commander" },
    { key: "collect_delivery_address", label: "Demander l'adresse de livraison", type: "checkbox", defaultValue: true },
    { key: "allow_whatsapp_confirmation", label: "Autoriser la confirmation WhatsApp", type: "checkbox", defaultValue: true },
  ] },
  { id: "room_catalog", label: "Catalogue des chambres", description: "Chambres, photos, capacité et tarifs", group: "Hébergement", templates: accommodationTemplates, configurationFields: [
    { key: "section_title", label: "Titre public", type: "text", defaultValue: "Nos chambres" },
    { key: "currency", label: "Devise", type: "select", defaultValue: "MAD", options: [{ label: "MAD — Dirham", value: "MAD" }, { label: "EUR — Euro", value: "EUR" }] },
  ] },
  { id: "bookings", label: "Rendez-vous & réservations", description: "Rendez-vous, réservations et demandes de créneaux", group: "Relation client", templates: businessTemplates, configurationFields: [
    { key: "section_title", label: "Titre public", type: "text", defaultValue: "Prendre rendez-vous" },
    { key: "booking_mode", label: "Mode de demande", type: "select", defaultValue: "request", options: [{ label: "Demande à confirmer par l'équipe", value: "request" }, { label: "Réservation directe", value: "direct" }] },
    { key: "confirmation_message", label: "Message après demande", type: "textarea", defaultValue: "Votre demande a bien été envoyée. Notre équipe vous recontactera pour confirmer." },
  ] },
  { id: "availability_calendar", label: "Calendrier de disponibilités", description: "Jours et plages horaires disponibles", group: "Relation client", templates: businessTemplates, configurationFields: [
    { key: "timezone", label: "Fuseau horaire", type: "select", defaultValue: "Africa/Casablanca", options: [{ label: "Maroc — Africa/Casablanca", value: "Africa/Casablanca" }, { label: "Europe/Paris", value: "Europe/Paris" }, { label: "UTC", value: "UTC" }] },
    { key: "advance_days", label: "Réservation jusqu'à (jours)", type: "select", defaultValue: "30", options: [{ label: "7 jours", value: "7" }, { label: "14 jours", value: "14" }, { label: "30 jours", value: "30" }, { label: "60 jours", value: "60" }] },
  ] },
  { id: "quote_requests", label: "Demandes de devis", description: "Collecte et suivi des demandes de devis", group: "Relation client", templates: businessTemplates, configurationFields: [
    { key: "section_title", label: "Titre public", type: "text", defaultValue: "Demander un devis" },
    { key: "ask_budget", label: "Demander un budget indicatif", type: "checkbox", defaultValue: false },
  ] },
  { id: "google_reviews", label: "Avis Google", description: "Lien officiel pour recueillir les avis clients", group: "Relation client", templates: allTemplates, configurationFields: [
    { key: "section_title", label: "Titre public", type: "text", defaultValue: "Votre avis compte" },
    { key: "thank_you_message", label: "Message de remerciement", type: "textarea", defaultValue: "Merci de prendre le temps de partager votre expérience." },
  ] },
  { id: "crm_contacts", label: "Contacts & CRM", description: "Centralisation des prospects et clients", group: "Relation client", templates: businessTemplates, configurationFields: [] },
  { id: "team", label: "Équipe & collaborateurs", description: "Gestion des membres de l'organisation", group: "Gestion", templates: businessTemplates, configurationFields: [] },
  { id: "gallery", label: "Portfolio & galerie de projets", description: "Réalisations, images de projets et présentation du CV professionnel", group: "Vitrine", templates: allTemplates, configurationFields: [
    { key: "section_title", label: "Titre public", type: "text", defaultValue: "Portfolio & réalisations" },
    { key: "layout", label: "Présentation", type: "select", defaultValue: "grid", options: [{ label: "Grille", value: "grid" }, { label: "Liste", value: "list" }] },
  ] },
  { id: "whatsapp", label: "Contact WhatsApp", description: "Accès direct à WhatsApp", group: "Relation client", templates: businessTemplates, configurationFields: [] },
  { id: "analytics", label: "Statistiques", description: "Vues, scans, clics et performances", group: "Pilotage", templates: allTemplates, configurationFields: [] },
];

export const BASE_MODULES_BY_TEMPLATE: Record<string, string[]> = {
  contact: ["dashboard", "digital_card", "contact_profile", "social_links", "qr_nfc", "gallery", "analytics"],
  service: ["dashboard", "digital_card", "contact_profile", "company_profile", "service_catalog", "quote_requests", "bookings", "availability_calendar", "crm_contacts", "whatsapp", "analytics"],
  "e-business": ["dashboard", "digital_card", "contact_profile", "company_profile", "gallery", "whatsapp", "analytics"],
  "google-review": ["dashboard", "digital_card", "contact_profile", "company_profile", "qr_nfc", "google_reviews", "analytics"],
};

export function getModuleDefinition(id: string) {
  return CARD_MODULES.find((module) => module.id === id) ?? null;
}

export function getModuleDefaults(moduleIds: string[]) {
  return Object.fromEntries(moduleIds.flatMap((id) => {
    const definition = getModuleDefinition(id);
    if (!definition?.configurationFields.length) return [];
    return [[id, Object.fromEntries(definition.configurationFields.map((field) => [field.key, field.defaultValue ?? (field.type === "checkbox" ? false : "")]))]];
  }));
}
