import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isPlatformSuperAdmin } from "@/lib/auth/platform-admin";
import { I18nText } from "@/i18n/provider";

export default async function DashboardPage() {
  await connection();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (isPlatformSuperAdmin(user?.email)) redirect("/dashboard/admin");
  if (!user) redirect("/login");

  const fullName = String(user.user_metadata.full_name || "").trim();
  const { data: membership } = await supabase.from("organization_members")
    .select("organization_id").eq("user_id", user.id).limit(1).maybeSingle();
  const organizationId = membership?.organization_id;
  const { data: organization } = organizationId
    ? await supabase.from("organizations").select("workspace_config").eq("id", organizationId).maybeSingle()
    : { data: null };
  const config = (organization?.workspace_config ?? {}) as { version?: number; modules?: string[] };
  const hasWorkspaceConfig = Boolean(config.version);
  const enabledModules = Array.isArray(config.modules) ? config.modules : [];
  const canUseCards = !hasWorkspaceConfig || enabledModules.includes("digital_card");
  const canManageCompany = !hasWorkspaceConfig || enabledModules.includes("company_profile") || enabledModules.includes("contact_profile");

  const { data: cards } = organizationId
    ? await supabase.from("cards").select("id").eq("organization_id", organizationId)
    : { data: [] as { id: string }[] };
  const cardIds = (cards ?? []).map((card) => card.id);
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: events } = cardIds.length
    ? await supabase.from("card_events").select("event_type").in("card_id", cardIds).gte("created_at", since)
    : { data: [] as { event_type: string }[] };
  const { count: contactCount } = organizationId
    ? await supabase.from("contacts").select("id", { count: "exact", head: true }).eq("organization_id", organizationId)
    : { count: 0 };
  const stats = [
    { label: "cards", note: "yourProfiles", value: String(cards?.length ?? 0) },
    { label: "profileViews", note: "last30", value: String((events ?? []).filter((event) => ["view", "qr_scan", "nfc_scan"].includes(event.event_type)).length) },
    { label: "collected", note: "newLeads", value: String(contactCount ?? 0) },
    { label: "interactions", note: "clicks", value: String((events ?? []).filter((event) => ["click", "contact_save"].includes(event.event_type)).length) },
  ];

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-sm font-semibold text-indigo-600"><I18nText message="dashboardLabel" /></p><h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950"><I18nText message="hello" />{fullName ? " " + fullName : ""} 👋</h1><p className="mt-2 text-slate-500"><I18nText message="dashboardIntro" /></p></div>
        {canUseCards && <Link href="/dashboard/cards" className="btn-primary"><I18nText message="createCard" /></Link>}
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((metric) => <article key={metric.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm font-medium text-slate-500"><I18nText message={metric.label as "cards" | "profileViews" | "collected" | "interactions"} /></p><p className="mt-4 text-3xl font-bold text-slate-950">{metric.value}</p><p className="mt-2 text-xs text-slate-400"><I18nText message={metric.note as "yourProfiles" | "last30" | "newLeads" | "clicks"} /></p></article>)}
      </div>
      <div className="mt-8 grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6"><h2 className="text-lg font-bold text-slate-950">Votre carte professionnelle</h2><p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">Personnalisez votre photo, vos coordonnées, vos boutons WhatsApp et Telegram, vos réseaux sociaux et les liens visibles après un scan NFC ou QR.</p><div className="mt-6 flex flex-wrap gap-3">{canUseCards && <Link href="/dashboard/cards" className="btn-primary">Gérer mes cartes NFC</Link>}{canManageCompany && <Link href="/dashboard/settings" className="btn-secondary"><I18nText message="setupCompany" /></Link>}</div></section>
        <section className="rounded-2xl bg-slate-950 p-6 text-white"><p className="text-sm font-semibold text-indigo-300">TOUCHCARD BUSINESS</p><h2 className="mt-3 text-xl font-bold">Votre présence professionnelle, partout.</h2><p className="mt-2 text-sm leading-6 text-slate-300">Une page publique unique pour votre carte NFC et QR, reliée à vos statistiques et à vos outils de gestion.</p></section>
      </div>
    </div>
  );
}
