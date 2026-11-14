"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "@/app/actions/auth";
import { LanguageSwitcher } from "@/i18n/provider";
import { DashboardNavigation, DashboardLogoutLabel } from "@/components/dashboard/dashboard-navigation";
import { DashboardTopbar } from "@/components/dashboard/dashboard-topbar";

type Props = {
  children: React.ReactNode;
  clientDisplayName: string;
  email: string;
  avatarUrl: string;
  notificationsEnabled: boolean;
  enabledModules: string[];
  hasWorkspaceConfig: boolean;
  hiddenModules: string[];
};

export function ClientDashboardShell({
  children,
  clientDisplayName,
  email,
  avatarUrl,
  notificationsEnabled,
  enabledModules,
  hasWorkspaceConfig,
  hiddenModules,
}: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-[#f5f7fc]">
      <aside
        id="client-dashboard-sidebar"
        aria-label="Menu latéral client"
        className={`z-30 w-full border-b border-slate-200 bg-white px-5 py-5 shadow-sm transition-all duration-300 ease-in-out lg:fixed lg:inset-y-0 lg:left-0 lg:h-screen lg:w-72 lg:overflow-y-auto lg:border-b-0 lg:border-r lg:shadow-none ${sidebarOpen ? "block translate-x-0 opacity-100" : "hidden -translate-x-4 opacity-0 lg:hidden"}`}
      >
        <Link href="/dashboard" className="inline-flex items-center gap-3" aria-label="TouchCard Business - espace client">
          <img src="/brand/touchcard-mark.svg" alt="" className="h-11 w-11 object-contain" />
          <span className="flex flex-col leading-none">
            <strong className="text-2xl font-black tracking-tight text-slate-950">TouchCard</strong>
            <span className="mt-1 text-[10px] font-bold tracking-[.2em] text-slate-500">BUSINESS WORKSPACE</span>
          </span>
        </Link>
        <div className="mt-5 rounded-2xl bg-slate-50 px-3 py-3">
          <p className="truncate text-sm font-extrabold text-slate-900">{clientDisplayName || "Mon entreprise"}</p>
          <p className="mt-1 truncate text-[11px] text-slate-500">{email}</p>
        </div>
        <div className="mt-4"><LanguageSwitcher /></div>
        <DashboardNavigation
          isSuperAdmin={false}
          enabledModules={enabledModules}
          hasWorkspaceConfig={hasWorkspaceConfig}
          hiddenModules={hiddenModules}
        />
        <div className="mt-5 border-t border-slate-100 pt-4 lg:mt-8">
          <Link href="/dashboard/settings" className="flex items-center rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-indigo-700">
            Paramètres de l’espace
          </Link>
          <form action={signOut}>
            <button className="mt-2 flex w-full items-center rounded-xl px-3 py-2.5 text-left text-sm font-bold text-rose-600 transition hover:bg-rose-50">
              <DashboardLogoutLabel />
            </button>
          </form>
        </div>
      </aside>

      <main className={`min-w-0 px-4 pb-8 pt-4 transition-[margin] duration-300 sm:px-7 lg:px-8 ${sidebarOpen ? "lg:ml-72" : "lg:ml-0"}`}>
        <div className="sticky top-0 z-20 mb-6 flex items-center gap-3 bg-[#f5f7fc]/95 pb-3 pt-1 backdrop-blur-xl">
          <button
            type="button"
            onClick={() => setSidebarOpen((open) => !open)}
            aria-controls="client-dashboard-sidebar"
            aria-expanded={sidebarOpen}
            aria-label={sidebarOpen ? "Masquer le menu latéral" : "Afficher le menu latéral"}
            title={sidebarOpen ? "Masquer le menu" : "Afficher le menu"}
            className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {sidebarOpen ? <><path d="M4 6h16M4 12h16M4 18h16" /><path d="m17 9 3 3-3 3" /></> : <><path d="M4 6h16M4 12h16M4 18h16" /><path d="m7 9-3 3 3 3" /></>}
            </svg>
            <span className="hidden sm:inline">{sidebarOpen ? "Masquer le menu" : "Afficher le menu"}</span>
          </button>
          <div className="min-w-0 flex-1">
            <DashboardTopbar
              name={clientDisplayName}
              email={email}
              avatarUrl={avatarUrl}
              notificationsEnabled={notificationsEnabled}
              isSuperAdmin={false}
            />
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}
