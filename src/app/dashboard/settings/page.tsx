import { connection } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { saveDashboardSettings } from "@/app/actions/dashboard-settings";

// Chaque rubrique du menu est liée aux modules activés à la création de l'espace client (formule demandée).
const modules = [
  { id: "digital_card", title: "Cartes digitales", description: "Accès à la gestion de vos cartes NFC et QR.", workspace: ["digital_card"] },
  { id: "requests", title: "Demandes clients", description: "Commandes, réservations et demandes de devis.", workspace: ["orders", "bookings", "quote_requests"] },
  { id: "crm_contacts", title: "Contacts & prospects", description: "Votre carnet de contacts et vos prospects.", workspace: ["crm_contacts"] },
  { id: "team", title: "Équipe", description: "Gestion des membres et des accès de votre équipe.", workspace: ["team"] },
  { id: "analytics", title: "Statistiques", description: "Consultation des vues, scans et interactions.", workspace: ["analytics"] },
];

export default async function DashboardSettingsPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  await connection();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const query = await searchParams;
  const preferences = (user.user_metadata?.dashboard_preferences ?? {}) as {
    hidden_modules?: string[];
    notifications_enabled?: boolean;
    email_notifications?: boolean;
    browser_notifications?: boolean;
  };
  const hidden = Array.isArray(preferences.hidden_modules) ? preferences.hidden_modules : [];
  const { data: membership } = await supabase.from("organization_members").select("organization_id").eq("user_id", user.id).limit(1).maybeSingle();
  let enabledModules: string[] = [];
  let hasWorkspaceConfig = false;
  if (membership?.organization_id) {
    const { data: organization } = await supabase.from("organizations").select("workspace_config").eq("id", membership.organization_id).maybeSingle();
    const config = organization?.workspace_config as { version?: number; modules?: string[] } | null;
    hasWorkspaceConfig = Boolean(config?.version);
    enabledModules = Array.isArray(config?.modules) ? config.modules : [];
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-7"><p className="text-sm font-semibold text-indigo-600">Personnalisation</p><h1 className="mt-2 text-3xl font-black text-slate-950">Paramètres</h1><p className="mt-2 text-sm text-slate-500">Adaptez votre tableau de bord à votre manière de travailler.</p></div>
      {query.saved === "1" && <p role="status" className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">Vos paramètres ont été enregistrés.</p>}
      {query.error && <p role="alert" className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">L'enregistrement a échoué. Veuillez réessayer.</p>}
      <form action={saveDashboardSettings} className="space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-5"><h2 className="text-lg font-bold text-slate-900">Modules du tableau de bord</h2><p className="mt-1 text-sm text-slate-500">Activez ou masquez les rubriques dans votre menu. Cela ne modifie pas votre abonnement ni vos données.</p></div>
          <div className="divide-y divide-slate-100">
            {modules.map((module) => {
              const included = !hasWorkspaceConfig || module.workspace.some((id) => enabledModules.includes(id));
              return (
                <label key={module.id} className={`flex items-center justify-between gap-4 py-4 ${included ? "cursor-pointer" : "cursor-not-allowed opacity-60"}`}>
                  <span><span className="block text-sm font-semibold text-slate-800">{module.title}</span><span className="mt-1 block text-xs text-slate-500">{included ? module.description : "Non inclus dans votre formule actuelle."}</span></span>
                  {included && <input type="hidden" name="rendered_module" value={module.id} />}
                  <input type="checkbox" name={module.id} defaultChecked={included && !hidden.includes(module.id)} disabled={!included} className="peer sr-only" />
                  <span aria-hidden="true" className="relative h-7 w-12 shrink-0 rounded-full border border-blue-300/40 bg-[#1b2f78]/40 transition peer-checked:border-transparent peer-checked:bg-gradient-to-r peer-checked:from-cyan-400 peer-checked:to-blue-600 peer-focus-visible:ring-2 peer-focus-visible:ring-cyan-300 after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-5" />
                </label>
              );
            })}
          </div>
        </section>
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-5"><h2 className="text-lg font-bold text-slate-900">Notifications</h2><p className="mt-1 text-sm text-slate-500">Choisissez les préférences de notification de votre espace.</p></div>
          <div className="space-y-4">
            <label className="flex items-center justify-between gap-4"><span><span className="block text-sm font-semibold text-slate-800">Notifications dans le tableau de bord</span><span className="text-xs text-slate-500">Activer l'affichage des alertes dans la barre supérieure.</span></span><input type="checkbox" name="notifications_enabled" defaultChecked={preferences.notifications_enabled ?? true} className="peer sr-only" /><span aria-hidden="true" className="relative h-7 w-12 shrink-0 rounded-full border border-blue-300/40 bg-[#1b2f78]/40 transition peer-checked:border-transparent peer-checked:bg-gradient-to-r peer-checked:from-cyan-400 peer-checked:to-blue-600 peer-focus-visible:ring-2 peer-focus-visible:ring-cyan-300 after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-5" /></label>
            <label className="flex items-center justify-between gap-4"><span><span className="block text-sm font-semibold text-slate-800">Notifications par e-mail</span><span className="text-xs text-slate-500">Préférence enregistrée, l'envoi automatique sera activé avec le service de notifications.</span></span><input type="checkbox" name="email_notifications" defaultChecked={preferences.email_notifications ?? false} className="peer sr-only" /><span aria-hidden="true" className="relative h-7 w-12 shrink-0 rounded-full border border-blue-300/40 bg-[#1b2f78]/40 transition peer-checked:border-transparent peer-checked:bg-gradient-to-r peer-checked:from-cyan-400 peer-checked:to-blue-600 peer-focus-visible:ring-2 peer-focus-visible:ring-cyan-300 after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-5" /></label>
            <label className="flex items-center justify-between gap-4"><span><span className="block text-sm font-semibold text-slate-800">Notifications du navigateur</span><span className="text-xs text-slate-500">Préférence enregistrée pour les futures alertes navigateur.</span></span><input type="checkbox" name="browser_notifications" defaultChecked={preferences.browser_notifications ?? false} className="peer sr-only" /><span aria-hidden="true" className="relative h-7 w-12 shrink-0 rounded-full border border-blue-300/40 bg-[#1b2f78]/40 transition peer-checked:border-transparent peer-checked:bg-gradient-to-r peer-checked:from-cyan-400 peer-checked:to-blue-600 peer-focus-visible:ring-2 peer-focus-visible:ring-cyan-300 after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-5" /></label>
          </div>
        </section>
        <div className="flex justify-end"><button type="submit" className="btn-primary">Enregistrer les paramètres</button></div>
      </form>
    </div>
  );
}
