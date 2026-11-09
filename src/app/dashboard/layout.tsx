import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { signOut } from "@/app/actions/auth";
import { createClient } from "@/lib/supabase/server";
import { isPlatformSuperAdmin } from "@/lib/auth/platform-admin";
import { LanguageSwitcher } from "@/i18n/provider";
import { DashboardNavigation, DashboardLogoutLabel } from "@/components/dashboard/dashboard-navigation";
import { DashboardTopbar } from "@/components/dashboard/dashboard-topbar";

function DashboardLoading() {
  return (
    <div className="min-h-screen bg-slate-50 p-8"><div className="mx-auto max-w-7xl animate-pulse"><div className="h-8 w-56 rounded bg-slate-200" /><div className="mt-6 h-4 w-80 rounded bg-slate-200" /><div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-32 rounded-2xl bg-white" />)}</div></div></div>
  );
}

async function AuthenticatedDashboard({ children }: Readonly<{ children: React.ReactNode }>) {
  await connection();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const isSuperAdmin = isPlatformSuperAdmin(user.email);
  if (!isSuperAdmin) {
    const { data: clientRequest } = await supabase.from("prospect_requests").select("status, password_initialized, client_access_enabled").eq("user_id", user.id).maybeSingle();
    if (clientRequest && ["rejected", "cancelled"].includes(clientRequest.status)) redirect("/account-pending?blocked=1");
    if (clientRequest && !clientRequest.password_initialized) redirect("/setup-password");
    if (clientRequest && !clientRequest.client_access_enabled) redirect("/account-pending");
  }
  const { data: membership } = await supabase.from("organization_members").select("organization_id").eq("user_id", user.id).limit(1).maybeSingle();
  let enabledModules: string[] = [];
  let hasWorkspaceConfig = false;
  let clientDisplayName = String(user.user_metadata.full_name || user.user_metadata.name || "");
  if (membership?.organization_id) {
    const { data: organization } = await supabase.from("organizations").select("name, workspace_config").eq("id", membership.organization_id).maybeSingle();
    const config = organization?.workspace_config as { version?: number; modules?: string[] } | null;
    hasWorkspaceConfig = Boolean(config?.version);
    if (organization?.name) clientDisplayName = organization.name;
    enabledModules = Array.isArray(config?.modules) ? config.modules : [];
  }
  const preferences = (user.user_metadata?.dashboard_preferences ?? {}) as { hidden_modules?: string[]; notifications_enabled?: boolean };
  const hiddenModules = Array.isArray(preferences.hidden_modules) ? preferences.hidden_modules : [];

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-[#f5f7fc]">
        <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur">
          <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-7">
            <Link href="/dashboard" className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-lg font-black text-white shadow-md shadow-indigo-200">T</span>
              <span><span className="block text-lg font-black tracking-tight text-slate-950">Touch<span className="text-indigo-600">Card</span></span><span className="block text-[10px] font-bold uppercase tracking-[.18em] text-slate-400">Espace client</span></span>
            </Link>
            <div className="flex items-center gap-3"><LanguageSwitcher /><form action={signOut}><button className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"><DashboardLogoutLabel /></button></form></div>
          </div>
          <div className="mx-auto max-w-[1500px] px-4 pb-3 sm:px-7">
            <DashboardNavigation isSuperAdmin={false} enabledModules={enabledModules} hasWorkspaceConfig={hasWorkspaceConfig} hiddenModules={hiddenModules} />
          </div>
        </header>
        <main className="mx-auto min-w-0 max-w-[1500px] px-4 py-6 sm:px-7 sm:py-8">
          <DashboardTopbar name={clientDisplayName} email={user.email || ""} notificationsEnabled={preferences.notifications_enabled ?? true} isSuperAdmin={false} />
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      <aside className="w-full border-b border-slate-200 bg-white p-5 lg:fixed lg:inset-y-0 lg:w-64 lg:border-b-0 lg:border-r">
        <Link href="/" className="text-2xl font-black tracking-tight text-slate-950">Touch<span className="text-indigo-600">Card</span></Link>
        <p className="mt-1 text-xs text-slate-400">BUSINESS WORKSPACE</p>
        <div className="mt-4"><LanguageSwitcher /></div>
        <DashboardNavigation isSuperAdmin={true} enabledModules={enabledModules} hasWorkspaceConfig={hasWorkspaceConfig} hiddenModules={hiddenModules} />
        <div className="mt-8 border-t border-slate-100 pt-5 lg:absolute lg:inset-x-5 lg:bottom-6">
          <p className="truncate text-sm font-semibold text-slate-800">{String(user.user_metadata.full_name || user.email)}</p>
          <p className="mt-1 truncate text-xs text-slate-400">{user.email}</p>
          <form action={signOut}><button className="mt-4 text-sm font-semibold text-rose-600"><DashboardLogoutLabel /></button></form>
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-4 sm:p-7 lg:ml-64"><DashboardTopbar name={clientDisplayName} email={user.email || ""} notificationsEnabled={preferences.notifications_enabled ?? true} isSuperAdmin={true} />{children}</main>
    </div>
  );
}

export default function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <Suspense fallback={<DashboardLoading />}><AuthenticatedDashboard>{children}</AuthenticatedDashboard></Suspense>;
}
