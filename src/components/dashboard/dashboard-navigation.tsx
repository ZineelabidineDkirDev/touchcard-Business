"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/i18n/provider";

const clientItems = [
  { label: "Vue d’ensemble", href: "/dashboard", modules: [] as string[] },
  { label: "Ma carte NFC", href: "/dashboard/cards", modules: ["digital_card"] },
  { label: "Demandes reçues", href: "/dashboard/requests", modules: ["orders", "bookings", "quote_requests"] },
  { label: "Mes contacts", href: "/dashboard/contacts", modules: ["crm_contacts"] },
  { label: "Mon équipe", href: "/dashboard/team", modules: ["team"] },
  { label: "Statistiques", href: "/dashboard/analytics", modules: ["analytics"] },
  { label: "Mon profil", href: "/dashboard/profile", modules: ["company_profile", "contact_profile"] },
];

const superAdminItems = [
  { label: "Statistiques", href: "/dashboard/admin", description: "Vue globale de la plateforme" },
  { label: "Demandes clients", href: "/dashboard/prospects", description: "Nouvelles inscriptions et validations" },
  { label: "Portefeuille clients", href: "/dashboard/cards", description: "Comptes, cartes NFC et activité des clients" },
  { label: "Préférences", href: "/dashboard/settings", description: "Préférences personnelles du tableau de bord" },
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
    const visibleClientItems = clientItems.filter((item) => {
      if (!hasWorkspaceConfig || item.modules.length === 0) return true;
      if (item.modules.some((module) => hiddenModules.includes(module))) return false;
      return item.modules.some((module) => enabledModules.includes(module));
    });

    return (
      <nav aria-label="Navigation de l’espace client" className="flex w-full flex-nowrap items-center gap-2 overflow-x-auto overscroll-x-contain whitespace-nowrap pb-1 [scrollbar-width:thin]">
        {visibleClientItems.map((item) => {
          const active = item.href === "/dashboard" ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/");
          return <Link key={item.href} href={item.href} className={`shrink-0 rounded-xl px-3.5 py-2.5 text-sm font-bold transition ${active ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" : "text-slate-600 hover:bg-indigo-50 hover:text-indigo-700"}`}>{item.label}</Link>;
        })}
      </nav>
    );
  }

  return (
    <nav aria-label="Navigation Super Admin" className="mt-8 flex gap-2 overflow-x-auto lg:flex-col">
      <p className="mb-1 px-3 text-[10px] font-black uppercase tracking-[.18em] text-slate-400">Pilotage plateforme</p>
      {superAdminItems.map((item) => {
        const active = item.href === "/dashboard/admin"
          ? pathname === item.href || pathname === "/dashboard"
          : pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            title={item.description}
            className={`whitespace-nowrap rounded-xl px-3 py-3 text-sm font-semibold transition ${active ? "bg-indigo-600 text-white shadow-md shadow-indigo-100" : "text-slate-600 hover:bg-indigo-50 hover:text-indigo-700"}`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function DashboardLogoutLabel() {
  const { t } = useI18n();
  return <span>{t("logout")}</span>;
}
