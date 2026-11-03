"use client";

import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { InteractiveNfcCard } from "@/components/landing/landing-page";
import { createClient } from "@/lib/supabase/client";
import { submitProspectRequest, type ProspectInput } from "@/app/actions/prospects";

const sectors = ["Commerce", "Restauration", "Immobilier", "Beauté & bien-être", "Santé", "Éducation", "Consulting", "Artisanat", "Services", "E-commerce", "Marketing", "Autre"];
const cards = [
  { id: "service", title: "Service", desc: "Présentez vos prestations et facilitez la prise de contact.", mark: "S" },
  { id: "contact", title: "Contact", desc: "Partagez vos coordonnées professionnelles en un geste.", mark: "C" },
  { id: "e-business", title: "E-Business", desc: "Réunissez votre présence digitale et vos services.", mark: "E" },
];

const empty: ProspectInput = {
  fullName: "", city: "", sector: "", sectorOther: "", email: "", phone: "",
  cardType: "", reason: "", customRequested: false, brandName: "", logoUrl: "",
  businessAddress: "", businessPhone: "",
};

export function ProspectIntake() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<ProspectInput>(empty);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [logoName, setLogoName] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const progress = useMemo(() => ((step + 1) / 7) * 100, [step]);

  function update<K extends keyof ProspectInput>(key: K, value: ProspectInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function onLogoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 2 * 1024 * 1024) {
      setError("Choisissez une image de 2 Mo maximum.");
      event.target.value = "";
      return;
    }
    setLogoName(file.name);
    setLogoFile(file);
    setError("");
    // The logo is collected as a file name for the first request. Upload is handled after admin review.
    update("logoUrl", file.name);
  }

  function validateStep() {
    if (step === 0 && !form.fullName.trim()) return "Indiquez votre nom et prénom.";
    if (step === 1 && !form.city.trim()) return "Indiquez votre ville.";
    if (step === 2 && (!form.sector || (form.sector.split("|").includes("Autre") && !form.sectorOther.trim()))) return "Sélectionnez au moins un secteur d'activité.";
    if (step === 3 && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) || !form.phone.trim())) return "Indiquez un e-mail valide et votre téléphone.";
    if (step === 4 && !form.cardType) return "Choisissez le type de carte qui vous intéresse.";
    return "";
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const validation = validateStep();
    if (validation) { setError(validation); return; }
    if (step < 6) { setStep((value) => value + 1); return; }

    setBusy(true);
    const requestId = crypto.randomUUID();
    let requestData = form;
    if (form.customRequested && logoFile) {
      const supabase = createClient();
      const extension = logoFile.name.split(".").pop()?.toLowerCase() || "png";
      const { data: uploaded, error: uploadError } = await supabase.storage
        .from("prospect-logos")
        .upload(`${requestId}/brand-logo.${extension}`, logoFile, { contentType: logoFile.type, upsert: false });
      if (uploadError || !uploaded) {
        setError("Le logo n'a pas pu être envoyé. Réessayez ou continuez sans logo.");
        setBusy(false);
        return;
      }
      const { data: publicUrl } = supabase.storage.from("prospect-logos").getPublicUrl(uploaded.path);
      requestData = { ...form, logoUrl: publicUrl.publicUrl };
    }
    const result = await submitProspectRequest(requestData, requestId);
    if (!result.ok) { setError(result.error); setBusy(false); return; }

    // Aucun compte n’est créé à cette étape : la demande attend la validation de l’administrateur.
    setDone(true);
    setBusy(false);
  }

  if (done) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white px-5 py-16 text-slate-900">
        <div className="pointer-events-none absolute -right-40 -top-40 h-96 w-96 rounded-full bg-indigo-600/20 blur-[100px]" />
        <div className="relative w-full max-w-2xl rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-2xl backdrop-blur-xl sm:p-12">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-3xl text-emerald-700">✓</div>
          <p className="mt-8 text-xs font-black uppercase tracking-[.24em] text-violet-700">TouchCard Business</p>
          <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">Merci pour votre confiance !</h1>
          <p className="mx-auto mt-5 max-w-lg leading-8 text-slate-600">Votre demande a bien été transmise à notre équipe. Nous allons étudier votre besoin et vous contacter pour confirmer les détails.</p>
          <div className="mt-8 rounded-2xl border border-violet-100 bg-violet-50/70 p-5 text-left">
            <p className="font-bold">Votre demande est enregistrée.</p>
            <p className="mt-2 text-sm text-slate-600">"Notre équipe étudiera votre demande. Si elle est validée, un compte client sera créé et vous recevrez une invitation par e-mail."</p>
          </div>
          <Link href="/" className="mt-8 inline-flex rounded-xl bg-violet-700 px-7 py-4 font-bold text-white transition hover:bg-violet-800">Retour à l'accueil</Link>
        </div>
      </main>
    );
  }

  const titles = ["Faisons connaissance", "Votre localisation", "Votre activité", "Vos coordonnées", "Votre choix", "Votre personnalisation", "Récapitulatif"];
  const subtitles = ["Comment pouvons-nous vous appeler ?", "Dans quelle ville exercez-vous ?", "Quel est votre secteur d'activité ?", "Comment pouvons-nous vous joindre ?", "Quelle solution correspond à votre besoin ?", "Souhaitez-vous une carte personnalisée ?", "Vérifiez votre demande avant de l'envoyer."];

  return (
    <main className="relative min-h-screen overflow-hidden bg-white px-4 py-10 text-slate-900 sm:px-6 sm:py-14">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_12%,rgba(99,102,241,.10),transparent_32%),radial-gradient(circle_at_88%_78%,rgba(168,85,247,.09),transparent_34%)]" />
      <header className="relative mx-auto flex max-w-5xl items-center justify-between">
        <Link href="/" className="flex items-center gap-3"><img src="/brand/touchcard-mark.svg" alt="" className="h-10 w-10"/><span className="text-xl font-black">Touch<span className="text-violet-700">Card</span><span className="ml-2 text-[9px] tracking-[.18em] text-violet-700">BUSINESS</span></span></Link>
        <Link href="/" className="text-sm font-semibold text-slate-600 hover:text-violet-700">Quitter</Link>
      </header>

      <section className="relative mx-auto mt-10 max-w-3xl rounded-[2rem] border border-slate-200/90 bg-white/95 p-6 shadow-[0_24px_80px_rgba(30,27,75,.12)] sm:mt-12 sm:p-10">
        <div className="flex items-center justify-between gap-4 text-xs font-bold uppercase tracking-[.18em] text-violet-700"><span>Votre projet TouchCard</span><span>Étape {step + 1} / 7</span></div>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 transition-all duration-500" style={{ width: `${progress}%` }}/></div>
        <p className="mt-9 text-xs font-black uppercase tracking-[.22em] text-violet-700">{titles[step]}</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">{subtitles[step]}</h1>
        <form onSubmit={submit} className="mt-8">
          {step === 0 && <Field label="Nom et prénom" value={form.fullName} onChange={(v) => update("fullName", v)} placeholder="Ex. : Zine El Abidine Dkir" autoComplete="name"/>}
          {step === 1 && <Field label="Ville" value={form.city} onChange={(v) => update("city", v)} placeholder="Ex. : Casablanca" />}
          {step === 2 && <div className="grid gap-3 sm:grid-cols-2">{sectors.map((sector) => <Choice key={sector} selected={form.sector.split("|").includes(sector)} onClick={() => { const selected = form.sector.split("|").filter(Boolean); update("sector", selected.includes(sector) ? selected.filter((item) => item !== sector).join("|") : [...selected, sector].join("|")); }}>{sector}</Choice>)}{form.sector.split("|").includes("Autre") && <div className="sm:col-span-2"><Field label="Précisez votre activité" value={form.sectorOther} onChange={(v) => update("sectorOther", v)} placeholder="Votre secteur d'activité"/></div>}</div>}
          {step === 3 && <div className="grid gap-5"><Field label="Adresse e-mail" type="email" value={form.email} onChange={(v) => update("email", v)} placeholder="vous@exemple.com" autoComplete="email"/><Field label="Téléphone" type="tel" value={form.phone} onChange={(v) => update("phone", v)} placeholder="+212 6 XX XX XX XX" autoComplete="tel"/></div>}
          {step === 4 && <div className="space-y-5"><div className="grid gap-5 sm:grid-cols-3">{cards.map((card) => <div key={card.id} role="checkbox" aria-checked={form.cardType === card.id} tabIndex={0} onClick={() => update("cardType", card.id)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); update("cardType", card.id); } }} className={`group cursor-pointer rounded-2xl border p-3 text-left transition focus:outline-none focus:ring-2 focus:ring-violet-400 ${form.cardType === card.id ? "border-violet-500 bg-violet-50 ring-2 ring-violet-200" : "border-slate-200 bg-white hover:border-violet-300 hover:bg-violet-50"}`}><div className="relative aspect-[1.586/1] w-full"><InteractiveNfcCard title={card.title} size="pricing"/>{form.cardType === card.id && <span className="absolute -right-2 -top-2 z-20 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-violet-700 text-lg font-black text-white shadow-lg" aria-label="Sélectionné">✓</span>}</div><div className="mt-4 flex items-center justify-between gap-2"><h3 className="font-extrabold text-slate-900">{card.title}</h3>{form.cardType === card.id && <span className="text-xs font-bold text-violet-700">Choisie ✓</span>}</div><p className="mt-1 text-xs leading-5 text-slate-600">{card.desc}</p></div>)}</div><div><label className="mb-2 block text-sm font-semibold text-slate-800">Pourquoi avez-vous choisi cette carte ?</label><textarea value={form.reason} onChange={(event) => update("reason", event.target.value)} rows={3} placeholder="Expliquez-nous votre besoin..." className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-400/20"/></div></div>}{step === 5 && <div className="space-y-5"><p className="text-sm text-slate-600">Nous pouvons adapter le design et les informations de votre carte à votre marque.</p><div className="grid grid-cols-2 gap-3"><Choice selected={form.customRequested} onClick={() => update("customRequested", true)}>Oui, personnaliser</Choice><Choice selected={!form.customRequested} onClick={() => update("customRequested", false)}>Non, passer</Choice></div>{form.customRequested && <div className="grid gap-4 rounded-2xl border border-violet-100 bg-violet-50/60 p-4 sm:grid-cols-2"><Field label="Nom de marque" value={form.brandName} onChange={(v) => update("brandName", v)} placeholder="Votre brand name"/><div><label className="mb-2 block text-sm font-semibold text-slate-700">Logo (image, 2 Mo max.)</label><input type="file" accept="image/*" onChange={onLogoChange} className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-500 file:px-3 file:py-2 file:font-bold file:text-white"/>{logoName && <p className="mt-2 text-xs text-emerald-700">{logoName}</p>}</div><Field label="Adresse professionnelle" value={form.businessAddress} onChange={(v) => update("businessAddress", v)} placeholder="Adresse"/><Field label="Téléphone professionnel" value={form.businessPhone} onChange={(v) => update("businessPhone", v)} placeholder="+212..."/></div>}</div>}
          {step === 6 && <div className="space-y-3 rounded-2xl border border-violet-100 bg-violet-50/50 p-5 text-sm"><Review label="Nom" value={form.fullName}/><Review label="Ville" value={form.city}/><Review label="Secteur" value={form.sector === "Autre" ? form.sectorOther : form.sector}/><Review label="E-mail" value={form.email}/><Review label="Téléphone" value={form.phone}/><Review label="Carte souhaitée" value={cards.find((card) => card.id === form.cardType)?.title || ""}/><Review label="Personnalisation" value={form.customRequested ? "Oui" : "Non"}/>{form.customRequested && <><Review label="Marque" value={form.brandName}/><Review label="Logo" value={logoName || "Non fourni"}/><Review label="Adresse" value={form.businessAddress}/><Review label="Téléphone professionnel" value={form.businessPhone}/></>}</div>}
          {error && <p role="alert" className="mt-5 rounded-xl border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-700">{error}</p>}
          <div className="mt-9 flex flex-col-reverse justify-between gap-3 sm:flex-row"><button type="button" disabled={step === 0 || busy} onClick={() => { setError(""); setStep((value) => value - 1); }} className="rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-bold text-slate-700 transition hover:border-violet-300 hover:bg-violet-50 disabled:opacity-30">Précédent</button><button type="submit" disabled={busy} className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-7 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-indigo-950/30 transition hover:-translate-y-0.5 hover:brightness-110 disabled:opacity-60">{busy ? "Enregistrement..." : step === 6 ? "Confirmer ma demande" : "Suivant →"}</button></div>
        </form>
        <p className="mt-7 text-center text-[11px] leading-5 text-slate-500">En confirmant, vous acceptez que TouchCard utilise ces informations pour traiter votre demande et vous contacter à ce sujet.</p>
      </section>
    </main>
  );
}

function Field({ label, value, onChange, placeholder, type = "text", autoComplete }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; type?: string; autoComplete?: string }) {
  return <div><label className="mb-2 block text-sm font-semibold text-slate-700">{label}</label><input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} autoComplete={autoComplete} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-4 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-400/20"/></div>;
}

function Choice({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" aria-pressed={selected} onClick={onClick} className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-4 text-left text-sm font-bold transition ${selected ? "border-violet-500 bg-violet-50 text-violet-900 ring-2 ring-violet-200" : "border-slate-200 bg-white text-slate-700 hover:border-violet-300 hover:bg-violet-50"}`}><span>{children}</span><span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${selected ? "border-violet-700 bg-violet-700 text-white" : "border-slate-300 bg-white text-transparent"}`} aria-hidden="true">✓</span></button>;
}

function Review({ label, value }: { label: string; value: string }) {
  return <div className="flex flex-wrap justify-between gap-2 border-b border-slate-200 pb-2 last:border-0"><span className="text-slate-500">{label}</span><span className="max-w-[65%] text-right font-semibold text-slate-900">{value || "—"}</span></div>;
}
