"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type RequestType = "order" | "booking" | "quote";
type CatalogItem = { id: string; name: string; price: number; currency: string };
type Props = {
  cardSlug: string;
  products: CatalogItem[];
  allowOrders: boolean;
  allowBookings: boolean;
  allowQuotes: boolean;
};

function RequestIcon({ type }: { type: RequestType }) {
  const paths: Record<RequestType, React.ReactNode> = {
    order: <><path d="M3 3h2l2.2 11.2a2 2 0 0 0 2 1.6h8.9a2 2 0 0 0 1.9-1.4L22 8H6" /><circle cx="10" cy="20" r="1" /><circle cx="18" cy="20" r="1" /></>,
    booking: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18M8 14h3" /></>,
    quote: <><path d="M4 4h16v16H4zM8 9h8M8 13h5M8 17h3" /><path d="m16 16 2 2 4-5" /></>,
  };
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[type]}</svg>;
}

export function PublicWorkspaceRequestForms({ cardSlug, products, allowOrders, allowBookings, allowQuotes }: Props) {
  const types = useMemo(() => [
    ...(allowOrders ? [{ id: "order" as const, label: "Commander", hint: "Passer une commande" }] : []),
    ...(allowBookings ? [{ id: "booking" as const, label: "Réserver", hint: "Choisir une date" }] : []),
    ...(allowQuotes ? [{ id: "quote" as const, label: "Demander un devis", hint: "Décrire votre besoin" }] : []),
  ], [allowOrders, allowBookings, allowQuotes]);
  const [type, setType] = useState<RequestType>(types[0]?.id ?? "quote");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [requestedAt, setRequestedAt] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  if (!types.length) return null;
  const selectedItems = Object.entries(quantities)
    .filter(([, quantity]) => quantity > 0)
    .map(([product_id, quantity]) => ({ product_id, quantity }));

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setFeedback(null);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.functions.invoke("create-public-workspace-request", {
        body: {
          card_slug: cardSlug,
          request_type: type,
          customer_name: name,
          customer_phone: phone,
          customer_email: email,
          message,
          requested_at: type === "booking" ? requestedAt : null,
          items: type === "quote" ? [] : selectedItems,
        },
      });
      if (error || !data?.ok) throw new Error(data?.error || error?.message || "La demande n'a pas pu être envoyée.");
      setFeedback({ ok: true, text: "Votre demande a bien été transmise. L'entreprise vous recontactera." });
      setName(""); setPhone(""); setEmail(""); setMessage(""); setRequestedAt(""); setQuantities({});
    } catch (error) {
      setFeedback({ ok: false, text: error instanceof Error ? error.message : "Une erreur est survenue." });
    } finally {
      setLoading(false);
    }
  }

  const activeLabel = types.find((item) => item.id === type)?.label ?? "Votre demande";
  return <>
    <section className="rounded-2xl bg-white p-4">
      <div><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Besoin d'un service ?</p><h2 className="mt-1 text-base font-bold text-slate-900">Comment pouvons-nous vous aider ?</h2></div>
      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {types.map((item) => <button key={item.id} type="button" onClick={() => { setType(item.id); setFeedback(null); setOpen(true); }} className="flex min-h-[66px] items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2" style={{ ["--tw-ring-color" as string]: "var(--card-accent, #4f46e5)" }}>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white"><RequestIcon type={item.id}/></span>
          <span className="min-w-0"><span className="block text-sm font-bold text-slate-900">{item.label}</span><span className="mt-0.5 block text-[11px] text-slate-500">{item.hint}</span></span>
          <span className="ml-auto text-lg text-slate-400" aria-hidden="true">›</span>
        </button>)}
      </div>
    </section>
    {open && <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-5" onClick={() => !loading && setOpen(false)}>
      <section role="dialog" aria-modal="true" aria-labelledby="public-request-title" className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Demande en ligne</p><h2 id="public-request-title" className="mt-1 text-xl font-black text-slate-950">{activeLabel}</h2><p className="mt-1 text-sm text-slate-500">Remplissez ces informations pour contacter l'entreprise.</p></div><button type="button" onClick={() => setOpen(false)} disabled={loading} aria-label="Fermer" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-700 hover:bg-slate-200">×</button></div>
        <form onSubmit={submit} className="mt-5 space-y-3">
          {type !== "quote" && products.length > 0 && <div className="space-y-2 rounded-2xl bg-slate-50 p-3"><p className="text-xs font-bold text-slate-700">{type === "booking" ? "Choisissez une prestation (facultatif)" : "Votre commande"}</p>
            {products.map((product) => <div key={product.id} className="flex items-center justify-between gap-3 rounded-xl bg-white p-3"><div className="min-w-0"><p className="text-sm font-semibold text-slate-900">{product.name}</p><p className="mt-1 text-xs text-slate-500">{Number(product.price).toLocaleString("fr-MA")} {product.currency}</p></div><input aria-label={"Quantité " + product.name} type="number" min="0" max="20" value={quantities[product.id] ?? 0} onChange={(event) => setQuantities((current) => ({ ...current, [product.id]: Math.max(0, Math.min(20, Number(event.target.value) || 0)) }))} className="w-20 rounded-lg border border-slate-200 px-2 py-2 text-sm"/></div>)}
          </div>}
          {type === "booking" && <label className="block text-xs font-semibold text-slate-600">Date et heure souhaitées<input required type="datetime-local" value={requestedAt} onChange={(event) => setRequestedAt(event.target.value)} min={new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"/></label>}
          <div className="grid gap-3 sm:grid-cols-2"><input required minLength={2} maxLength={160} value={name} onChange={(event) => setName(event.target.value)} placeholder="Votre nom complet" className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"/><input required minLength={6} maxLength={40} value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Téléphone" className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"/></div>
          <input type="email" maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="E-mail (facultatif)" className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"/>
          <textarea maxLength={2000} rows={3} value={message} onChange={(event) => setMessage(event.target.value)} placeholder={type === "quote" ? "Décrivez votre besoin pour recevoir un devis…" : "Message ou précision (facultatif)"} className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"/>
          <button type="submit" disabled={loading || (type === "order" && selectedItems.length === 0)} className="w-full rounded-xl bg-slate-950 px-4 py-3.5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">{loading ? "Envoi en cours…" : type === "order" ? "Envoyer ma commande" : type === "booking" ? "Envoyer ma demande de réservation" : "Envoyer ma demande de devis"}</button>
        </form>
        {feedback && <p role="status" className={"mt-3 rounded-xl p-3 text-sm " + (feedback.ok ? "bg-slate-100 text-slate-800" : "bg-rose-50 text-rose-700")}>{feedback.text}</p>}
        <p className="mt-3 text-[11px] leading-5 text-slate-400">Votre demande est transmise à l'entreprise. Une commande ou réservation n'est confirmée qu'après validation par celle-ci.</p>
      </section>
    </div>}
  </>;
}
