import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-12">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50">
        <Link href="/" className="text-xl font-black tracking-tight text-slate-950">Touch<span className="text-indigo-600">Card</span></Link>
        <p className="mt-8 text-sm font-semibold uppercase tracking-[.18em] text-indigo-600">Démarrer</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Créez votre espace.</h1>
        <p className="mt-2 text-slate-500">Centralisez vos cartes, vos contacts et vos interactions.</p>
        <AuthForm mode="register" />
      </section>
    </main>
  );
}