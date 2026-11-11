"use client";

import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { PhysicalNfcCard } from "@/components/cards/physical-nfc-card";
import { createClient } from "@/lib/supabase/client";
import { submitProspectRequest, type ProspectInput } from "@/app/actions/prospects";

const sectors = ["Commerce", "Restauration", "Immobilier", "Beauté & bien-être", "Santé", "Éducation", "Consulting", "Artisanat", "Services", "E-commerce", "Marketing", "Autre"];
const cards = [
  { id: "service", title: "Personnalisée", desc: "Une carte et un service digital adaptés à votre identité.", mark: "P" },
  { id: "google-review", title: "Avis Google", desc: "Facilitez l’accès à votre page Google et la collecte d’avis clients.", mark: "G" },
  { id: "contact", title: "E-Contact", desc: "Une carte personnelle avec coordonnées, portfolio, CV et réseaux sociaux.", mark: "C" },
  { id: "e-business", title: "E-Business", desc: "Réunissez votre présence digitale et vos services.", mark: "E" },
];

const DRAFT_KEY = "touchcard-prospect-draft-v3";
const LEGACY_DRAFT_KEY = "touchcard-prospect-draft-v2";

const empty: ProspectInput = {
  fullName: "", city: "", sector: "", sectorOther: "", email: "", phone: "",
  cardType: "", reason: "", customRequested: false, brandName: "", logoUrl: "",
  businessAddress: "", businessPhone: "", socialLinks: [{ platform: "Instagram", url: "" }],
  projectNeeds: [], reservationMode: "", reservationChannels: [], managementNeeds: [],
};

