import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AuthForm } from "@/components/auth/auth-form";
import { I18nText } from "@/i18n/provider";

export default function RegisterPage() {
  return (
    <Suspense fallback={<RegisterLoading />}>
      <RegisterContent />
    </Suspense>
  );
}

async function RegisterContent() {
  await connection();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-12">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50">
        <Link href="/" className="text-xl font-black tracking-tight text-slate-950">Touch<span className="text-indigo-600">Card</span></Link>
        <p className="mt-8 text-sm font-semibold uppercase tracking-[.18em] text-indigo-600"><I18nText message="start" /></p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950"><I18nText message="createSpace" /></h1>
        <p className="mt-2 text-slate-500"><I18nText message="registerIntro" /></p>
        <AuthForm mode="register" />
      </section>
    </main>
  );
}

function RegisterLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-12">
      <section
        aria-label="Chargement de l'inscription"
        className="h-[420px] w-full max-w-md animate-pulse rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50"
      >
        <div className="h-7 w-32 rounded bg-slate-100" />
        <div className="mt-12 h-4 w-40 rounded bg-slate-100" />
        <div className="mt-4 h-9 w-56 rounded bg-slate-100" />
        <div className="mt-3 h-4 w-full rounded bg-slate-100" />
        <div className="mt-10 h-12 rounded-xl bg-slate-100" />
        <div className="mt-4 h-12 rounded-xl bg-slate-100" />
      </section>
    </main>
  );
}
