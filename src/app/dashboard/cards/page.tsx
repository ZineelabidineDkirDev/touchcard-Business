import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { createClientCard, saveClientCardProfile, addClientCardLink, deleteClientCardLink, toggleClientCardPublication, createCatalogItem, updateCatalogItem, deleteCatalogItem } from "@/app/actions/cards";
import { createClient } from "@/lib/supabase/server";
import { CustomCardFieldsEditor, type EditableCardField } from "@/components/cards/custom-card-fields-editor";
import { CardTemplateGallery } from "@/components/cards/card-template-gallery";
import { isPlatformSuperAdmin } from "@/lib/auth/platform-admin";
import { AdminClientCards } from "@/components/dashboard/admin-client-cards";
import { MediaImagePicker } from "@/components/dashboard/media-image-picker";
import { PopupDialog } from "@/components/dashboard/popup-dialog";

type Card = {
  id: string; slug: string; full_name: string; job_title: string | null; company_name: string | null;
  bio: string | null; email: string | null; phone: string | null; website: string | null;
  avatar_url: string | null; is_published: boolean; theme: Record<string, unknown> | null; public_fields: Record<string, string> | null; public_settings: Record<string, boolean> | null;
};
type CardLink = { id: string; card_id: string; label: string; url: string; kind: string };
type CatalogItem = { id: string; name: string; description: string | null; price: number; currency: string; image_url: string | null; is_active: boolean };

