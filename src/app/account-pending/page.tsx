import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions/auth";

export default function AccountPendingPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-slate-50" />}>
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
    .select("status, password_initialized, client_access_enabled")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!request) redirect("/dashboard");
  const accessBlocked = ["rejected", "cancelled"].includes(request.status);
  if (!accessBlocked && !request.password_initialized) redirect("/setup-password");
  if (!accessBlocked && request.client_access_enabled) redirect("/dashboard");

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-12">
      <section className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-200/50 sm:p-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-8 w-8"><circle cx="12" cy="12" r="9"/><path strokeLinecap="round" d="M12 7v5l3 2"/></svg>
        </div>
        <p className="mt-6 text-xs font-black uppercase tracking-[.2em] text-indigo-600">TouchCard Business</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">{accessBlocked ? "Accès désactivé" : "Votre espace est presque prêt"}</h1>
        <p className="mt-4 leading-7 text-slate-600">{accessBlocked ? "Votre demande a été annulée ou refusée. L’accès à votre espace est désactivé. Contactez TouchCard si vous pensez qu’il s’agit d’une erreur." : "Votre mot de passe est bien configuré. Votre demande attend la validation du Super Admin. Votre tableau de bord et vos outils resteront verrouillés jusqu’à la validation et à l’activation de votre espace."}</p>
        {!accessBlocked && <div className="mt-7 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">En attente de validation par TouchCard</div>}
        <p className="mt-5 text-sm text-slate-500">Connecté avec {user.email}</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link href="/" className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">Retour au site</Link>
          <form action={signOut}><button className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800">Se déconnecter</button></form>
        </div>
      </section>
    </main>
  );
}
