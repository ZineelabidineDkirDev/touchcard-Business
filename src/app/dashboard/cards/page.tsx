import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { createClientCard, saveClientCardProfile, saveClientCardVisibility, addClientCardLink, deleteClientCardLink, toggleClientCardPublication, createCatalogItem, updateCatalogItem, deleteCatalogItem, importCatalogItems, uploadCatalogPdf } from "@/app/actions/cards";
import { createClient } from "@/lib/supabase/server";
import { CustomCardFieldsEditor, type EditableCardField } from "@/components/cards/custom-card-fields-editor";
import { SectionBlocksEditor } from "@/components/cards/section-blocks-editor";
import { sanitizeSectionBlocks } from "@/lib/cards/section-blocks";
import { isPlatformSuperAdmin } from "@/lib/auth/platform-admin";
import { AdminClientCards } from "@/components/dashboard/admin-client-cards";
import { MediaImagePicker } from "@/components/dashboard/media-image-picker";
import { CardCvManager } from "@/components/dashboard/card-cv-manager";
import { PopupDialog } from "@/components/dashboard/popup-dialog";
import { CardColorPicker } from "@/components/cards/card-color-picker";
import { CardStudio, type StudioTab } from "@/components/cards/studio/card-studio";
import type { PreviewBase, PreviewValues } from "@/components/cards/studio/live-card-preview";
import { PanelHeading, StudioCard, studioInput, studioVisibilityFormId } from "@/components/cards/studio/studio-ui";

type Card = {
  id: string; slug: string; full_name: string; job_title: string | null; company_name: string | null;
  bio: string | null; email: string | null; phone: string | null; website: string | null;
  avatar_url: string | null; cover_url: string | null; is_published: boolean; theme: Record<string, unknown> | null; public_fields: Record<string, string> | null; public_settings: Record<string, boolean> | null;
};
type CardLink = { id: string; card_id: string; label: string; url: string; kind: string };
type CatalogItem = { id: string; name: string; description: string | null; price: number; currency: string; image_url: string | null; is_active: boolean };