export default async function ClientCardsPage() {
  await connection();
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
    ? await supabase.from("cards").select("id,slug,full_name,job_title,company_name,bio,email,phone,website,avatar_url,is_published,theme,public_fields,public_settings")
      .eq("organization_id", organizationId).order("created_at", { ascending: false })
    : { data: [] as Card[] };
  const cardIds = (cards ?? []).map((card) => card.id);
  const { data: links } = cardIds.length
    ? await supabase.from("card_links").select("id,card_id,label,url,kind").in("card_id", cardIds).order("position")
    : { data: [] as CardLink[] };
  const { data: events } = cardIds.length
    ? await supabase.from("card_events").select("card_id,event_type").in("card_id", cardIds)
    : { data: [] as { card_id: string; event_type: string }[] };
  const config = (organization?.workspace_config ?? {}) as { version?: number; template?: string; modules?: string[]; ai_suggestions?: { profile_draft?: { tagline?: string; description?: string; card_fields?: { key: string; label: string; type: string; visible: boolean }[]; suggested_buttons?: { kind: string; label: string; enabled: boolean }[] } } };
  const modules = Array.isArray(config.modules) ? config.modules : [];
  if (config.version && !modules.includes("digital_card")) notFound();
  const catalogEnabled = !config.version || modules.some((module) => ["product_catalog", "service_catalog"].includes(module));
  const catalogLabel = config.template === "service" ? "Prestations" : "Produits";
  const { data: catalogItems } = catalogEnabled && organizationId
    ? await supabase.from("products").select("id,name,description,price,currency,image_url,is_active")
      .eq("organization_id", organizationId).order("created_at", { ascending: false })
    : { data: [] as CatalogItem[] };
  const profileDraft = config.ai_suggestions?.profile_draft;
  const { data: designRequest } = await supabase.from("card_design_requests").select("status,template_id").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
  const totalViews = (events ?? []).filter((event) => ["view", "qr_scan", "nfc_scan"].includes(event.event_type)).length;
  const totalNfc = (events ?? []).filter((event) => event.event_type === "nfc_scan").length;
  const totalQr = (events ?? []).filter((event) => event.event_type === "qr_scan").length;
  const totalSaves = (events ?? []).filter((event) => event.event_type === "contact_save").length;
  const totalClicks = (events ?? []).filter((event) => event.event_type === "click").length;
  const publicSiteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://touchcard-three.vercel.app").replace(/\/$/, "");

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-sm font-bold uppercase tracking-wider text-indigo-600">Espace client · {organization?.name ?? "TouchCard"}</p><h1 className="mt-2 text-3xl font-black text-slate-950">Mes cartes NFC</h1><p className="mt-2 text-sm text-slate-500">Gérez vos profils, vos boutons et les informations visibles après un scan.</p></div>
        <Link href="/dashboard" className="text-sm font-semibold text-indigo-700">← Tableau de bord</Link>
      </header>

      <CardTemplateGallery cardType={String(config.template ?? "contact")} modules={modules} existingStatus={designRequest?.status ?? null} existingTemplate={designRequest?.template_id ?? null} />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[["Visites & scans", totalViews], ["Scans NFC", totalNfc], ["Contacts enregistrés", totalSaves], ["Clics sur les boutons", totalClicks]].map(([label, value]) => <article key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">{label}</p><p className="mt-3 text-3xl font-black text-slate-950">{value}</p><p className="mt-1 text-xs text-slate-400">Événements réels enregistrés</p></article>)}
      </section>

      {profileDraft?.tagline && <aside className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4 text-sm text-indigo-950"><strong>Suggestion IA approuvée :</strong> {profileDraft.tagline}{profileDraft.description ? " — " + profileDraft.description : ""}{profileDraft.suggested_buttons?.length ? <p className="mt-2 text-xs">Boutons recommandés à configurer : {profileDraft.suggested_buttons.filter((button) => button.enabled).map((button) => button.label).join(" · ")}</p> : null}</aside>}

      {catalogEnabled && <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-wider text-indigo-600">Catalogue client</p><h2 className="mt-1 text-xl font-black text-slate-950">{catalogLabel}</h2><p className="mt-1 text-sm text-slate-500">Ajoutez les éléments qui seront visibles sur votre page publique. Les prix sont exprimés en MAD.</p></div><span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">{catalogItems?.length ?? 0} élément(s)</span></div>
        <PopupDialog title={catalogLabel === "Prestations" ? "Ajouter une prestation" : "Ajouter un produit"} description="Ajoutez les informations et la photo qui seront visibles sur votre page publique." triggerLabel={catalogLabel === "Prestations" ? "+ Ajouter une prestation" : "+ Ajouter un produit"} triggerClassName="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700"><form action={createCatalogItem} className="grid gap-3 sm:grid-cols-2">
          <input name="name" required maxLength={120} placeholder={catalogLabel === "Prestations" ? "Nom de la prestation" : "Nom du produit"} className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm"/>
          <input name="price" required type="number" min="0" max="100000000" step="0.01" placeholder="Prix en MAD" className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm"/>
          <textarea name="description" maxLength={1200} rows={2} placeholder="Description (facultatif)" className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm sm:col-span-2"/>
          <div className="sm:col-span-2"><MediaImagePicker organizationId={organizationId!} name="image_url" label="Photo du produit / couverture"/></div>
          <button className="btn-primary">Ajouter au catalogue</button>
        </form></PopupDialog>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {(catalogItems ?? []).map((item) => <article key={item.id} className="flex items-start gap-3 rounded-xl border border-slate-100 p-3">
            {item.image_url ? <img src={item.image_url} alt="" className="h-16 w-16 rounded-lg object-cover"/> : <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-slate-100 text-xl">▧</div>}
            <div className="min-w-0 flex-1"><p className="font-bold text-slate-900">{item.name}</p><p className="mt-1 line-clamp-2 text-xs text-slate-500">{item.description || "Sans description"}</p><p className="mt-2 text-sm font-black text-indigo-700">{Number(item.price).toLocaleString("fr-MA")} {item.currency}</p><div className="mt-2"><PopupDialog title="Modifier le produit" description="Modifiez les informations et remplacez sa photo de couverture." triggerLabel="Modifier" triggerClassName="text-xs font-bold text-indigo-700 hover:underline"><form action={updateCatalogItem} className="space-y-3"><input type="hidden" name="id" value={item.id}/><label className="block text-xs font-semibold text-slate-600">Nom<input name="name" required defaultValue={item.name} className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm"/></label><label className="block text-xs font-semibold text-slate-600">Prix en MAD<input name="price" required type="number" min="0" step="0.01" defaultValue={item.price} className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm"/></label><label className="block text-xs font-semibold text-slate-600">Description<textarea name="description" rows={3} defaultValue={item.description || ""} className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm"/></label><MediaImagePicker organizationId={organizationId!} name="image_url" initialUrl={item.image_url} label="Photo / couverture du produit"/><button className="btn-primary">Enregistrer</button></form></PopupDialog></div></div>
            <form action={deleteCatalogItem}><input type="hidden" name="id" value={item.id}/><button className="text-xs font-bold text-rose-600">Supprimer</button></form>
          </article>)}
          {!(catalogItems?.length) && <p className="rounded-xl border border-dashed border-slate-200 p-5 text-sm text-slate-500 md:col-span-2">Votre catalogue est vide. Ajoutez votre premier élément ci-dessus.</p>}
        </div>
      </section>}

      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div><h2 className="text-lg font-bold text-slate-950">Mes cartes NFC</h2><p className="mt-1 text-sm text-slate-500">Créez une carte supplémentaire si votre formule l'autorise.</p></div>
        <PopupDialog title="Créer une carte NFC" description="Configurez les informations principales de votre nouvelle carte." triggerLabel="+ Créer une carte"><form action={createClientCard} className="grid gap-3 sm:grid-cols-2">
          <input name="full_name" required placeholder="Nom affiché sur la carte" className="rounded-xl border border-slate-200 px-3 py-3 text-sm" />
          <input name="job_title" placeholder="Fonction / activité" className="rounded-xl border border-slate-200 px-3 py-3 text-sm" />
          <input name="company_name" placeholder="Entreprise" className="rounded-xl border border-slate-200 px-3 py-3 text-sm" />
          <button className="btn-primary sm:col-span-2">Créer ma carte NFC</button>
        </form></PopupDialog>
      </section>

      <div className="space-y-6">
        {(cards ?? []).map((card) => {
          const cardLinks = (links ?? []).filter((link) => link.card_id === card.id);
          const cardEvents = (events ?? []).filter((event) => event.card_id === card.id);
          const fields = (card.public_fields ?? {}) as Record<string, any>;
          const settings = card.public_settings ?? {};
          const initialCustomFields: EditableCardField[] = Array.isArray(fields.custom_fields) && fields.custom_fields.length
            ? fields.custom_fields
            : (profileDraft?.card_fields ?? []).map((field) => ({ key: field.key, label: field.label, value: "", visible: field.visible }));
          const publicUrl = "/p/" + card.slug;
          return <article key={card.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
              <div><h2 className="text-xl font-black text-slate-950">{card.full_name}</h2><p className="mt-1 text-xs text-slate-500">{card.company_name || "Carte professionnelle"} · {card.slug}</p></div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={"rounded-full px-3 py-1.5 text-xs font-bold " + (card.is_published ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700")}>{card.is_published ? "Publiée" : "Brouillon"}</span>
                <Link href={publicUrl} target="_blank" className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">Voir la carte</Link>
                <form action={toggleClientCardPublication}><input type="hidden" name="card_id" value={card.id}/><input type="hidden" name="publish" value={String(!card.is_published)}/><button className="btn-primary">{card.is_published ? "Dépublier" : "Publier"}</button></form>
              </div>
            </div>
            <div className="grid gap-6 p-5 xl:grid-cols-[1.15fr_.85fr]">
              <PopupDialog title="Modifier ma carte NFC" description="Modifiez les coordonnées, la photo et les rubriques affichées après un scan." triggerLabel="Modifier ma carte">
              <form action={saveClientCardProfile} className="space-y-3">
                <input type="hidden" name="card_id" value={card.id}/>
                <h3 className="font-bold text-slate-900">Informations de la carte</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-xs font-semibold text-slate-600">Nom affiché<input name="full_name" required defaultValue={card.full_name} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"/></label>
                  <label className="text-xs font-semibold text-slate-600">Fonction<input name="job_title" defaultValue={card.job_title ?? ""} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"/></label>
                  <label className="text-xs font-semibold text-slate-600">Entreprise<input name="company_name" defaultValue={card.company_name ?? ""} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"/></label>
                  <div className="sm:col-span-2"><MediaImagePicker organizationId={organizationId!} name="avatar_url" initialUrl={card.avatar_url} label="Photo de profil de la carte"/></div>
                  <label className="text-xs font-semibold text-slate-600 sm:col-span-2">Présentation<textarea name="bio" defaultValue={card.bio ?? ""} rows={3} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"/></label>
                  <label className="text-xs font-semibold text-slate-600">Téléphone<input name="phone" defaultValue={card.phone ?? ""} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"/></label>
                  <label className="text-xs font-semibold text-slate-600">E-mail<input name="email" type="email" defaultValue={card.email ?? ""} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"/></label>
                  <label className="text-xs font-semibold text-slate-600 sm:col-span-2">Site web<input name="website" defaultValue={card.website ?? ""} placeholder="https://..." className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"/></label>
                  <label className="text-xs font-semibold text-slate-600 sm:col-span-2">Phrase d'accroche<input name="tagline" defaultValue={fields.tagline ?? ""} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"/></label>
                  <label className="text-xs font-semibold text-slate-600">Ville / adresse<input name="location" defaultValue={fields.location ?? ""} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"/></label>
                  <label className="text-xs font-semibold text-slate-600">Horaires<input name="hours" defaultValue={fields.hours ?? ""} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"/></label>
                  <label className="text-xs font-semibold text-slate-600 sm:col-span-2">WhatsApp Business (numéro)<input name="whatsapp" defaultValue={fields.whatsapp ?? ""} placeholder="+212..." className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"/></label>
                  {config.template === "google-review" && <label className="text-xs font-semibold text-slate-600 sm:col-span-2">Lien officiel Google Avis<input name="google_review_url" type="url" defaultValue={fields.google_review_url ?? ""} placeholder="https://g.page/r/..." className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"/></label>}
                  <CustomCardFieldsEditor initialFields={initialCustomFields}/>
                  <div className="flex flex-wrap gap-4 rounded-xl bg-slate-50 p-3 sm:col-span-2"><span className="w-full text-xs font-bold text-slate-700">Champs visibles sur la page publique</span><label className="flex items-center gap-2 text-xs"><input type="checkbox" name="show_phone" defaultChecked={settings.show_phone !== false}/> Téléphone</label><label className="flex items-center gap-2 text-xs"><input type="checkbox" name="show_email" defaultChecked={settings.show_email !== false}/> E-mail</label><label className="flex items-center gap-2 text-xs"><input type="checkbox" name="show_website" defaultChecked={settings.show_website !== false}/> Site web</label></div>
                </div>
                <button className="btn-primary">Enregistrer les modifications</button>
              </form>
              </PopupDialog>

              <div className="space-y-5">
                <div><h3 className="font-bold text-slate-900">Liens et boutons publics</h3><p className="mt-1 text-xs text-slate-500">WhatsApp, Telegram, réseaux sociaux, boutique et autres liens.</p>
                  <div className="mt-3 space-y-2">{cardLinks.map((link) => <div key={link.id} className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 p-3"><div className="min-w-0"><p className="text-sm font-semibold text-slate-800">{link.label} <span className="text-xs font-normal text-slate-400">· {link.kind}</span></p><p className="truncate text-xs text-slate-500">{link.url}</p></div><form action={deleteClientCardLink}><input type="hidden" name="card_id" value={card.id}/><input type="hidden" name="link_id" value={link.id}/><button className="text-xs font-bold text-rose-600">Supprimer</button></form></div>)}</div>
                  <PopupDialog title="Ajouter un bouton à ma carte" description="Ajoutez un lien WhatsApp, réseau social, site web ou boutique." triggerLabel="+ Ajouter un bouton"><form action={addClientCardLink} className="space-y-2 rounded-xl bg-slate-50 p-3">
                    <input type="hidden" name="card_id" value={card.id}/>
                    <input name="label" required placeholder="Nom du bouton (ex. WhatsApp Business)" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"/>
                    <input name="url" type="url" required placeholder="https://..." className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"/>
                    <div className="flex gap-2"><select name="kind" className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"><option value="whatsapp">WhatsApp</option><option value="telegram">Telegram</option><option value="instagram">Instagram</option><option value="facebook">Facebook</option><option value="linkedin">LinkedIn</option><option value="store">Boutique / Store</option><option value="website">Site web</option><option value="other">Autre</option></select><button className="btn-primary">Ajouter</button></div>
                  </form></PopupDialog>
                </div>
                <div className="rounded-2xl bg-slate-950 p-4 text-white"><p className="text-xs font-bold uppercase tracking-wider text-indigo-300">Statistiques de cette carte</p><div className="mt-3 grid grid-cols-2 gap-3"><div><p className="text-2xl font-black">{cardEvents.filter(e => ["view","qr_scan","nfc_scan"].includes(e.event_type)).length}</p><p className="text-xs text-slate-300">Visites</p></div><div><p className="text-2xl font-black">{cardEvents.filter(e => e.event_type === "nfc_scan").length}</p><p className="text-xs text-slate-300">Scans NFC</p></div></div><p className="mt-2 text-xs text-slate-400">Les statistiques commencent à la publication et à l'enregistrement des événements.</p><div className="mt-4 border-t border-white/10 pt-3"><p className="text-xs font-bold text-white">URL à encoder sur la puce NFC</p><p className="mt-1 break-all text-[11px] text-slate-300">${publicSiteUrl}/p/${card.slug}?source=nfc</p><p className="mt-3 text-xs font-bold text-white">QR code de partage</p><img alt="QR code de la carte" loading="lazy" className="mt-2 h-28 w-28 rounded-lg bg-white p-1" src={"https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=" + encodeURIComponent(publicSiteUrl + "/p/" + card.slug + "?source=qr")}/></div></div>
                <p className="text-xs text-slate-400">Modules autorisés : {modules.join(" · ") || "Configuration standard"}</p>
              </div>
            </div>
          </article>;
        })}
      </div>
    </div>
  );
}
