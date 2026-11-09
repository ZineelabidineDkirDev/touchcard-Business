import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { updateWorkspaceRequestStatus } from "@/app/actions/workspace-requests";

const labels: Record<string, string> = { order: "Commande", booking: "Réservation", quote: "Demande de devis" };
const statusLabels: Record<string, string> = {
  pending: "En attente", confirmed: "Confirmée", in_progress: "En cours",
  completed: "Terminée", rejected: "Refusée", cancelled: "Annulée",
};

type RequestItem = { product_id: string; name: string; quantity: number; unit_price: number; line_total: number };

export default async function WorkspaceRequestsPage() {
  await connection();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: membership } = await supabase.from("organization_members")
    .select("organization_id").eq("user_id", user.id).limit(1).maybeSingle();
  if (!membership?.organization_id) notFound();

  const { data: organization } = await supabase.from("organizations")
    .select("name,workspace_config").eq("id", membership.organization_id).maybeSingle();
  const config = (organization?.workspace_config ?? {}) as { version?: number; modules?: string[] };
  const modules = Array.isArray(config.modules) ? config.modules : [];
  const canSeeRequests = !config.version || modules.some((module) => ["orders", "bookings", "quote_requests"].includes(module));
  if (!canSeeRequests) notFound();

  const { data: requests, error } = await supabase.from("workspace_requests")
    .select("id,card_id,request_type,customer_name,customer_email,customer_phone,message,requested_at,items,total,currency,status,created_at")
    .eq("organization_id", membership.organization_id)
    .order("created_at", { ascending: false }).limit(100);

  const pendingCount = (requests ?? []).filter((request) => request.status === "pending").length;
  const orderCount = (requests ?? []).filter((request) => request.request_type === "order").length;
  const bookingCount = (requests ?? []).filter((request) => request.request_type === "booking").length;
  const quoteCount = (requests ?? []).filter((request) => request.request_type === "quote").length;

  return <div className="mx-auto max-w-7xl space-y-7">
    <header><p className="text-xs font-black uppercase tracking-[.18em] text-indigo-600">Espace client · {organization?.name || "TouchCard"}</p><h1 className="mt-2 text-3xl font-black text-slate-950">Demandes clients</h1><p className="mt-2 text-sm text-slate-500">Commandes, réservations et demandes de devis reçues depuis votre carte publique.</p></header>
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Metric label="À traiter" value={pendingCount}/><Metric label="Commandes" value={orderCount}/><Metric label="Réservations" value={bookingCount}/><Metric label="Devis" value={quoteCount}/>
    </section>
    {error && <p className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">Impossible de charger les demandes. Vérifiez les droits de votre organisation.</p>}
    <section className="space-y-4">
      {(requests ?? []).map((request) => {
        const items = Array.isArray(request.items) ? request.items as RequestItem[] : [];
        return <article key={request.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-black text-slate-950">{request.customer_name}</h2><span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-700">{labels[request.request_type] ?? request.request_type}</span></div><p className="mt-1 text-xs text-slate-500">Reçue le {new Date(request.created_at).toLocaleString("fr-FR")}</p></div>
            <span className={"rounded-full px-3 py-1.5 text-xs font-bold " + (request.status === "pending" ? "bg-amber-50 text-amber-800" : request.status === "completed" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-700")}>{statusLabels[request.status] ?? request.status}</span>
          </div>
          <div className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
            <p><strong className="text-slate-900">Téléphone :</strong> <a className="text-indigo-700" href={"tel:" + request.customer_phone}>{request.customer_phone}</a></p>
            <p><strong className="text-slate-900">E-mail :</strong> {request.customer_email ? <a className="text-indigo-700" href={"mailto:" + request.customer_email}>{request.customer_email}</a> : "Non fourni"}</p>
            {request.requested_at && <p className="sm:col-span-2"><strong className="text-slate-900">Date souhaitée :</strong> {new Date(request.requested_at).toLocaleString("fr-FR")}</p>}
            {request.message && <p className="sm:col-span-2 whitespace-pre-line rounded-xl bg-slate-50 p-3">{request.message}</p>}
          </div>
          {items.length > 0 && <div className="mt-4 rounded-xl bg-slate-50 p-3"><p className="mb-2 text-xs font-black uppercase tracking-wider text-slate-500">Articles / prestations</p>{items.map((item) => <div key={item.product_id} className="flex justify-between gap-3 py-1 text-sm"><span>{item.name} × {item.quantity}</span><strong>{Number(item.line_total).toLocaleString("fr-MA")} {request.currency}</strong></div>)}{request.request_type === "order" && <div className="mt-2 flex justify-between border-t border-slate-200 pt-2 text-sm font-black"><span>Total</span><span>{Number(request.total).toLocaleString("fr-MA")} {request.currency}</span></div>}</div>}
          <form action={updateWorkspaceRequestStatus} className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4"><input type="hidden" name="id" value={request.id}/><select name="status" defaultValue={request.status} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm">{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><button className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700">Mettre à jour</button></form>
        </article>;
      })}
      {!(requests?.length) && !error && <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center"><h2 className="font-bold text-slate-900">Aucune demande pour le moment</h2><p className="mt-2 text-sm text-slate-500">Les commandes, réservations et demandes de devis apparaîtront ici.</p></div>}
    </section>
  </div>;
}

function Metric({ label, value }: { label: string; value: number }) {
  return <article className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-3xl font-black text-slate-950">{value}</p></article>;
}
