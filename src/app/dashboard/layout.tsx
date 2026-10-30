import Link from "next/link";
import { redirect } from "next/navigation";
import { signOut } from "@/app/actions/auth";
import { createClient } from "@/lib/supabase/server";

const navigation = [
  ["Vue d’ensemble", "/dashboard"],
  ["Cartes digitales", "/dashboard/cards"],
  ["Contacts & prospects", "/dashboard/contacts"],
  ["Équipe", "/dashboard/team"],
  ["Statistiques", "/dashboard/analytics"],
  ["Fidélité", "/dashboard/loyalty"],
  ["Paramètres", "/dashboard/settings"],
];

export default async function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      <aside className="w-full border-b border-slate-200 bg-white p-5 lg:fixed lg:inset-y-0 lg:w-64 lg:border-b-0 lg:border-r">
        <Link href="/" className="text-2xl font-black tracking-tight text-slate-950">Touch<span className="text-indigo-600">Card</span></Link>
        <p className="mt-1 text-xs text-slate-400">BUSINESS WORKSPACE</p>
        <nav className="mt-8 flex gap-2 overflow-x-auto lg:flex-col">
          {navigation.map(([label, href]) => <Link key={href} href={href} className="whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-700">{label}</Link>)}
        </nav>
        <div className="mt-8 border-t border-slate-100 pt-5 lg:absolute lg:inset-x-5 lg:bottom-6">
          <p className="truncate text-sm font-semibold text-slate-800">{String(user.user_metadata.full_name || user.email)}</p>
          <p className="mt-1 truncate text-xs text-slate-400">{user.email}</p>
          <form action={signOut}><button className="mt-4 text-sm font-semibold text-rose-600">Se déconnecter</button></form>
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-5 sm:p-8 lg:ml-64">{children}</main>
    </div>
  );
}