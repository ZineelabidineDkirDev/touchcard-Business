import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isPlatformSuperAdmin } from "@/lib/auth/platform-admin";

type WorkspaceConfig = { version?: number; template?: string; modules?: string[]; plan?: string };
type ModulePreview = { title: string; description: string; fields: string[]; examples: { title: string; detail: string; meta?: string }[] };

const previews: Record<string, ModulePreview> = {
  dashboard: { title: "Tableau de bord", description: "Vue quotidienne de l'activité et raccourcis de gestion.", fields: ["Période", "Indicateurs clés", "Activité récente", "Actions rapides"], examples: [{ title: "Vues de la carte", detail: "Nombre de consultations du profil public", meta: "Statistique de démonstration" }, { title: "Demandes reçues", detail: "Devis, réservations et nouveaux contacts", meta: "Statistique de démonstration" }, { title: "Taux de conversion", detail: "Interactions ayant abouti à une demande", meta: "Statistique de démonstration" }] },
  digital_card: { title: "Carte digitale", description: "Carte publique consultée après un scan NFC ou QR code.", fields: ["Photo ou logo", "Nom affiché", "Fonction / activité", "Accroche", "Téléphone", "E-mail", "Adresse", "Boutons d'action"], examples: [{ title: "Aperçu de la carte publique", detail: "Logo · Nom de l'entreprise · Présentation · Appeler · WhatsApp · Itinéraire", meta: "Contenu fictif à personnaliser" }] },
  contact_profile: { title: "Profil de contact", description: "Informations personnelles et professionnelles affichées sur la carte.", fields: ["Prénom et nom", "Poste / fonction", "Téléphone professionnel", "E-mail professionnel", "Adresse", "Bio / présentation"], examples: [{ title: "Profil professionnel", detail: "Nom, fonction, coordonnées et courte présentation", meta: "Champs à compléter par le client" }] },
  social_links: { title: "Réseaux sociaux", description: "Liens externes visibles sur la carte publique.", fields: ["Plateforme", "URL du profil", "Libellé du bouton", "Ordre d'affichage"], examples: [{ title: "Instagram", detail: "Lien vers le compte professionnel" }, { title: "Facebook / LinkedIn", detail: "Liens des pages de l'entreprise" }] },
  qr_nfc: { title: "QR code & NFC", description: "Accès et partage de la même adresse publique.", fields: ["URL publique unique", "QR code", "Identifiant NFC", "État du lien", "Date de dernière mise à jour"], examples: [{ title: "Lien de la carte", detail: "Une URL unique à encoder sur le QR code et la puce NFC", meta: "Lien de démonstration non activé" }] },
  company_profile: { title: "Profil entreprise", description: "Identité et informations générales de l'établissement.", fields: ["Nom commercial", "Logo", "Secteur d'activité", "Description", "Adresse", "Téléphone", "E-mail", "Horaires d'ouverture"], examples: [{ title: "Fiche entreprise", detail: "Identité, coordonnées, description et horaires", meta: "À renseigner" }] },
  service_catalog: { title: "Catalogue de services", description: "Prestations organisées par catégorie avec tarifs et modalités.", fields: ["Nom du service", "Catégorie", "Description", "Prix", "Durée", "Image", "Disponible / indisponible", "Réservation ou demande de devis"], examples: [{ title: "Exemple de prestation", detail: "Description détaillée de la prestation", meta: "Prix à définir · Durée à définir" }, { title: "Autre prestation", detail: "Détails, options et conditions", meta: "Brouillon de démonstration" }] },
  product_catalog: { title: "Catalogue de produits", description: "Produits vendus en ligne, organisés par catégories.", fields: ["Nom du produit", "Référence / SKU", "Catégorie", "Description", "Prix", "Prix promotionnel", "Stock", "Images", "Variantes"], examples: [{ title: "Produit de démonstration", detail: "Description, options et photos du produit", meta: "Prix et stock à renseigner" }] },
  orders: { title: "Commandes", description: "Réception, préparation et suivi des commandes clients.", fields: ["N° de commande", "Client", "Articles", "Quantité", "Total", "Adresse de livraison", "Mode de paiement", "Statut", "Date"], examples: [{ title: "Aucune commande réelle", detail: "Les commandes apparaîtront ici après activation de la boutique.", meta: "Données de démonstration uniquement" }] },
  quote_requests: { title: "Demandes de devis", description: "Formulaire public et suivi des demandes de prix.", fields: ["Nom du demandeur", "Téléphone / e-mail", "Service concerné", "Description du besoin", "Budget indicatif", "Pièces jointes", "Statut", "Réponse et montant proposé"], examples: [{ title: "Demande de devis exemple", detail: "Service demandé · besoin du client · coordonnées", meta: "Statut : À traiter" }] },
  bookings: { title: "Réservations", description: "Demandes de rendez-vous et gestion des réservations.", fields: ["Nom du client", "Service", "Date souhaitée", "Heure", "Durée", "Nombre de personnes", "Coordonnées", "Notes", "Statut"], examples: [{ title: "Réservation exemple", detail: "Service sélectionné · date et heure souhaitées", meta: "Statut : En attente" }] },
  availability_calendar: { title: "Calendrier de disponibilités", description: "Définition des jours et créneaux ouverts à la réservation.", fields: ["Jour", "Heure de début", "Heure de fin", "Durée des créneaux", "Pause", "Capacité", "Indisponibilités / congés"], examples: [{ title: "Lundi – Vendredi", detail: "09:00–12:00 · 14:00–18:00", meta: "Exemple d'horaires, à confirmer" }] },
  crm_contacts: { title: "Contacts CRM", description: "Fichier central des prospects et clients avec historique.", fields: ["Nom complet", "Téléphone", "E-mail", "Entreprise", "Origine du contact", "Tags", "Dernier échange", "Notes", "Statut"], examples: [{ title: "Fiche contact exemple", detail: "Coordonnées · origine · notes et historique des échanges", meta: "Contact fictif" }] },
  team: { title: "Équipe", description: "Membres autorisés à accéder à l'espace de travail.", fields: ["Nom du membre", "E-mail", "Rôle", "Permissions", "Statut d'accès", "Dernière connexion"], examples: [{ title: "Administrateur", detail: "Gestion du profil, des contenus et des demandes", meta: "Rôle à attribuer" }] },
  gallery: { title: "Galerie", description: "Photos et réalisations visibles sur la carte publique.", fields: ["Image", "Titre", "Description", "Catégorie", "Texte alternatif", "Ordre d'affichage", "Visibilité"], examples: [{ title: "Emplacement photo", detail: "Ajouter une image et une courte description", meta: "Aucune photo réelle chargée" }] },
  whatsapp: { title: "WhatsApp", description: "Bouton de contact direct depuis la carte publique.", fields: ["Numéro WhatsApp", "Message prérempli", "Libellé du bouton", "Afficher / masquer"], examples: [{ title: "Contacter sur WhatsApp", detail: "Ouverture d'une conversation avec un message prérempli", meta: "Numéro à confirmer" }] },
  analytics: { title: "Statistiques", description: "Mesure des consultations et interactions de la carte.", fields: ["Nombre de vues", "Scans QR", "Scans NFC", "Clics téléphone", "Clics WhatsApp", "Clics réseaux sociaux", "Demandes reçues", "Période"], examples: [{ title: "Performance de la carte", detail: "Vues · scans · clics · demandes", meta: "Aucune donnée réelle dans cet aperçu" }] },
  quotes: { title: "Devis", description: "Suivi des propositions commerciales envoyées.", fields: ["Référence", "Client", "Lignes de devis", "Quantité", "Prix unitaire", "Total", "Validité", "Statut"], examples: [{ title: "Devis exemple", detail: "Prestations, quantités, prix et conditions", meta: "Montants à renseigner" }] },
  loyalty: { title: "Fidélité", description: "Programme de fidélité et avantages clients.", fields: ["Nom du programme", "Règle de cumul", "Points du client", "Récompenses", "Date d'expiration"], examples: [{ title: "Programme à configurer", detail: "Définir les règles et les récompenses", meta: "Optionnel" }] },
};

