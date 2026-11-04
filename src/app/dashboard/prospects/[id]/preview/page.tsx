import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isPlatformSuperAdmin } from "@/lib/auth/platform-admin";

type WorkspaceConfig = {
  version?: number;
  template?: string;
  modules?: string[];
  plan?: string;
};

const moduleLabels: Record<string, string> = {
  dashboard: "Tableau de bord",
  digital_card: "Carte digitale",
  contact_profile: "Profil de contact",
  social_links: "Réseaux sociaux",
  qr_nfc: "QR code & NFC",
  company_profile: "Profil entreprise",
  service_catalog: "Catalogue de services",
  product_catalog: "Catalogue de produits",
  orders: "Commandes",
  quotes: "Devis",
  bookings: "Réservations",
  availability: "Disponibilités",
  crm_contacts: "Contacts CRM",
  team: "Équipe",
  gallery: "Galerie",
  whatsapp: "WhatsApp",
  analytics: "Statistiques",
  loyalty: "Fidélité",
};

export default async function ClientWorkspacePreview({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!isPlatformSuperAdmin(user.email)) notFound();

  const { data: prospect } = await supabase
    .from("prospect_requests")
    .select("id, user_id, full_name, email, card_type, brand_name, activity_sector, city, status")
    .eq("id", id)
    .maybeSingle();

  if (!prospect || prospect.status !== "approved" || !prospect.user_id) notFound();

  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", prospect.user_id)
    .limit(1)
    .maybeSingle();

  if (!membership?.organization_id) notFound();

  const { data: organization } = await supabase
    .from("organizations")
    .select("id, name, workspace_config")
    .eq("id", membership.organization_id)
    .maybeSingle();

  if (!organization) notFound();
  const config = (organization.workspace_config || {}) as WorkspaceConfig;
  const enabledModules = Array.isArray(config.modules) ? config.modules : [];
  const templateName = config.template || prospect.card_type || "Espace client";

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <div>
          <p className="text-sm font-black text-amber-900">APERÇU SUPER ADMIN · MODE PROVISOIRE</p>
          <p className="mt-1 text-xs text-amber-800">Consultation uniquement : aucune session client n'est ouverte et aucune donnée n'est modifiée.</p>
        </div>
        <Link href="/dashboard/prospects" className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800">← Retour Super Admin</Link>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[.16em] text-indigo-600">TouchCard Business · Espace client</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">{organization.name || prospect.brand_name || prospect.full_name}</h1>
          <p className="mt-2 text-sm text-slate-500">{prospect.full_name} · {prospect.email} · {prospect.city || "Ville non renseignée"}</p>
        </div>
        <span className="rounded-full bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700">Modèle : {templateName}</span>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Modèle de carte", templateName],
          ["Modules activés", String(enabledModules.length)],
          ["Secteur", prospect.activity_sector || "—"],
          ["Mode", "Aperçu lecture seule"],
        ].map(([label, value]) => (
          <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-3 text-xl font-black text-slate-950">{value}</p>
          </article>
        ))}
      </div>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="text-lg font-black text-slate-950">Espace de travail du client</h2><p className="mt-1 text-sm text-slate-500">Aperçu des rubriques autorisées par la configuration enregistrée.</p></div>
          <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">Configuration active</span>
        </div>
        {enabledModules.length > 0 ? (
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {enabledModules.map((module) => (
              <div key={module} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-bold text-slate-900">{moduleLabels[module] || module.replaceAll("_", " ")}</p>
                <p className="mt-1 text-xs text-slate-500">Module activé pour ce client</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-5 rounded-xl bg-slate-50 p-5 text-sm text-slate-600">Aucun module n'est enregistré dans la configuration de cet espace.</p>
        )}
      </section>
      <p className="mt-6 text-xs text-slate-400">Cette première version affiche la configuration réelle du client et ses modules activés. Les fonctions métier de chaque module restent accessibles uniquement lorsqu'elles sont développées.</p>
    </div>
  );
}
