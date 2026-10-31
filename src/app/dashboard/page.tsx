import Link from "next/link";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { I18nText } from "@/i18n/provider";

const metrics = [
  { label: "cards", note: "yourProfiles" },
  { label: "profileViews", note: "last30" },
  { label: "collected", note: "newLeads" },
  { label: "interactions", note: "clicks" },
];

export default async function DashboardPage() {
  await connection();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const fullName = String(user?.user_metadata.full_name || "").trim();

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-sm font-semibold text-indigo-600"><I18nText message="dashboardLabel" /></p><h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950"><I18nText message="hello" />{fullName ? " " + fullName : ""} 👋</h1><p className="mt-2 text-slate-500"><I18nText message="dashboardIntro" /></p></div>
        <Link href="/dashboard/cards" className="btn-primary"><I18nText message="createCard" /></Link>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => <article key={metric.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm font-medium text-slate-500"><I18nText message={metric.label as "cards" | "profileViews" | "collected" | "interactions"} /></p><p className="mt-4 text-3xl font-bold text-slate-950">—</p><p className="mt-2 text-xs text-slate-400"><I18nText message={metric.note as "yourProfiles" | "last30" | "newLeads" | "clicks"} /></p></article>)}
      </div>
      <div className="mt-8 grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6"><h2 className="text-lg font-bold text-slate-950"><I18nText message="ready" /></h2><p className="mt-2 max-w-xl text-sm leading-6 text-slate-500"><I18nText message="readyIntro" /></p><div className="mt-6 flex flex-wrap gap-3"><Link href="/dashboard/cards" className="btn-primary"><I18nText message="setupCard" /></Link><Link href="/dashboard/settings" className="btn-secondary"><I18nText message="setupCompany" /></Link></div></section>
        <section className="rounded-2xl bg-slate-950 p-6 text-white"><p className="text-sm font-semibold text-indigo-300">TOUCHCARD BUSINESS</p><h2 className="mt-3 text-xl font-bold"><I18nText message="identity" /></h2><p className="mt-2 text-sm leading-6 text-slate-300"><I18nText message="identityIntro" /></p></section>
      </div>
    </div>
  );
}