export function ProspectIntake() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<ProspectInput>(empty);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [submittedRequestId, setSubmittedRequestId] = useState("");
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const reduceMotion = useReducedMotion();
  const [logoName, setLogoName] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const serviceChoiceRequired = form.cardType === "e-business" || form.cardType === "service";
  const visibleSteps = useMemo(() => [0, 1, 2, 3, 4, 5, 6, 7, 8], []);
  const progress = ((Math.max(0, visibleSteps.indexOf(step)) + 1) / visibleSteps.length) * 100;

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(DRAFT_KEY) || window.localStorage.getItem(LEGACY_DRAFT_KEY);
      if (saved) {
        const draft = JSON.parse(saved) as { savedAt?: number; step?: number; form?: ProspectInput };
        const draftAge = typeof draft.savedAt === "number" ? Date.now() - draft.savedAt : Number.POSITIVE_INFINITY;
        const draftIsFresh = draftAge >= 0 && draftAge <= 24 * 60 * 60 * 1000;
        if (draftIsFresh && draft.form && typeof draft.form === "object") {
          const savedLogoUrl = String(draft.form.logoUrl ?? "");
          const restoredForm = { ...draft.form, logoUrl: savedLogoUrl.startsWith("https://") || savedLogoUrl.startsWith("http://") ? savedLogoUrl : "" };
          const restoredStep = Number.isInteger(draft.step) ? Number(draft.step) : 0;
          const safeStep = Math.min(8, Math.max(0, restoredStep));
          setForm((current) => ({ ...current, ...restoredForm }));
          setStep(safeStep);
        }
        if (!draftIsFresh) {
          window.localStorage.removeItem(DRAFT_KEY);
          window.localStorage.removeItem(LEGACY_DRAFT_KEY);
        }
      }
    } catch {
      window.localStorage.removeItem(DRAFT_KEY);
      window.localStorage.removeItem(LEGACY_DRAFT_KEY);
    } finally { setDraftLoaded(true); }
  }, []);

  useEffect(() => {
    if (!draftLoaded) return;
    const saveDraft = () => {
      try {
        window.localStorage.setItem(DRAFT_KEY, JSON.stringify({ version: 4, savedAt: Date.now(), step, form }));
        window.localStorage.removeItem(LEGACY_DRAFT_KEY);
      } catch { /* Storage may be disabled; the form remains usable. */ }
    };
    saveDraft();
    window.addEventListener("pagehide", saveDraft);
    window.addEventListener("beforeunload", saveDraft);
    return () => {
      saveDraft();
      window.removeEventListener("pagehide", saveDraft);
      window.removeEventListener("beforeunload", saveDraft);
    };
  }, [step, form, draftLoaded]);

  function persistDraft(nextStep: number, nextForm: ProspectInput) {
    try {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify({ version: 4, savedAt: Date.now(), step: nextStep, form: nextForm }));
    } catch { /* Keep the form usable if browser storage is unavailable. */ }
  }

  function update<K extends keyof ProspectInput>(key: K, value: ProspectInput[K]) {
    setForm((current) => {
      const next = { ...current, [key]: value };
      persistDraft(step, next);
      return next;
    });
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
    if (step === 4 && serviceChoiceRequired && (!form.sector || form.sector.includes("|") || (form.sector === "Autre" && !form.sectorOther.trim()))) return "Choisissez un seul domaine professionnel.";
    if (step === 4 && serviceChoiceRequired && !form.brandName.trim()) return "Indiquez le nom de votre activité ou de votre marque."
    if (step === 3 && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) || !form.phone.trim())) return "Indiquez un e-mail valide et votre téléphone.";
    if (step === 4 && !form.cardType) return "Choisissez le type de carte qui vous intéresse.";
    if (step === 5 && serviceChoiceRequired && !form.projectNeeds[0]) return "Choisissez une formule de service pour continuer.";
    if (step === 5 && !serviceChoiceRequired && !form.businessAddress.trim()) return "Indiquez l’adresse de votre établissement (rue, quartier et ville).";
    return "";
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const validation = validateStep();
    if (validation) { setError(validation); return; }
    if (step < 8) {
      const nextStep = step + 1;
      persistDraft(nextStep, form);
      setStep(nextStep);
      return;
    }

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

    if (!result.temporaryPassword) {
      setError("La demande a été enregistrée, mais les identifiants temporaires n’ont pas pu être récupérés. Contactez le support avant toute connexion.");
      setBusy(false);
      return;
    }
    setSubmittedRequestId(requestId);
    setTemporaryPassword(result.temporaryPassword);
    // Remove locally cached contact details after a successful submission.
    try { window.localStorage.removeItem(DRAFT_KEY); window.localStorage.removeItem(LEGACY_DRAFT_KEY); } catch { /* Storage may be disabled. */ }
    // Le compte est créé sans e-mail de confirmation, mais reste verrouillé jusqu’à validation du Super Admin.
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
          <p className="mx-auto mt-5 max-w-lg leading-8 text-slate-600">Votre demande a bien été transmise à notre équipe. Après sa validation, votre espace client sera créé automatiquement dans un délai maximal d’une heure.</p>
          <div className="mt-8 rounded-2xl border border-violet-100 bg-violet-50/70 p-5 text-left">
            <p className="font-bold">Numéro de demande : <span className="font-mono">{submittedRequestId}</span></p>
            <p className="font-bold">Votre demande est enregistrée et votre mot de passe a été généré automatiquement.</p>
            <p className="mt-2 text-sm text-slate-600">Identifiant : <strong>{form.email}</strong></p>
            <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-violet-200 bg-white p-3"><code className="min-w-0 flex-1 break-all text-sm font-bold text-slate-900">{temporaryPassword}</code><button type="button" onClick={async () => { try { await navigator.clipboard.writeText(temporaryPassword); setCopiedPassword(true); } catch { setCopiedPassword(false); } }} className="rounded-lg bg-violet-700 px-3 py-2 text-xs font-bold text-white">{copiedPassword ? "Copié ✓" : "Copier"}</button></div>
            <p className="mt-3 text-sm text-slate-600">Conservez ce mot de passe provisoire. Lors de votre première connexion, vous choisirez votre mot de passe personnel sans avoir à ressaisir l’ancien. L’espace restera verrouillé jusqu’à validation de votre demande.</p>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-3"><Link href="/login" className="inline-flex rounded-xl bg-violet-700 px-7 py-4 font-bold text-white transition hover:bg-violet-800">Se connecter</Link><Link href="/" className="inline-flex rounded-xl border border-slate-200 bg-white px-7 py-4 font-bold text-slate-700 transition hover:bg-slate-50">Retour à l'accueil</Link></div>
        </div>
      </main>
    );
  }

  const titles = ["Faisons connaissance", "Votre localisation", "Votre activité", "Vos coordonnées", "Votre choix", serviceChoiceRequired ? "Votre formule de service" : "Adresse de l’établissement", "Vos réseaux & pages", "Votre personnalisation", "Récapitulatif"];
  const subtitles = ["Comment pouvons-nous vous appeler ?", "Dans quelle ville exercez-vous ?", "Quel est votre domaine professionnel ?", "Comment pouvons-nous vous joindre ?", "Quelle solution correspond à votre besoin ?", serviceChoiceRequired ? "Choisissez une seule formule adaptée à votre activité." : "Indiquez l’adresse où votre carte ou votre espace sera rattaché.", "Ajoutez votre site web, votre CV / portfolio et vos réseaux sociaux.", "Souhaitez-vous une carte personnalisée ?", "Relisez votre demande avant de l’envoyer."];

  return (
    <main className="touchcard-intake relative min-h-screen overflow-hidden bg-[#071326] px-4 py-5 text-white sm:px-6 lg:grid lg:grid-cols-[.92fr_1.08fr] lg:gap-7 lg:px-8 lg:py-6 xl:px-12">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_90%_80%,rgba(91,55,255,.28),transparent_42%),linear-gradient(120deg,#06101e_0%,#101d36_52%,#101638_100%)]"/>
      <aside className="relative z-10 mx-auto mb-5 flex h-[48vh] min-h-[340px] w-full max-w-[720px] flex-col justify-between overflow-hidden rounded-[1.75rem] border border-white/15 bg-[#071326] p-6 shadow-2xl sm:p-8 lg:sticky lg:top-6 lg:mb-0 lg:h-[calc(100vh-3rem)] lg:max-h-[940px] lg:max-w-none">
        <div className="absolute inset-0 bg-[url('/brand/touchcard-demande-hero.webp')] bg-cover bg-[position:50%_42%] lg:bg-[position:50%_center]"/>
        <div className="absolute inset-0 bg-gradient-to-t from-[#071326]/35 via-transparent to-[#071326]/5"/>
        <div className="relative z-10 flex items-center gap-3"><img src="/brand/touchcard-mark.svg" alt="Symbole officiel TouchCard" className="h-12 w-12 object-contain drop-shadow-lg"/><span className="flex flex-col leading-none"><strong className="text-2xl font-black tracking-tight text-white">TouchCard</strong><span className="mt-1 text-xs font-bold uppercase tracking-[.24em] text-cyan-200">Business</span></span></div>
        <div className="relative z-10 max-w-lg pb-2"><p className="text-xs font-black uppercase tracking-[.28em] text-cyan-200">Votre identité. En un contact.</p><h2 className="mt-4 text-3xl font-black leading-tight text-white sm:text-4xl">Une seule carte.<br/><span className="bg-gradient-to-r from-cyan-300 via-blue-300 to-violet-300 bg-clip-text text-transparent">Toutes vos connexions.</span></h2><p className="mt-4 max-w-md text-sm leading-6 text-white/80">Faites découvrir votre activité, partagez vos informations et développez votre réseau avec TouchCard Business.</p><div className="mt-7 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3"><div className="rounded-xl border border-white/15 bg-slate-950/35 p-3 backdrop-blur-md"><p className="text-sm font-bold text-white">Contact instantané</p><p className="mt-1 text-xs text-white/65">Un geste, toutes vos coordonnées.</p></div><div className="rounded-xl border border-white/15 bg-slate-950/35 p-3 backdrop-blur-md"><p className="text-sm font-bold text-white">Image professionnelle</p><p className="mt-1 text-xs text-white/65">Une présence digitale cohérente.</p></div><div className="rounded-xl border border-white/15 bg-slate-950/35 p-3 backdrop-blur-md"><p className="text-sm font-bold text-white">Simple et connecté</p><p className="mt-1 text-xs text-white/65">NFC et QR code réunis.</p></div></div></div>
      </aside>
      <div className="relative z-10 min-w-0">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 pb-4">
        <Link href="/" className="inline-flex items-center gap-2"><img src="/brand/touchcard-mark.svg" alt="TouchCard Business" className="h-9 w-9 object-contain"/><span className="flex flex-col leading-none"><strong className="text-lg font-black tracking-tight">TouchCard</strong><span className="mt-1 text-xs text-white/75">Business</span></span></Link>
        <div className="ml-auto flex items-center gap-2 text-xs font-bold">
          <span className="rounded-full border border-white/30 bg-white/5 px-3 py-2">🇫🇷 FR</span><span className="rounded-full border border-white/20 bg-white/5 px-3 py-2">🇬🇧 EN</span><span className="rounded-full border border-white/20 bg-white/5 px-3 py-2">🇲🇦 AR</span>
        </div>
      </header>
      <section className="relative mx-auto mt-1 w-full max-w-3xl rounded-[1.75rem] border border-blue-300/35 bg-[linear-gradient(125deg,rgba(9,27,52,.88),rgba(18,32,62,.76)_52%,rgba(47,55,113,.76))] p-5 text-white shadow-[0_25px_80px_rgba(0,0,0,.45)] backdrop-blur-2xl sm:p-7 lg:p-8">
        <div className="text-center"><h1 className="text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">Devenez <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-500 bg-clip-text text-transparent">client</span></h1><p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-white/85 sm:text-base">Rejoignez TouchCard Business et créez votre carte digitale en quelques étapes simples.</p></div>
        <div className="mt-7 grid grid-cols-5 gap-x-2 gap-y-3 sm:grid-cols-9 sm:gap-2">{visibleSteps.map((item,index)=><div key={item} className="flex min-w-0 flex-col items-center text-center"><span className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-bold ${step===item?"border-cyan-300 bg-gradient-to-br from-cyan-400 to-blue-600 text-white shadow-[0_0_22px_rgba(0,174,255,.4)]":step>item?"border-violet-300/70 bg-violet-500/20 text-white":"border-slate-400/60 bg-slate-900/40 text-slate-300"}`}>{index+1}</span><span className="mt-1 hidden max-w-full truncate text-[9px] leading-tight text-white/75 sm:block">{["Identité","Ville","Activité","Contact","Carte","Services","Liens","Options","Envoi"][index]}</span></div>)}</div>
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500 transition-all duration-500" style={{ width: `${progress}%` }}/></div>
        <p className="mt-7 text-xs font-black uppercase tracking-[.22em] text-cyan-200">{titles[step]}</p>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">{subtitles[step]}</h2>
        <form onSubmit={submit} className="mt-8">
          {step === 0 && <Field label="Nom et prénom" value={form.fullName} onChange={(v) => update("fullName", v)} placeholder="Ex. : Zine El Abidine Dkir" autoComplete="name"/>}
          {step === 1 && <Field label="Ville" value={form.city} onChange={(v) => update("city", v)} placeholder="Ex. : Casablanca" />}
          {step === 2 && <div className="space-y-4"><Field label="Nom de votre activité / marque (facultatif pour E-Contact et Avis Google)" value={form.brandName} onChange={(v) => update("brandName", v)} placeholder="Ex. : MMC Event" autoComplete="organization"/><p className="text-sm text-slate-600">Sélectionnez un seul domaine correspondant à votre activité principale. Facultatif pour E-Contact et Avis Google.</p><div className="grid gap-3 sm:grid-cols-2">{sectors.map((sector) => <label key={sector} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 text-left transition ${form.sector === sector ? "border-violet-500 bg-violet-50 ring-2 ring-violet-200" : "border-slate-200 bg-white hover:border-violet-300 hover:bg-violet-50"}`}><input type="radio" name="professional_sector" value={sector} checked={form.sector === sector} onChange={() => update("sector", sector)} className="h-4 w-4 accent-violet-700"/><span className="font-semibold text-slate-800">{sector}</span>{form.sector === sector && <span className="ml-auto text-xs font-bold text-violet-700">Choisi ✓</span>}</label>)}</div>{form.sector === "Autre" && <Field label="Précisez votre activité" value={form.sectorOther} onChange={(v) => update("sectorOther", v)} placeholder="Votre secteur d'activité"/>}</div>}
          {step === 3 && <div className="grid gap-5"><Field label="Adresse e-mail" type="email" value={form.email} onChange={(v) => update("email", v)} placeholder="vous@exemple.com" autoComplete="email"/><Field label="Téléphone" type="tel" value={form.phone} onChange={(v) => update("phone", v)} placeholder="+212 6 XX XX XX XX" autoComplete="tel"/></div>}
          {step === 4 && <div className="space-y-5"><div className="grid gap-5 sm:grid-cols-3">{cards.map((card) => <div key={card.id} role="checkbox" aria-checked={form.cardType === card.id} tabIndex={0} onClick={() => setForm((current) => ({ ...current, cardType: card.id, projectNeeds: [], reservationMode: "", reservationChannels: [], managementNeeds: [] }))} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setForm((current) => ({ ...current, cardType: card.id, projectNeeds: [], reservationMode: "", reservationChannels: [], managementNeeds: [] })); } }} className={`group cursor-pointer rounded-2xl border p-3 text-left transition focus:outline-none focus:ring-2 focus:ring-violet-400 ${form.cardType === card.id ? "border-violet-500 bg-violet-50 ring-2 ring-violet-200" : "border-slate-200 bg-white hover:border-violet-300 hover:bg-violet-50"}`}><div className="relative aspect-[1.586/1] w-full"><PhysicalNfcCard title={card.title} cardType={card.id} clientName={form.fullName || "M./Mme Client"}/>{form.cardType === card.id && <span className="absolute -right-2 -top-2 z-20 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-violet-700 text-lg font-black text-white shadow-lg" aria-label="Sélectionné">✓</span>}</div><div className="mt-4 flex items-center justify-between gap-2"><h3 className="font-extrabold text-slate-900">{card.title}</h3>{form.cardType === card.id && <span className="text-xs font-bold text-violet-700">Choisie ✓</span>}</div><p className="mt-1 text-xs leading-5 text-slate-600">{card.desc}</p></div>)}</div><div><label className="mb-2 block text-sm font-semibold text-slate-800">Pourquoi avez-vous choisi cette carte ?</label><textarea value={form.reason} onChange={(event) => update("reason", event.target.value)} rows={3} placeholder="Expliquez-nous votre besoin..." className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-400/20"/></div></div>}{serviceChoiceRequired && step === 5 && <div className="space-y-5">
  <div className="rounded-2xl border border-violet-100 bg-violet-50/60 p-5">
    <p className="text-sm font-bold text-slate-900">Choisissez une seule formule de service</p>
    <p className="mt-1 text-sm leading-6 text-slate-600">Cette étape apparaît uniquement après le choix E-Business ou Personnalisée. Les fonctionnalités seront préparées selon votre activité.</p>
  </div>
  <div className="grid gap-3">
    {(form.cardType === "service"
      ? ["Profil personnel + portfolio et galerie", "Profil personnalisé + prestations et réservations", "Profil personnalisé + boutique en ligne"]
      : ["Présentation entreprise + catalogue de services", "Catalogue de produits + boutique en ligne", "Services + réservations et demandes de devis"]
    ).map((choice) => (
      <label key={choice} className={form.projectNeeds[0] === choice ? "flex cursor-pointer items-center gap-3 rounded-xl border border-violet-500 bg-violet-50 px-4 py-4 text-left text-sm font-bold text-violet-900 ring-2 ring-violet-200" : "flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-4 text-left text-sm font-bold text-slate-700 hover:border-violet-300 hover:bg-violet-50"}>
        <input type="radio" name="service_formula" value={choice} checked={form.projectNeeds[0] === choice} onChange={() => update("projectNeeds", [choice])} className="h-5 w-5 shrink-0 accent-violet-700"/>
        <span className="flex-1">{choice}</span>
        {form.projectNeeds[0] === choice && <span className="text-xs font-black text-violet-700">CHOISIE</span>}
      </label>
    ))}
  </div>
