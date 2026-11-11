"use client";

import { useRef, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { saveClientCardCv } from "@/app/actions/cards";

type Props = {
  organizationId: string;
  cardId: string;
  initialUrl?: string | null;
};

export function CardCvManager({ organizationId, cardId, initialUrl = "" }: Props) {
  const [url, setUrl] = useState(initialUrl);
  const [busy, setBusy] = useState(false);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(file?: File) {
    if (!file) return;
    setMessage("");
    if (file.type !== "application/pdf" || !file.name.toLowerCase().endsWith(".pdf")) {
      setMessage("Sélectionnez un fichier PDF.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setMessage("Le CV ne doit pas dépasser 10 Mo.");
      return;
    }
    setBusy(true);
    try {
      const supabase = createClient();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-80) || "cv-professionnel.pdf";
      const path = organizationId + "/cv/" + crypto.randomUUID() + "-" + safeName;
      const { error } = await supabase.storage.from("client-media").upload(path, file, {
        cacheControl: "3600",
        contentType: "application/pdf",
        upsert: false,
      });
      if (error) throw error;
      const { data } = supabase.storage.from("client-media").getPublicUrl(path);
      const result = await saveClientCardCv(cardId, data.publicUrl);
      if (!result.ok) throw new Error(result.error);
      setUrl(data.publicUrl);
      setMessage("CV enregistré. Il est maintenant disponible sur votre carte publique.");
    } catch (error) {
      console.error("CV upload failed", error);
      setMessage(error instanceof Error ? error.message : "Import impossible. Vérifiez les droits du stockage.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function removeCv() {
    setMessage("");
    startTransition(async () => {
      const result = await saveClientCardCv(cardId, "");
      if (result.ok) {
        setUrl("");
        setMessage("CV retiré de votre carte publique.");
      } else {
        setMessage(result.error);
      }
    });
  }

  return (
    <section className="rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-indigo-600">Document professionnel</p>
          <h3 className="mt-1 text-base font-black text-slate-900">Mon CV professionnel</h3>
          <p className="mt-1 max-w-xl text-xs leading-5 text-slate-500">Importez votre CV au format PDF. Il sera affiché dans votre carte publique avec un lien pour le consulter ou le télécharger.</p>
        </div>
        {url && <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700">CV publié</span>}
      </div>
      {url ? (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-100 text-sm font-black text-rose-700">PDF</span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-slate-800">CV professionnel</p>
            <a href={url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-indigo-700 underline">Consulter le fichier actuel ↗</a>
          </div>
          <button type="button" disabled={busy || pending} onClick={() => inputRef.current?.click()} className="rounded-full bg-indigo-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-50">Remplacer</button>
          <button type="button" disabled={busy || pending} onClick={removeCv} className="rounded-full border border-rose-200 px-4 py-2 text-xs font-bold text-rose-600 disabled:opacity-50">Retirer</button>
        </div>
      ) : (
        <button type="button" disabled={busy || pending} onClick={() => inputRef.current?.click()} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50/60 px-4 py-5 text-sm font-bold text-indigo-700 transition hover:bg-indigo-50 disabled:opacity-50">
          {busy ? "Import du CV en cours…" : "＋ Importer mon CV PDF"}
        </button>
      )}
      <input ref={inputRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={(event) => void upload(event.target.files?.[0])}/>
      <p className="mt-2 text-[10px] text-slate-400">PDF uniquement · 10 Mo maximum · Téléversement direct sécurisé vers le stockage.</p>
      {message && <p role="status" className="mt-3 text-xs font-semibold text-slate-600">{message}</p>}
    </section>
  );
}
