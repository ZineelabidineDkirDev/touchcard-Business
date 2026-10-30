import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const metrics = [
  { label: "Cartes digitales", note: "Vos profils professionnels" },
  { label: "Vues de profil", note: "Sur les 30 derniers jours" },
  { label: "Contacts collectés", note: "Vos nouveaux prospects" },
  { label: "Interactions", note: "Clics et actions" },
];

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const fullName = String(user?.user_metadata.full_name || "").trim();

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-sm font-semibold text-indigo-600">ESPACE DE GESTION</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Bonjour{fullName ? " " + fullName : ""} 👋</h1><p className="mt-2 text-slate-500">Voici le point de départ de votre activité TouchCard.</p></div>
        <Link href="/dashboard/cards" className="btn-primary">+ Créer une carte</Link>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => <article key={metric.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm font-medium text-slate-500">{metric.label}</p><p className="mt-4 text-3xl font-bold text-slate-950">—</p><p className="mt-2 text-xs text-slate-400">{metric.note}</p></article>)}
      </div>
      <div className="mt-8 grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6"><h2 className="text-lg font-bold text-slate-950">Votre espace est prêt à être configuré</h2><p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">Créez votre première carte digitale, ajoutez vos coordonnées et préparez votre QR code ou votre lien NFC.</p><div className="mt-6 flex flex-wrap gap-3"><Link href="/dashboard/cards" className="btn-primary">Configurer ma carte</Link><Link href="/dashboard/settings" className="btn-secondary">Configurer mon entreprise</Link></div></section>
        <section className="rounded-2xl bg-slate-950 p-6 text-white"><p className="text-sm font-semibold text-indigo-300">TOUCHCARD BUSINESS</p><h2 className="mt-3 text-xl font-bold">Une identité. Tous vos points de contact.</h2><p className="mt-2 text-sm leading-6 text-slate-300">Cartes NFC, QR codes, contacts et fidélité réunis dans un seul espace.</p></section>
      </div>
    </div>
  );
}