</div>}{!serviceChoiceRequired && step === 5 && <div className="space-y-4 rounded-2xl border border-violet-100 bg-violet-50/60 p-5">
  <p className="text-sm leading-6 text-slate-600">Cette adresse sera utilisée pour préparer votre espace et rattacher votre carte à votre établissement. Elle ne remplace pas vos liens sociaux.</p>
  <Field label="Adresse de l’établissement (rue, quartier et ville)" value={form.businessAddress} onChange={(v) => update("businessAddress", v)} placeholder="Ex. : 12 rue..., quartier..., Casablanca"/>
</div>}{step === 6 && <div className="space-y-5"><p className="text-sm leading-6 text-slate-600">{form.cardType === "contact" ? "Ajoutez votre site web personnel, votre CV / portfolio et vos réseaux sociaux." : "Ajoutez les liens de vos pages professionnelles et réseaux sociaux. Vous pouvez en ajouter plusieurs ou supprimer ceux qui ne sont pas utiles."}</p><div className="space-y-3">{form.socialLinks.map((item, index) => <div key={index} className="grid gap-2 rounded-2xl border border-violet-100 bg-violet-50/60 p-3 sm:grid-cols-[.8fr_1.4fr_auto] sm:items-end"><div><label className="mb-2 block text-xs font-bold text-slate-700">Plateforme</label><select value={item.platform} onChange={(event) => update("socialLinks", form.socialLinks.map((link, i) => i === index ? { ...link, platform: event.target.value } : link))} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none focus:border-violet-400"><option>Instagram</option><option>Facebook</option><option>TikTok</option><option>LinkedIn</option><option>YouTube</option><option>WhatsApp</option><option>Site web</option><option>CV / Portfolio</option><option>Autre</option></select></div><div><label className="mb-2 block text-xs font-bold text-slate-700">Lien de votre page</label><input type="url" value={item.url} onChange={(event) => update("socialLinks", form.socialLinks.map((link, i) => i === index ? { ...link, url: event.target.value } : link))} placeholder="https://..." className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-violet-400"/></div><div className="flex gap-2"><button type="button" aria-label="Ajouter un lien" onClick={() => update("socialLinks", [...form.socialLinks, { platform: "Instagram", url: "" }])} className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-700 text-2xl text-white shadow-md hover:bg-violet-800">+</button><button type="button" aria-label="Supprimer ce lien" disabled={form.socialLinks.length === 1} onClick={() => update("socialLinks", form.socialLinks.filter((_, i) => i !== index))} className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-300 bg-white text-2xl text-slate-600 hover:bg-rose-50 disabled:opacity-30">−</button></div></div>)}</div></div>}{step === 7 && <div className="space-y-5">
  <p className="text-sm text-slate-600">{form.cardType === "contact" ? "Personnalisez votre carte personnelle avec une photo ou un logo. Vos coordonnées et votre portfolio restent au centre de la carte." : "Nous pouvons adapter le design et les informations de votre carte à votre marque."}</p>
  <div className="grid grid-cols-2 gap-3"><Choice selected={form.customRequested} onClick={() => update("customRequested", true)}>Oui, personnaliser</Choice><Choice selected={!form.customRequested} onClick={() => update("customRequested", false)}>Non, passer</Choice></div>
  {form.customRequested && <div className="grid gap-4 rounded-2xl border border-violet-100 bg-violet-50/60 p-4 sm:grid-cols-2">
    {form.cardType !== "contact" && <><Field label="Nom de marque" value={form.brandName} onChange={(v) => update("brandName", v)} placeholder="Votre brand name"/><Field label="Adresse professionnelle" value={form.businessAddress} onChange={(v) => update("businessAddress", v)} placeholder="Adresse"/><Field label="Téléphone professionnel" value={form.businessPhone} onChange={(v) => update("businessPhone", v)} placeholder="+212..."/></>}
    <div><label className="mb-2 block text-sm font-semibold text-slate-700">Logo (image, 2 Mo max.)</label><input type="file" accept="image/*" onChange={onLogoChange} className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-500 file:px-3 file:py-2 file:font-bold file:text-white"/>{logoName && <p className="mt-2 text-xs text-emerald-700">{logoName}</p>}</div>
  </div>}
</div>}{step === 8 && <div className="space-y-3 rounded-2xl border border-violet-100 bg-violet-50/50 p-5 text-sm"><Review label="Nom" value={form.fullName}/><Review label="Ville" value={form.city}/><Review label="Secteur" value={form.sector === "Autre" ? form.sectorOther : form.sector}/><Review label="E-mail" value={form.email}/><Review label="Téléphone" value={form.phone}/><Review label="Pages & réseaux" value={form.socialLinks.filter((item) => item.url.trim()).map((item) => item.platform + ": " + item.url).join(" · ") || "Non renseignés"}/><Review label="Nom de l’activité" value={form.brandName || (form.cardType === "contact" ? form.fullName : "")}/><Review label="Carte souhaitée" value={cards.find((card) => card.id === form.cardType)?.title || ""}/>{!serviceChoiceRequired && <Review label="Adresse de l’établissement" value={form.businessAddress}/>}<Review label="Prix indicatif" value={({ contact: "149 DH", "google-review": "199 DH", "e-business": "399 DH", service: "499 DH" } as Record<string, string>)[form.cardType] || "À confirmer"}/><Review label="Formule choisie" value={form.projectNeeds[0] || (form.cardType === "contact" ? "Non applicable — E-Contact" : form.cardType === "google-review" ? "Non applicable — Avis Google" : "Non sélectionnée")}/><Review label="Personnalisation" value={form.customRequested ? "Oui" : "Non"}/>{form.customRequested && <><Review label="Marque" value={form.brandName}/><Review label="Logo" value={logoName || "Non fourni"}/><Review label="Adresse" value={form.businessAddress}/><Review label="Téléphone professionnel" value={form.businessPhone}/></>}</div>}
          {error && <p role="alert" className="mt-5 rounded-xl border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-700">{error}</p>}
          <div className="mt-9 flex flex-col-reverse justify-between gap-3 sm:flex-row"><button type="button" disabled={step === 0 || busy} onClick={() => { setError(""); setStep((value) => value === 8 ? 7 : value === 6 && !serviceChoiceRequired ? 4 : value - 1); }} className="rounded-full border border-white/25 bg-white/5 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-white/10 disabled:opacity-30">Précédent</button><button type="submit" disabled={busy} className="rounded-full bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-600 px-8 py-3.5 text-sm font-extrabold text-white shadow-[0_10px_30px_rgba(0,120,255,.28)] transition hover:-translate-y-0.5 hover:brightness-110 disabled:opacity-60">{busy ? "Enregistrement..." : step === 8 ? "Envoyer ma demande →" : "Continuer →"}</button></div>
        </form>
        <div className="mt-6 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-5 text-center sm:flex-row sm:text-left"><p className="text-xs text-white/60">Vous souhaitez terminer plus tard ? Votre progression est sauvegardée automatiquement.</p><Link href="/" className="shrink-0 rounded-full border border-white/20 bg-white/5 px-5 py-2.5 text-xs font-bold text-white/85 transition hover:border-cyan-300/50 hover:bg-cyan-400/10 hover:text-white">Quitter et revenir plus tard</Link></div>
        <p className="mt-7 text-center text-[11px] leading-5 text-white/55">En confirmant, vous acceptez que TouchCard utilise ces informations pour traiter votre demande et vous contacter à ce sujet.</p>
      </section>
      </div>

      <style jsx global>{`
        .touchcard-intake .text-slate-900, .touchcard-intake .text-slate-800, .touchcard-intake .text-slate-700 { color: rgba(244,248,255,.94) !important; }
        .touchcard-intake .text-slate-600, .touchcard-intake .text-slate-500 { color: rgba(219,231,249,.72) !important; }
        .touchcard-intake .border-slate-200, .touchcard-intake .border-slate-300 { border-color: rgba(167,195,235,.24) !important; }
        .touchcard-intake .bg-white, .touchcard-intake .bg-violet-50, .touchcard-intake .bg-violet-50\/60, .touchcard-intake .bg-violet-50\/50 { background-color: rgba(5,17,36,.66) !important; }
        .touchcard-intake input:not([type=radio]):not([type=file]), .touchcard-intake textarea, .touchcard-intake select { color: #f8fbff !important; background-color: rgba(3,13,29,.72) !important; border-color: rgba(155,190,235,.3) !important; }
        .touchcard-intake input::placeholder, .touchcard-intake textarea::placeholder { color: rgba(207,220,241,.5) !important; }
        .touchcard-intake select option { color: #f8fbff; background: #0b1930; }
        .touchcard-intake label { color: rgba(238,245,255,.92); }
        .touchcard-intake .hover\\:bg-violet-50:hover, .touchcard-intake .hover\\:bg-slate-50:hover { background-color: rgba(24,62,104,.6) !important; }
        .touchcard-intake .bg-violet-700 { background-color: #4f46e5 !important; }
        .touchcard-intake .text-violet-900, .touchcard-intake .text-violet-700 { color: #dceaff !important; }
        .touchcard-intake .ring-violet-200 { --tw-ring-color: rgba(103,232,249,.35) !important; }
        @media (max-width: 639px) { .touchcard-intake section { border-radius: 1.35rem; } }
      `}</style>
    </main>
  );
}

function Field({ label, value, onChange, placeholder, type = "text", autoComplete }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; type?: string; autoComplete?: string }) {
  return <div><label className="mb-2 block text-sm font-semibold text-slate-700">{label}</label><input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} autoComplete={autoComplete} className="w-full rounded-xl border border-white/20 bg-slate-950/35 px-4 py-4 text-white outline-none transition placeholder:text-slate-400 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-400/20"/></div>;
}

function Choice({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" aria-pressed={selected} onClick={onClick} className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-4 text-left text-sm font-bold transition ${selected ? "border-violet-500 bg-violet-50 text-violet-900 ring-2 ring-violet-200" : "border-slate-200 bg-white text-slate-700 hover:border-violet-300 hover:bg-violet-50"}`}><span>{children}</span><span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${selected ? "border-violet-700 bg-violet-700 text-white" : "border-slate-300 bg-white text-transparent"}`} aria-hidden="true">✓</span></button>;
}

function Review({ label, value }: { label: string; value: string }) {
  return <div className="flex flex-wrap justify-between gap-2 border-b border-slate-200 pb-2 last:border-0"><span className="text-slate-500">{label}</span><span className="max-w-[65%] text-right font-semibold text-slate-900">{value || "—"}</span></div>;
}
