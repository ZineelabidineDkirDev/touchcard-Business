import { connection } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { saveDashboardSettings } from "@/app/actions/dashboard-settings";

const modules = [
  { id: "digital_card", title: "Cartes digitales", description: "Accès à la gestion de vos cartes NFC et QR." },
  { id: "requests", title: "Demandes clients", description: "Commandes, réservations et demandes de devis." },
  { id: "crm_contacts", title: "Contacts & prospects", description: "Votre carnet de contacts et vos prospects." },
  { id: "team", title: "Équipe", description: "Gestion des membres et des accès de votre équipe." },
  { id: "analytics", title: "Statistiques", description: "Consultation des vues, scans et interactions." },
  { id: "loyalty", title: "Fidélité", description: "Outils et fonctionnalités de fidélisation." },
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

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-7"><p className="text-sm font-semibold text-indigo-600">Personnalisation</p><h1 className="mt-2 text-3xl font-black text-slate-950">Paramètres</h1><p className="mt-2 text-sm text-slate-500">Adaptez votre tableau de bord à votre manière de travailler.</p></div>
      {query.saved === "1" && <p role="status" className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">Vos paramètres ont été enregistrés.</p>}
      {query.error && <p role="alert" className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">L'enregistrement a échoué. Veuillez réessayer.</p>}
      <form action={saveDashboardSettings} className="space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-5"><h2 className="text-lg font-bold text-slate-900">Modules du tableau de bord</h2><p className="mt-1 text-sm text-slate-500">Activez ou masquez les rubriques dans votre menu. Cela ne modifie pas votre abonnement ni vos données.</p></div>
          <div className="divide-y divide-slate-100">
            {modules.map((module) => <label key={module.id} className="flex cursor-pointer items-center justify-between gap-4 py-4"><span><span className="block text-sm font-semibold text-slate-800">{module.title}</span><span className="mt-1 block text-xs text-slate-500">{module.description}</span></span><input type="checkbox" name={module.id} defaultChecked={!hidden.includes(module.id)} className="h-5 w-5 shrink-0 accent-indigo-600" /></label>)}
          </div>
        </section>
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-5"><h2 className="text-lg font-bold text-slate-900">Notifications</h2><p className="mt-1 text-sm text-slate-500">Choisissez les préférences de notification de votre espace.</p></div>
          <div className="space-y-4">
            <label className="flex items-center justify-between gap-4"><span><span className="block text-sm font-semibold text-slate-800">Notifications dans le tableau de bord</span><span className="text-xs text-slate-500">Activer l'affichage des alertes dans la barre supérieure.</span></span><input type="checkbox" name="notifications_enabled" defaultChecked={preferences.notifications_enabled ?? true} className="h-5 w-5 accent-indigo-600" /></label>
            <label className="flex items-center justify-between gap-4"><span><span className="block text-sm font-semibold text-slate-800">Notifications par e-mail</span><span className="text-xs text-slate-500">Préférence enregistrée, l'envoi automatique sera activé avec le service de notifications.</span></span><input type="checkbox" name="email_notifications" defaultChecked={preferences.email_notifications ?? false} className="h-5 w-5 accent-indigo-600" /></label>
            <label className="flex items-center justify-between gap-4"><span><span className="block text-sm font-semibold text-slate-800">Notifications du navigateur</span><span className="text-xs text-slate-500">Préférence enregistrée pour les futures alertes navigateur.</span></span><input type="checkbox" name="browser_notifications" defaultChecked={preferences.browser_notifications ?? false} className="h-5 w-5 accent-indigo-600" /></label>
          </div>
        </section>
        <div className="flex justify-end"><button type="submit" className="btn-primary">Enregistrer les paramètres</button></div>
      </form>
    </div>
  );
}
