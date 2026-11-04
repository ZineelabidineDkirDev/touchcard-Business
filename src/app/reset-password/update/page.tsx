import Link from "next/link";
import { PasswordRecoveryForm } from "@/components/auth/password-recovery-form";

export default function UpdatePasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-12">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50">
        <Link href="/" className="inline-flex items-center gap-3">
          <img src="/brand/touchcard-mark.svg" alt="" className="h-11 w-11 object-contain" />
          <span className="text-xl font-black tracking-tight text-slate-950">Touch<span className="text-indigo-600">Card</span><span className="ml-2 text-[9px] font-extrabold tracking-[.18em] text-indigo-600">BUSINESS</span></span>
        </Link>
        <p className="mt-8 text-sm font-semibold uppercase tracking-[.18em] text-indigo-600">Sécurité du compte</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Choisir un nouveau mot de passe</h1>
        <p className="mt-2 leading-6 text-slate-500">Votre lien de réinitialisation vous a permis d’accéder à cette page. Choisissez un mot de passe d’au moins 8 caractères.</p>
        <PasswordRecoveryForm mode="update" />
      </section>
    </main>
  );
}
