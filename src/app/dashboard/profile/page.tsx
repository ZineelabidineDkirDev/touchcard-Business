import { connection } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateClientProfile } from "@/app/actions/dashboard-settings";

export default async function ClientProfilePage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  await connection();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const query = await searchParams;
  const metadata = user.user_metadata ?? {};

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-7"><p className="text-sm font-semibold text-indigo-600">Mon espace client</p><h1 className="mt-2 text-3xl font-black text-slate-950">Mon profil</h1><p className="mt-2 text-sm text-slate-500">Gérez les informations personnelles associées à votre compte TouchCard.</p></div>
      {query.saved === "1" && <p role="status" className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">Votre profil a été mis à jour.</p>}
      {query.error && <p role="alert" className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{query.error === "name" ? "Le nom complet est obligatoire." : "Impossible d'enregistrer vos modifications. Réessayez."}</p>}
      <form action={updateClientProfile} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-7 flex items-center gap-4 border-b border-slate-100 pb-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 text-2xl font-black text-indigo-700">{String(metadata.full_name || user.email || "C").slice(0,1).toUpperCase()}</div>
          <div className="min-w-0"><h2 className="font-bold text-slate-900">{String(metadata.full_name || "Votre nom")}</h2><p className="truncate text-sm text-slate-500">{user.email}</p><p className="mt-1 text-xs text-slate-400">Compte client TouchCard</p></div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block text-sm font-semibold text-slate-700 sm:col-span-2">Nom complet<input required name="full_name" defaultValue={String(metadata.full_name || metadata.name || "")} placeholder="Votre nom et prénom" className="field mt-2" /></label>
          <label className="block text-sm font-semibold text-slate-700">Adresse e-mail<input disabled value={user.email || ""} className="field mt-2 cursor-not-allowed opacity-70" /><span className="mt-1 block text-xs font-normal text-slate-400">L'adresse e-mail est liée à votre authentification.</span></label>
          <label className="block text-sm font-semibold text-slate-700">Téléphone<input name="phone" type="tel" defaultValue={String(metadata.phone || "")} placeholder="+212 6..." className="field mt-2" /></label>
          <label className="block text-sm font-semibold text-slate-700 sm:col-span-2">Fonction / activité<input name="job_title" defaultValue={String(metadata.job_title || "")} placeholder="Ex. Gérant, consultant, responsable..." className="field mt-2" /></label>
        </div>
        <div className="mt-8 flex flex-wrap justify-end gap-3"><a href="/dashboard" className="btn-secondary">Annuler</a><button type="submit" className="btn-primary">Enregistrer le profil</button></div>
      </form>
    </div>
  );
}
