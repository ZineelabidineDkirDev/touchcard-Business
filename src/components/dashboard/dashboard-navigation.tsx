"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/i18n/provider";

const items = [
  ["overview", "/dashboard", null],
  ["cards", "/dashboard/cards", "digital_card"],
  ["requests", "/dashboard/requests", "requests"],
  ["contacts", "/dashboard/contacts", "crm_contacts"],
  ["team", "/dashboard/team", "team"],
  ["analytics", "/dashboard/analytics", "analytics"],
  ["loyalty", "/dashboard/loyalty", "loyalty"],
  ["settings", "/dashboard/settings", null],
] as const;

export function DashboardNavigation({
  isSuperAdmin = false,
  enabledModules = [],
  hasWorkspaceConfig = false,
  hiddenModules = [],
}: {
  isSuperAdmin?: boolean;
  enabledModules?: string[];
  hasWorkspaceConfig?: boolean;
  hiddenModules?: string[];
}) {
  const { t } = useI18n();
  const pathname = usePathname();

  if (!isSuperAdmin) {
    const clientItems = [
      { label: "Vue d’ensemble", href: "/dashboard", modules: [] as string[] },
      { label: "Ma carte NFC", href: "/dashboard/cards", modules: ["digital_card"] },
      { label: "Demandes reçues", href: "/dashboard/requests", modules: ["orders", "bookings", "quote_requests"] },
      { label: "Mes contacts", href: "/dashboard/contacts", modules: ["crm_contacts"] },
      { label: "Mon équipe", href: "/dashboard/team", modules: ["team"] },
      { label: "Statistiques", href: "/dashboard/analytics", modules: ["analytics"] },
      { label: "Mon profil", href: "/dashboard/profile", modules: ["company_profile", "contact_profile"] },
    ].filter((item) => {
      if (!hasWorkspaceConfig || item.modules.length === 0) return true;
      if (item.modules.some((module) => hiddenModules.includes(module))) return false;
      return item.modules.some((module) => enabledModules.includes(module));
    });

    return (
      <nav aria-label="Navigation de l’espace client" className="flex w-full flex-nowrap items-center gap-2 overflow-x-auto overscroll-x-contain whitespace-nowrap pb-1 [scrollbar-width:thin]">
        {clientItems.map((item) => {
          const active = item.href === "/dashboard" ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/");
          return <Link key={item.href} href={item.href} className={`shrink-0 rounded-xl px-3.5 py-2.5 text-sm font-bold transition ${active ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" : "text-slate-600 hover:bg-indigo-50 hover:text-indigo-700"}`}>{item.label}</Link>;
        })}
      </nav>
    );
  }

  const visibleItems = items.filter(([key, , module]) => {
    if (key === "settings" || key === "overview") return true;
    if (module && hiddenModules.includes(module)) return false;
    if (!hasWorkspaceConfig || !module) return true;
    if (module === "requests") return enabledModules.some((value) => ["orders", "bookings", "quote_requests"].includes(value));
    return enabledModules.includes(module);
  });

  return (
    <nav className="mt-8 flex gap-2 overflow-x-auto lg:flex-col">
      {visibleItems.map(([key, href]) => (
        <Link key={href} href={href} className="whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-700">
          {key === "requests" ? "Demandes clients" : t(key)}
        </Link>
      ))}
      <Link href="/dashboard/admin" className="whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50">Vue globale Super Admin</Link>
      <Link href="/dashboard/prospects" className="whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50">Prospects / Demandes clients</Link>
    </nav>
  );
}

export function DashboardLogoutLabel() {
  const { t } = useI18n();
  return <span>{t("logout")}</span>;
}
