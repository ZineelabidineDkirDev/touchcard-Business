import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ registered?: string }> }) {
  const params = await searchParams;
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-12">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50">
        <Link href="/" className="text-xl font-black tracking-tight text-slate-950">Touch<span className="text-indigo-600">Card</span></Link>
        <p className="mt-8 text-sm font-semibold uppercase tracking-[.18em] text-indigo-600">Espace professionnel</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Bon retour.</h1>
        <p className="mt-2 text-slate-500">Connectez-vous pour gérer votre présence digitale.</p>
        {params.registered === "1" && <p className="mt-5 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">Compte créé. Vérifiez votre e-mail si une confirmation est demandée.</p>}
        <AuthForm mode="login" />
      </section>
    </main>
  );
}