const moduleLabels: Record<string, string> = Object.fromEntries(Object.entries(previews).map(([id, item]) => [id, item.title]));

export default async function ClientWorkspacePreview({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!isPlatformSuperAdmin(user.email)) notFound();

  const { data: prospect } = await supabase.from("prospect_requests")
    .select("id, user_id, full_name, email, card_type, brand_name, activity_sector, city, status")
    .eq("id", id).maybeSingle();
  if (!prospect || !prospect.user_id) notFound();

  const { data: organization } = await supabase.from("organizations")
    .select("id, name, workspace_config").eq("owner_id", prospect.user_id).maybeSingle();
  if (!organization) notFound();

  const config = (organization.workspace_config || {}) as WorkspaceConfig;
  const enabledModules = Array.isArray(config.modules) ? config.modules : [];
  const templateName = config.template || prospect.card_type || "Espace client";
  const { data: clientCards } = await supabase.from("cards")
    .select("id,slug,full_name,job_title,company_name,bio,phone,email,website,avatar_url,is_published,theme,public_fields")
    .eq("organization_id", organization.id).order("created_at", { ascending: false });
  const primaryCard = clientCards?.[0] ?? null;
  const { data: primaryCardLinks } = primaryCard
    ? await supabase.from("card_links").select("id,label,url,kind").eq("card_id", primaryCard.id).order("position")
    : { data: [] as { id: string; label: string; url: string; kind: string }[] };
  const showCatalog = enabledModules.includes("product_catalog") || enabledModules.includes("service_catalog");
  const { data: clientCatalog } = showCatalog
    ? await supabase.from("products").select("id,name,description,price,currency,image_url")
      .eq("organization_id", organization.id).eq("is_active", true).order("created_at", { ascending: false })
    : { data: [] as { id: string; name: string; description: string | null; price: number; currency: string; image_url: string | null }[] };
  const enabledPreviews = enabledModules.map((module) => ({ id: module, ...(previews[module] || {
    title: moduleLabels[module] || module.replaceAll("_", " "),
    description: "Module sélectionné dans la configuration du client.",
    fields: ["Paramètres du module", "Contenu", "Visibilité", "Statut"],
    examples: [{ title: "Configuration à compléter", detail: "Les champs métier seront adaptés au besoin précis du client." }],
  }) }));

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <div><p className="text-sm font-black text-amber-900">APERÇU SUPER ADMIN · ESPACE CLIENT</p><p className="mt-1 text-xs text-amber-800">Les cartes et catalogues affichés proviennent des données réelles. Les modules non encore développés restent des maquettes explicatives.</p></div>
        <Link href="/dashboard/prospects" className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white">← Retour Super Admin</Link>
      </div>

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-sm font-semibold uppercase tracking-[.16em] text-indigo-600">TouchCard Business · Espace client</p><h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">{organization.name || prospect.brand_name || prospect.full_name}</h1><p className="mt-2 text-sm text-slate-500">{prospect.full_name} · {prospect.email} · {prospect.city || "Ville non renseignée"}</p></div>
        <span className="rounded-full bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700">Modèle : {templateName}</span>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[["Modules activés", String(enabledModules.length)], ["Secteur", prospect.activity_sector || "—"], ["Type de carte", templateName], ["Données", "Démonstration"]].map(([label, value]) => <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">{label}</p><p className="mt-3 text-xl font-black text-slate-950">{value}</p></article>)}
      </section>

      {enabledModules.includes("digital_card") && <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5"><div><p className="text-xs font-black uppercase tracking-wider text-indigo-600">Carte publique réelle · NFC / QR</p><h2 className="mt-1 text-xl font-black text-slate-950">{primaryCard?.full_name || "Carte non créée"}</h2><p className="mt-1 text-xs text-slate-500">{primaryCard?.company_name || organization.name}</p></div>{primaryCard?.is_published ? <Link href={"/p/" + primaryCard.slug} target="_blank" className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white">Ouvrir la carte publique ↗</Link> : <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800">Brouillon · non publiée</span>}</div>
        {primaryCard ? <div className="grid gap-5 p-5 md:grid-cols-[160px_1fr]"><div className="flex h-40 w-40 items-center justify-center overflow-hidden rounded-2xl bg-slate-100 text-3xl font-black text-slate-500">{primaryCard.avatar_url ? <img src={primaryCard.avatar_url} alt="" className="h-full w-full object-cover"/> : primaryCard.full_name.slice(0,1).toUpperCase()}</div><div><p className="text-xl font-black text-slate-950">{primaryCard.full_name}</p>{primaryCard.job_title && <p className="mt-1 text-sm font-semibold text-indigo-700">{primaryCard.job_title}</p>}{primaryCard.bio && <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">{primaryCard.bio}</p>}<div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">{primaryCard.phone && <span className="rounded-lg bg-slate-100 px-3 py-2">{primaryCard.phone}</span>}{primaryCard.email && <span className="rounded-lg bg-slate-100 px-3 py-2">{primaryCard.email}</span>}{primaryCard.website && <span className="rounded-lg bg-slate-100 px-3 py-2">{primaryCard.website}</span>}</div><div className="mt-4 flex flex-wrap gap-2">{(primaryCardLinks ?? []).map((link) => <a key={link.id} href={link.url} target="_blank" rel="noreferrer" className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">{link.label} ↗</a>)}</div></div></div> : <p className="p-5 text-sm text-slate-500">Aucune carte digitale n'a encore été créée pour cette organisation.</p>}
      </section>}

      <section><div className="mb-4"><h2 className="text-xl font-black text-slate-950">Contenu et champs de chaque rubrique</h2><p className="mt-1 text-sm text-slate-500">Chaque bloc détaille les informations que le client pourra renseigner et gérer dans son espace.</p></div>
        <div className="grid gap-5 lg:grid-cols-2">
          {enabledPreviews.map((module, index) => <article key={module.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 p-5"><div><p className="text-[11px] font-black uppercase tracking-wider text-indigo-600">Rubrique {String(index + 1).padStart(2, "0")}</p><h3 className="mt-1 text-lg font-black text-slate-950">{module.title}</h3><p className="mt-1 text-sm leading-5 text-slate-500">{module.description}</p></div><span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">Activé</span></div>
            <div className="grid gap-4 p-5 sm:grid-cols-[1fr_1fr]"><div><p className="mb-2 text-xs font-black uppercase tracking-wider text-slate-400">Champs prévus</p><div className="space-y-2">{module.fields.map((field) => <div key={field} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700">{field}<span className="float-right text-slate-300">✎</span></div>)}</div></div><div><p className="mb-2 text-xs font-black uppercase tracking-wider text-slate-400">Exemple de contenu</p><div className="space-y-3">{module.examples.map((example, i) => <div key={i} className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3"><p className="text-sm font-bold text-slate-900">{example.title}</p><p className="mt-1 text-xs leading-5 text-slate-600">{example.detail}</p>{example.meta && <p className="mt-2 text-[10px] font-semibold text-indigo-700">{example.meta}</p>}</div>)}</div></div></div>
          </article>)}
        </div>
        {enabledModules.length === 0 && <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">Aucun module n'est activé dans la configuration enregistrée.</p>}
      </section>
      <p className="text-xs leading-5 text-slate-400">Cette page est une maquette de validation des écrans et des champs. Les formulaires interactifs, enregistrements en base, gestion des fichiers et publication publique doivent être développés dans les modules client correspondants. Aucun compte, contenu client ou réglage Supabase n'a été modifié par cet aperçu.</p>
    </div>
  );
}