export default async function ClientCardsPage({ searchParams }: { searchParams: Promise<{ card?: string; card_saved?: string; card_created?: string; card_error?: string; publish_error?: string; catalog_import?: string; imported?: string; skipped?: string }> }) {
  await connection();
  const status = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Super Admin: vue transversale des demandes, comptes et cartes de tous les clients.
  if (isPlatformSuperAdmin(user.email)) {
    const [prospectsResult, organizationsResult, cardsResult, designRequestsResult] = await Promise.all([
      supabase.from("prospect_requests")
        .select("id,user_id,full_name,email,phone,city,activity_sector,card_type,status,client_access_enabled,password_initialized,created_at,brand_name,reason,project_needs")
        .order("created_at", { ascending: false }),
      supabase.from("organizations").select("id,name,owner_id"),
      supabase.from("cards").select("id,organization_id,slug,full_name,job_title,company_name,is_published,theme,created_at"),
      supabase.from("card_design_requests").select("user_id,status,template_id").order("created_at", { ascending: false }),
    ]);

    const prospects = prospectsResult.data ?? [];
    const organizations = organizationsResult.data ?? [];
    const organizationByOwner = new Map(organizations.map((org) => [org.owner_id, org]));
    const activeUserIds = prospects
      .filter((p) => p.user_id && p.client_access_enabled && ["approved", "in_production", "completed"].includes(p.status))
      .map((p) => p.user_id as string);
    const activeOrganizations = organizations.filter((org) => activeUserIds.includes(org.owner_id));
    const activeOrganizationIds = activeOrganizations.map((org) => org.id);
    const visibleCards = (cardsResult.data ?? []).filter((card) => activeOrganizationIds.includes(card.organization_id));
    const visibleCardIds = visibleCards.map((card) => card.id);
    const [linksResult, eventsResult] = await Promise.all([
      visibleCardIds.length
        ? supabase.from("card_links").select("id,card_id,label,url,kind").in("card_id", visibleCardIds).order("position")
        : Promise.resolve({ data: [] as { id: string; card_id: string; label: string; url: string; kind: string }[] }),
      visibleCardIds.length
        ? supabase.from("card_events").select("card_id,event_type").in("card_id", visibleCardIds)
        : Promise.resolve({ data: [] as { card_id: string; event_type: string }[] }),
    ]);
    const latestDesignByUser = new Map<string, { status: string; template_id: string }>();
    for (const request of designRequestsResult.data ?? []) {
      if (!latestDesignByUser.has(request.user_id)) latestDesignByUser.set(request.user_id, { status: request.status, template_id: request.template_id });
    }
    const adminClients = prospects.map((prospect) => {
      const organization = prospect.user_id ? organizationByOwner.get(prospect.user_id) : null;
      const clientCards = prospect.client_access_enabled && prospect.user_id && organization
        ? visibleCards.filter((card) => card.organization_id === organization.id).map((card) => {
            const cardEvents = (eventsResult.data ?? []).filter((event) => event.card_id === card.id);
            return {
              id: card.id,
              slug: card.slug,
              full_name: card.full_name,
              job_title: card.job_title,
              company_name: card.company_name,
              is_published: card.is_published,
              theme: card.theme as Record<string, unknown> | null,
              created_at: card.created_at,
              links: (linksResult.data ?? []).filter((link) => link.card_id === card.id),
              views: cardEvents.filter((event) => ["view", "qr_scan", "nfc_scan"].includes(event.event_type)).length,
              nfc_scans: cardEvents.filter((event) => event.event_type === "nfc_scan").length,
              qr_scans: cardEvents.filter((event) => event.event_type === "qr_scan").length,
              clicks: cardEvents.filter((event) => event.event_type === "click").length,
              saves: cardEvents.filter((event) => event.event_type === "contact_save").length,
            };
          })
        : [];
      return {
        id: prospect.id,
        user_id: prospect.user_id,
        full_name: prospect.full_name,
        email: prospect.email,
        phone: prospect.phone,
        city: prospect.city,
        activity_sector: prospect.activity_sector,
        card_type: prospect.card_type,
        status: prospect.status,
        client_access_enabled: prospect.client_access_enabled,
        password_initialized: prospect.password_initialized,
        created_at: prospect.created_at,
        brand_name: prospect.brand_name,
        reason: prospect.reason,
        project_needs: prospect.project_needs as { selected?: string[] } | string[] | null,
        organization_name: organization?.name ?? null,
        cards: clientCards,
        design_status: prospect.user_id ? latestDesignByUser.get(prospect.user_id)?.status ?? null : null,
        design_template: prospect.user_id ? latestDesignByUser.get(prospect.user_id)?.template_id ?? null : null,
      };
    });
    return <AdminClientCards prospects={adminClients} />;
  }

  const { data: membership } = await supabase.from("organization_members")
    .select("organization_id").eq("user_id", user.id).limit(1).maybeSingle();
  const organizationId = membership?.organization_id;
  const { data: organization } = organizationId
    ? await supabase.from("organizations").select("id,name,workspace_config").eq("id", organizationId).maybeSingle()
    : { data: null };
  const { data: cards } = organizationId
    ? await supabase.from("cards").select("id,slug,full_name,job_title,company_name,bio,email,phone,website,avatar_url,cover_url,is_published,theme,public_fields,public_settings")
      .eq("organization_id", organizationId).order("created_at", { ascending: false })
    : { data: [] as Card[] };
  const { data: intakeProfile } = await supabase.from("prospect_requests")
    .select("full_name,city,activity_sector,email,phone,business_address,business_phone")
    .eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
  const cardIds = (cards ?? []).map((card) => card.id);
  const { data: links } = cardIds.length
    ? await supabase.from("card_links").select("id,card_id,label,url,kind").in("card_id", cardIds).order("position")
    : { data: [] as CardLink[] };
  const { data: events } = cardIds.length
    ? await supabase.from("card_events").select("card_id,event_type").in("card_id", cardIds)
    : { data: [] as { card_id: string; event_type: string }[] };
  const config = (organization?.workspace_config ?? {}) as { version?: number; template?: string; modules?: string[]; ai_suggestions?: { profile_draft?: { tagline?: string; description?: string; card_fields?: { key: string; label: string; type: string; visible: boolean }[]; suggested_buttons?: { kind: string; label: string; enabled: boolean }[] } } };
  const modules = Array.isArray(config.modules) ? config.modules : [];
  const activitySector = String((organization?.workspace_config as any)?.original_client_choices?.activity_sector ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const isCreativeProfile = /designer|design graphique|graphiste|photographe|photography/.test(activitySector);
  const galleryEnabled = isCreativeProfile || !config.version || modules.includes("gallery");
  const selectedServiceId = String((organization?.workspace_config as { original_client_choices?: { project_needs?: { selected?: string[] } } } | null)?.original_client_choices?.project_needs?.selected?.[0] ?? "");
  // CV et portfolio professionnel : réservés aux profils personnels / créatifs, pas aux marques et commerces.
  const portfolioCvEnabled = config.template === "contact" || isCreativeProfile || !config.version || selectedServiceId === "professional_profile" || /developpeur|developer|freelance|marketing digital|media buy|photograph|graphiste|designer|community manager|consultant independant/.test(activitySector);
  if (config.version && !modules.includes("digital_card")) notFound();
  const selectedNeed = String(((organization?.workspace_config as any)?.original_client_choices?.project_needs?.selected ?? []).join(" ")).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const isEcommerce = config.template === "e-business" && (/e.?commerce|commerce en ligne|boutique en ligne|vente en ligne/.test(activitySector) || /boutique en ligne|vente en ligne|e.?commerce|commerce en ligne|catalogue de produits|commande de produits/.test(selectedNeed));
  const supportsBusinessCatalog = !config.template || ["service", "e-business"].includes(config.template);
  const isBeauty = supportsBusinessCatalog && /beaute|cosmetique?s?|cosmetics?|esthetique|spa|hammam|salon de coiffure|coiffure|onglerie|maquillage|institut de beaute|massage|barber|barbier|barbershop/.test(activitySector + " " + selectedNeed);
  const isBarber = /barber|barbier|barbershop/.test(activitySector + " " + selectedNeed);
  const isRestaurant = supportsBusinessCatalog && /restaurant|restauration|cafe|coffee shop|snack|traiteur|pizzeria|boulangerie|patisserie/.test(activitySector + " " + selectedNeed);
  const isRealEstate = supportsBusinessCatalog && /immobilier|agence immobiliere|promotion immobiliere|location immobiliere/.test(activitySector);
  const catalogEnabled = !isCreativeProfile && supportsBusinessCatalog && (!config.version || modules.some((module) => module === "service_catalog" || module === "room_catalog" || (module === "product_catalog" && isEcommerce)) || isBeauty || isRestaurant || isRealEstate);
  const catalogLabel = modules.includes("room_catalog") ? "Chambres" : isBarber ? "Prestations barber" : isBeauty ? "Prestations beauté" : isRestaurant ? "Menu" : config.template === "service" ? "Prestations" : isEcommerce ? "Shop" : isRealEstate ? "Projets" : "Catalogue";
  const { data: catalogItems } = catalogEnabled && organizationId
    ? await supabase.from("products").select("id,name,description,price,currency,image_url,is_active")
      .eq("organization_id", organizationId).order("created_at", { ascending: false })
    : { data: [] as CatalogItem[] };
  const { data: catalogDocument } = catalogEnabled && organizationId
    ? await supabase.from("organization_catalog_documents").select("file_url,file_name")
      .eq("organization_id", organizationId).maybeSingle()
    : { data: null as { file_url: string; file_name: string } | null };
  const profileDraft = config.ai_suggestions?.profile_draft;
  const publicSiteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://touchcard-three.vercel.app").replace(/\/$/, "");


  const allCards = cards ?? [];
  const selectedCard = allCards.find((item) => item.id === status.card) ?? allCards[0] ?? null;
  const studio = selectedCard ? (() => {
    const card = selectedCard;
    const cardLinks = (links ?? []).filter((link) => link.card_id === card.id);
    const cardEvents = (events ?? []).filter((event) => event.card_id === card.id);
    const storedFields = (card.public_fields ?? {}) as Record<string, any>;
    const fields = storedFields.intake_profile_synced === true ? storedFields : {
      ...storedFields,
      location: storedFields.location || intakeProfile?.business_address || intakeProfile?.city || "",
      company_address: storedFields.company_address || intakeProfile?.business_address || "",
      whatsapp: storedFields.whatsapp || intakeProfile?.business_phone || "",
      company_phone: storedFields.company_phone || intakeProfile?.business_phone || "",
      company_email: storedFields.company_email || intakeProfile?.email || "",
      industry: storedFields.industry || intakeProfile?.activity_sector || "",
      contact_person_name: storedFields.contact_person_name || (config.template !== "contact" ? intakeProfile?.full_name : "") || "",
    };
    const settings = (card.public_settings ?? {}) as Record<string, boolean>;
    const currentAccent = typeof card.theme?.accent === "string" ? card.theme.accent : "#2563EB";
    const currentTextColor = typeof card.theme?.text_color === "string" ? card.theme.text_color : "#111827";
    const storedCustomFields: EditableCardField[] = Array.isArray(fields.custom_fields) ? fields.custom_fields : [];
    const cvField = storedCustomFields.find((field) => /cv professionnel|^cv$/i.test(field.label.trim()) && (field.value.trim().startsWith("https://") || field.value.trim().startsWith("http://")));
    const initialCustomFields: EditableCardField[] = storedCustomFields.length
      ? storedCustomFields.filter((field) => portfolioCvEnabled || !/portfolio|cv professionnel/i.test(field.key + " " + field.label))
      : (profileDraft?.card_fields ?? []).filter((field) => portfolioCvEnabled || !/portfolio|cv/i.test(field.key + " " + field.label)).map((field) => ({ key: field.key, label: field.label, value: "", visible: field.visible, section: (field as { section?: string }).section }));
    const initialSections = config.template === "contact" ? [] : (() => { const stored = sanitizeSectionBlocks(fields.sections); return stored.length ? stored : sanitizeSectionBlocks((profileDraft as { sections?: unknown } | null | undefined)?.sections); })();
    const publicUrl = "/p/" + card.slug;
    const count = (types: string[]) => cardEvents.filter((event) => types.includes(event.event_type)).length;
    const visibilityGroups: { title: string; items: string[][] }[] = [
      { title: "Présentation & identité", items: [["show_about", "Présentation / À propos"], ["show_company_info", "Informations entreprise"], ["show_categories", "Domaines et spécialités"], ["show_info_fields", "Informations complémentaires"]] },
                        { title: "Coordonnées", items: [["show_contact", "Bloc de contact"], ["show_phone", "Téléphone"], ["show_email", "E-mail"], ["show_website", "Site web"]] },
                        ...(!isCreativeProfile ? [{ title: "Services & demandes", items: [["show_catalog", catalogLabel], ["show_catalog_pdf", "Catalogue PDF"], ["show_orders", "Commandes boutique"], ["show_bookings", "Réservations"], ["show_quotes", "Demandes de devis"], ["show_request_forms", "Formulaires de demande"]] }] : []),
                        { title: "Communication & découverte", items: [...(galleryEnabled ? [["show_gallery", portfolioCvEnabled ? "Portfolio & galerie" : "Galerie photos"]] : []), ...(portfolioCvEnabled ? [["show_cv", "CV professionnel"]] : []), ["show_google_reviews", "Avis Google"], ["show_social_links", "Réseaux sociaux"], ["show_featured_links", "Liens mis en avant"], ["show_faq", "Questions fréquentes (FAQ)"], ["show_videos", "Vidéos"], ["show_location", "Adresse et carte"]] },
    ];
    const hasRequests = config.template !== "contact" && Boolean(config.version);
    const requestButtons: PreviewBase["requestButtons"] = hasRequests ? [
      ...(modules.includes("bookings") ? [{ label: modules.includes("room_catalog") ? "Réserver une chambre" : "Réserver", kind: "booking" as const }] : []),
      ...(modules.includes("orders") ? [{ label: "Commander", kind: "order" as const }] : []),
      ...(modules.includes("quote_requests") ? [{ label: "Demander un devis", kind: "quote" as const }] : []),
    ] : [];
    const base: PreviewBase = {
      template: config.template ?? "service", links: cardLinks.map((link) => ({ id: link.id, label: link.label, url: link.url, kind: link.kind })),
      catalog: (catalogItems ?? []).filter((item) => item.is_active !== false), catalogLabel, catalogEnabled, requestButtons, settings,
      visibilityKeys: visibilityGroups.flatMap((group) => group.items.map(([key]) => key)),
    };
    const initial: PreviewValues = {
      full_name: card.full_name, job_title: card.job_title ?? "", company_name: card.company_name ?? "", avatar_url: card.avatar_url ?? "", cover_url: card.cover_url ?? "",
      accent_color: currentAccent, text_color: currentTextColor, email: card.email ?? intakeProfile?.email ?? "", phone: card.phone ?? intakeProfile?.phone ?? "", website: card.website ?? "",
      tagline: fields.tagline ?? "", bio: card.bio ?? "", location: fields.location ?? "", hours: fields.hours ?? "", company_phone: fields.company_phone ?? card.phone ?? "",
      company_email: fields.company_email ?? card.email ?? "", company_address: fields.company_address ?? fields.location ?? intakeProfile?.business_address ?? "", whatsapp: fields.whatsapp ?? card.phone ?? "",
      custom_fields: initialCustomFields, sections: initialSections, show: settings,
    };
    const tabs: StudioTab[] = [
      { id: "identity", label: "Identité", icon: "identity", kind: "form", panel: <>
        <PanelHeading icon="identity" title="Identité & image" hint="Votre photo, votre bannière et la façon dont vous êtes présenté." />
        {profileDraft?.tagline && !fields.tagline && <p className="rounded-xl border border-cyan-300/50 bg-cyan-50 p-3 text-xs leading-5 text-cyan-900"><strong>Suggestion d’accroche :</strong> {profileDraft.tagline}</p>}
        <div className="grid gap-4 md:grid-cols-[.8fr_1.2fr]"><div className="sm:col-span-2 grid gap-4 md:grid-cols-[.8fr_1.2fr]"><MediaImagePicker organizationId={organizationId!} name="avatar_url" initialUrl={card.avatar_url} label="Photo de profil"/><MediaImagePicker organizationId={organizationId!} name="cover_url" initialUrl={card.cover_url} label="Couverture de la carte" shape="wide"/></div></div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-semibold text-slate-600">Nom affiché<input name="full_name" required defaultValue={card.full_name} className={studioInput}/></label>
          <label className="text-xs font-semibold text-slate-600">Fonction / spécialité<input name="job_title" required defaultValue={card.job_title ?? ""} placeholder="Ex. Médecin généraliste, Développeur, Gérant…" className={studioInput}/></label>
          <label className="text-xs font-semibold text-slate-600">Entreprise / marque<input name="company_name" defaultValue={card.company_name ?? ""} placeholder="Nom de votre entreprise ou marque" className={studioInput}/></label>
          <label className="text-xs font-semibold text-slate-600">Accroche<input name="tagline" defaultValue={fields.tagline ?? ""} placeholder="Une phrase qui présente votre activité" className={studioInput}/></label>
          <label className="text-xs font-semibold text-slate-600 sm:col-span-2">Présentation<textarea name="bio" rows={4} defaultValue={card.bio ?? ""} placeholder="Présentez votre activité..." className={studioInput}/></label>
        </div>
      </> },
      { id: "contact", label: "Coordonnées", icon: "contact", kind: "form", panel: <>
        <PanelHeading icon="contact" title="Coordonnées & adresse" hint="Comment vos clients vous joignent, et où vous trouver." />
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-semibold text-slate-600">E-mail public<input name="email" type="email" defaultValue={card.email ?? intakeProfile?.email ?? ""} className={studioInput}/></label>
          <label className="text-xs font-semibold text-slate-600">Téléphone public<input name="phone" defaultValue={card.phone ?? intakeProfile?.phone ?? ""} className={studioInput}/></label>
          <label className="text-xs font-semibold text-slate-600">WhatsApp professionnel<input name="whatsapp" defaultValue={fields.whatsapp ?? card.phone ?? ""} placeholder="+212..." className={studioInput}/></label>
          <label className="text-xs font-semibold text-slate-600">Site web<input name="website" type="url" defaultValue={card.website ?? ""} placeholder="https://" className={studioInput}/></label>
          <label className="text-xs font-semibold text-slate-600">Téléphone professionnel<input name="company_phone" defaultValue={fields.company_phone ?? card.phone ?? ""} placeholder="+212..." className={studioInput}/></label>
          <label className="text-xs font-semibold text-slate-600">E-mail professionnel<input name="company_email" type="email" defaultValue={fields.company_email ?? card.email ?? ""} className={studioInput}/></label>
          <label className="text-xs font-semibold text-slate-600 sm:col-span-2">Adresse professionnelle complète<input name="company_address" defaultValue={fields.company_address ?? fields.location ?? intakeProfile?.business_address ?? ""} placeholder="Adresse, quartier, ville, pays" className={studioInput}/></label>
          <label className="text-xs font-semibold text-slate-600">Ville / zone<input name="location" defaultValue={fields.location ?? ""} className={studioInput}/></label>
          <label className="text-xs font-semibold text-slate-600">Horaires<input name="hours" defaultValue={fields.hours ?? ""} placeholder="Ex. Lun–Sam, 9h–18h" className={studioInput}/></label>
          <label className="text-xs font-semibold text-slate-600">Nom du contact<input name="contact_person_name" defaultValue={fields.contact_person_name ?? card.full_name} className={studioInput}/></label>
          <label className="text-xs font-semibold text-slate-600">Domaine professionnel<input name="industry" defaultValue={fields.industry ?? intakeProfile?.activity_sector ?? ""} className={studioInput}/></label>
          {(config.template === "google-review" || config.template === "e-business") && <label className="text-xs font-semibold text-slate-600 sm:col-span-2">Lien Google Avis<input name="google_review_url" type="url" defaultValue={fields.google_review_url ?? ""} placeholder="https://..." className={studioInput}/></label>}
        </div>
      </> },
      { id: "design", label: "Design", icon: "design", kind: "form", panel: <>
        <PanelHeading icon="design" title="Couleurs de la carte" hint="La couleur principale s’applique aux boutons et aux éléments de marque ; la couleur du texte à tous les contenus." />
        <StudioCard title="Votre palette" hint="Choisissez une nuance ou saisissez directement son code HEX. Le résultat s’affiche tout de suite dans l’aperçu.">
          <div className="grid gap-5 md:grid-cols-2"><CardColorPicker name="accent_color" label="Couleur principale de la carte" defaultValue={currentAccent} presets={["#2563EB","#1D4ED8","#0891B2","#16A34A","#059669","#7C3AED","#DB2777","#DC2626","#EA580C","#171717","#0F766E","#D97706"]}/><CardColorPicker name="text_color" label="Couleur des textes" defaultValue={currentTextColor} presets={["#111827","#1F2937","#334155","#1E3A8A","#312E81","#14532D","#7F1D1D","#7C2D12"]}/></div>
        </StudioCard>
      </> },
      ...(config.template !== "contact" || initialCustomFields.length > 0 ? [{ id: "sections", label: "Sections", icon: "sections" as const, kind: "form" as const, panel: <>
        <PanelHeading icon="sections" title="Sections de votre activité" hint="Les contenus propres à votre métier : listes, dates, boutons de demande et informations complémentaires." />
        <div className="grid gap-4 sm:grid-cols-2">
          {config.template !== "contact" && <SectionBlocksEditor initialSections={initialSections} />}
          <div className="sm:col-span-2"><CustomCardFieldsEditor initialFields={initialCustomFields} showPortfolioActions={portfolioCvEnabled}/></div>
        </div>
      </> }] : []),
      { id: "links", label: "Liens & boutons", icon: "links", kind: "standalone", panel: <>
        <PanelHeading icon="links" title="Réseaux sociaux & boutons" hint="Instagram, TikTok, YouTube, LinkedIn, boutique ou lien de réservation : chaque lien devient un bouton sur votre carte." />
                        <div><h3 className="font-bold text-slate-900">Réseaux sociaux & liens</h3><p className="mt-1 text-xs text-slate-500">Ajoutez Instagram, TikTok, YouTube, LinkedIn, vos projets, une boutique ou un lien de réservation.</p>
                  <div className="mt-3 space-y-2">{cardLinks.map((link) => <div key={link.id} className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 p-3"><div className="min-w-0"><p className="text-sm font-semibold text-slate-800">{link.label} <span className="text-xs font-normal text-slate-400">· {link.kind}</span></p><p className="truncate text-xs text-slate-500">{link.url}</p></div><form action={deleteClientCardLink}><input type="hidden" name="card_id" value={card.id}/><input type="hidden" name="link_id" value={link.id}/><button className="text-xs font-bold text-rose-600">Supprimer</button></form></div>)}</div>
                  <PopupDialog title="Ajouter un bouton à ma carte" description={config.template === "contact" ? "Ajoutez vos réseaux sociaux, votre site web personnel ou un lien vers votre CV / portfolio." : "Ajoutez un lien WhatsApp, réseau social, site web ou boutique."} triggerLabel="+ Ajouter un bouton"><form action={addClientCardLink} className="space-y-2 rounded-xl bg-slate-50 p-3">
                    <input type="hidden" name="card_id" value={card.id}/>
                    <input name="label" required placeholder="Nom du bouton (ex. WhatsApp Business)" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"/>
                    <input name="url" type="url" required placeholder="https://..." className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"/>
                    <div className="flex gap-2"><select name="kind" className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"><option value="whatsapp">WhatsApp</option><option value="telegram">Telegram</option><option value="instagram">Instagram</option><option value="facebook">Facebook</option><option value="linkedin">LinkedIn</option><option value="tiktok">TikTok</option><option value="youtube">YouTube</option><option value="x">X / Twitter</option><option value="pinterest">Pinterest</option>{config.template === "contact" ? <><option value="website">Site web personnel</option><option value="other">CV / Portfolio</option></> : <><option value="calendly">Prendre rendez-vous</option><option value="store">Boutique / Store</option><option value="website">Site web</option><option value="other">Autre</option></>}</select><button className="btn-primary">Ajouter</button></div>
                  </form></PopupDialog>
                </div>
        {portfolioCvEnabled && <CardCvManager organizationId={organizationId!} cardId={card.id} initialUrl={cvField?.value ?? ""}/>}
      </> },
      ...(catalogEnabled ? [{ id: "catalog", label: catalogLabel, icon: "catalog" as const, kind: "standalone" as const, panel: <>
        <PanelHeading icon="catalog" title={catalogLabel} hint="Les éléments visibles sur votre page publique. Les prix sont exprimés en MAD." />
                <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-wider text-indigo-600">Catalogue client</p><h2 className="mt-1 text-xl font-black text-slate-950">{catalogLabel}</h2><p className="mt-1 text-sm text-slate-500">Ajoutez les éléments qui seront visibles sur votre page publique. Les prix sont exprimés en MAD.</p></div><span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">{catalogItems?.length ?? 0} élément(s)</span></div>
        <form action={importCatalogItems} className="mt-4 flex flex-wrap items-end gap-3 rounded-xl border border-dashed border-indigo-200 bg-indigo-50/60 p-3"><label className="min-w-0 flex-1 text-xs font-bold text-slate-700">Importer un catalogue CSV<input name="catalog_file" type="file" accept=".csv,text/csv" required className="mt-2 block w-full rounded-lg border border-indigo-100 bg-white p-2 text-xs font-normal"/></label><button className="rounded-xl border border-indigo-200 bg-white px-4 py-2.5 text-sm font-bold text-indigo-700 hover:bg-indigo-100">Importer le fichier</button><p className="w-full text-[11px] text-slate-500">Colonnes attendues : name, description, price, image_url. Jusqu’à 250 éléments par import.</p></form><form action={uploadCatalogPdf} encType="multipart/form-data" className="mt-3 flex flex-wrap items-end gap-3 rounded-xl border border-dashed border-rose-200 bg-rose-50/50 p-3"><label className="min-w-0 flex-1 text-xs font-bold text-slate-700">Catalogue PDF à afficher sur votre carte NFC<input name="catalog_pdf" type="file" accept="application/pdf,.pdf" required className="mt-2 block w-full rounded-lg border border-rose-100 bg-white p-2 text-xs font-normal"/></label><button className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-rose-700">{catalogDocument?.file_url ? "Remplacer le PDF" : "Publier le PDF"}</button><p className="w-full text-[11px] text-slate-500">PDF uniquement · 15 Mo maximum. Le bouton sera visible par les visiteurs de votre carte NFC.</p>{catalogDocument?.file_url && <p className="w-full text-xs font-semibold text-emerald-700">PDF actuel : <a href={catalogDocument.file_url} target="_blank" rel="noreferrer" className="underline">{catalogDocument.file_name || "Consulter le catalogue"}</a></p>}</form><PopupDialog title={catalogLabel.includes("Prestations") ? "Ajouter une prestation" : catalogLabel === "Menu" ? "Ajouter un plat" : catalogLabel === "Shop" ? "Ajouter un article au Shop" : catalogLabel === "Chambres" ? "Ajouter une chambre" : catalogLabel === "Projets" ? "Ajouter un projet" : "Ajouter un élément"} description="Ajoutez les informations et la photo qui seront visibles sur votre page publique." triggerLabel={catalogLabel.includes("Prestations") ? "+ Ajouter une prestation" : catalogLabel === "Menu" ? "+ Ajouter un plat" : catalogLabel === "Shop" ? "+ Ajouter un article" : catalogLabel === "Chambres" ? "+ Ajouter une chambre" : catalogLabel === "Projets" ? "+ Ajouter un projet" : "+ Ajouter un élément"} triggerClassName="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700"><form action={createCatalogItem} className="grid gap-3 sm:grid-cols-2">
          <input name="name" required maxLength={120} placeholder={catalogLabel.includes("Prestations") ? "Nom de la prestation" : catalogLabel === "Menu" ? "Nom du plat" : catalogLabel === "Shop" ? "Nom de l'article" : catalogLabel === "Chambres" ? "Nom de la chambre" : catalogLabel === "Projets" ? "Nom du projet" : "Nom de l'élément"} className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm"/>
          <input name="price" required type="number" min="0" max="100000000" step="0.01" placeholder="Prix en MAD" className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm"/>
          <textarea name="description" maxLength={1200} rows={2} placeholder="Description (facultatif)" className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm sm:col-span-2"/>
          <div className="sm:col-span-2"><MediaImagePicker organizationId={organizationId!} name="image_url" label="Photo de la prestation / produit"/></div>
          <button className="btn-primary">Ajouter au catalogue</button>
        </form></PopupDialog>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {(catalogItems ?? []).map((item) => <article key={item.id} className="flex items-start gap-3 rounded-xl border border-slate-100 p-3">
            {item.image_url ? <img src={item.image_url} alt="" className="h-16 w-16 rounded-lg object-cover"/> : <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-slate-100 text-xl">▧</div>}
            <div className="min-w-0 flex-1"><p className="font-bold text-slate-900">{item.name}</p><p className="mt-1 line-clamp-2 text-xs text-slate-500">{item.description || "Sans description"}</p><p className="mt-2 text-sm font-black text-indigo-700">{Number(item.price).toLocaleString("fr-MA")} {item.currency}</p><div className="mt-2"><PopupDialog title={catalogLabel.includes("Prestations") ? "Modifier la prestation" : catalogLabel === "Menu" ? "Modifier le plat" : "Modifier le produit"} description="Modifiez les informations et remplacez sa photo de couverture." triggerLabel="Modifier" triggerClassName="text-xs font-bold text-indigo-700 hover:underline"><form action={updateCatalogItem} className="space-y-3"><input type="hidden" name="id" value={item.id}/><label className="block text-xs font-semibold text-slate-600">Nom<input name="name" required defaultValue={item.name} className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm"/></label><label className="block text-xs font-semibold text-slate-600">Prix en MAD<input name="price" required type="number" min="0" step="0.01" defaultValue={item.price} className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm"/></label><label className="block text-xs font-semibold text-slate-600">Description<textarea name="description" rows={3} defaultValue={item.description || ""} className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm"/></label><MediaImagePicker organizationId={organizationId!} name="image_url" initialUrl={item.image_url} label={catalogLabel.includes("Prestations") ? "Photo de la prestation" : catalogLabel === "Menu" ? "Photo du plat" : "Photo / couverture du produit"}/><button className="btn-primary">Enregistrer</button></form></PopupDialog></div></div>
            <form action={deleteCatalogItem}><input type="hidden" name="id" value={item.id}/><button className="text-xs font-bold text-rose-600">Supprimer</button></form>
          </article>)}
          {!(catalogItems?.length) && <p className="rounded-xl border border-dashed border-slate-200 p-5 text-sm text-slate-500 md:col-span-2">Votre catalogue est vide. Ajoutez votre premier élément ci-dessus.</p>}
        </div>
      </> }] : []),
      { id: "visibility", label: "Rubriques visibles", icon: "eye", kind: "standalone", panel: <>
        <PanelHeading icon="eye" title="Ce que voient vos visiteurs" hint="Cochez les rubriques à afficher après un scan. Le changement se voit tout de suite dans l’aperçu." />
        <form id={studioVisibilityFormId(card.id)} action={saveClientCardVisibility} className="space-y-4"><input type="hidden" name="card_id" value={card.id}/><div className="space-y-4">
          {visibilityGroups.map((group) => (
            <div key={group.title}>
              <h5 className="mb-2 text-xs font-bold text-slate-700">{group.title}</h5>
              <div className="grid gap-2 sm:grid-cols-2">
                {group.items.map(([key, label]) => (
                  <label key={key} className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50/50">
                    <input type="checkbox" name={key} defaultChecked={settings[key] !== false} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"/>
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div><div className="border-t border-slate-100 pt-4"><button className="btn-primary w-full rounded-full py-3 text-sm">✓ Enregistrer les rubriques visibles</button></div></form>
      </> },
      { id: "share", label: "Partage & stats", icon: "share", kind: "standalone", panel: <>
        <PanelHeading icon="share" title="Partage & statistiques" hint="L’adresse à encoder sur votre puce NFC, le QR code et les performances de cette carte." />
        <div className="grid gap-3 sm:grid-cols-3">{[["Visites", count(["view", "qr_scan", "nfc_scan"])], ["Scans NFC", count(["nfc_scan"])], ["Scans QR", count(["qr_scan"])], ["Contacts enregistrés", count(["contact_save"])], ["Clics sur les boutons", count(["click"])]].map(([label, value]) => <article key={String(label)} className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-2xl font-black text-slate-950">{value}</p><p className="mt-1 text-xs text-slate-500">{label}</p></article>)}</div>
        <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center rounded-2xl bg-slate-950 p-4 text-white"><div><p className="text-xs font-bold text-white">URL à encoder sur la puce NFC</p><p className="mt-1 break-all text-[11px] text-slate-300">{publicSiteUrl}/p/{card.slug}?source=nfc</p><p className="mt-3 text-xs text-slate-400">Les statistiques commencent à la publication de la carte.</p></div><div><p className="mb-2 text-xs font-bold text-white">QR code de partage</p><img alt="QR code de la carte" loading="lazy" className="h-28 w-28 rounded-lg bg-white p-1" src={"https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=" + encodeURIComponent(publicSiteUrl + "/p/" + card.slug + "?source=qr")}/></div></div>
        <p className="text-xs text-slate-400">Modules autorisés : {modules.join(" · ") || "Configuration standard"}</p>
      </> },
    ];
    return <CardStudio key={card.id} cardId={card.id} slug={card.slug} title={card.full_name} subtitle={config.template === "contact" ? "E-Contact personnel" : card.company_name || "Carte professionnelle"} isPublished={card.is_published} publicUrl={publicUrl} formAction={saveClientCardProfile} tabs={tabs} base={base} initial={initial} stats={{ views: count(["view", "qr_scan", "nfc_scan"]), nfc: count(["nfc_scan"]) }}
      headerActions={<form action={toggleClientCardPublication}><input type="hidden" name="card_id" value={card.id}/><input type="hidden" name="publish" value={String(!card.is_published)}/><button className="btn-primary">{card.is_published ? "Dépublier" : "Publier"}</button></form>} />;
  })() : null;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-sm font-bold uppercase tracking-wider text-indigo-600">Espace client · {organization?.name ?? "TouchCard"}</p><h1 className="mt-2 text-3xl font-black text-slate-950">Ma carte NFC</h1><p className="mt-2 max-w-2xl text-sm text-slate-500">Modifiez votre carte et voyez le résultat en direct. Vos visiteurs ne voient les changements qu’après l’enregistrement.</p></div>
        <div className="flex flex-wrap items-center gap-3"><Link href="/dashboard" className="text-sm font-semibold text-indigo-700">← Tableau de bord</Link>
                  <PopupDialog title="Créer une carte NFC" description="Configurez les informations principales de votre nouvelle carte." triggerLabel="+ Créer une carte"><form action={createClientCard} className="grid gap-3 sm:grid-cols-2">
          <input name="full_name" required placeholder="Nom affiché sur la carte" className="rounded-xl border border-slate-200 px-3 py-3 text-sm" />
          <input name="job_title" placeholder="Fonction / activité" className="rounded-xl border border-slate-200 px-3 py-3 text-sm" />
          <input name="company_name" placeholder="Entreprise" className="rounded-xl border border-slate-200 px-3 py-3 text-sm" />
          <button className="btn-primary sm:col-span-2">Créer ma carte NFC</button>
        </form></PopupDialog>
        </div>
      </header>

            {status.card_created === "1" && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">Votre nouvelle carte NFC a été créée en brouillon. Vous pouvez maintenant la personnaliser.</div>}
      {status.card_saved === "1" && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">Modifications enregistrées. Votre carte publique a été actualisée.</div>}
      {status.publish_error === "contact" && <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">Avant de publier, ajoutez au moins un moyen de contact (téléphone ou e-mail) dans votre carte. Vos visiteurs doivent pouvoir vous joindre facilement.</div>}
      {status.card_error === "cv_format" && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">Le CV doit être un fichier PDF de 10 Mo maximum.</div>}
      {status.card_error === "cv_upload" && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">Le téléversement du CV a échoué. Vérifiez le stockage puis réessayez.</div>}
      {status.catalog_import === "success" && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">Import réussi : {status.imported ?? "0"} élément(s) ajouté(s). {Number(status.skipped ?? 0) > 0 ? status.skipped + " ligne(s) ignorée(s) car les données étaient invalides." : ""}</div>}
      {status.catalog_import && status.catalog_import !== "success" && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{({
        workspace: "Aucun espace client n'est associé à cette session.",
        access: "L'import catalogue n'est pas activé pour votre secteur.",
        file: "Choisissez un fichier CSV non vide avant de lancer l'import.",
        format: "Format non accepté : sélectionnez un fichier .csv de 2 Mo maximum.",
        empty: "Le fichier CSV est vide ou ne contient aucune ligne de données.",
        headers: "Colonnes manquantes. Le fichier doit contenir : name, description, price, image_url.",
        limit: "Limite dépassée : importez au maximum 250 éléments à la fois.",
        invalid: "Aucune ligne valide. Vérifiez que chaque ligne contient un nom et un prix numérique.",
        database: "Supabase a refusé l'import. Vérifiez les droits de votre espace puis réessayez.",
      } as Record<string, string>)[status.catalog_import] ?? "L'import du catalogue a échoué. Vérifiez le fichier puis réessayez."}</div>}
      {status.card_error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{({
        workspace: "Aucun espace client n'est associé à cette session.",
        module: "La gestion des cartes NFC n'est pas activée pour cet espace.",
        missing: "La carte à modifier n'a pas été identifiée.",
        fields: "Les rubriques personnalisées sont invalides. Vérifiez les champs puis réessayez.",
        database: "Supabase a refusé l'enregistrement. Réessayez ; si le problème persiste, consultez les journaux serveur.",
        permission: "Aucune carte de cet espace n'a été modifiée. Vérifiez les droits d'accès à cette carte.",
      } as Record<string, string>)[status.card_error] ?? "L'enregistrement a échoué. Réessayez."}</div>}

      {allCards.length > 1 && <nav aria-label="Mes cartes" className="flex flex-wrap gap-2">{allCards.map((item) => <Link key={item.id} href={"/dashboard/cards?card=" + item.id} className={"rounded-full border px-4 py-2 text-sm font-bold " + (item.id === selectedCard?.id ? "border-transparent bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-600 text-white shadow-md shadow-blue-500/30" : "border-slate-200 bg-white text-slate-700 hover:border-cyan-300")}>{item.full_name}{item.is_published ? "" : " · brouillon"}</Link>)}</nav>}

      {studio ?? <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center"><h2 className="text-xl font-black text-slate-950">Aucune carte pour le moment</h2><p className="mt-2 text-sm text-slate-500">Créez votre première carte NFC avec le bouton « + Créer une carte ».</p></section>}
    </div>
  );
}
