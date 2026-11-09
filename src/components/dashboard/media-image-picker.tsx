"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  organizationId: string;
  name: string;
  label: string;
  initialUrl?: string | null;
  shape?: "square" | "wide";
};

export function MediaImagePicker({ organizationId, name, label, initialUrl = "", shape = "square" }: Props) {
  const [url, setUrl] = useState(initialUrl || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(file?: File) {
    if (!file) return;
    setError("");
    if (!["image/jpeg", "image/png", "image/webp", "image/avif"].includes(file.type)) {
      setError("Formats acceptés : JPG, PNG, WEBP ou AVIF.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("L’image ne doit pas dépasser 5 Mo.");
      return;
    }
    setBusy(true);
    try {
      const supabase = createClient();
      const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
      const path = organizationId + "/" + crypto.randomUUID() + "." + extension;
      const { error: uploadError } = await supabase.storage.from("client-media").upload(path, file, {
        cacheControl: "31536000", contentType: file.type, upsert: false,
      });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from("client-media").getPublicUrl(path);
      setUrl(data.publicUrl);
    } catch (cause) {
      console.error("Client image upload failed", cause);
      setError("Téléversement impossible. Vérifiez que la configuration du stockage est appliquée.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={url} />
      <div className="flex items-center gap-3">
        {url ? <img src={url} alt={label} className={shape === "wide" ? "h-20 w-36 rounded-xl border border-slate-200 object-cover" : "h-16 w-16 rounded-2xl object-cover"} /> : <div className={shape === "wide" ? "flex h-20 w-36 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-xs text-slate-400" : "flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-xs text-slate-400"}>Image</div>}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-slate-800">{label}</p>{shape === "wide" && <p className="mt-1 text-[10px] leading-4 text-slate-500">Format horizontal conseillé · 16:9</p>}
          <div className="mt-1 flex flex-wrap gap-2">
            <button type="button" disabled={busy} onClick={() => inputRef.current?.click()} className="rounded-full bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50">{busy ? "Envoi…" : url ? "Modifier l’image" : "Ajouter une image"}</button>
            {url && <button type="button" disabled={busy} onClick={() => { setUrl(""); if (inputRef.current) inputRef.current.value = ""; }} className="rounded-full border border-rose-200 px-4 py-2.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50">Retirer</button>}
          </div>
        </div>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="hidden" onChange={(event) => void upload(event.target.files?.[0])} />
      </div>
      {error && <p role="alert" className="text-xs text-rose-600">{error}</p>}
      <p className="text-[10px] text-slate-400">JPG, PNG, WEBP ou AVIF · 5 Mo maximum</p>
    </div>
  );
}
