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
      { label: "Vue d’ensemble", href: "/dashboard", visible: true },
      { label: "Ma carte NFC", href: "/dashboard/cards", visible: !hasWorkspaceConfig || enabledModules.includes("digital_card") },
      { label: "Demandes reçues", href: "/dashboard/requests", visible: !hasWorkspaceConfig || enabledModules.some((value) => ["orders", "bookings", "quote_requests"].includes(value)) },
      { label: "Mes contacts", href: "/dashboard/contacts", visible: !hasWorkspaceConfig || enabledModules.includes("crm_contacts") },
      { label: "Statistiques", href: "/dashboard/analytics", visible: !hasWorkspaceConfig || enabledModules.includes("analytics") },
      { label: "Mon profil", href: "/dashboard/profile", visible: true },
    ].filter((item) => item.visible && !hiddenModules.includes(item.href === "/dashboard/cards" ? "digital_card" : item.href === "/dashboard/contacts" ? "crm_contacts" : item.href === "/dashboard/analytics" ? "analytics" : item.href === "/dashboard/requests" ? "requests" : ""));

    return (
      <nav aria-label="Navigation de l’espace client" className="flex flex-wrap items-center gap-2">
        {clientItems.map((item) => {
          const active = item.href === "/dashboard" ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/");
          return <Link key={item.href} href={item.href} className={`rounded-xl px-3.5 py-2.5 text-sm font-bold transition ${active ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" : "text-slate-600 hover:bg-indigo-50 hover:text-indigo-700"}`}>{item.label}</Link>;
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
