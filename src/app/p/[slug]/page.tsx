import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { I18nText } from "@/i18n/provider";
import { PublicCardTracker, TrackedPublicLink } from "@/components/cards/public-card-tracker";
import { PublicWorkspaceRequestForms } from "@/components/cards/public-workspace-request-forms";

type PublicFields = { nfc_display_code?: string; tagline?: string; location?: string; hours?: string; whatsapp?: string; company_phone?: string; company_email?: string; company_address?: string; industry?: string; custom_fields?: { key: string; label: string; value: string; visible: boolean }[] };
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
  const allowedTextColors = ["#111827", "#1F2937", "#334155", "#1E3A8A", "#312E81", "#14532D", "#7F1D1D", "#7C2D12"];
  const textColor = typeof theme.text_color === "string" && allowedTextColors.includes(theme.text_color.toUpperCase()) ? theme.text_color : "#111827";
  const { data: organization } = await supabase.from("organizations").select("workspace_config")
    .eq("id", card.organization_id).maybeSingle();
  const workspaceConfig = (organization?.workspace_config ?? {}) as {
    version?: number;
    modules?: string[];
    ai_suggestions?: { profile_draft?: { categories?: string[]; suggested_buttons?: { kind: string; label: string; enabled: boolean }[] } | null } | null;
    original_client_choices?: { project_needs?: { selected?: string[]; management_needs?: string[]; reservation_mode?: string | null; reservation_channels?: string[] } | null; activity_sector?: string; city?: string };
  };
  const modules = Array.isArray(workspaceConfig.modules) ? workspaceConfig.modules : [];
  const activitySector = String(workspaceConfig.original_client_choices?.activity_sector ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const selectedNeed = (workspaceConfig.original_client_choices?.project_needs?.selected ?? []).join(" ").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const isEcommerce = template === "e-business" && (
    /e.?commerce|commerce en ligne|boutique en ligne|vente en ligne/.test(activitySector)
    || /boutique en ligne|vente en ligne|e.?commerce|commerce en ligne|catalogue de produits|commande de produits/.test(selectedNeed)
  );
  const isTraining = /formation|centre de formation|ecole|enseignement|coaching|cours/.test(activitySector);
  const isHealth = /sante|medical|medecin|dentiste|clinique|cabinet medical|kinesitherapie|bien.?etre/.test(activitySector);
  const isHospitality = /hotel|riad|maison d.?hotes|hebergement|residence touristique|auberge/.test(activitySector);
  const isRealEstate = /immobilier|agence immobiliere|promotion immobiliere|location immobiliere/.test(activitySector);
  const supportsBusinessCatalog = ["service", "e-business"].includes(template);
  const isBeauty = supportsBusinessCatalog && /beaute|cosmetique?s?|cosmetics?|esthetique|spa|hammam|salon de coiffure|coiffure|onglerie|maquillage|institut de beaute|massage|barber|barbier|barbershop/.test(activitySector + " " + selectedNeed);
  const isBarber = /barber|barbier|barbershop/.test(activitySector + " " + selectedNeed);
  const isRestaurant = supportsBusinessCatalog && /restaurant|restauration|cafe|coffee shop|snack|traiteur|pizzeria|boulangerie|patisserie/.test(activitySector + " " + selectedNeed);
  const hasRoomCatalog = modules.includes("room_catalog");
  const profileDraft = workspaceConfig.ai_suggestions?.profile_draft;
  const originalNeeds = workspaceConfig.original_client_choices?.project_needs;
  const selectedServices = Array.isArray(originalNeeds?.selected)
    ? originalNeeds.selected.map((value) => String(value).trim()).filter(Boolean).slice(0, 12)
    : [];
  const profileCategories = Array.isArray(profileDraft?.categories)
    ? profileDraft.categories.map((value) => String(value).trim()).filter(Boolean).slice(0, 8)
    : [];
  const showCatalog = supportsBusinessCatalog
    && (["service", "e-business"].includes(template) || isBeauty || isRestaurant || isRealEstate)
    && (!workspaceConfig.version || modules.some((module) => module === "service_catalog" || module === "room_catalog" || (module === "product_catalog" && isEcommerce)) || isBeauty || isRestaurant || isRealEstate);
  const visibilitySettings = (card.public_settings ?? {}) as Record<string, boolean>;
  const allowOrders = template === "e-business" && isEcommerce && modules.includes("orders") && visibilitySettings.show_orders !== false;
  const allowBookings = template !== "contact" && (modules.includes("bookings") || isBeauty) && visibilitySettings.show_bookings !== false;
  const allowQuotes = template !== "contact" && modules.includes("quote_requests") && visibilitySettings.show_quotes !== false;
  const { data: catalogItems } = showCatalog
    ? await supabase.from("products").select("id,name,description,price,currency,image_url")
      .eq("organization_id", card.organization_id).eq("is_active", true).order("created_at", { ascending: false }).limit(24)
    : { data: [] as PublicCatalogItem[] };
  const { data: catalogDocument } = showCatalog
    ? await supabase.from("organization_catalog_documents").select("file_url,file_name")
      .eq("organization_id", card.organization_id).maybeSingle()
    : { data: null as { file_url: string; file_name: string } | null };
  const fields = (card.public_fields ?? {}) as PublicFields & { google_review_url?: string };
  const settings = (card.public_settings ?? {}) as Record<string, boolean>;
  const source = query.source === "nfc" ? "nfc_scan" : query.source === "qr" ? "qr_scan" : "view";
  const publicSiteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://touchcard-three.vercel.app").replace(/\/$/, "");
  const whatsapp = String(fields.whatsapp ?? "").replace(/[^+\d]/g, "").replace(/^\+/, "");
  const vcardUrl = "/api/cards/" + encodeURIComponent(slug) + "/vcard";
  // The map must point to the exact address entered for this card. Never fall back to a city or company name.
  const exactAddress = (template === "e-business" ? fields.company_address : fields.location)?.trim() ?? "";
  const mapEmbedUrl = exactAddress ? "https://www.google.com/maps?q=" + encodeURIComponent(exactAddress) + "&output=embed" : null;
  const mapDirectionsUrl = exactAddress ? "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(exactAddress) : null;
  const socialLinks = (links ?? []).filter((link) => ["instagram", "facebook", "linkedin", "tiktok", "youtube", "x", "pinterest", "whatsapp", "telegram"].includes(link.kind));
  const videoLinks = (links ?? []).filter((link) => link.kind === "youtube");
  const featuredLinks = (links ?? []).filter((link) => template === "contact" ? ["website", "other"].includes(link.kind) : ["calendly", "store", "website", "other"].includes(link.kind));
  const faqFields = (fields.custom_fields ?? []).filter((field) => field.visible && /^(faq|question|q\d)/i.test(field.key + " " + field.label) && field.label && field.value);
  const galleryFields = template === "contact"
    ? (fields.custom_fields ?? []).filter((field) => field.visible && /^(photo|image|galerie|gallery|portfolio)/i.test(field.label.trim()) && /^https?:\/\//i.test(field.value.trim()))
    : [];
  const infoFields = (fields.custom_fields ?? []).filter((field) => field.visible && !faqFields.includes(field) && !galleryFields.includes(field) && field.label && field.value);

  return (
    <main className="min-h-screen bg-slate-100 px-0 py-0 sm:px-5 sm:py-8">
      <PublicCardTracker cardId={card.id} eventType={source} />
      <article className="mx-auto w-full max-w-[440px] overflow-hidden rounded-none bg-[#111111] p-0 shadow-[0_28px_90px_rgba(0,0,0,.28)] sm:rounded-[2.4rem] sm:p-2">
        <div className="relative h-[230px] overflow-hidden rounded-b-[1.5rem] bg-cover bg-center sm:h-[270px]" style={{ background: `linear-gradient(120deg, #0f172a, ${accent})` }}>
          {card.cover_url && <img src={card.cover_url} alt="" className="h-full w-full object-cover" />}
          <div className="absolute right-3 top-3 flex items-center gap-2 rounded-2xl border border-white/30 bg-black/70 p-2 text-white shadow-xl backdrop-blur-md"><div className="flex min-w-0 items-center gap-2 px-1"><svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M7 7v10M17 7v10M4 9v6M20 9v6M10 4v16M14 4v16"/></svg><span className="min-w-0"><span className="block text-[9px] font-bold uppercase tracking-[.14em] text-white/70">NFC</span><span className="block max-w-[104px] truncate text-[11px] font-black tracking-wide">{fields.nfc_display_code?.trim() || `TC-${card.id.slice(0,8).toUpperCase()}`}</span></span></div><div className="h-14 w-14 shrink-0 rounded-lg bg-white p-1"><img alt="QR code pour ouvrir cette carte" loading="lazy" className="h-full w-full object-contain" src={"https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=" + encodeURIComponent(publicSiteUrl + "/p/" + card.slug + "?source=qr")}/></div></div>
        </div>
        <div className="space-y-2 px-2 pb-3 pt-0 sm:px-0">
          <section className="relative z-10 -mt-12 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
            <div className="grid grid-cols-[1fr_118px] items-stretch gap-3">
              <div className="flex min-w-0 flex-col justify-between py-1">
                <div><h1 className="break-words text-[25px] font-black leading-[1.02] tracking-tight" style={{ color: textColor }}>{card.full_name}</h1>
                  {card.job_title && <p className="mt-3 text-xs font-medium leading-4" style={{ color: textColor }}>{card.job_title}</p>}
                  {template !== "contact" && card.company_name && <p className="mt-1 text-xs font-bold" style={{ color: textColor }}>{card.company_name}</p>}</div>
                {fields.tagline && <p className="mt-3 text-[11px] font-bold leading-4" style={{ color: textColor }}>{fields.tagline}</p>}
              </div>
              <div className="h-[118px] w-[118px] overflow-hidden rounded-xl bg-slate-100">
                {card.avatar_url ? <img src={card.avatar_url} alt={card.full_name} className="h-full w-full object-cover"/> : <div className="flex h-full items-center justify-center text-4xl font-black text-slate-400">{card.full_name.slice(0,1).toUpperCase()}</div>}
              </div>
            </div>
          </section>
          <div className="grid grid-cols-2 gap-2">
            <TrackedPublicLink cardId={card.id} href={vcardUrl} eventType="contact_save" className="flex min-h-14 items-center justify-center gap-2 rounded-[30px] px-3 py-3 text-center text-sm font-extrabold leading-tight text-black shadow-sm transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2" style={{ backgroundColor: accent }}>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/10" aria-hidden="true"><svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/><path d="M19 8v6m-3-3h6"/></svg></span>
              <span>Échanger contact</span>
            </TrackedPublicLink>
            <TrackedPublicLink cardId={card.id} href={vcardUrl} eventType="contact_save" className="flex min-h-14 items-center justify-center gap-2 rounded-[30px] border border-slate-200 bg-white px-3 py-3 text-center text-sm font-extrabold leading-tight text-slate-900 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100" aria-hidden="true"><svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><path d="M6.5 16a2.8 2.8 0 0 1 5 0M16 9v6m-3-3h6"/></svg></span>
              <span>Enregistrer contact</span>
            </TrackedPublicLink>
          </div>
          {settings.show_about !== false && card.bio && (() => { const words = card.bio.trim().split(/\s+/); const shortBio = words.slice(0, 20).join(" "); const isLong = words.length > 20; return <section className="rounded-2xl bg-white p-4"><h2 className="text-base font-bold text-slate-900">À propos</h2><p className="mt-2 whitespace-pre-line text-[13px] leading-[1.7]" style={{ color: textColor }}>{isLong ? shortBio + "…" : card.bio}</p>{isLong && <details className="mt-2"><summary className="w-fit cursor-pointer list-none text-xs font-bold" style={{ color: accent }}>Lire plus <span aria-hidden="true">＋</span></summary><p className="mt-2 whitespace-pre-line text-[13px] leading-[1.7]" style={{ color: textColor }}>{card.bio}</p></details>}{(fields.location || fields.hours) && <div className="mt-3 flex flex-wrap gap-2">{fields.location && <span className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-bold text-slate-700"><span aria-hidden="true">📍</span>{fields.location}</span>}{fields.hours && <span className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-bold text-slate-700"><span aria-hidden="true">◷</span>{fields.hours}</span>}</div>}</section>; })()}
          {galleryFields.length > 0 && <section className="rounded-2xl bg-white p-4"><h2 className="text-base font-bold text-slate-900">Portfolio & galerie</h2><p className="mt-1 text-xs text-slate-500">Quelques photos pour découvrir mon travail.</p><div className="mt-3 grid grid-cols-2 gap-3">{galleryFields.map((field) => <a key={field.key} href={field.value} target="_blank" rel="noopener noreferrer" className="overflow-hidden rounded-xl border border-slate-100 bg-slate-50"><img src={field.value} alt={field.label} loading="lazy" className="h-36 w-full object-cover"/><span className="block truncate px-3 py-2 text-xs font-semibold text-slate-700">{field.label}</span></a>)}</div></section>}
          {settings.show_contact !== false && (card.phone || card.email || card.website || whatsapp) && <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-base font-extrabold text-slate-950">Restons en contact</h2>
            <p className="mt-1 text-xs text-slate-500">Retrouvez facilement les coordonnées de {template === "contact" ? card.full_name : card.company_name || card.full_name}.</p>
            <div className="mt-4 grid grid-cols-1 gap-2">
              {settings.show_phone !== false && card.phone && <TrackedPublicLink cardId={card.id} href={"tel:" + card.phone} className="flex min-h-[68px] items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-slate-300 hover:bg-slate-50"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg font-bold text-white" style={{ backgroundColor: accent }} aria-hidden="true">☎</span><span className="min-w-0 flex-1"><span className="block text-xs font-semibold text-slate-500">Téléphone</span><span className="block break-all text-sm font-bold text-slate-950">{card.phone}</span></span><span className="text-xs font-bold" style={{ color: accent }}>Appeler ↗</span></TrackedPublicLink>}
              {settings.show_email !== false && card.email && <TrackedPublicLink cardId={card.id} href={"mailto:" + card.email} className="flex min-h-[68px] items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-slate-300 hover:bg-slate-50"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg font-bold text-white" style={{ backgroundColor: accent }} aria-hidden="true">✉</span><span className="min-w-0 flex-1"><span className="block text-xs font-semibold text-slate-500">E-mail</span><span className="block break-all text-sm font-bold text-slate-950">{card.email}</span></span><span className="text-xs font-bold" style={{ color: accent }}>Écrire ↗</span></TrackedPublicLink>}
              {settings.show_website !== false && card.website && <TrackedPublicLink cardId={card.id} href={card.website} className="flex min-h-[68px] items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-slate-300 hover:bg-slate-50"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg font-bold text-white" style={{ backgroundColor: accent }} aria-hidden="true">◎</span><span className="min-w-0 flex-1"><span className="block text-xs font-semibold text-slate-500">Site web</span><span className="block break-all text-sm font-bold text-slate-950">{card.website}</span></span><span className="text-xs font-bold" style={{ color: accent }}>Visiter ↗</span></TrackedPublicLink>}
              {whatsapp && <TrackedPublicLink cardId={card.id} href={"https://wa.me/" + whatsapp} className="flex min-h-[68px] items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-slate-300 hover:bg-slate-50"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#25D366] text-white" aria-hidden="true"><svg viewBox="0 0 32 32" className="h-7 w-7" fill="currentColor"><path d="M16.02 3.2A12.7 12.7 0 0 0 5.1 22.37L3.4 28.6l6.38-1.67A12.7 12.7 0 1 0 16.02 3.2Zm0 23.1c-1.94 0-3.84-.52-5.5-1.5l-.4-.24-3.78.99 1.01-3.68-.26-.42a10.45 10.45 0 1 1 8.93 4.85Zm5.74-7.83c-.31-.16-1.83-.9-2.11-1-.28-.1-.49-.16-.7.16-.21.31-.8 1-.98 1.2-.18.2-.36.23-.67.08-.31-.16-1.3-.48-2.47-1.53-.91-.81-1.53-1.82-1.71-2.13-.18-.31-.02-.48.14-.64.14-.14.31-.36.47-.54.16-.18.21-.31.31-.52.1-.21.05-.39-.03-.55-.08-.16-.7-1.69-.96-2.31-.25-.6-.51-.52-.7-.53h-.6c-.21 0-.55.08-.83.39-.28.31-1.09 1.07-1.09 2.6s1.12 3.02 1.27 3.23c.16.21 2.2 3.36 5.33 4.71.75.32 1.33.52 1.78.66.75.24 1.43.2 1.97.12.6-.09 1.83-.75 2.09-1.48.26-.73.26-1.35.18-1.48-.08-.13-.28-.21-.6-.37Z"/></svg></span><span className="min-w-0 flex-1"><span className="block text-xs font-semibold text-slate-500">WhatsApp Business</span><span className="block break-all text-sm font-bold text-slate-950">{fields.whatsapp}</span></span><span className="text-xs font-bold" style={{ color: accent }}>Écrire ↗</span></TrackedPublicLink>}
            </div>
          </section>}
          {settings.show_company_info !== false && template === "e-business" && (fields.company_phone || fields.company_email || fields.company_address || fields.industry) && <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-base font-extrabold text-slate-950">Company Info</h2>
            <div className="mt-3 space-y-2">
              {fields.company_phone && <TrackedPublicLink cardId={card.id} href={"tel:" + fields.company_phone} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-lg" aria-hidden="true">☎</span><span className="min-w-0"><span className="block text-[10px] font-bold uppercase tracking-wide text-slate-400">Téléphone de l’entreprise</span><span className="break-all text-sm font-bold text-slate-900">{fields.company_phone}</span></span></TrackedPublicLink>}
              {fields.company_email && <TrackedPublicLink cardId={card.id} href={"mailto:" + fields.company_email} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-lg" aria-hidden="true">✉</span><span className="min-w-0"><span className="block text-[10px] font-bold uppercase tracking-wide text-slate-400">E-mail de l’entreprise</span><span className="break-all text-sm font-bold text-slate-900">{fields.company_email}</span></span></TrackedPublicLink>}
              {fields.company_address && <div className="flex items-center gap-3 rounded-xl border border-slate-100 p-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-lg" aria-hidden="true">📍</span><span className="min-w-0"><span className="block text-[10px] font-bold uppercase tracking-wide text-slate-400">Adresse de l’entreprise</span><span className="text-sm font-bold text-slate-900">{fields.company_address}</span></span></div>}
              {fields.industry && <div className="flex items-center gap-3 rounded-xl border border-slate-100 p-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-lg" aria-hidden="true">🏢</span><span className="min-w-0"><span className="block text-[10px] font-bold uppercase tracking-wide text-slate-400">Secteur d’activité</span><span className="text-sm font-bold text-slate-900">{fields.industry}</span></span></div>}
            </div>
          </section>}
          {settings.show_categories !== false && (profileCategories.length > 0 || selectedServices.length > 0) && <section className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-500">{template === "service" ? "Nos domaines de service" : template === "e-business" ? "Univers & spécialités" : template === "google-review" ? "Notre activité" : "Expertises"}</h2>
            {profileCategories.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{profileCategories.map((category) => <span key={category} className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-700 ring-1 ring-slate-200">{category}</span>)}</div>}
            {selectedServices.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{selectedServices.map((service) => <span key={service} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold leading-4 text-slate-700 shadow-sm"><span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: accent }} />{service}</span>)}</div>}
          </section>}

          {settings.show_info_fields !== false && infoFields.length > 0 && <section className="rounded-2xl bg-white p-4"><h2 className="text-base font-bold text-black">Informations</h2><div className="mt-3 space-y-3">{infoFields.map((field) => <div key={field.key} className="border-b border-slate-100 pb-3 last:border-0"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{field.label}</p><p className="mt-1 whitespace-pre-line text-sm font-medium text-slate-800">{field.value}</p></div>)}</div></section>}


          {settings.show_google_reviews !== false && template === "google-review" && <section className="rounded-2xl bg-white p-4 text-center"><p className="text-sm font-bold text-slate-900">Votre avis compte pour nous</p><p className="mt-1 text-2xl tracking-[.2em] text-amber-500" aria-label="5 étoiles">★★★★★</p>{fields.google_review_url ? <TrackedPublicLink cardId={card.id} href={fields.google_review_url} className="mt-3 flex items-center justify-center rounded-xl px-4 py-3 text-sm font-bold text-white" style={{ backgroundColor: accent }}>Laisser un avis Google</TrackedPublicLink> : <p className="mt-2 text-xs text-slate-600">Le lien Google sera ajouté prochainement.</p>}</section>}

          {settings.show_catalog_pdf !== false && showCatalog && catalogDocument?.file_url && <section className="rounded-2xl bg-white p-4"><a href={catalogDocument.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-indigo-950 shadow-sm transition hover:bg-indigo-100"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white"><svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M7 3h7l5 5v13H7z"/><path d="M14 3v6h5M9 15h6M9 18h6"/></svg></span><span className="min-w-0 flex-1"><strong className="block text-sm font-black">Consulter notre catalogue PDF</strong><span className="mt-1 block truncate text-xs text-indigo-700">{catalogDocument.file_name || "Voir les prestations et tarifs"}</span></span><span className="text-lg font-black">↗</span></a></section>}
          {settings.show_catalog !== false && showCatalog && (!isEcommerce || template !== "e-business") && <section className="rounded-2xl bg-white p-4">
            <h2 className="mb-3 text-base font-bold text-black">{hasRoomCatalog ? "Nos chambres" : isBarber ? "Nos prestations barber" : isBeauty ? "Nos prestations beauté" : isRestaurant ? "Notre menu" : template === "service" ? "Prestations" : isRealEstate ? "Nos projets" : "Nos réalisations"}</h2>
            {showCatalog && (catalogItems?.length ?? 0) > 0 ? <div className="grid grid-cols-2 gap-3">
              {(catalogItems ?? []).map((item) => <article key={item.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                {item.image_url ? <img src={item.image_url} alt={item.name} loading="lazy" className="h-32 w-full object-cover"/> : <div className="flex h-24 items-center justify-center bg-slate-50 text-3xl text-slate-300">✦</div>}
                <div className="p-4"><h3 className="font-bold text-slate-900">{item.name}</h3>{item.description && <p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p>}<p className="mt-3 text-sm font-black text-slate-700">{Number(item.price).toLocaleString("fr-MA")} {item.currency}</p></div>
              </article>)}
            </div> : <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-xs leading-5 text-slate-500">Aucun élément publié pour le moment.</p>}
          </section>}

          {settings.show_request_forms !== false && (allowOrders || allowBookings || allowQuotes || (isEcommerce && showCatalog) || (hasRoomCatalog && allowBookings)) && <PublicWorkspaceRequestForms
            cardSlug={card.slug}
            accent={accent}
            products={(catalogItems ?? []).map((item) => ({ id: item.id, name: item.name, description: item.description, image_url: item.image_url, price: Number(item.price), currency: item.currency }))}
            allowOrders={allowOrders}
            allowBookings={allowBookings}
            allowQuotes={allowQuotes}
            shopMode={isEcommerce}
            bookingLabel={isTraining ? "S'inscrire" : isHealth ? "Prendre rendez-vous" : isHospitality ? "Réserver une chambre" : "Réserver"}
            bookingHint={isTraining ? "Demander une inscription à une formation" : isHealth ? "Choisir une date de consultation" : isHospitality ? "Choisir les dates de votre séjour" : "Choisir une date"}
            bookingDateMode={isHospitality ? "stay" : "datetime"}
            serviceMode={isBeauty}
            whatsappPhone={fields.whatsapp || card.phone || ""}
          />}

          {settings.show_social_links !== false && <section className="rounded-2xl bg-white p-4"><div className="flex flex-wrap items-end justify-between gap-2"><div><h2 className="text-base font-bold text-black">Réseaux sociaux</h2></div></div>{socialLinks.length > 0 ? <div className="mt-4 grid grid-cols-5 gap-2">{socialLinks.map((link: PublicLink) => <TrackedPublicLink key={link.id} cardId={card.id} linkId={link.id} href={link.url} className="flex aspect-square min-w-0 items-center justify-center rounded-xl text-lg font-black text-white shadow-sm transition hover:-translate-y-0.5" style={{ backgroundColor: ({instagram:"#E4405F",facebook:"#1877F2",linkedin:"#0A66C2",tiktok:"#111111",youtube:"#FF0000",x:"#000000",pinterest:"#BD081C",whatsapp:"#25D366",telegram:"#229ED9"} as Record<string,string>)[link.kind] ?? "#64748b" }}><span>{({instagram:"◎",facebook:"f",linkedin:"in",tiktok:"♪",youtube:"▶",x:"𝕏",pinterest:"P",whatsapp:"◉",telegram:"➤"} as Record<string,string>)[link.kind] ?? "↗"}</span></TrackedPublicLink>)}</div> : <p className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-center text-xs leading-5 text-slate-500">Les réseaux sociaux ajoutés par le client apparaîtront ici.</p>}</section>}

          {settings.show_featured_links !== false && featuredLinks.length > 0 && <section className="rounded-2xl bg-white p-4"><h2 className="text-base font-bold text-black">Featured</h2><div className="mt-3 grid grid-cols-2 gap-2">{featuredLinks.map((link) => <TrackedPublicLink key={link.id} cardId={card.id} linkId={link.id} href={link.url} className="flex min-h-24 items-end justify-between rounded-xl bg-slate-100 p-3 text-sm font-bold text-slate-800"><span className="max-w-[85%]">{link.label}</span><span className="text-lg">↗</span></TrackedPublicLink>)}</div></section>}

          {settings.show_faq !== false && faqFields.length > 0 && <section className="rounded-2xl bg-white p-4"><h2 className="text-base font-bold text-black">Expandable Text. FAQ</h2><div className="mt-3 divide-y divide-slate-100">{faqFields.map((field) => <details key={field.key} className="py-3"><summary className="cursor-pointer list-none text-sm font-semibold text-slate-800">{field.label.replace(/^(FAQ|Question|Q\d+)\s*[:.-]?\s*/i,"")}<span className="float-right text-slate-400">⌄</span></summary><p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">{field.value}</p></details>)}</div></section>}

          {settings.show_videos !== false && videoLinks.length > 0 && <section className="rounded-2xl bg-white p-4"><h2 className="text-base font-bold text-black">Multiple Videos</h2><div className="mt-3 flex gap-3 overflow-x-auto pb-2">{videoLinks.map((link) => <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className="w-[245px] shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white"><div className="flex h-32 items-center justify-center bg-slate-900 text-4xl text-white">▶</div><p className="p-3 text-xs font-semibold leading-5 text-slate-800">{link.label}</p></a>)}</div></section>}

          {settings.show_location !== false && <section className="rounded-2xl bg-white p-4" aria-label="Localisation">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-black">Adresse exacte</h2>
                <p className="mt-2 text-xs leading-5 text-slate-600">{exactAddress || "Le propriétaire doit renseigner l’adresse complète de son établissement."}</p>
              </div>
              {mapDirectionsUrl && <a href={mapDirectionsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center rounded-xl px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:opacity-90" style={{ backgroundColor: accent }}>Itinéraire Google Maps ↗</a>}
            </div>
            {mapEmbedUrl ? <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-sm">
              <iframe title={"Localisation de " + (card.company_name || card.full_name)} src={mapEmbedUrl} className="h-64 w-full" loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
            </div> : <div className="mt-3 flex min-h-32 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 text-center text-sm text-slate-500">Aucune carte géographique ne sera affichée tant que l’adresse exacte n’est pas renseignée.</div>}
          </section>}

          <p className="py-3 text-center text-[10px] text-slate-400"><I18nText message="powered" /></p>
        </div>
      </article>
    </main>
  );
}

function PublicCardLoading() {
  return <main className="flex min-h-screen items-center justify-center bg-slate-100 px-5 py-12"><div aria-label="Chargement de la carte digitale" className="h-[460px] w-full max-w-md animate-pulse overflow-hidden rounded-[2rem] bg-white shadow-xl"><div className="h-32 bg-slate-100" /><div className="px-7 pt-5"><div className="h-28 w-28 rounded-3xl bg-slate-100" /><div className="mt-5 h-7 w-2/3 rounded bg-slate-100" /><div className="mt-3 h-4 w-1/2 rounded bg-slate-100" /><div className="mt-8 h-12 rounded-xl bg-slate-100" /><div className="mt-3 h-12 rounded-xl bg-slate-100" /></div></div></main>;
}
