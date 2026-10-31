import { notFound } from "next/navigation";
import { connection } from "next/server";
import { I18nText } from "@/i18n/provider";

const sections: Record<string, { title: string; description: string; status: string }> = {
  cards: { title: "secCardsTitle", description: "secCardsDesc", status: "secCardsStatus" },
  contacts: { title: "secContactsTitle", description: "secContactsDesc", status: "secContactsStatus" },
  team: { title: "secTeamTitle", description: "secTeamDesc", status: "secTeamStatus" },
  analytics: { title: "secAnalyticsTitle", description: "secAnalyticsDesc", status: "secAnalyticsStatus" },
  loyalty: { title: "secLoyaltyTitle", description: "secLoyaltyDesc", status: "secLoyaltyStatus" },
  settings: { title: "secSettingsTitle", description: "secSettingsDesc", status: "secSettingsStatus" },
};

export default async function DashboardSection({ params }: { params: Promise<{ section: string }> }) {
  await connection();
  const { section } = await params;
  const content = sections[section];
  if (!content) notFound();
  return (
    <div className="mx-auto max-w-5xl">
      <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600"><I18nText message="workspaceBrand" /></p>
      <h1 className="mt-2 text-3xl font-bold text-slate-950"><I18nText message={content.title as any} /></h1>
      <p className="mt-3 max-w-2xl text-slate-500"><I18nText message={content.description as any} /></p>
      <section className="mt-8 rounded-2xl border border-indigo-100 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-semibold text-indigo-700"><span className="h-2 w-2 rounded-full bg-indigo-500" /> Module en préparation</div>
        <p className="mt-3 text-sm leading-6 text-slate-600"><I18nText message={content.status as any} /></p>
      </section>
    </div>
  );
}