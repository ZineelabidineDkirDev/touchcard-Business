"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { signOut } from "@/app/actions/auth";
import type { ReactNode } from "react";

type AdminNotification = {
  id: string;
  full_name: string;
  brand_name: string | null;
  card_type: string;
  city: string | null;
  created_at: string;
};

type Props = {
  name: string;
  email: string;
  avatarUrl?: string;
  notificationsEnabled?: boolean;
  isSuperAdmin?: boolean;
  navigation?: ReactNode;
};

function Icon({ name, size = 19 }: { name: "bell" | "sun" | "moon" | "user" | "settings" | "logout" | "chevron" | "check" | "inbox" | "arrow"; size?: number }) {
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
    case "inbox": return <svg {...common}><path d="M4 4h16v16H4z" /><path d="M4 13h4l2 3h4l2-3h4" /></svg>;
    case "arrow": return <svg {...common}><path d="M5 12h14m-6-6 6 6-6 6" /></svg>;
  }
}

const cardLabels: Record<string, string> = {
  contact: "Contact",
  service: "E-Service",
  "e-business": "E-Business",
  "google-review": "Avis Google",
};

export function DashboardTopbar({ name, email, avatarUrl = "", notificationsEnabled = true, isSuperAdmin = false, navigation }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [dark, setDark] = useState(true);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  const loadNotifications = useCallback(async () => {
    if (!isSuperAdmin || !notificationsEnabled) return;
    setNotificationsLoading(true);
    try {
      const response = await fetch("/api/admin/notifications", { cache: "no-store" });
      if (!response.ok) throw new Error("Notification request failed");
      const payload = await response.json();
      setNotifications(Array.isArray(payload.notifications) ? payload.notifications : []);
      setNotificationCount(Number(payload.count) || 0);
    } catch (error) {
      console.error("Unable to refresh admin notifications", error);
    } finally {
      setNotificationsLoading(false);
    }
  }, [isSuperAdmin, notificationsEnabled]);

  useEffect(() => {
    const saved = window.localStorage.getItem("touchcard-dashboard-theme");
    const enabled = saved !== "light";
    setDark(enabled);
    document.documentElement.dataset.theme = enabled ? "dark" : "light";
    return () => { document.documentElement.dataset.theme = "light"; };
  }, []);

  useEffect(() => {
    if (!isSuperAdmin || !notificationsEnabled) {
      setNotifications([]);
      setNotificationCount(0);
      return;
    }
    void loadNotifications();
    const interval = window.setInterval(() => void loadNotifications(), 30000);
    return () => window.clearInterval(interval);
  }, [isSuperAdmin, notificationsEnabled, loadNotifications]);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    window.localStorage.setItem("touchcard-dashboard-theme", next ? "dark" : "light");
  }

  return (
    <header className={"dashboard-topbar " + (isSuperAdmin ? "sticky top-0 z-40 mb-6 " : "mb-0 ") + "relative flex min-h-[64px] flex-wrap items-center justify-between gap-x-4 gap-y-3 rounded-2xl border border-slate-200 bg-white/95 px-3 py-3 shadow-sm backdrop-blur sm:px-5"}>
      {isSuperAdmin && <div className="flex min-w-0 items-center gap-3">
        <Link href="/dashboard/admin" aria-label="TouchCard Business - tableau de bord" className="flex shrink-0 items-center gap-2">
          <img src="/brand/touchcard-mark.svg" alt="" className="h-10 w-10 object-contain"/>
          <span className="flex flex-col leading-none"><strong className="text-base font-black tracking-tight text-slate-900">TouchCard</strong><span className="mt-1 text-[9px] font-bold tracking-[.16em] text-slate-500">BUSINESS</span></span>
        </Link>
        <span className="hidden h-8 w-px bg-slate-200 sm:block"/>
        <p className="min-w-0 truncate text-sm font-extrabold text-slate-900 sm:text-base">{name || "Super Admin"}</p>
      </div>}
      {!isSuperAdmin && <Link href="/dashboard" className="hidden min-w-0 shrink-0 items-center gap-2 xl:flex" aria-label="TouchCard Business - tableau de bord"><img src="/brand/touchcard-mark.svg" alt="" className="h-9 w-9 object-contain"/><span className="flex flex-col leading-none"><strong className="text-sm font-black tracking-tight text-slate-900">TouchCard</strong><span className="mt-1 text-[9px] font-bold tracking-[.16em] text-slate-500">BUSINESS</span></span></Link>}
      {!isSuperAdmin && navigation && <div className="order-3 w-full min-w-0 xl:order-2 xl:w-auto xl:flex-1">{navigation}</div>}
      <div className={"flex shrink-0 items-center gap-2 sm:gap-3 " + (!isSuperAdmin ? "order-2 ml-auto xl:order-3 xl:ml-0" : "")}>
        <button type="button" onClick={toggleTheme} aria-label={dark ? "Passer au thème clair" : "Passer au thème sombre"} title={dark ? "Mode clair" : "Mode sombre"} className="dashboard-icon-button flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 transition hover:bg-slate-100">
          <Icon name={dark ? "sun" : "moon"} />
        </button>
        {!isSuperAdmin && <div className="relative">
          <button type="button" onClick={() => { setNotificationsOpen(!notificationsOpen); setMenuOpen(false); }} aria-expanded={notificationsOpen} aria-label="Notifications" className="dashboard-icon-button relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 transition hover:bg-slate-100"><Icon name="bell" /></button>
          {notificationsOpen && <div className="dashboard-popover absolute right-0 top-12 z-50 w-[min(320px,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white p-5 shadow-xl"><p className="font-bold text-slate-900">Notifications</p><p className="mt-2 text-sm text-slate-500">Vous serez informé ici des nouvelles activités concernant votre espace.</p><div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">Aucune nouvelle notification.</div></div>}
        </div>}
        {isSuperAdmin && <div className="relative">
          <button type="button" onClick={() => { const next = !notificationsOpen; setNotificationsOpen(next); setMenuOpen(false); if (next) void loadNotifications(); }} aria-expanded={notificationsOpen} aria-label={`Notifications : ${notificationCount} demande(s) en attente`} className="dashboard-icon-button relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 transition hover:bg-slate-100">
            <Icon name="bell" />
            {notificationsEnabled && notificationCount > 0 && <span className="absolute -right-1 -top-1 flex min-h-[19px] min-w-[19px] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-black text-white ring-2 ring-white">{notificationCount > 99 ? "99+" : notificationCount}</span>}
          </button>
          {notificationsOpen && <div className="dashboard-popover absolute right-0 top-12 z-50 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div><p className="flex items-center gap-2 font-bold text-slate-900"><Icon name="bell" size={17} /> Nouvelles demandes</p><p className="mt-1 text-[11px] text-slate-500">Demandes à examiner par le Super Admin</p></div>
              {notificationCount > 0 && <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700">{notificationCount} en attente</span>}
            </div>
            {!notificationsEnabled ? <p className="p-5 text-sm text-slate-500">Les notifications sont désactivées dans vos paramètres.</p> : notificationsLoading && notifications.length === 0 ? <p className="p-5 text-sm text-slate-500">Chargement des demandes…</p> : notifications.length === 0 ? <div className="flex flex-col items-center px-5 py-7 text-center"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><Icon name="check" /></span><p className="mt-3 text-sm font-semibold text-slate-800">Aucune nouvelle demande</p><p className="mt-1 text-xs text-slate-500">Les nouvelles demandes apparaîtront ici automatiquement.</p></div> : <div className="max-h-[min(420px,65vh)] overflow-y-auto divide-y divide-slate-100">
              {notifications.map((item) => <Link key={item.id} href={`/dashboard/prospects#${item.id}`} onClick={() => setNotificationsOpen(false)} className="block px-4 py-3 transition hover:bg-indigo-50/60">
                <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-bold text-slate-900">{item.brand_name || item.full_name}</p><p className="mt-1 text-xs text-slate-600">{item.full_name} · {cardLabels[item.card_type] || item.card_type}</p><p className="mt-1 text-[11px] text-slate-400">{item.city || "Ville non précisée"} · {new Date(item.created_at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}</p></div><span className="mt-1 shrink-0 text-indigo-600"><Icon name="arrow" size={17} /></span></div>
                <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700">Examiner la demande <Icon name="arrow" size={13} /></span>
              </Link>)}
            </div>}
            <div className="border-t border-slate-100 bg-slate-50 px-4 py-3"><Link href="/dashboard/prospects" onClick={() => setNotificationsOpen(false)} className="text-xs font-bold text-indigo-700 hover:underline">Ouvrir toutes les demandes</Link><Link href="/dashboard/settings" onClick={() => setNotificationsOpen(false)} className="float-right text-xs font-medium text-slate-500 hover:underline">Paramètres</Link></div>
          </div>}
        </div>}
        <div className="relative">
          <button type="button" onClick={() => { setMenuOpen(!menuOpen); setNotificationsOpen(false); }} aria-expanded={menuOpen} className="flex max-w-[190px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-2 text-left transition hover:bg-slate-50 sm:px-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-indigo-100 text-indigo-700">{avatarUrl ? <img src={avatarUrl} alt="" className="h-full w-full object-cover"/> : <Icon name="user" size={17} />}</span>
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
