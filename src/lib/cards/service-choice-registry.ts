export type ServiceChoice = { id: string; label: string; description: string; modules: string[]; sectors?: RegExp };

const choices: ServiceChoice[] = [
  { id: "commerce", label: "Commerce & vente de produits", description: "Catalogue de produits, demandes clients et commandes selon votre activité.", modules: ["company_profile", "product_catalog", "orders", "crm_contacts", "whatsapp"], sectors: /commerce|boutique|vente|ecommerce|e-commerce/ },
  { id: "beauty", label: "Beauté, bien-être & prestations sur rendez-vous", description: "Prestations, tarifs, calendrier et demandes de rendez-vous.", modules: ["company_profile", "service_catalog", "bookings", "availability_calendar", "gallery", "crm_contacts", "whatsapp"], sectors: /beaute|cosmetique|esthetique|spa|hammam|coiffure|onglerie|massage|barber|barbier/ },
  { id: "training", label: "Éducation, cours & formation", description: "Programmes, sessions, galerie et préinscriptions.", modules: ["company_profile", "school_registration", "gallery", "crm_contacts", "whatsapp"], sectors: /education|ecole|formation|enseignement|coaching|cours/ },
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

/**
 * Champs SPÉCIFIQUES à chaque service choisi dans la demande du client.
 * Ils s'ajoutent aux champs classiques (téléphone, adresse, horaires…) et aux modules classiques,
 * et apparaissent dans le profil du client sous une rubrique « Informations spécifiques ».
 */
export type ServiceField = { key: string; label: string; type: "text" | "textarea" | "url"; placeholder?: string };

const f = (key: string, label: string, placeholder = "", type: ServiceField["type"] = "text"): ServiceField => ({ key, label, type, placeholder });

const serviceFields: Record<string, ServiceField[]> = {
  commerce: [f("categories", "Catégories de produits", "Ex. Vêtements, accessoires, chaussures"), f("brands", "Marques proposées"), f("delivery", "Livraison & zones desservies", "Ex. Livraison partout au Maroc sous 48 h"), f("payment", "Modes de paiement acceptés", "Ex. Espèces, carte, virement"), f("returns", "Échanges & retours", "Ex. Échange sous 7 jours avec ticket", "textarea")],
  online_store: [f("categories", "Catégories de produits"), f("delivery", "Livraison & zones desservies"), f("delivery_time", "Délai de livraison", "Ex. 24 à 72 h"), f("payment", "Modes de paiement acceptés"), f("returns", "Échanges & retours", "", "textarea"), f("support_hours", "Horaires du service client")],
  beauty: [f("specialties", "Spécialités & prestations phares", "Ex. Soins visage, coiffure, onglerie"), f("avg_duration", "Durée moyenne d’une prestation", "Ex. 45 min"), f("products", "Marques & produits utilisés"), f("walk_in", "Accueil sans rendez-vous", "Ex. Oui, selon disponibilité"), f("cancellation", "Politique d’annulation", "Ex. Annulation gratuite jusqu’à 24 h avant", "textarea")],
  appointments: [f("bookable_services", "Services réservables", "Ex. Consultation, séance, atelier"), f("avg_duration", "Durée d’un rendez-vous"), f("confirmation_delay", "Délai de confirmation", "Ex. Sous 2 heures"), f("location_mode", "Lieu du rendez-vous", "Ex. Sur place, à domicile, en visio"), f("cancellation", "Politique d’annulation", "", "textarea")],
  training: [f("levels", "Niveaux proposés", "Ex. Débutant, intermédiaire, avancé"), f("programs", "Programmes & matières"), f("mode", "Modalité", "Ex. Présentiel, à distance, mixte"), f("next_session", "Prochaine session"), f("certifications", "Certifications délivrées")],
  school: [f("levels", "Niveaux & cycles", "Ex. Primaire, collège, lycée"), f("programs", "Filières & programmes"), f("diplomas", "Diplômes & certifications délivrés"), f("school_year", "Dates de rentrée / sessions"), f("fees", "Frais d’inscription & scolarité", "Ex. Sur demande"), f("teaching_languages", "Langues d’enseignement")],
  professional_profile: [f("job_title", "Titre professionnel", "Ex. Développeur web freelance"), f("skills", "Compétences clés", "Ex. React, SEO, design UI"), f("experience", "Années d’expérience"), f("availability", "Disponibilité", "Ex. Freelance, disponible sous 2 semaines"), f("work_profile", "Profil Behance / GitHub / Dribbble", "https://", "url"), f("languages", "Langues parlées")],
  service_catalog: [f("expertise", "Domaines d’expertise"), f("service_area", "Zone d’intervention", "Ex. Casablanca et alentours"), f("quote_delay", "Délai de réponse aux devis", "Ex. Sous 24 h"), f("on_site", "Déplacement sur site / à domicile"), f("guarantees", "Garanties & engagements", "", "textarea")],
  restaurant: [f("cuisine", "Type de cuisine", "Ex. Marocaine, italienne, fast-food"), f("signature_dishes", "Spécialités de la maison"), f("seats", "Capacité (couverts)"), f("service_modes", "Modes de service", "Ex. Sur place, à emporter, livraison"), f("avg_budget", "Budget moyen par personne", "Ex. 120 MAD"), f("amenities", "Équipements", "Ex. Terrasse, wifi, parking"), f("menu_link", "Lien du menu (PDF ou page)", "https://", "url")],
  real_estate: [f("property_types", "Types de biens", "Ex. Appartements, villas, terrains, locaux"), f("transactions", "Transactions", "Ex. Vente, location, gestion locative"), f("zones", "Quartiers & villes couverts"), f("fees", "Honoraires / commission"), f("license", "Numéro d’agrément professionnel"), f("virtual_tour", "Lien visite virtuelle", "https://", "url")],
  accommodation: [f("category", "Catégorie / classement", "Ex. Riad 4 étoiles"), f("rooms_count", "Nombre de chambres"), f("check_in", "Heure d’arrivée (check-in)", "Ex. 14:00"), f("check_out", "Heure de départ (check-out)", "Ex. 12:00"), f("amenities", "Équipements & services", "Ex. Piscine, wifi, navette"), f("breakfast", "Petit-déjeuner"), f("cancellation", "Politique d’annulation", "", "textarea")],
  medical: [f("specialty", "Spécialité médicale"), f("languages", "Langues parlées"), f("insurances", "Mutuelles & assurances acceptées"), f("consultation_modes", "Modalités", "Ex. Cabinet, téléconsultation"), f("emergency", "Urgences & garde", "Ex. Joignable en cas d’urgence au…")],
  gym: [f("disciplines", "Disciplines proposées", "Ex. Musculation, yoga, boxe, cardio"), f("coaches", "Coachs & encadrement"), f("plans", "Formules d’abonnement (résumé)", "Ex. Mensuel, trimestriel, annuel"), f("facilities", "Équipements & espaces", "Ex. Sauna, vestiaires, parking"), f("trial", "Séance d’essai", "Ex. Première séance offerte"), f("schedule_link", "Planning des cours (lien)", "https://", "url")],
};

/** Champs spécifiques d'un service, prêts à être ajoutés au profil (clés préfixées par le service). */
export function getServiceFields(id: string) {
  const choice = getServiceChoice(id);
  if (!choice) return [];
  return (serviceFields[id] ?? []).map((field) => ({
    key: `s_${id}_${field.key}`.slice(0, 48),
    label: field.label,
    type: field.type,
    placeholder: field.placeholder ?? "",
    section: choice.label,
  }));
}
