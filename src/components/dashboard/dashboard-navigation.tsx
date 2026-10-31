"use client";

import Link from "next/link";
import { useI18n } from "@/i18n/provider";

const items = [
  ["overview", "/dashboard"],
  ["cards", "/dashboard/cards"],
  ["contacts", "/dashboard/contacts"],
  ["team", "/dashboard/team"],
  ["analytics", "/dashboard/analytics"],
  ["loyalty", "/dashboard/loyalty"],
  ["settings", "/dashboard/settings"],
] as const;

export function DashboardNavigation() {
  const { t } = useI18n();
  return <nav className="mt-8 flex gap-2 overflow-x-auto lg:flex-col">
    {items.map(([key, href]) => <Link key={href} href={href} className="whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-700">{t(key)}</Link>)}
  </nav>;
}

export function DashboardLogoutLabel() {
  const { t } = useI18n();
  return <span>{t("logout")}</span>;
}
