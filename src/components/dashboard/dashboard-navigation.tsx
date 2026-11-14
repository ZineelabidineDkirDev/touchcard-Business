"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/i18n/provider";

const clientItems: { label: string; href: string; modules: string[]; key?: string; section: string }[] = [
  { label: "Vue d’ensemble", href: "/dashboard", modules: [], section: "Espace" },
  { label: "Ma carte NFC", href: "/dashboard/cards", modules: ["digital_card"], key: "digital_card", section: "Espace" },
  { label: "Demandes reçues", href: "/dashboard/requests", modules: ["orders", "bookings", "quote_requests", "car_rental", "doctor_appointments"], key: "requests", section: "Activité" },
  { label: "Calendrier & disponibilités", href: "/dashboard/calendar", modules: ["bookings", "availability_calendar", "doctor_appointments", "car_rental"], key: "calendar", section: "Activité" },
  { label: "Location de voitures", href: "/dashboard/rentals", modules: ["car_rental"], key: "car_rental", section: "Gestion métier" },
  { label: "Santé & praticiens", href: "/dashboard/healthcare", modules: ["doctor_appointments"], key: "doctor_appointments", section: "Gestion métier" },
  { label: "Catalogue & prestations", href: "/dashboard/modules", modules: ["service_catalog", "room_catalog", "bookings", "availability_calendar"], key: "catalog", section: "Gestion métier" },
  { label: "Restaurant · Boutique · Spa", href: "/dashboard/modules", modules: ["service_catalog", "product_catalog", "orders"], key: "commerce", section: "Gestion métier" },
  { label: "Gym & abonnements", href: "/dashboard/modules", modules: ["gym_registration"], key: "gym", section: "Gestion métier" },
  { label: "École & formations", href: "/dashboard/modules", modules: ["school_registration"], key: "school", section: "Gestion métier" },
  { label: "Mes contacts", href: "/dashboard/contacts", modules: ["crm_contacts"], key: "crm_contacts", section: "Relation client" },
  { label: "Statistiques", href: "/dashboard/analytics", modules: ["analytics"], key: "analytics", section: "Relation client" },
  { label: "Mon profil", href: "/dashboard/profile", modules: ["company_profile", "contact_profile"], key: "profile", section: "Compte" },
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
      if ((item.key && hiddenModules.includes(item.key)) || item.modules.some((module) => hiddenModules.includes(module))) return false;
      return item.modules.some((module) => enabledModules.includes(module));
    });
    const sections = [...new Set(visibleClientItems.map((item) => item.section))];
    return (
      <nav aria-label="Navigation de l’espace client" className="mt-8 flex w-full flex-col gap-1">
        {sections.map((section) => (
          <div key={section} className="mb-3">
            <p className="mb-2 px-3 text-[10px] font-extrabold uppercase tracking-[.17em] text-slate-400">{section}</p>
            <div className="space-y-1">
              {visibleClientItems.filter((item) => item.section === section).map((item) => {
                const active = item.href === "/dashboard"
                  ? pathname === item.href
                  : pathname === item.href || (item.href !== "/dashboard/modules" && pathname.startsWith(item.href + "/"));
                return <Link key={item.key || item.href} href={item.href} aria-current={active ? "page" : undefined}
                  className={`group flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${active ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" : "text-slate-600 hover:bg-indigo-50 hover:text-indigo-700"}`}>
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${active ? "bg-white" : "bg-slate-300 group-hover:bg-indigo-500"}`} />
                  <span className="min-w-0 truncate">{item.label}</span>
                </Link>;
              })}
            </div>
          </div>
        ))}
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
