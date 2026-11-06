import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions/auth";
import { PendingStatusRefresh } from "@/components/prospects/pending-status-refresh";

export default function AccountPendingPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-white" />}>
      <AccountPendingContent />
    </Suspense>
  );
}

async function AccountPendingContent() {
  await connection();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: request } = await supabase
    .from("prospect_requests")
    .select("id, full_name, status, password_initialized, client_access_enabled, created_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!request) redirect("/dashboard");
  const accessBlocked = ["rejected", "cancelled"].includes(request.status);
  if (!accessBlocked && !request.password_initialized) redirect("/setup-password");
  if (!accessBlocked && request.client_access_enabled) redirect("/dashboard");

  const deadline = new Date(new Date(request.created_at).getTime() + 12 * 60 * 60 * 1000);
  const displayName = String(request.full_name || user.user_metadata.full_name || "cher client").trim();

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-5 py-12 text-slate-950">
      <PendingStatusRefresh />
      <section className="w-full max-w-4xl text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-indigo-50 text-indigo-700">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-10 w-10" aria-hidden="true">
            <circle cx="12" cy="12" r="9" /><path strokeLinecap="round" d="M12 7v5l3 2" />
          </svg>
        </div>
        <p className="mt-8 text-sm font-black uppercase tracking-[.24em] text-indigo-700">TouchCard Business</p>
        {accessBlocked ? (
          <>
            <h1 className="mt-6 text-4xl font-black leading-tight tracking-tight sm:text-6xl">Demande non validée</h1>
            <p className="mx-auto mt-7 max-w-3xl text-xl leading-relaxed text-slate-600 sm:text-2xl">Votre demande a été refusée ou annulée. Pour toute précision, veuillez contacter l’équipe TouchCard.</p>
          </>
        ) : (
          <>
            <h1 className="mt-6 text-4xl font-black leading-tight tracking-tight sm:text-6xl">Pour des raisons de sécurité, veuillez patienter, {displayName}.</h1>
            <p className="mx-auto mt-8 max-w-3xl text-xl font-medium leading-relaxed text-slate-700 sm:text-2xl">Votre compte a bien été créé. Votre espace client sera accessible après validation de votre demande par l’équipe TouchCard.</p>
            <div className="mx-auto mt-9 max-w-2xl rounded-3xl border border-indigo-100 bg-indigo-50/70 px-6 py-7">
              <p className="text-sm font-bold uppercase tracking-wider text-indigo-700">Délai maximal de validation</p>
              <p className="mt-2 text-4xl font-black text-indigo-950 sm:text-5xl">12 heures</p>
              <p className="mt-3 text-base leading-7 text-slate-600">à compter de la réception de votre demande.</p>
              <p className="mt-5 text-xs font-semibold text-slate-500">Échéance indicative : {deadline.toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}</p>
            </div>
            <p className="mt-7 text-sm text-slate-500">Numéro de demande : <span className="font-mono font-bold text-slate-800">{request.id}</span></p>
            <p className="mt-8 text-xl font-bold text-slate-900 sm:text-2xl">Merci pour votre confiance !</p>
          </>
        )}
        <form action={signOut} className="mt-12">
          <button className="text-sm font-semibold text-slate-400 underline underline-offset-4 hover:text-slate-700">Se déconnecter</button>
        </form>
      </section>
    </main>
  );
}
