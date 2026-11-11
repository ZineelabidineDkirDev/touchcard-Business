export type ServiceChoice = { id: string; label: string; description: string; modules: string[]; sectors?: RegExp };

const choices: ServiceChoice[] = [
  { id: "professional_profile", label: "Profil professionnel & portfolio", description: "Profil, réalisations, galerie, CV et liens professionnels.", modules: ["gallery", "whatsapp"] },
  { id: "service_catalog", label: "Prestations & demandes de devis", description: "Catalogue de services, tarifs, demandes de devis et contacts clients.", modules: ["company_profile", "service_catalog", "quote_requests", "crm_contacts", "whatsapp"] },
  { id: "online_store", label: "Boutique en ligne & commandes", description: "Catalogue produits, panier et réception des commandes.", modules: ["company_profile", "product_catalog", "orders", "crm_contacts", "whatsapp"] },
  { id: "appointments", label: "Rendez-vous & réservations", description: "Services réservables, calendrier et demandes de créneaux.", modules: ["company_profile", "service_catalog", "bookings", "availability_calendar", "crm_contacts", "whatsapp"] },
  { id: "restaurant", label: "Restaurant, café & restauration", description: "Menu, commandes, réservations de tables et horaires.", modules: ["company_profile", "service_catalog", "orders", "bookings", "availability_calendar", "crm_contacts", "whatsapp"], sectors: /restaurant|restauration|cafe|coffee|snack|traiteur|pizzeria|boulangerie|patisserie/ },
  { id: "real_estate", label: "Immobilier & demandes de visite", description: "Présentation des biens, galerie, demandes de visite et devis.", modules: ["company_profile", "gallery", "quote_requests", "bookings", "crm_contacts", "whatsapp"], sectors: /immobilier|agence immobiliere|promotion immobiliere|location immobiliere/ },
  { id: "accommodation", label: "Hébergement & réservation de chambres", description: "Chambres, capacités, disponibilités et demandes de séjour.", modules: ["company_profile", "room_catalog", "bookings", "availability_calendar", "crm_contacts", "whatsapp"], sectors: /hotel|riad|hebergement|maison d.?hotes|residence touristique|auberge/ },
  { id: "medical", label: "Cabinet médical & rendez-vous patients", description: "Services médicaux, créneaux et demandes de consultation privées.", modules: ["company_profile", "gallery", "doctor_appointments", "availability_calendar", "crm_contacts"], sectors: /sante|medical|medecin|dentiste|clinique|cabinet medical|kinesitherapie/ },
  { id: "gym", label: "Salle de sport & abonnements", description: "Formules d’abonnement, séances d’essai et inscriptions.", modules: ["company_profile", "gallery", "gym_registration", "crm_contacts", "whatsapp"], sectors: /sport|fitness|gym|musculation|coaching sportif/ },
  { id: "school", label: "École & centre de formation", description: "Programmes, sessions et préinscriptions des élèves.", modules: ["company_profile", "gallery", "school_registration", "crm_contacts", "whatsapp"], sectors: /education|ecole|formation|enseignement|coaching|cours/ },
];

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export function getServiceChoices(sector = "") {
  const normalizedSector = normalize(sector);
  const sectorChoices = choices.filter((choice) => choice.sectors?.test(normalizedSector));
  const generalChoices = choices.filter((choice) => !choice.sectors);
  return [...generalChoices, ...sectorChoices];
}

export function getServiceChoice(id: string) {
  return choices.find((choice) => choice.id === id) ?? null;
}

export function getServiceModules(id: string) {
  return getServiceChoice(id)?.modules ?? [];
}
