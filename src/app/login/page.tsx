import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { AuthForm } from "@/components/auth/auth-form";
import { I18nText } from "@/i18n/provider";

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ registered?: string }>;
}) {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginContent searchParams={searchParams} />
    </Suspense>
  );
}

async function LoginContent({
  searchParams,
}: {
  searchParams: Promise<{ registered?: string }>;
}) {
  await connection();
  const params = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-12">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50">
        <Link href="/" className="inline-flex items-center gap-3">
          <img src="/brand/touchcard-mark.svg" alt="" className="h-11 w-11 object-contain" />
          <span className="text-xl font-black tracking-tight text-slate-950">Touch<span className="text-indigo-600">Card</span><span className="ml-2 text-[9px] font-extrabold tracking-[.18em] text-indigo-600">BUSINESS</span></span>
        </Link>
        <p className="mt-8 text-sm font-semibold uppercase tracking-[.18em] text-indigo-600">
          <I18nText message="workspace" />
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950"><I18nText message="welcome" /></h1>
        <p className="mt-2 text-slate-500">
          <I18nText message="loginIntro" />
        </p>
        {params.registered === "1" && (
          <p className="mt-5 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">
            <I18nText message="created" />
          </p>
        )}
        <AuthForm mode="login" />
      </section>
    </main>
  );
}

function LoginLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-12">
      <section
        aria-label="Chargement de la connexion"
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
