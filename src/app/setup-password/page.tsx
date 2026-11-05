import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PasswordRecoveryForm } from "@/components/auth/password-recovery-form";

export default async function SetupPasswordPage() {
  await connection();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: request } = await supabase
    .from("prospect_requests")
    .select("status, password_initialized")
    .eq("user_id", user.id)
    .maybeSingle();

  if (request && ["rejected", "cancelled"].includes(request.status)) redirect("/account-pending?blocked=1");
  if (!request || !["in_production", "completed"].includes(request.status)) redirect("/dashboard");
  if (request.password_initialized) redirect("/account-pending");

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-12">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50">
        <Link href="/" className="inline-flex items-center gap-3">
          <img src="/brand/touchcard-mark.svg" alt="" className="h-11 w-11 object-contain" />
          <span className="text-xl font-black tracking-tight text-slate-950">Touch<span className="text-indigo-600">Card</span><span className="ml-2 text-[9px] font-extrabold tracking-[.18em] text-indigo-600">BUSINESS</span></span>
        </Link>
        <p className="mt-8 text-sm font-semibold uppercase tracking-[.18em] text-indigo-600">Première connexion</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Sécurisez votre compte</h1>
        <p className="mt-2 leading-6 text-slate-500">Choisissez votre mot de passe personnel. Cette étape est obligatoire avant de pouvoir accéder à votre espace TouchCard.</p>
        <PasswordRecoveryForm mode="setup" />
      </section>
    </main>
  );
}
