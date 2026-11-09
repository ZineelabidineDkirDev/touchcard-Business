"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut } from "@/app/actions/auth";

type Props = { name: string; email: string; notificationsEnabled?: boolean };

function Icon({ name, size = 19 }: { name: "bell" | "sun" | "moon" | "user" | "settings" | "logout" | "chevron" | "check"; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true as const };
  switch (name) {
    case "bell": return <svg {...common}><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></svg>;
    case "sun": return <svg {...common}><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" /></svg>;
    case "moon": return <svg {...common}><path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5 8.5 8.5 0 1 0 20.5 14.2Z" /></svg>;
    case "user": return <svg {...common}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>;
    case "settings": return <svg {...common}><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.7a8 8 0 0 1-1.6.9l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.6-.9l-1.7.7-1.4-2.4 1.4-1.1a7 7 0 0 1 0-1.9l-1.4-1.1 1.4-2.4 1.7.7a8 8 0 0 1 1.6-.9l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.6.9l1.7-.7 1.4 2.4-1.4 1.1a7 7 0 0 1 0 1.8Z" /></svg>;
    case "logout": return <svg {...common}><path d="M10 17l5-5-5-5m5 5H3" /><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" /></svg>;
    case "chevron": return <svg {...common}><path d="m7 10 5 5 5-5" /></svg>;
    case "check": return <svg {...common}><path d="m5 12 4 4L19 6" /></svg>;
  }
}

export function DashboardTopbar({ name, email, notificationsEnabled = true }: Props) {
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
        <button type="button" onClick={toggleTheme} aria-label={dark ? "Passer au thème clair" : "Passer au thème sombre"} title={dark ? "Mode clair" : "Mode sombre"} className="dashboard-icon-button flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 transition hover:bg-slate-100">
          <Icon name={dark ? "sun" : "moon"} />
        </button>
        <div className="relative">
          <button type="button" onClick={() => { setNotificationsOpen(!notificationsOpen); setMenuOpen(false); }} aria-expanded={notificationsOpen} aria-label="Notifications" className="dashboard-icon-button relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 transition hover:bg-slate-100">
            <Icon name="bell" />
            {notificationsEnabled && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-indigo-600 ring-2 ring-white" />}
          </button>
          {notificationsOpen && <div className="dashboard-popover absolute right-0 top-12 z-50 w-72 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl"><div className="flex items-center gap-2 font-bold text-slate-900"><Icon name="bell" size={17} /> Notifications</div><div className="mt-4 flex flex-col items-center py-3 text-center"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500"><Icon name="check" /></span><p className="mt-3 text-sm font-semibold text-slate-700">Tout est à jour</p><p className="mt-1 text-xs leading-5 text-slate-500">{notificationsEnabled ? "Aucune nouvelle notification pour le moment." : "Les notifications sont désactivées dans vos paramètres."}</p><Link href="/dashboard/settings" onClick={() => setNotificationsOpen(false)} className="mt-3 text-xs font-semibold text-indigo-600 hover:underline">Gérer les notifications</Link></div></div>}
        </div>
        <div className="relative">
          <button type="button" onClick={() => { setMenuOpen(!menuOpen); setNotificationsOpen(false); }} aria-expanded={menuOpen} className="flex max-w-[190px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-2 text-left transition hover:bg-slate-50 sm:px-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700"><Icon name="user" size={17} /></span>
            <span className="hidden min-w-0 sm:block"><span className="block truncate text-xs font-bold text-slate-900">{name || "Mon compte"}</span><span className="block max-w-[112px] truncate text-[10px] text-slate-400">{email}</span></span>
            <Icon name="chevron" size={15} />
          </button>
          {menuOpen && <div className="dashboard-popover absolute right-0 top-12 z-50 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white py-2 shadow-xl">
            <Link onClick={() => setMenuOpen(false)} href="/dashboard/profile" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"><Icon name="user" size={17} /> Mon profil</Link>
            <Link onClick={() => setMenuOpen(false)} href="/dashboard/settings" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"><Icon name="settings" size={17} /> Paramètres</Link>
            <div className="my-1 border-t border-slate-100" />
            <form action={signOut}><button className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-rose-600 hover:bg-rose-50"><Icon name="logout" size={17} /> Déconnexion</button></form>
          </div>}
        </div>
      </div>
    </header>
  );
}
