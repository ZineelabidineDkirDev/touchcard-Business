"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut } from "@/app/actions/auth";

type Props = { name: string; email: string };

export function DashboardTopbar({ name, email }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("touchcard-dashboard-theme");
    const enabled = saved === "dark";
    setDark(enabled);
    document.documentElement.dataset.theme = enabled ? "dark" : "light";
    return () => { document.documentElement.dataset.theme = "light"; };
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    window.localStorage.setItem("touchcard-dashboard-theme", next ? "dark" : "light");
  }

  return (
    <header className="dashboard-topbar sticky top-0 z-40 mb-6 flex min-h-[76px] items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur sm:px-6">
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[.18em] text-indigo-600">TouchCard Business</p>
        <p className="mt-1 truncate text-base font-extrabold text-slate-900 sm:text-lg">{name || "Espace client"}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <button type="button" onClick={toggleTheme} aria-label={dark ? "Passer au thème clair" : "Passer au thème sombre"} title={dark ? "Mode clair" : "Mode sombre"} className="dashboard-icon-button flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-lg text-slate-700 transition hover:bg-slate-100">
          {dark ? "☀" : "☾"}
        </button>
        <div className="relative">
          <button type="button" onClick={() => { setNotificationsOpen(!notificationsOpen); setMenuOpen(false); }} aria-label="Notifications" className="dashboard-icon-button relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-lg text-slate-700 transition hover:bg-slate-100">
            ♧
          </button>
          {notificationsOpen && <div className="dashboard-popover absolute right-0 top-12 z-50 w-72 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl"><p className="font-bold text-slate-900">Notifications</p><p className="mt-2 text-sm leading-5 text-slate-500">Aucune nouvelle notification pour le moment.</p><p className="mt-3 text-[11px] text-slate-400">Les alertes apparaîtront ici lorsqu'elles seront activées.</p></div>}
        </div>
        <div className="relative">
          <button type="button" onClick={() => { setMenuOpen(!menuOpen); setNotificationsOpen(false); }} aria-expanded={menuOpen} className="flex max-w-[190px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-2 text-left transition hover:bg-slate-50 sm:px-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-black text-indigo-700">{(name || email || "C").slice(0,1).toUpperCase()}</span>
            <span className="hidden min-w-0 sm:block"><span className="block truncate text-xs font-bold text-slate-900">{name || "Mon compte"}</span><span className="block max-w-[112px] truncate text-[10px] text-slate-400">{email}</span></span>
            <span className="text-xs text-slate-400">⌄</span>
          </button>
          {menuOpen && <div className="dashboard-popover absolute right-0 top-12 z-50 w-52 overflow-hidden rounded-2xl border border-slate-200 bg-white py-2 shadow-xl">
            <Link onClick={() => setMenuOpen(false)} href="/dashboard/settings?tab=profile" className="block px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50">Mon profil</Link>
            <Link onClick={() => setMenuOpen(false)} href="/dashboard/settings" className="block px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50">Paramètres</Link>
            <div className="my-1 border-t border-slate-100" />
            <form action={signOut}><button className="w-full px-4 py-3 text-left text-sm font-semibold text-rose-600 hover:bg-rose-50">Déconnexion</button></form>
          </div>}
        </div>
      </div>
    </header>
  );
}
