"use client";

import Link from "next/link";
import { useI18n } from "@/i18n/provider";

const items = [
  ["overview", "/dashboard", null],
  ["cards", "/dashboard/cards", "digital_card"],
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
}: {
  isSuperAdmin?: boolean;
  enabledModules?: string[];
  hasWorkspaceConfig?: boolean;
}) {
  const { t } = useI18n();
  const visibleItems = items.filter(([, , module]) =>
    !hasWorkspaceConfig || !module || enabledModules.includes(module)
  );

  return (
    <nav className="mt-8 flex gap-2 overflow-x-auto lg:flex-col">
      {visibleItems.map(([key, href]) => (
        <Link
          key={href}
          href={href}
          className="whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-700"
        >
          {t(key)}
        </Link>
      ))}
      {isSuperAdmin && (
        <Link href="/dashboard/admin" className="whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50">
          Vue globale Super Admin
        </Link>
      )}
      {isSuperAdmin && (
        <Link href="/dashboard/prospects" className="whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50">
          Prospects / Demandes clients
        </Link>
      )}
    </nav>
  );
}

export function DashboardLogoutLabel() {
  const { t } = useI18n();
  return <span>{t("logout")}</span>;
}
