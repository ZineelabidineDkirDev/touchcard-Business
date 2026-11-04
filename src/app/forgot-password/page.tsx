import Link from "next/link";
import { PasswordRecoveryForm } from "@/components/auth/password-recovery-form";

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-12">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50">
        <Link href="/" className="inline-flex items-center gap-3">
          <img src="/brand/touchcard-mark.svg" alt="" className="h-11 w-11 object-contain" />
          <span className="text-xl font-black tracking-tight text-slate-950">Touch<span className="text-indigo-600">Card</span><span className="ml-2 text-[9px] font-extrabold tracking-[.18em] text-indigo-600">BUSINESS</span></span>
        </Link>
        <p className="mt-8 text-sm font-semibold uppercase tracking-[.18em] text-indigo-600">Sécurité du compte</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Mot de passe oublié ?</h1>
        <p className="mt-2 leading-6 text-slate-500">Saisissez l’adresse e-mail associée à votre compte. Si un compte existe, vous recevrez un lien sécurisé pour choisir un nouveau mot de passe.</p>
        <PasswordRecoveryForm mode="request" />
      </section>
    </main>
  );
}
