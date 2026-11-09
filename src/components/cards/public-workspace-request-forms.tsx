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

export function PublicWorkspaceRequestForms({ cardSlug, products, allowOrders, allowBookings, allowQuotes }: Props) {
  const types = useMemo(() => [
    ...(allowOrders ? [{ id: "order" as const, label: "Commander" }] : []),
    ...(allowBookings ? [{ id: "booking" as const, label: "Réserver" }] : []),
    ...(allowQuotes ? [{ id: "quote" as const, label: "Demander un devis" }] : []),
  ], [allowOrders, allowBookings, allowQuotes]);
  const [type, setType] = useState<RequestType>(types[0]?.id ?? "quote");
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
      setName("");
      setPhone("");
      setEmail("");
      setMessage("");
      setRequestedAt("");
      setQuantities({});
    } catch (error) {
      setFeedback({ ok: false, text: error instanceof Error ? error.message : "Une erreur est survenue." });
    } finally {
      setLoading(false);
    }
  }

  return <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
    <p className="text-xs font-black uppercase tracking-wider text-indigo-600">Contact & demandes</p>
    <h2 className="mt-1 text-xl font-black text-slate-950">Passer à l'action</h2>
    <p className="mt-1 text-sm text-slate-500">Envoyez directement votre demande à cette entreprise.</p>
    <div className="mt-4 flex flex-wrap gap-2">
      {types.map((item) => <button key={item.id} type="button" onClick={() => { setType(item.id); setFeedback(null); }} className={"rounded-xl px-3 py-2 text-xs font-bold transition " + (type === item.id ? "bg-indigo-600 text-white" : "border border-slate-200 bg-white text-slate-600")}>{item.label}</button>)}
    </div>
    <form onSubmit={submit} className="mt-4 space-y-3">
      {type !== "quote" && products.length > 0 && <div className="space-y-2 rounded-2xl bg-slate-50 p-3">
        <p className="text-xs font-bold text-slate-700">{type === "booking" ? "Choisissez une prestation (facultatif)" : "Votre commande"}</p>
        {products.map((product) => <div key={product.id} className="flex items-center justify-between gap-3 rounded-xl bg-white p-3">
          <div className="min-w-0"><p className="text-sm font-semibold text-slate-900">{product.name}</p><p className="mt-1 text-xs text-slate-500">{Number(product.price).toLocaleString("fr-MA")} {product.currency}</p></div>
          <input aria-label={"Quantité " + product.name} type="number" min="0" max="20" value={quantities[product.id] ?? 0} onChange={(event) => setQuantities((current) => ({ ...current, [product.id]: Math.max(0, Math.min(20, Number(event.target.value) || 0)) }))} className="w-20 rounded-lg border border-slate-200 px-2 py-2 text-sm"/>
        </div>)}
      </div>}
      {type === "booking" && <label className="block text-xs font-semibold text-slate-600">Date et heure souhaitées<input required type="datetime-local" value={requestedAt} onChange={(event) => setRequestedAt(event.target.value)} min={new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"/></label>}
      <div className="grid gap-3 sm:grid-cols-2">
        <input required minLength={2} maxLength={160} value={name} onChange={(event) => setName(event.target.value)} placeholder="Votre nom complet" className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"/>
        <input required minLength={6} maxLength={40} value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Téléphone" className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"/>
      </div>
      <input type="email" maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="E-mail (facultatif)" className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"/>
      <textarea maxLength={2000} rows={3} value={message} onChange={(event) => setMessage(event.target.value)} placeholder={type === "quote" ? "Décrivez votre besoin pour recevoir un devis…" : "Message ou précision (facultatif)"} className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"/>
      <button type="submit" disabled={loading || (type === "order" && selectedItems.length === 0)} className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50">{loading ? "Envoi en cours…" : type === "order" ? "Envoyer ma commande" : type === "booking" ? "Envoyer ma demande de réservation" : "Envoyer ma demande de devis"}</button>
    </form>
    {feedback && <p role="status" className={"mt-3 rounded-xl p-3 text-sm " + (feedback.ok ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-700")}>{feedback.text}</p>}
    <p className="mt-3 text-[11px] leading-5 text-slate-400">Votre demande est transmise à l'entreprise. Une commande ou réservation n'est confirmée qu'après validation par celle-ci.</p>
  </section>;
}
