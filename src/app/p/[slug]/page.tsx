import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { I18nText } from "@/i18n/provider";
import { PublicCardTracker, TrackedPublicLink } from "@/components/cards/public-card-tracker";
import { PublicWorkspaceRequestForms } from "@/components/cards/public-workspace-request-forms";

type PublicFields = { tagline?: string; location?: string; hours?: string; whatsapp?: string; custom_fields?: { key: string; label: string; value: string; visible: boolean }[] };
type PublicLink = { id: string; label: string; url: string; kind: string };
type PublicCatalogItem = { id: string; name: string; description: string | null; price: number; currency: string; image_url: string | null };

export default function PublicCardPage({
  params, searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ source?: string }>;
}) {
  return <Suspense fallback={<PublicCardLoading />}><PublicCardContent params={params} searchParams={searchParams} /></Suspense>;
}

async function PublicCardContent({
  params, searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ source?: string }>;
}) {
  await connection();
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const supabase = await createClient();
  const { data: card } = await supabase.from("cards")
    .select("id,organization_id,slug,full_name,job_title,company_name,bio,email,phone,website,avatar_url,cover_url,theme,public_fields,public_settings")
    .eq("slug", slug).eq("is_published", true).maybeSingle();
  if (!card) notFound();

  const { data: links } = await supabase.from("card_links")
    .select("id,label,url,kind").eq("card_id", card.id).order("position");
  const theme = (card.theme ?? {}) as Record<string, unknown>;
  const template = String(theme.template ?? "contact");
  const accent = typeof theme.accent === "string" && /^#[0-9a-fA-F]{6}$/.test(theme.accent) ? theme.accent : "#4f46e5";
  const { data: organization } = await supabase.from("organizations").select("workspace_config")
    .eq("id", card.organization_id).maybeSingle();
  const workspaceConfig = (organization?.workspace_config ?? {}) as {
    version?: number;
    modules?: string[];
    ai_suggestions?: { profile_draft?: { categories?: string[]; suggested_buttons?: { kind: string; label: string; enabled: boolean }[] } | null } | null;
    original_client_choices?: { project_needs?: { selected?: string[]; management_needs?: string[]; reservation_mode?: string | null; reservation_channels?: string[] } | null; activity_sector?: string; city?: string };
  };
  const modules = Array.isArray(workspaceConfig.modules) ? workspaceConfig.modules : [];
  const profileDraft = workspaceConfig.ai_suggestions?.profile_draft;
  const originalNeeds = workspaceConfig.original_client_choices?.project_needs;
  const selectedServices = Array.isArray(originalNeeds?.selected)
    ? originalNeeds.selected.map((value) => String(value).trim()).filter(Boolean).slice(0, 12)
    : [];
  const profileCategories = Array.isArray(profileDraft?.categories)
    ? profileDraft.categories.map((value) => String(value).trim()).filter(Boolean).slice(0, 8)
    : [];
  const showCatalog = ["service", "e-business"].includes(template)
    && (!workspaceConfig.version || modules.some((module) => ["service_catalog", "product_catalog"].includes(module)));
  const allowOrders = modules.includes("orders");
  const allowBookings = modules.includes("bookings");
  const allowQuotes = modules.includes("quote_requests");
  const { data: catalogItems } = showCatalog
    ? await supabase.from("products").select("id,name,description,price,currency,image_url")
      .eq("organization_id", card.organization_id).eq("is_active", true).order("created_at", { ascending: false }).limit(24)
    : { data: [] as PublicCatalogItem[] };
  const fields = (card.public_fields ?? {}) as PublicFields & { google_review_url?: string };
  const settings = (card.public_settings ?? {}) as Record<string, boolean>;
  const source = query.source === "nfc" ? "nfc_scan" : query.source === "qr" ? "qr_scan" : "view";
  const whatsapp = String(fields.whatsapp ?? "").replace(/[^+\d]/g, "").replace(/^\+/, "");
  const vcardUrl = "/api/cards/" + encodeURIComponent(slug) + "/vcard";
  const organizationCity = workspaceConfig.original_client_choices?.city?.trim() ?? "";
  const mapLocation = fields.location?.trim() || organizationCity || [card.company_name, "Maroc"].filter(Boolean).join(", ");
  const mapEmbedUrl = "https://www.google.com/maps?q=" + encodeURIComponent(mapLocation) + "&output=embed";
  const mapDirectionsUrl = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(mapLocation);

  return (
    <main className="min-h-screen bg-[#f4f6fb] px-3 py-6 sm:px-6 sm:py-10">
      <PublicCardTracker cardId={card.id} eventType={source} />
      <article className="mx-auto w-full max-w-5xl overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.10)]">
        <div className="relative h-44 overflow-hidden sm:h-64" style={{ background: `linear-gradient(120deg, #0f172a, ${accent})` }}>
          {card.cover_url && <img src={card.cover_url} alt="" className="h-full w-full object-cover" />}
        </div>
        <div className="-mt-14 px-5 pb-8 sm:-mt-20 sm:px-10 sm:pb-12">
          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-[1.8rem] border-4 border-white bg-indigo-50 text-3xl font-bold text-indigo-700 shadow-xl sm:h-36 sm:w-36">
            {card.avatar_url ? <img src={card.avatar_url} alt={card.full_name} className="h-full w-full object-cover" /> : card.full_name.slice(0, 1).toUpperCase()}
          </div>
          <h1 className="mt-5 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">{card.full_name}</h1>
          {card.job_title && <p className="mt-1 font-semibold" style={{ color: accent }}>{card.job_title}</p>}
          {card.company_name && <p className="mt-1 text-sm text-slate-500">{card.company_name}</p>}
          {fields.tagline && <p className="mt-4 text-sm font-semibold text-slate-700">{fields.tagline}</p>}
          {card.bio && <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">{card.bio}</p>}
          {(profileCategories.length > 0 || selectedServices.length > 0) && <section className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-500">{template === "service" ? "Nos domaines de service" : template === "e-business" ? "Univers & spécialités" : template === "google-review" ? "Notre activité" : "Expertises"}</h2>
            {profileCategories.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{profileCategories.map((category) => <span key={category} className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-700 ring-1 ring-slate-200">{category}</span>)}</div>}
            {selectedServices.length > 0 && <div className="mt-3 space-y-2">{selectedServices.map((service) => <div key={service} className="flex items-start gap-2 text-sm text-slate-700"><span className="mt-0.5 font-black" style={{ color: accent }}>✓</span><span>{service}</span></div>)}</div>}
          </section>}
          {(fields.location || fields.hours) && <div className="mt-4 space-y-1 text-xs text-slate-500">{fields.location && <p>📍 {fields.location}</p>}{fields.hours && <p>🕒 {fields.hours}</p>}</div>}
          {fields.custom_fields?.some((field) => field.visible && field.label && field.value) && <section className="mt-5 space-y-2">{fields.custom_fields.filter((field) => field.visible && field.label && field.value).map((field) => <div key={field.key} className="rounded-xl bg-slate-50 px-4 py-3"><p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{field.label}</p><p className="mt-1 whitespace-pre-line text-sm font-medium text-slate-800">{field.value}</p></div>)}</section>}

          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:max-w-3xl">
            <TrackedPublicLink cardId={card.id} href={vcardUrl} eventType="contact_save" className="block rounded-xl px-4 py-3 text-center text-sm font-bold text-white" style={{ backgroundColor: accent }}>Enregistrer le contact</TrackedPublicLink>
            {settings.show_phone !== false && card.phone && <TrackedPublicLink cardId={card.id} href={"tel:" + card.phone} className="btn-secondary text-center">Appeler</TrackedPublicLink>}
            {settings.show_email !== false && card.email && <TrackedPublicLink cardId={card.id} href={"mailto:" + card.email} className="btn-secondary text-center">Envoyer un e-mail</TrackedPublicLink>}
            {settings.show_website !== false && card.website && <TrackedPublicLink cardId={card.id} href={card.website} className="btn-secondary text-center">Site web</TrackedPublicLink>}
            {whatsapp && <TrackedPublicLink cardId={card.id} href={"https://wa.me/" + whatsapp} className="flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white">WhatsApp Business</TrackedPublicLink>}
            {template === "google-review" && <div className="rounded-2xl bg-emerald-50 p-4 text-center"><p className="text-sm font-bold text-emerald-950">Votre avis compte pour nous</p><p className="mt-1 text-2xl tracking-[.2em] text-amber-500" aria-label="5 étoiles">★★★★★</p>{fields.google_review_url ? <TrackedPublicLink cardId={card.id} href={fields.google_review_url} className="mt-3 flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white">Laisser un avis Google</TrackedPublicLink> : <p className="mt-2 text-xs text-emerald-800">Le lien Google sera ajouté prochainement.</p>}</div>}
          </div>

          {showCatalog && <section className="mt-8 border-t border-slate-100 pt-6">
            <h2 className="mb-3 text-sm font-black uppercase tracking-wider text-slate-400">{template === "service" ? "Prestations" : "Catalogue"}</h2>
            <div className="grid gap-3">
              {(catalogItems ?? []).map((item) => <article key={item.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                {item.image_url && <img src={item.image_url} alt={item.name} loading="lazy" className="h-36 w-full object-cover"/>}
                <div className="p-4"><h3 className="font-bold text-slate-900">{item.name}</h3>{item.description && <p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p>}<p className="mt-3 text-sm font-black text-indigo-700">{Number(item.price).toLocaleString("fr-MA")} {item.currency}</p></div>
              </article>)}
              {!(catalogItems?.length) && <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">{template === "service" ? "Les prestations seront bientôt disponibles." : "Le catalogue sera bientôt disponible."}</p>}
            </div>
          </section>}

          {(allowOrders || allowBookings || allowQuotes) && <PublicWorkspaceRequestForms
            cardSlug={card.slug}
            products={(catalogItems ?? []).map((item) => ({ id: item.id, name: item.name, price: Number(item.price), currency: item.currency }))}
            allowOrders={allowOrders}
            allowBookings={allowBookings}
            allowQuotes={allowQuotes}
          />}

          {links && links.length > 0 && <section className="mt-8 border-t border-slate-100 pt-7"><div className="flex flex-wrap items-end justify-between gap-2"><div><p className="text-xs font-black uppercase tracking-[.18em] text-indigo-600">Présence digitale</p><h2 className="mt-1 text-xl font-black text-slate-950">Réseaux sociaux & liens</h2></div><p className="text-xs text-slate-400">Retrouvez-nous sur nos plateformes</p></div><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{links.map((link: PublicLink) => <TrackedPublicLink key={link.id} cardId={card.id} linkId={link.id} href={link.url} className="group flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-semibold text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs font-black uppercase text-slate-700">{({instagram:"IG",facebook:"f",linkedin:"in",tiktok:"♪",youtube:"▶",x:"X",pinterest:"P",whatsapp:"WA",telegram:"TG",calendly:"↗",store:"SHOP",website:"WEB"} as Record<string,string>)[link.kind] ?? "↗"}</span><span className="min-w-0 flex-1 truncate">{link.label}</span><span className="text-indigo-600 transition group-hover:translate-x-0.5">↗</span></TrackedPublicLink>)}</div></section>}

          <section className="mt-9 border-t border-slate-100 pt-8" aria-label="Localisation">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[.18em]" style={{ color: accent }}>Nous trouver</p>
                <h2 className="mt-1 text-xl font-black text-slate-950 sm:text-2xl">Notre localisation</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{fields.location?.trim() || organizationCity || "Localisation de l’entreprise"}</p>
              </div>
              <a href={mapDirectionsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:opacity-90" style={{ backgroundColor: accent }}>Itinéraire Google Maps ↗</a>
            </div>
            <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm">
              <iframe
                title={"Localisation de " + (card.company_name || card.full_name)}
                src={mapEmbedUrl}
                className="h-64 w-full sm:h-80"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          </section>

          <p className="mt-8 text-center text-xs text-slate-400"><I18nText message="powered" /></p>
        </div>
      </article>
    </main>
  );
}

function PublicCardLoading() {
  return <main className="flex min-h-screen items-center justify-center bg-slate-100 px-5 py-12"><div aria-label="Chargement de la carte digitale" className="h-[460px] w-full max-w-md animate-pulse overflow-hidden rounded-[2rem] bg-white shadow-xl"><div className="h-32 bg-indigo-100" /><div className="px-7 pt-5"><div className="h-28 w-28 rounded-3xl bg-slate-100" /><div className="mt-5 h-7 w-2/3 rounded bg-slate-100" /><div className="mt-3 h-4 w-1/2 rounded bg-slate-100" /><div className="mt-8 h-12 rounded-xl bg-slate-100" /><div className="mt-3 h-12 rounded-xl bg-slate-100" /></div></div></main>;
}
