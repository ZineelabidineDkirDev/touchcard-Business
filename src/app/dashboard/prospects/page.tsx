import { redirect } from "next/navigation";
import Link from "next/link";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isPlatformSuperAdmin } from "@/lib/auth/platform-admin";
import { activateProspectClientAccess, updateProspectStatus } from "@/app/actions/prospects";

const statuses = [
  ["new", "Nouveau"], ["to_contact", "À contacter"], ["in_discussion", "En discussion"],
  ["quote_sent", "Devis envoyé"], ["approved", "Validé"], ["in_production", "En production"],
  ["completed", "Terminé"], ["rejected", "Refusé"], ["cancelled", "Annulé"],
];

export default async function ProspectsPage({ searchParams }: { searchParams: Promise<{ created?: string; already_created?: string; approval_required?: string }> }) {
  await connection();
  const query = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  if (!isPlatformSuperAdmin(user.email)) {
    return <section className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8"><p className="text-xs font-black uppercase tracking-[.2em] text-indigo-600">TouchCard Business</p><h1 className="mt-3 text-3xl font-black text-slate-950">Espace administrateur</h1><p className="mt-3 text-slate-600">Cette rubrique est réservée aux administrateurs TouchCard autorisés.</p></section>;
  }

  const { data: prospects, error } = await supabase
    .from("prospect_requests")
    .select("id, user_id, full_name, city, activity_sector, email, phone, card_type, reason, customization_requested, brand_name, logo_url, business_address, business_phone, social_links, project_needs, status, admin_notes, password_initialized, client_access_enabled, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-7xl">
      <p className="text-sm font-semibold uppercase tracking-[.18em] text-indigo-600">TouchCard Business · CRM</p>
      <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Prospects & demandes</h1>
      <p className="mt-2 text-slate-500">Toutes les demandes reçues depuis le parcours « Créer votre carte ».</p>
      {query.created === "1" && <div role="status" className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">Le compte client et son espace configuré ont été créés. L'invitation a été envoyée par e-mail.</div>}
      {query.already_created === "1" && <div className="mt-6 rounded-2xl bg-slate-100 p-4 text-sm text-slate-700">Cette demande est déjà liée à un compte client.</div>}
      {query.approval_required === "1" && <div className="mt-6 rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">Validez d'abord la demande avant de configurer son espace client.</div>}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Metric label="Total des demandes" value={String(prospects?.length ?? 0)}/>
        <Metric label="Nouvelles demandes" value={String(prospects?.filter((p) => p.status === "new").length ?? 0)}/>
        <Metric label="Demandes validées" value={String(prospects?.filter((p) => p.status === "approved").length ?? 0)}/>
      </div>
      {error && <p className="mt-6 rounded-xl bg-rose-50 p-4 text-sm text-rose-700">Impossible de charger les demandes. Vérifiez que la migration prospect_requests est appliquée.</p>}
      <div className="mt-8 space-y-4">
        {(prospects ?? []).map((p) => (
          <article key={p.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div><h2 className="text-lg font-bold text-slate-950">{p.full_name}</h2><p className="mt-1 text-sm text-slate-500">{p.city} · {p.activity_sector}</p></div>
              <span className="rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700">{statuses.find(([key]) => key === p.status)?.[1] ?? p.status}</span>
            </div>
            <div className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
              <p><strong className="text-slate-900">E-mail :</strong> {p.email}</p><p><strong className="text-slate-900">Téléphone :</strong> {p.phone}</p>
              <p><strong className="text-slate-900">Carte :</strong> {p.card_type}</p><p><strong className="text-slate-900">Personnalisation :</strong> {p.customization_requested ? "Oui" : "Non"}</p>
              {p.customization_requested && <><p><strong className="text-slate-900">Marque :</strong> {p.brand_name || "—"}</p><p><strong className="text-slate-900">Logo :</strong> {p.logo_url || "Non fourni"}</p><p><strong className="text-slate-900">Adresse :</strong> {p.business_address || "—"}</p><p><strong className="text-slate-900">Téléphone professionnel :</strong> {p.business_phone || "—"}</p></>}
              {p.reason && <p className="sm:col-span-2"><strong className="text-slate-900">Projet :</strong> {p.reason}</p>}<div className="sm:col-span-2 rounded-xl border border-violet-100 bg-violet-50/50 p-4"><p className="font-bold text-slate-900">Besoins métier déclarés</p><p className="mt-2 text-xs text-slate-600">Objectifs : {((p.project_needs as any)?.selected || []).join(" · ") || "—"}</p><p className="mt-1 text-xs text-slate-600">Réservation : {(p.project_needs as any)?.reservation_mode || "Non précisée"} · Canaux : {((p.project_needs as any)?.reservation_channels || []).join(" · ") || "—"}</p><p className="mt-1 text-xs text-slate-600">Gestion CRM : {((p.project_needs as any)?.management_needs || []).join(" · ") || "—"}</p></div>
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <p className="text-xs text-slate-400">Reçue le {new Date(p.created_at).toLocaleString("fr-FR")}</p>
              <div className="flex flex-wrap gap-2">
                <form action={updateProspectStatus} className="flex flex-wrap gap-2">
                  <input type="hidden" name="id" value={p.id}/>
                  <select name="status" defaultValue={p.status} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">{statuses.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>
                  <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-500">Enregistrer</button>
                </form>
                {p.status === "approved" && !p.user_id && (
                  <Link href={`/dashboard/prospects/${p.id}/configure`} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700">Configurer l'espace client →</Link>
                )}
                {p.user_id && !p.password_initialized && <span className="rounded-lg bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800">Invitation envoyée · mot de passe à définir</span>}
                {p.user_id && p.password_initialized && !p.client_access_enabled && <form action={activateProspectClientAccess}><input type="hidden" name="id" value={p.id}/><button className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700">Valider et ouvrir l'accès client</button></form>}
                {p.user_id && p.client_access_enabled && <span className="rounded-lg bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800">Espace client activé</span>}
                {p.user_id && <Link href={`/dashboard/prospects/${p.id}/preview`} className="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-bold text-indigo-700 hover:bg-indigo-100">Voir l'espace client ↗</Link>}
                {p.status === "in_production" && p.user_id && <Link href={`/dashboard/prospects/${p.id}/ai-test`} className="rounded-lg border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-bold text-violet-700 hover:bg-violet-100">Tester Gemini sans création ✨</Link>}
              </div>
            </div>
          </article>
        ))}
        {!error && (prospects?.length ?? 0) === 0 && <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center"><h2 className="text-lg font-bold text-slate-900">Aucun prospect pour le moment</h2><p className="mt-2 text-sm text-slate-500">Les nouvelles demandes apparaîtront ici automatiquement.</p></div>}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-3xl font-black text-slate-950">{value}</p></div>;
}
