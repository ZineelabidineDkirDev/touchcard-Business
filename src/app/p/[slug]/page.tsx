import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { I18nText } from "@/i18n/provider";
import { PublicCardTracker, TrackedPublicLink } from "@/components/cards/public-card-tracker";

type PublicFields = { tagline?: string; location?: string; hours?: string; whatsapp?: string; custom_fields?: { key: string; label: string; value: string; visible: boolean }[] };
type PublicLink = { id: string; label: string; url: string; kind: string };

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
    .select("id,slug,full_name,job_title,company_name,bio,email,phone,website,avatar_url,cover_url,public_fields,public_settings")
    .eq("slug", slug).eq("is_published", true).maybeSingle();
  if (!card) notFound();

  const { data: links } = await supabase.from("card_links")
    .select("id,label,url,kind").eq("card_id", card.id).order("position");
  const fields = (card.public_fields ?? {}) as PublicFields;
  const settings = (card.public_settings ?? {}) as Record<string, boolean>;
  const source = query.source === "nfc" ? "nfc_scan" : query.source === "qr" ? "qr_scan" : "view";
  const whatsapp = String(fields.whatsapp ?? "").replace(/[^+\d]/g, "").replace(/^\+/, "");
  const vcardUrl = "/api/cards/" + encodeURIComponent(slug) + "/vcard";

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 sm:py-12">
      <PublicCardTracker cardId={card.id} eventType={source} />
      <article className="mx-auto w-full max-w-md overflow-hidden rounded-[2rem] bg-white shadow-2xl shadow-slate-300/60">
        <div className="relative h-36 bg-gradient-to-br from-indigo-950 via-indigo-700 to-violet-500">
          {card.cover_url && <img src={card.cover_url} alt="" className="h-full w-full object-cover" />}
        </div>
        <div className="-mt-14 px-7 pb-8">
          <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-3xl border-4 border-white bg-indigo-50 text-3xl font-bold text-indigo-700 shadow-lg">
            {card.avatar_url ? <img src={card.avatar_url} alt={card.full_name} className="h-full w-full object-cover" /> : card.full_name.slice(0, 1).toUpperCase()}
          </div>
          <h1 className="mt-5 text-2xl font-black text-slate-950">{card.full_name}</h1>
          {card.job_title && <p className="mt-1 font-semibold text-indigo-700">{card.job_title}</p>}
          {card.company_name && <p className="mt-1 text-sm text-slate-500">{card.company_name}</p>}
          {fields.tagline && <p className="mt-4 text-sm font-semibold text-slate-700">{fields.tagline}</p>}
          {card.bio && <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">{card.bio}</p>}
          {(fields.location || fields.hours) && <div className="mt-4 space-y-1 text-xs text-slate-500">{fields.location && <p>📍 {fields.location}</p>}{fields.hours && <p>🕒 {fields.hours}</p>}</div>}
          {fields.custom_fields?.some((field) => field.visible && field.label && field.value) && <section className="mt-5 space-y-2">{fields.custom_fields.filter((field) => field.visible && field.label && field.value).map((field) => <div key={field.key} className="rounded-xl bg-slate-50 px-4 py-3"><p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{field.label}</p><p className="mt-1 whitespace-pre-line text-sm font-medium text-slate-800">{field.value}</p></div>)}</section>}

          <div className="mt-7 grid gap-3">
            <TrackedPublicLink cardId={card.id} href={vcardUrl} eventType="contact_save" className="btn-primary text-center">Enregistrer le contact</TrackedPublicLink>
            {settings.show_phone !== false && card.phone && <TrackedPublicLink cardId={card.id} href={"tel:" + card.phone} className="btn-secondary text-center">Appeler</TrackedPublicLink>}
            {settings.show_email !== false && card.email && <TrackedPublicLink cardId={card.id} href={"mailto:" + card.email} className="btn-secondary text-center">Envoyer un e-mail</TrackedPublicLink>}
            {settings.show_website !== false && card.website && <TrackedPublicLink cardId={card.id} href={card.website} className="btn-secondary text-center">Site web</TrackedPublicLink>}
            {whatsapp && <TrackedPublicLink cardId={card.id} href={"https://wa.me/" + whatsapp} className="flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white">WhatsApp Business</TrackedPublicLink>}
          </div>

          {links && links.length > 0 && <section className="mt-7 border-t border-slate-100 pt-6"><h2 className="mb-3 text-sm font-black uppercase tracking-wider text-slate-400">Me retrouver en ligne</h2><div className="grid gap-2">{links.map((link: PublicLink) => <TrackedPublicLink key={link.id} cardId={card.id} linkId={link.id} href={link.url} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800"><span>{link.label}</span><span className="text-indigo-600">↗</span></TrackedPublicLink>)}</div></section>}

          <p className="mt-8 text-center text-xs text-slate-400"><I18nText message="powered" /></p>
        </div>
      </article>
    </main>
  );
}

function PublicCardLoading() {
  return <main className="flex min-h-screen items-center justify-center bg-slate-100 px-5 py-12"><div aria-label="Chargement de la carte digitale" className="h-[460px] w-full max-w-md animate-pulse overflow-hidden rounded-[2rem] bg-white shadow-xl"><div className="h-32 bg-indigo-100" /><div className="px-7 pt-5"><div className="h-28 w-28 rounded-3xl bg-slate-100" /><div className="mt-5 h-7 w-2/3 rounded bg-slate-100" /><div className="mt-3 h-4 w-1/2 rounded bg-slate-100" /><div className="mt-8 h-12 rounded-xl bg-slate-100" /><div className="mt-3 h-12 rounded-xl bg-slate-100" /></div></div></main>;
}
