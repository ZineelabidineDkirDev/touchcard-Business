import { connection } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateClientProfile } from "@/app/actions/dashboard-settings";
import { MediaImagePicker } from "@/components/dashboard/media-image-picker";
import { PopupDialog } from "@/components/dashboard/popup-dialog";

export default async function ClientProfilePage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  await connection();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const query = await searchParams;
  const metadata = user.user_metadata ?? {};
  const { data: membership } = await supabase.from("organization_members").select("organization_id").eq("user_id", user.id).limit(1).maybeSingle();
  const organizationId = membership?.organization_id;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold text-indigo-600">Mon espace client</p><h1 className="mt-2 text-3xl font-black text-slate-950">Mon profil</h1><p className="mt-2 text-sm text-slate-500">Gérez les informations personnelles associées à votre compte TouchCard.</p></div><PopupDialog title="Modifier mon profil" description="Mettez à jour vos informations et votre photo." triggerLabel="Modifier mon profil"><form action={updateClientProfile} className="space-y-5"><MediaImagePicker organizationId={organizationId || user.id} name="avatar_url" initialUrl={String(metadata.avatar_url || "")} label="Photo de profil"/><label className="block text-sm font-semibold text-slate-700">Nom complet<input required name="full_name" defaultValue={String(metadata.full_name || metadata.name || "")} className="field mt-2"/></label><label className="block text-sm font-semibold text-slate-700">Téléphone<input name="phone" type="tel" defaultValue={String(metadata.phone || "")} className="field mt-2"/></label><label className="block text-sm font-semibold text-slate-700">Fonction / activité<input name="job_title" defaultValue={String(metadata.job_title || "")} className="field mt-2"/></label><button type="submit" className="btn-primary">Enregistrer le profil</button></form></PopupDialog></div>
      {query.saved === "1" && <p role="status" className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">Votre profil a été mis à jour.</p>}
      {query.error && <p role="alert" className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{query.error === "name" ? "Le nom complet est obligatoire." : "Impossible d'enregistrer vos modifications. Réessayez."}</p>}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><div className="flex items-center gap-4"><div className="h-16 w-16 overflow-hidden rounded-2xl bg-indigo-100">{metadata.avatar_url ? <img src={String(metadata.avatar_url)} alt="Photo de profil" className="h-full w-full object-cover"/> : <div className="flex h-full w-full items-center justify-center text-2xl font-black text-indigo-700">{String(metadata.full_name || user.email || "C").slice(0,1).toUpperCase()}</div>}</div><div className="min-w-0"><h2 className="font-bold text-slate-900">{String(metadata.full_name || "Votre nom")}</h2><p className="truncate text-sm text-slate-500">{user.email}</p><p className="mt-1 text-xs text-slate-400">Compte client TouchCard</p></div></div></section>

    </div>
  );
}
