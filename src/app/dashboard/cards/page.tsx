import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { createClientCard, saveClientCardProfile, addClientCardLink, deleteClientCardLink, toggleClientCardPublication } from "@/app/actions/cards";
import { createClient } from "@/lib/supabase/server";
import { CustomCardFieldsEditor, type EditableCardField } from "@/components/cards/custom-card-fields-editor";

type Card = {
  id: string; slug: string; full_name: string; job_title: string | null; company_name: string | null;
  bio: string | null; email: string | null; phone: string | null; website: string | null;
  avatar_url: string | null; is_published: boolean; public_fields: Record<string, string> | null; public_settings: Record<string, boolean> | null;
};
type CardLink = { id: string; card_id: string; label: string; url: string; kind: string };

export default async function ClientCardsPage() {
  await connection();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: membership } = await supabase.from("organization_members")
    .select("organization_id").eq("user_id", user.id).limit(1).maybeSingle();
  const organizationId = membership?.organization_id;
  const { data: organization } = organizationId
    ? await supabase.from("organizations").select("id,name,workspace_config").eq("id", organizationId).maybeSingle()
    : { data: null };
  const { data: cards } = organizationId
    ? await supabase.from("cards").select("id,slug,full_name,job_title,company_name,bio,email,phone,website,avatar_url,is_published,public_fields,public_settings")
      .eq("organization_id", organizationId).order("created_at", { ascending: false })
    : { data: [] as Card[] };
  const cardIds = (cards ?? []).map((card) => card.id);
  const { data: links } = cardIds.length
    ? await supabase.from("card_links").select("id,card_id,label,url,kind").in("card_id", cardIds).order("position")
    : { data: [] as CardLink[] };
  const { data: events } = cardIds.length
    ? await supabase.from("card_events").select("card_id,event_type").in("card_id", cardIds)
    : { data: [] as { card_id: string; event_type: string }[] };
  const config = (organization?.workspace_config ?? {}) as { modules?: string[]; ai_suggestions?: { profile_draft?: { tagline?: string; description?: string; card_fields?: { key: string; label: string; type: string; visible: boolean }[]; suggested_buttons?: { kind: string; label: string; enabled: boolean }[] } } };
  const modules = Array.isArray(config.modules) ? config.modules : [];
  if (config.version && !modules.includes("digital_card")) notFound();
  const profileDraft = config.ai_suggestions?.profile_draft;
  const totalViews = (events ?? []).filter((event) => ["view", "qr_scan", "nfc_scan"].includes(event.event_type)).length;
  const totalNfc = (events ?? []).filter((event) => event.event_type === "nfc_scan").length;
  const totalSaves = (events ?? []).filter((event) => event.event_type === "contact_save").length;
  const totalClicks = (events ?? []).filter((event) => event.event_type === "click").length;

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-sm font-bold uppercase tracking-wider text-indigo-600">Espace client · {organization?.name ?? "TouchCard"}</p><h1 className="mt-2 text-3xl font-black text-slate-950">Mes cartes NFC</h1><p className="mt-2 text-sm text-slate-500">Gérez vos profils, vos boutons et les informations visibles après un scan.</p></div>
        <Link href="/dashboard" className="text-sm font-semibold text-indigo-700">← Tableau de bord</Link>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[["Visites & scans", totalViews], ["Scans NFC", totalNfc], ["Contacts enregistrés", totalSaves], ["Clics sur les boutons", totalClicks]].map(([label, value]) => <article key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">{label}</p><p className="mt-3 text-3xl font-black text-slate-950">{value}</p><p className="mt-1 text-xs text-slate-400">Événements réels enregistrés</p></article>)}
      </section>

      {profileDraft?.tagline && <aside className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4 text-sm text-indigo-950"><strong>Suggestion IA approuvée :</strong> {profileDraft.tagline}{profileDraft.description ? " — " + profileDraft.description : ""}{profileDraft.suggested_buttons?.length ? <p className="mt-2 text-xs">Boutons recommandés à configurer : {profileDraft.suggested_buttons.filter((button) => button.enabled).map((button) => button.label).join(" · ")}</p> : null}</aside>}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-slate-950">Créer une carte</h2>
        <p className="mt-1 text-sm text-slate-500">Vous pouvez créer plusieurs cartes NFC dans votre espace si votre formule l'autorise.</p>
        <form action={createClientCard} className="mt-4 grid gap-3 sm:grid-cols-3">
          <input name="full_name" required placeholder="Nom affiché sur la carte" className="rounded-xl border border-slate-200 px-3 py-3 text-sm" />
          <input name="job_title" placeholder="Fonction / activité" className="rounded-xl border border-slate-200 px-3 py-3 text-sm" />
          <input name="company_name" placeholder="Entreprise" className="rounded-xl border border-slate-200 px-3 py-3 text-sm" />
          <button className="btn-primary sm:col-span-3 sm:justify-self-start">Créer ma carte NFC</button>
        </form>
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
              <form action={saveClientCardProfile} className="space-y-3">
                <input type="hidden" name="card_id" value={card.id}/>
                <h3 className="font-bold text-slate-900">Informations de la carte</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-xs font-semibold text-slate-600">Nom affiché<input name="full_name" required defaultValue={card.full_name} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"/></label>
                  <label className="text-xs font-semibold text-slate-600">Fonction<input name="job_title" defaultValue={card.job_title ?? ""} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"/></label>
                  <label className="text-xs font-semibold text-slate-600">Entreprise<input name="company_name" defaultValue={card.company_name ?? ""} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"/></label>
                  <label className="text-xs font-semibold text-slate-600">Photo de profil (URL)<input name="avatar_url" defaultValue={card.avatar_url ?? ""} placeholder="https://..." className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"/></label>
                  <label className="text-xs font-semibold text-slate-600 sm:col-span-2">Présentation<textarea name="bio" defaultValue={card.bio ?? ""} rows={3} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"/></label>
                  <label className="text-xs font-semibold text-slate-600">Téléphone<input name="phone" defaultValue={card.phone ?? ""} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"/></label>
                  <label className="text-xs font-semibold text-slate-600">E-mail<input name="email" type="email" defaultValue={card.email ?? ""} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"/></label>
                  <label className="text-xs font-semibold text-slate-600 sm:col-span-2">Site web<input name="website" defaultValue={card.website ?? ""} placeholder="https://..." className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"/></label>
                  <label className="text-xs font-semibold text-slate-600 sm:col-span-2">Phrase d'accroche<input name="tagline" defaultValue={fields.tagline ?? ""} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"/></label>
                  <label className="text-xs font-semibold text-slate-600">Ville / adresse<input name="location" defaultValue={fields.location ?? ""} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"/></label>
                  <label className="text-xs font-semibold text-slate-600">Horaires<input name="hours" defaultValue={fields.hours ?? ""} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"/></label>
                  <label className="text-xs font-semibold text-slate-600 sm:col-span-2">WhatsApp Business (numéro)<input name="whatsapp" defaultValue={fields.whatsapp ?? ""} placeholder="+212..." className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"/></label>
                  <CustomCardFieldsEditor initialFields={initialCustomFields}/>
                  <div className="flex flex-wrap gap-4 rounded-xl bg-slate-50 p-3 sm:col-span-2"><span className="w-full text-xs font-bold text-slate-700">Champs visibles sur la page publique</span><label className="flex items-center gap-2 text-xs"><input type="checkbox" name="show_phone" defaultChecked={settings.show_phone !== false}/> Téléphone</label><label className="flex items-center gap-2 text-xs"><input type="checkbox" name="show_email" defaultChecked={settings.show_email !== false}/> E-mail</label><label className="flex items-center gap-2 text-xs"><input type="checkbox" name="show_website" defaultChecked={settings.show_website !== false}/> Site web</label></div>
                </div>
                <button className="btn-primary">Enregistrer les modifications</button>
              </form>

              <div className="space-y-5">
                <div><h3 className="font-bold text-slate-900">Liens et boutons publics</h3><p className="mt-1 text-xs text-slate-500">WhatsApp, Telegram, réseaux sociaux, boutique et autres liens.</p>
                  <div className="mt-3 space-y-2">{cardLinks.map((link) => <div key={link.id} className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 p-3"><div className="min-w-0"><p className="text-sm font-semibold text-slate-800">{link.label} <span className="text-xs font-normal text-slate-400">· {link.kind}</span></p><p className="truncate text-xs text-slate-500">{link.url}</p></div><form action={deleteClientCardLink}><input type="hidden" name="card_id" value={card.id}/><input type="hidden" name="link_id" value={link.id}/><button className="text-xs font-bold text-rose-600">Supprimer</button></form></div>)}</div>
                  <form action={addClientCardLink} className="mt-3 space-y-2 rounded-xl bg-slate-50 p-3">
                    <input type="hidden" name="card_id" value={card.id}/>
                    <input name="label" required placeholder="Nom du bouton (ex. WhatsApp Business)" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"/>
                    <input name="url" type="url" required placeholder="https://..." className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"/>
                    <div className="flex gap-2"><select name="kind" className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"><option value="whatsapp">WhatsApp</option><option value="telegram">Telegram</option><option value="instagram">Instagram</option><option value="facebook">Facebook</option><option value="linkedin">LinkedIn</option><option value="store">Boutique / Store</option><option value="website">Site web</option><option value="other">Autre</option></select><button className="btn-primary">Ajouter</button></div>
                  </form>
                </div>
                <div className="rounded-2xl bg-slate-950 p-4 text-white"><p className="text-xs font-bold uppercase tracking-wider text-indigo-300">Statistiques de cette carte</p><div className="mt-3 grid grid-cols-2 gap-3"><div><p className="text-2xl font-black">{cardEvents.filter(e => ["view","qr_scan","nfc_scan"].includes(e.event_type)).length}</p><p className="text-xs text-slate-300">Visites</p></div><div><p className="text-2xl font-black">{cardEvents.filter(e => e.event_type === "nfc_scan").length}</p><p className="text-xs text-slate-300">Scans NFC</p></div></div><p className="mt-2 text-xs text-slate-400">Les statistiques commencent à la publication et à l'enregistrement des événements.</p><div className="mt-4 border-t border-white/10 pt-3"><p className="text-xs font-bold text-white">URL à encoder sur la puce NFC</p><p className="mt-1 break-all text-[11px] text-slate-300">https://touchcard-zayn-dk.vercel.app/p/${card.slug}?source=nfc</p><p className="mt-3 text-xs font-bold text-white">QR code de partage</p><img alt="QR code de la carte" loading="lazy" className="mt-2 h-28 w-28 rounded-lg bg-white p-1" src={"https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=" + encodeURIComponent("https://touchcard-zayn-dk.vercel.app/p/" + card.slug + "?source=qr")}/></div></div>
                <p className="text-xs text-slate-400">Modules autorisés : {modules.join(" · ") || "Configuration standard"}</p>
              </div>
            </div>
          </article>;
        })}
      </div>
    </div>
  );
}
