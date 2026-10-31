"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

const rise = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0 },
};

const features = [
  {
    number: "01",
    icon: "⌁",
    title: "Cartes NFC & QR",
    description:
      "Partagez vos coordonnées en un geste. Une carte, un scan, et votre contact est enregistré.",
    detail: "Profils personnalisables · QR unique · NFC",
  },
  {
    number: "02",
    icon: "◎",
    title: "CRM & prospects",
    description:
      "Centralisez les contacts collectés, qualifiez vos prospects et gardez le fil de chaque opportunité.",
    detail: "Contacts · Pipeline · Suivi commercial",
  },
  {
    number: "03",
    icon: "↗",
    title: "Analyses intelligentes",
    description:
      "Suivez les vues, les scans et les clics pour mieux comprendre l’impact de votre présence.",
    detail: "Statistiques · Interactions · Rapports",
  },
  {
    number: "04",
    icon: "✳",
    title: "Fidélité & récompenses",
    description:
      "Faites revenir vos clients avec des programmes de points, des avantages et des campagnes.",
    detail: "Points · Récompenses · Campagnes",
  },
  {
    number: "05",
    icon: "▦",
    title: "Équipes & organisations",
    description:
      "Gérez les cartes de vos collaborateurs et gardez une identité cohérente pour toute l’entreprise.",
    detail: "Membres · Rôles · Gestion centralisée",
  },
  {
    number: "06",
    icon: "◇",
    title: "Boutique & commandes",
    description:
      "Préparez la vente de cartes NFC et de supports personnalisés depuis votre espace professionnel.",
    detail: "Produits · Personnalisation · Commandes",
  },
];

const steps = [
  ["01", "Créez votre carte", "Ajoutez votre identité, vos coordonnées et vos liens professionnels."],
  ["02", "Partagez en un geste", "Présentez votre carte NFC, partagez votre QR code ou envoyez votre lien."],
  ["03", "Transformez les échanges", "Retrouvez vos contacts et suivez les interactions depuis votre espace."],
];

function Arrow() {
  return <span aria-hidden="true">↗</span>;
}

function QrPattern() {
  const cells = [
    1, 1, 1, 0, 1, 0, 1, 1, 1,
    1, 0, 1, 0, 0, 1, 1, 0, 1,
    1, 1, 1, 0, 1, 0, 1, 1, 1,
    0, 0, 0, 1, 0, 1, 0, 0, 0,
    1, 0, 1, 1, 1, 1, 0, 1, 0,
    0, 1, 0, 1, 0, 0, 1, 1, 1,
    1, 1, 1, 0, 1, 1, 1, 0, 1,
    1, 0, 1, 1, 0, 1, 0, 1, 0,
    1, 1, 1, 0, 1, 0, 1, 1, 1,
  ];
  return (
    <div className="grid grid-cols-9 gap-[3px] rounded-xl bg-white p-2.5 shadow-sm">
      {cells.map((cell, index) => (
        <span
          key={index}
          className={`aspect-square rounded-[2px] ${cell ? "bg-slate-950" : "bg-white"}`}
        />
      ))}
    </div>
  );
}

function DashboardPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[610px]">
      <motion.div
        aria-hidden="true"
        animate={{ y: [0, -13, 0], rotate: [0, 1.2, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -right-5 top-8 z-20 hidden rounded-2xl border border-white/70 bg-white/90 p-4 shadow-xl shadow-indigo-950/10 backdrop-blur md:block"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-lg text-emerald-600">✓</span>
          <div>
            <p className="text-xs font-bold text-slate-900">Contact enregistré</p>
            <p className="mt-1 text-[11px] text-slate-500">Nouveau prospect · À l’instant</p>
          </div>
        </div>
      </motion.div>

      <div className="rounded-[2.25rem] border border-white/10 bg-[#10132c] p-3 shadow-[0_35px_100px_-30px_rgba(49,46,129,.55)] sm:p-4">
        <div className="flex items-center justify-between px-3 py-3">
          <div className="flex items-center gap-2.5">
            <img src="/brand/touchcard-mark.svg" alt="" className="h-8 w-8 object-contain" />
            <span className="text-sm font-bold tracking-tight text-white">TouchCard <span className="font-medium text-indigo-300">Business</span></span>
          </div>
          <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[10px] font-semibold text-emerald-300">● Profil actif</span>
        </div>

        <div className="grid gap-3 md:grid-cols-[1.05fr_.95fr]">
          <div className="relative overflow-hidden rounded-[1.7rem] bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-6 text-white sm:p-7">
            <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full border border-white/10" />
            <div className="absolute -right-8 -top-8 h-36 w-36 rounded-full border border-white/10" />
            <div className="relative flex items-center justify-between">
              <span className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-[10px] font-bold tracking-[.18em]">VOTRE CARTE DIGITALE</span>
              <span className="text-xl text-indigo-100">✳</span>
            </div>
            <div className="relative mt-12">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/15 text-xl font-black">JD</div>
              <p className="mt-5 text-2xl font-bold tracking-tight">Jean Dupont</p>
              <p className="mt-1 text-sm text-indigo-100">Directeur · Studio Créatif</p>
            </div>
            <div className="relative mt-7 grid grid-cols-2 gap-2">
              {["Téléphone", "E-mail", "Site web", "LinkedIn"].map((item) => (
                <div key={item} className="rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 text-xs text-white/90">{item} <span className="float-right">↗</span></div>
              ))}
            </div>
            <p className="mt-7 text-[10px] font-semibold tracking-[.2em] text-indigo-200">TOUCHCARD · CONNECTER AUTREMENT</p>
          </div>

          <div className="grid gap-3">
            <div className="rounded-[1.7rem] bg-white p-5">
              <div className="flex items-center justify-between">
                <div><p className="text-xs font-semibold text-slate-500">Aperçu des interactions</p><p className="mt-1 text-2xl font-black tracking-tight text-slate-950">En un coup d’œil</p></div>
                <span className="rounded-xl bg-indigo-50 p-2.5 text-lg text-indigo-600">↗</span>
              </div>
              <div className="mt-6 flex h-24 items-end gap-2">
                {[28, 42, 34, 62, 48, 78, 58, 92, 70, 100, 77, 88].map((height, i) => (
                  <span key={i} style={{ height: `${height}%` }} className={`flex-1 rounded-t-md ${i === 9 ? "bg-violet-500" : "bg-indigo-100"}`} />
                ))}
              </div>
              <div className="mt-3 flex justify-between text-[10px] text-slate-400"><span>Activité</span><span>Exemple d’interface</span></div>
            </div>
            <div className="flex items-center justify-between rounded-[1.7rem] bg-[#f0edff] p-5">
              <div><p className="text-xs font-bold text-indigo-700">Partage instantané</p><p className="mt-1 text-sm text-slate-600">Votre profil, partout.</p><p className="mt-4 text-[10px] font-semibold tracking-[.16em] text-indigo-500">SCAN · CONNECT · GROW</p></div>
              <QrPattern />
            </div>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {["Cartes & profils", "Contacts & CRM", "Fidélité client"].map((label, i) => (
            <div key={label} className="rounded-xl border border-white/10 bg-white/[.06] px-2 py-3 text-center text-[10px] font-medium text-slate-300 sm:text-xs">
              <span className="mb-1 block text-sm text-indigo-300">{["▣", "◎", "✳"][i]}</span>{label}
            </div>
          ))}
        </div>
      </div>

      <motion.div
        aria-hidden="true"
        animate={{ y: [0, 12, 0], rotate: [0, -2, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        className="absolute -bottom-7 -left-5 z-20 hidden rounded-2xl border border-white bg-white p-4 shadow-xl shadow-indigo-950/10 sm:block"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-lg text-violet-600">⌁</span>
          <div><p className="text-xs font-bold text-slate-900">NFC + QR code</p><p className="mt-1 text-[11px] text-slate-500">Un partage, plusieurs possibilités</p></div>
        </div>
      </motion.div>
    </div>
  );
}

export function LandingPage() {
  const reduceMotion = useReducedMotion();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 24);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  const reveal = reduceMotion
    ? { hidden: { opacity: 1, y: 0 }, visible: { opacity: 1, y: 0 } }
    : rise;

  return (
    <main className="overflow-hidden bg-white text-slate-950">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-gradient-to-r from-[#090b1b] via-[#17143b] to-[#090b1b] text-white shadow-lg shadow-black/20 backdrop-blur-xl transition-all duration-300">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-4 sm:px-8 lg:px-12">
          <Link href="/" className="group flex items-center gap-2.5">
            <img src="/brand/touchcard-mark.svg" alt="TouchCard" className="h-11 w-11 object-contain transition-transform group-hover:rotate-3" />
            <span className={`text-xl font-black tracking-tight transition-colors duration-300 text-white`}>Touch<span className="text-indigo-500">Card</span><span className={`ml-2 hidden rounded-md px-2 py-1 align-middle text-[9px] font-extrabold tracking-[.18em] sm:inline-block border border-white/15 bg-white/10 text-indigo-200`}>BUSINESS</span></span>
          </Link>
          <nav aria-label="Navigation principale" className={`hidden items-center gap-6 text-sm font-semibold transition-colors duration-300 xl:flex text-white/90`}>
            <details className="group relative">
              <summary className="flex cursor-pointer list-none items-center gap-2 transition hover:text-indigo-600 [&::-webkit-details-marker]:hidden">Solutions <span className="text-[10px] transition group-open:rotate-180">⌄</span></summary>
              <div className="absolute left-0 top-full z-50 mt-4 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-950/10">
                <a className="block rounded-xl px-4 py-3 hover:bg-indigo-50 hover:text-indigo-700" href="#solutions"><span className="block text-sm font-bold">Toutes les fonctionnalités</span><span className="mt-1 block text-xs font-normal text-slate-500">NFC, QR, CRM, fidélité et boutique</span></a>
                <a className="block rounded-xl px-4 py-3 hover:bg-indigo-50 hover:text-indigo-700" href="#secteurs"><span className="block text-sm font-bold">Par secteur d’activité</span><span className="mt-1 block text-xs font-normal text-slate-500">Indépendants, commerces et équipes</span></a>
              </div>
            </details>
            <a className="transition hover:text-indigo-600" href="#experience">Plateforme</a>
            <a className="transition hover:text-indigo-600" href="#fonctionnement">Comment ça marche</a>
            <a className="transition hover:text-indigo-600" href="#demo">Démo</a>
            <a className="transition hover:text-indigo-600" href="#tarifs">Tarifs</a>
            <a className="transition hover:text-indigo-600" href="#faq">FAQ</a>
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/login" className={`hidden rounded-xl px-4 py-2.5 text-sm font-bold transition sm:inline-flex text-white hover:bg-white/10`}>Connexion</Link>
            <Link href="/register" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:-translate-y-0.5 hover:bg-indigo-700 sm:px-5">Créer mon espace <Arrow /></Link>
            <button type="button" aria-label={mobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"} aria-expanded={mobileMenuOpen} onClick={() => setMobileMenuOpen((open) => !open)} className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border text-xl transition-colors xl:hidden border-white/20 bg-white/10 text-white`}>
              {mobileMenuOpen ? "×" : "☰"}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <nav aria-label="Navigation mobile" className="border-t border-white/10 bg-gradient-to-r from-[#090b1b] via-[#17143b] to-[#090b1b] px-5 py-4 text-white shadow-xl xl:hidden">
            <div className="mx-auto grid max-w-[1440px] gap-1">
              {[["Solutions", "#solutions"], ["La plateforme", "#experience"], ["Démonstration", "#demo"], ["Comment ça marche", "#fonctionnement"], ["Tarifs", "#tarifs"], ["FAQ", "#faq"]].map(([label, href]) => (
                <a key={href} href={href} onClick={() => setMobileMenuOpen(false)} className="rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700">{label}</a>
              ))}
              <div className="mt-2 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
                <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="rounded-xl border border-slate-200 px-3 py-3 text-center text-sm font-bold text-slate-700">Connexion</Link>
                <Link href="/register" onClick={() => setMobileMenuOpen(false)} className="rounded-xl bg-indigo-600 px-3 py-3 text-center text-sm font-bold text-white">Créer un espace</Link>
              </div>
            </div>
          </nav>
        )}
      </header>

      <section className="relative isolate overflow-hidden bg-[#090b1b] text-white">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          {/* Vidéo d'ambiance NFC : les motifs Framer Motion ci-dessous restent inchangés. */}
          <video
            className="absolute inset-0 h-full w-full object-cover opacity-45"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden="true"
          >
            <source src="https://videos.pexels.com/video-files/5101679/5101679-hd_1920_1080_25fps.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-br from-[#090b1b]/95 via-[#17143b]/85 to-[#090b1b]/95" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#090b1b]/70 via-indigo-950/35 to-violet-950/55" />
          <div className="absolute -right-48 -top-56 h-[42rem] w-[42rem] rounded-full bg-indigo-600/30 blur-[120px]" />
          <div className="absolute -bottom-64 -left-40 h-[34rem] w-[34rem] rounded-full bg-violet-700/25 blur-[120px]" />
          <div className="absolute inset-0 opacity-[.13]" style={{ backgroundImage: "radial-gradient(#a5b4fc 1px, transparent 1px)", backgroundSize: "30px 30px" }} />
          <motion.div aria-hidden="true" className="absolute -right-24 top-24 h-[34rem] w-[34rem] rounded-full border border-indigo-300/20" animate={reduceMotion ? undefined : { rotate: 360 }} transition={{ duration: 70, repeat: Infinity, ease: "linear" }} />
          <motion.div aria-hidden="true" className="absolute -right-8 top-40 h-[22rem] w-[22rem] rounded-full border border-violet-300/20" animate={reduceMotion ? undefined : { rotate: -360 }} transition={{ duration: 52, repeat: Infinity, ease: "linear" }}>
            <span className="absolute left-1/2 top-0 h-3 w-3 -translate-x-1/2 rounded-full bg-fuchsia-300 shadow-[0_0_24px_rgba(232,121,249,.9)]" />
          </motion.div>
          <motion.div aria-hidden="true" className="absolute right-[13%] top-[22%] h-3 w-3 rounded-full bg-indigo-300 shadow-[0_0_28px_rgba(129,140,248,.95)]" animate={reduceMotion ? undefined : { y: [0, -22, 0], x: [0, 12, 0], opacity: [.45, 1, .45] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }} />
          <motion.div aria-hidden="true" className="absolute bottom-[22%] right-[42%] h-2 w-2 rounded-full bg-fuchsia-300 shadow-[0_0_22px_rgba(232,121,249,.9)]" animate={reduceMotion ? undefined : { y: [0, 18, 0], opacity: [.35, 1, .35] }} transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: .7 }} />
          <motion.div aria-hidden="true" className="absolute right-[7%] top-[34%] hidden rounded-2xl border border-white/10 bg-white/[.045] p-3 text-[10px] font-bold tracking-[.18em] text-indigo-100/70 backdrop-blur-sm lg:block" animate={reduceMotion ? undefined : { y: [0, -12, 0], rotate: [3, 0, 3] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}>NFC · CONNECT</motion.div>
          <motion.div aria-hidden="true" className="absolute bottom-[18%] right-[8%] hidden h-16 w-16 rotate-12 rounded-2xl border border-fuchsia-300/20 bg-gradient-to-br from-indigo-400/10 to-fuchsia-400/10 backdrop-blur-sm lg:block" animate={reduceMotion ? undefined : { y: [0, 14, 0], rotate: [12, 24, 12] }} transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: .4 }}>
            <span className="absolute inset-3 rounded-xl border border-white/15" />
          </motion.div>
          <motion.div aria-hidden="true" className="absolute left-[5%] top-[23%] hidden h-20 w-20 rounded-full border border-indigo-300/15 lg:block" animate={reduceMotion ? undefined : { scale: [1, 1.16, 1], opacity: [.25, .65, .25] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} />
        </div>
        <div className="mx-auto grid min-h-[760px] max-w-[1440px] items-center gap-16 px-5 py-20 sm:px-8 lg:grid-cols-[1fr_1.08fr] lg:px-12 lg:py-28">
          <motion.div initial="hidden" animate="visible" variants={reveal} transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}>
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-300/20 bg-white/[.06] px-4 py-2 text-[11px] font-extrabold uppercase tracking-[.16em] text-indigo-200 shadow-sm backdrop-blur">
              <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" /><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" /></span>
              La nouvelle génération de cartes professionnelles
            </div>
            <h1 className="mt-8 max-w-3xl text-[clamp(3.25rem,4.5vw,4.4rem)] font-black leading-[.99] tracking-[-.065em] text-white">
              Chaque rencontre peut devenir <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-500 bg-clip-text text-transparent">une opportunité.</span>
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-8 text-slate-300 sm:text-xl sm:leading-9">
              Bien plus qu’une carte de visite. Créez votre identité digitale, partagez-la avec NFC ou QR code, développez vos contacts et fidélisez vos clients depuis une seule plateforme.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link href="/register" className="group inline-flex items-center justify-center gap-3 rounded-2xl border border-white/25 bg-gradient-to-r from-indigo-500/35 via-violet-500/30 to-fuchsia-500/25 px-7 py-[1.125rem] text-base font-bold text-white shadow-[0_12px_40px_-18px_rgba(99,102,241,.8)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-white/40 hover:from-indigo-500/55 hover:to-violet-500/45">
                Commencer maintenant <span className="transition-transform group-hover:translate-x-1">→</span>
              </Link>
              <a href="#solutions" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/[.035] px-7 py-[1.125rem] text-base font-bold text-white/95 shadow-sm backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-indigo-200/50 hover:bg-white/[.09]">Explorer les solutions <span className="text-indigo-200">↓</span></a>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-sm font-medium text-slate-300">
              <span className="inline-flex items-center gap-2"><span className="text-emerald-500">✓</span> Sans application à installer</span>
              <span className="inline-flex items-center gap-2"><span className="text-emerald-500">✓</span> NFC, QR code et lien</span>
              <span className="inline-flex items-center gap-2"><span className="text-emerald-500">✓</span> Pour les équipes</span>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.94, x: 30 }} animate={{ opacity: 1, scale: 1, x: 0 }} transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }} className="py-8 lg:py-0">
            <DashboardPreview />
          </motion.div>
        </div>
        <div className="relative border-t border-white/10 bg-gradient-to-r from-[#0c1025] via-[#15143a] to-[#0c1025]">
          <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-3 px-5 py-8 sm:grid-cols-2 sm:px-8 lg:grid-cols-4 lg:px-12">
            {[
              ["01", "Une identité digitale", "Votre univers professionnel, toujours à jour.", "◈"],
              ["02", "Un partage instantané", "Un geste NFC, un scan QR, le contact est créé.", "⌁"],
              ["03", "Des contacts organisés", "Chaque rencontre devient une opportunité suivie.", "◎"],
              ["04", "Une relation durable", "Entretenez le lien et fidélisez vos clients.", "✳"],
            ].map(([n, label, detail, symbol], index) => (
              <motion.div key={n} initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .4 }} transition={{ duration: .55, delay: index * .1 }} whileHover={reduceMotion ? undefined : { y: -5 }} className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[.045] p-5 backdrop-blur-sm">
                <div className="absolute -right-8 -top-10 h-24 w-24 rounded-full bg-indigo-500/10 blur-2xl transition group-hover:bg-fuchsia-500/20" />
                <div className="relative flex items-center justify-between"><span className="text-[10px] font-black tracking-[.2em] text-indigo-300">{n}</span><span className="flex h-9 w-9 items-center justify-center rounded-xl border border-indigo-300/20 bg-indigo-400/10 text-lg text-indigo-200">{symbol}</span></div>
                <h3 className="relative mt-5 text-sm font-extrabold text-white">{label}</h3>
                <p className="relative mt-2 text-xs leading-5 text-slate-400">{detail}</p>
                <motion.div className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400" initial={{ width: "0%" }} whileInView={{ width: "100%" }} viewport={{ once: true }} transition={{ duration: 1, delay: .2 + index * .12 }} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="chiffres" className="relative isolate overflow-hidden bg-[#090b1b] px-5 py-24 text-white sm:px-8 lg:px-12 lg:py-32">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -left-40 top-0 h-96 w-96 rounded-full bg-indigo-600/20 blur-[120px]" />
          <div className="absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-fuchsia-600/15 blur-[120px]" />
          <div className="absolute inset-0 opacity-[.07]" style={{ backgroundImage: "radial-gradient(#a5b4fc 1px, transparent 1px)", backgroundSize: "26px 26px" }} />
        </div>
        <div className="relative mx-auto max-w-[1440px]">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: .25 }} variants={reveal} className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-300/20 bg-white/[.06] px-4 py-2 text-[10px] font-extrabold uppercase tracking-[.2em] text-indigo-200"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> L’impact en un coup d’œil</span>
            <h2 className="mt-6 text-4xl font-black tracking-[-.05em] sm:text-5xl lg:text-6xl">Les rencontres prennent de la valeur. <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-fuchsia-300 bg-clip-text text-transparent">Les chiffres le raconteront.</span></h2>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-400 sm:text-lg">Un tableau de bord pour mesurer l’adoption de TouchCard et suivre l’activité de votre réseau, en toute transparence.</p>
          </motion.div>
          <div className="mt-16 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ["Utilisateurs actifs", "Profils professionnels qui utilisent la plateforme", "01", "◎"],
              ["Cartes digitales créées", "Cartes NFC et profils QR configurés", "02", "▣"],
              ["Interactions enregistrées", "Scans, vues et clics sur les profils", "03", "↗"],
              ["Contacts collectés", "Nouveaux contacts ajoutés au réseau", "04", "✳"],
            ].map(([label, description, number, symbol], index) => (
              <motion.article key={number} initial={{ opacity: 0, y: 28, scale: .97 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={{ once: true, amount: .25 }} transition={{ duration: .65, delay: index * .1 }} whileHover={reduceMotion ? undefined : { y: -7 }} className="group relative overflow-hidden rounded-[1.7rem] border border-white/10 bg-gradient-to-br from-white/[.09] to-white/[.025] p-7 shadow-[0_25px_70px_-45px_rgba(99,102,241,.5)] backdrop-blur-xl">
                <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-indigo-500/10 blur-3xl transition-colors group-hover:bg-fuchsia-500/20" />
                <div className="relative flex items-center justify-between"><span className="text-[10px] font-black tracking-[.2em] text-indigo-300">{number}</span><span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-indigo-300/20 bg-indigo-400/10 text-xl text-indigo-200">{symbol}</span></div>
                <p className="relative mt-8 text-4xl font-black tracking-tight text-white">—</p>
                <h3 className="relative mt-3 text-base font-extrabold text-white">{label}</h3>
                <p className="relative mt-2 min-h-10 text-xs leading-5 text-slate-400">{description}</p>
                <div className="relative mt-6 flex items-center gap-2 border-t border-white/10 pt-4 text-[10px] font-bold uppercase tracking-[.12em] text-slate-500"><span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> Statistique bientôt disponible</div>
              </motion.article>
            ))}
          </div>
          <p className="mt-7 text-center text-xs text-slate-500">Les compteurs seront alimentés par les données réelles de la plateforme après son lancement. Aucun chiffre fictif n’est affiché.</p>
        </div>
      </section>

      <section id="solutions" className="relative isolate overflow-hidden bg-[#0b0d20] px-5 py-24 text-white sm:px-8 lg:px-12 lg:py-32">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -right-40 top-0 h-[34rem] w-[34rem] rounded-full bg-indigo-600/15 blur-[120px]" />
          <div className="absolute -bottom-48 -left-32 h-[30rem] w-[30rem] rounded-full bg-fuchsia-600/10 blur-[120px]" />
          <div className="absolute inset-0 opacity-[.08]" style={{ backgroundImage: "linear-gradient(rgba(165,180,252,.35) 1px, transparent 1px), linear-gradient(90deg, rgba(165,180,252,.35) 1px, transparent 1px)", backgroundSize: "52px 52px" }} />
        </div>
        <div className="relative mx-auto max-w-[1440px]">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={reveal} transition={{ duration: 0.65}} className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-300/20 bg-indigo-400/[.08] px-4 py-2 text-[10px] font-extrabold uppercase tracking-[.2em] text-indigo-200"><span className="h-1.5 w-1.5 rounded-full bg-fuchsia-400" /> L’écosystème TouchCard</span>
            <h2 className="mt-6 text-4xl font-black leading-tight tracking-[-.045em] text-white sm:text-5xl lg:text-6xl">Tous vos outils pour <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-fuchsia-300 bg-clip-text text-transparent">développer votre réseau.</span></h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-400">De la première prise de contact à la fidélisation, une suite professionnelle conçue pour transformer chaque échange en opportunité.</p>
          </motion.div>
          <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <motion.article key={feature.number} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.16 }} variants={reveal} transition={{ duration: 0.55, delay: index * 0.07 }} whileHover={reduceMotion ? undefined : { y: -8, scale: 1.012 }} className="group relative isolate overflow-hidden rounded-[1.65rem] border border-white/[.09] bg-white/[.045] p-7 shadow-[0_18px_55px_-35px_rgba(0,0,0,.8)] backdrop-blur-xl transition-all duration-300 hover:border-indigo-300/35 hover:bg-white/[.075] hover:shadow-[0_25px_70px_-35px_rgba(99,102,241,.35)] sm:p-8">
                <div className="pointer-events-none absolute -right-16 -top-20 -z-10 h-48 w-48 rounded-full bg-indigo-500/0 blur-3xl transition-colors duration-500 group-hover:bg-indigo-500/20" />
                <div className="relative flex items-center justify-between">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-indigo-300/20 bg-gradient-to-br from-indigo-400/20 to-fuchsia-400/10 text-2xl font-semibold text-indigo-200 shadow-inner shadow-white/[.04] transition duration-300 group-hover:scale-110 group-hover:border-violet-300/40 group-hover:text-white">{feature.icon}</span>
                  <span className="rounded-full border border-white/10 px-3 py-1.5 text-[10px] font-bold tracking-[.18em] text-slate-500">{feature.number}</span>
                </div>
                <h3 className="relative mt-8 text-xl font-extrabold tracking-tight text-white transition-colors group-hover:text-indigo-100">{feature.title}</h3>
                <p className="relative mt-3 min-h-[76px] text-sm leading-7 text-slate-400">{feature.description}</p>
                <div className="relative mt-7 flex items-center justify-between gap-3 border-t border-white/[.09] pt-5">
                  <p className="text-[10px] font-bold leading-5 tracking-wide text-indigo-200/80">{feature.detail}</p>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 text-sm text-slate-400 transition-all group-hover:translate-x-1 group-hover:border-indigo-300/40 group-hover:bg-indigo-400/10 group-hover:text-indigo-200">↗</span>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section id="experience" className="relative overflow-hidden bg-[#11132d] py-24 text-white lg:py-32">
        <div className="absolute -right-48 top-0 h-[35rem] w-[35rem] rounded-full bg-indigo-600/20 blur-[110px]" />
        <div className="absolute -bottom-48 -left-40 h-[30rem] w-[30rem] rounded-full bg-violet-600/20 blur-[100px]" />
        <div className="relative mx-auto grid max-w-[1440px] items-center gap-16 px-5 sm:px-8 lg:grid-cols-2 lg:px-12">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={reveal} transition={{ duration: 0.65 }}>
            <p className="text-xs font-black uppercase tracking-[.22em] text-indigo-300">Votre activité, mieux connectée</p>
            <h2 className="mt-5 text-4xl font-black leading-tight tracking-[-.045em] sm:text-5xl lg:text-6xl">Une expérience fluide. <span className="text-indigo-300">Un réseau qui grandit.</span></h2>
            <p className="mt-7 max-w-xl text-lg leading-8 text-slate-300">Votre profil professionnel devient le point de départ d’une expérience complète : partage, collecte de contacts, suivi commercial et fidélisation.</p>
            <div className="mt-10 space-y-5">
              {[
                ["Une seule présence", "Toutes vos informations professionnelles réunies sur un profil."],
                ["Une gestion centralisée", "Retrouvez cartes, collaborateurs et contacts dans votre espace."],
                ["Des décisions plus claires", "Consultez vos interactions et identifiez ce qui suscite l’intérêt."],
              ].map(([title, description]) => (
                <div key={title} className="flex gap-4">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-400/15 text-sm text-indigo-300">✓</span>
                  <div><h3 className="font-bold text-white">{title}</h3><p className="mt-1 text-sm leading-6 text-slate-400">{description}</p></div>
                </div>
              ))}
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.7 }} className="relative">
            <div className="rounded-[2rem] border border-white/10 bg-white/[.06] p-5 shadow-2xl shadow-black/20 backdrop-blur sm:p-7">
              <div className="flex items-center justify-between border-b border-white/10 pb-5">
                <div><p className="text-xs font-semibold text-slate-400">ESPACE PROFESSIONNEL</p><p className="mt-1 text-lg font-bold">Votre activité en un endroit</p></div>
                <span className="rounded-xl bg-indigo-400/15 px-3 py-2 text-xs font-bold text-indigo-200">TouchCard</span>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3">
                {[["Cartes digitales", "Votre identité"], ["Contacts", "Vos opportunités"], ["Équipe", "Vos collaborateurs"], ["Fidélité", "Vos clients"]].map(([title, sub], i) => (
                  <div key={title} className="rounded-2xl border border-white/10 bg-[#1b1e3e] p-4 sm:p-5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-400/15 text-lg text-indigo-200">{["▣", "◎", "♧", "✳"][i]}</span>
                    <p className="mt-5 text-sm font-bold">{title}</p><p className="mt-1 text-xs text-slate-400">{sub}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 rounded-2xl border border-indigo-300/15 bg-gradient-to-r from-indigo-500/15 to-violet-500/10 p-5">
                <div className="flex items-center justify-between"><div><p className="text-xs font-semibold text-indigo-200">Une plateforme évolutive</p><p className="mt-1 text-sm font-bold">Construisez votre présence digitale</p></div><span className="text-2xl text-indigo-200">✦</span></div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="fonctionnement" className="mx-auto max-w-[1440px] px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
        <div className="grid gap-12 lg:grid-cols-[.85fr_1.15fr]">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={reveal} transition={{ duration: 0.6 }}>
            <p className="text-xs font-black uppercase tracking-[.22em] text-indigo-600">Trois étapes, tout simplement</p>
            <h2 className="mt-5 text-4xl font-black leading-tight tracking-[-.045em] sm:text-5xl">De la rencontre à la <span className="text-indigo-600">connexion.</span></h2>
            <p className="mt-6 max-w-md text-lg leading-8 text-slate-500">Pas de parcours compliqué. Votre carte digitale est prête à être partagée en quelques étapes.</p>
            <Link href="/register" className="mt-9 inline-flex items-center gap-3 rounded-xl bg-indigo-600 px-6 py-4 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:-translate-y-1 hover:bg-indigo-700">Créer mon espace <Arrow /></Link>
          </motion.div>
          <div className="space-y-4">
            {steps.map(([number, title, description], index) => (
              <motion.div key={number} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={reveal} transition={{ duration: 0.55, delay: index * 0.1 }} className="group flex gap-5 rounded-[1.6rem] border border-slate-200 bg-white p-6 transition hover:border-indigo-200 hover:bg-indigo-50/30 sm:gap-7 sm:p-8">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-sm font-black text-indigo-700 transition group-hover:bg-indigo-600 group-hover:text-white">{number}</span>
                <div className="pt-1"><h3 className="text-lg font-extrabold text-slate-950">{title}</h3><p className="mt-2 text-sm leading-7 text-slate-500">{description}</p></div>
                <span className="ml-auto hidden self-center text-xl text-slate-300 transition group-hover:translate-x-1 group-hover:text-indigo-600 sm:block">→</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>


      <section id="demo" className="bg-[#f7f7ff] px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
        <div className="mx-auto grid max-w-[1280px] items-center gap-14 lg:grid-cols-[.85fr_1.15fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-[.22em] text-indigo-600">Découvrez TouchCard</p>
            <h2 className="mt-5 text-4xl font-black leading-tight tracking-[-.045em] sm:text-5xl">Votre activité mérite une <span className="text-indigo-600">meilleure vitrine.</span></h2>
            <p className="mt-6 text-lg leading-8 text-slate-600">Découvrez comment une carte digitale peut simplifier le partage de vos coordonnées, organiser vos prospects et renforcer votre relation client.</p>
            <ul className="mt-8 space-y-4 text-sm font-semibold text-slate-700">
              {["Un profil professionnel accessible en un scan", "Un espace centralisé pour vos contacts et votre équipe", "Des indicateurs pour suivre vos interactions"].map((item) => <li key={item} className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">✓</span>{item}</li>)}
            </ul>
            <Link href="/register" className="mt-9 inline-flex rounded-xl bg-indigo-600 px-6 py-4 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:-translate-y-1 hover:bg-indigo-700">Essayer la plateforme <Arrow /></Link>
          </div>
          <div className="relative">
            <div className="absolute -inset-5 rounded-[2.5rem] bg-gradient-to-br from-indigo-200/70 to-violet-200/70 blur-2xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white bg-[#11132d] p-3 shadow-2xl shadow-indigo-950/20 sm:p-5">
              <div className="flex items-center gap-2 px-3 py-3"><span className="h-2.5 w-2.5 rounded-full bg-rose-400"/><span className="h-2.5 w-2.5 rounded-full bg-amber-300"/><span className="h-2.5 w-2.5 rounded-full bg-emerald-400"/><span className="ml-3 text-xs font-semibold text-slate-400">Présentation de la plateforme</span></div>
              <div className="relative flex min-h-[290px] flex-col items-center justify-center overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-indigo-600 via-[#3530a2] to-violet-800 px-6 py-10 text-center sm:min-h-[390px]">
                <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full border border-white/10"/><div className="absolute -bottom-28 -right-16 h-80 w-80 rounded-full border border-white/10"/>
                <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl border border-white/20 bg-white/15 text-4xl text-white shadow-xl backdrop-blur">▶</div>
                <p className="relative mt-7 text-2xl font-black text-white sm:text-3xl">TouchCard Business</p>
                <p className="relative mt-3 max-w-md text-sm leading-6 text-indigo-100">Un aperçu visuel de votre futur espace de gestion. La vidéo de présentation sera intégrée ici dès que son fichier ou son lien sera disponible.</p>
                <span className="relative mt-6 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[10px] font-bold uppercase tracking-[.18em] text-white/90">Espace vidéo · prêt à intégrer</span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-4 text-xs text-slate-400"><span>Cartes · CRM · Fidélité · Analyses</span><span className="font-semibold text-indigo-200">Une seule plateforme</span></div>
            </div>
          </div>
        </div>
      </section>

      <section id="secteurs" className="relative isolate overflow-hidden bg-[#080a1b] px-5 py-24 text-white sm:px-8 lg:px-12 lg:py-32">
        <div className="pointer-events-none absolute -right-40 top-10 -z-10 h-[32rem] w-[32rem] rounded-full bg-violet-700/25 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-48 -left-32 -z-10 h-[30rem] w-[30rem] rounded-full bg-indigo-700/25 blur-[120px]" />
        <div className="mx-auto max-w-[1480px]">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={reveal} className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-white/[.06] px-4 py-2 text-[10px] font-extrabold uppercase tracking-[.2em] text-indigo-200 shadow-sm"><span className="h-1.5 w-1.5 rounded-full bg-fuchsia-400" /> Collection TouchCard NFC</span>
            <h2 className="mt-6 text-4xl font-black tracking-[-.05em] text-white sm:text-5xl lg:text-6xl">Une carte pour chaque <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">usage professionnel.</span></h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-300">Découvrez nos cinq modèles NFC : partage professionnel, prise de contact, services digitaux, avis Google et identité personnalisée.</p>
          </motion.div>
          <div className="mt-20 grid gap-x-6 gap-y-16 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {[
              {name:"Business",type:"Réseau professionnel",desc:"Présentez votre profil, vos coordonnées et tous vos liens professionnels en un seul geste.",price:"399 DH",tone:"metal",number:"01"},
              {name:"Contact",type:"Partage de coordonnées",desc:"Facilitez l’échange de vos informations et l’enregistrement de vos coordonnées.",price:"249 DH",tone:"metal",number:"02"},
              {name:"E-Service",type:"Services & accès rapides",desc:"Dirigez vos clients vers vos services, réservations, menus ou pages utiles.",price:"399 DH",tone:"metal",number:"03"},
              {name:"Avis Google",type:"Collecte d’avis clients",desc:"Invitez vos clients à découvrir votre page Google et à partager leur expérience.",price:"199 DH",tone:"from-[#111827] via-[#202b50] to-[#394b8c]",number:"04"},
              {name:"Personnalisée",type:"Logo personnalisé",desc:"Affichez votre propre logo au centre et créez une carte à l’image de votre marque.",price:"499 DH",tone:"from-[#171521] via-[#29233f] to-[#514078]",number:"05"}
            ].map((card,index) => (
              <motion.article key={card.name} initial="hidden" whileInView="visible" viewport={{ once:true, amount:.18 }} variants={reveal} transition={{ duration:.6, delay:index*.07 }} className="group">
                <div className="relative mx-auto flex h-[245px] items-center justify-center [perspective:1100px]">
                  <div className="absolute bottom-5 h-9 w-[78%] rounded-[50%] bg-indigo-950/70 blur-2xl transition-all duration-500 group-hover:scale-90 group-hover:opacity-60" />
                  <div className={"relative h-[190px] w-full max-w-[290px] overflow-hidden rounded-[1.35rem] border p-5 shadow-[0_28px_55px_-24px_rgba(0,0,0,.8)] transition-all duration-500 [transform:rotateY(-17deg)_rotateX(9deg)_rotateZ(-3deg)] group-hover:[transform:rotateY(-5deg)_rotateX(2deg)_rotateZ(0deg)_translateY(-10px)] group-hover:shadow-[0_38px_65px_-25px_rgba(99,102,241,.5)] " + (card.tone === "metal" ? "border-white/20 bg-[#101114]" : "border-white/25 bg-gradient-to-br " + card.tone)}>
                    {card.tone === "metal" && <div className="pointer-events-none absolute inset-0 opacity-80" style={{backgroundImage:"repeating-linear-gradient(90deg,rgba(255,255,255,.055) 0px,rgba(255,255,255,.012) 1px,transparent 2px,transparent 4px),linear-gradient(145deg,#25262a 0%,#090a0c 48%,#1b1c20 100%)"}} />}
                    {card.tone !== "metal" && <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-black/35" />}
                    <div className="relative flex h-full flex-col items-center justify-center text-white">
                      <img src="/brand/touchcard-mark.svg" alt="Logo TouchCard" className="h-[68px] w-[68px] object-contain drop-shadow-[0_4px_12px_rgba(99,102,241,.45)]" />
                      <span className="mt-4 text-[11px] font-extrabold uppercase tracking-[.22em] text-white">{card.name}</span>
                    </div>
                    <div className="pointer-events-none absolute bottom-3 right-4 text-[7px] font-bold tracking-[.2em] text-white/40">NFC</div>
                  </div>
                </div>
                <div className="mt-5 flex items-center justify-between gap-2">
                  <div><p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-indigo-300">{card.type}</p><h3 className="mt-2 text-xl font-black tracking-tight text-white">{card.name}</h3></div>
                  <span className="text-xs font-black tracking-[.18em] text-slate-500">{card.number}</span>
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-400">{card.desc}</p>
                <p className="mt-4 text-2xl font-black tracking-tight text-white">{card.price}</p>
                {card.name === "Personnalisée" && <p className="mt-3 inline-flex rounded-full border border-fuchsia-400/25 bg-fuchsia-400/10 px-3 py-1.5 text-[10px] font-bold text-fuchsia-200">Votre logo au centre</p>}
              </motion.article>
            ))}
          </div>
          <div className="mt-16 flex flex-col items-center justify-between gap-5 rounded-3xl border border-white/10 bg-white/[.06] p-6 shadow-[0_20px_60px_-45px_rgba(49,46,129,.5)] backdrop-blur sm:flex-row sm:p-8">
            <div><p className="text-sm font-extrabold text-white">Votre marque, au cœur de chaque rencontre.</p><p className="mt-1 text-sm text-slate-300">Choisissez votre modèle NFC et partagez votre univers en un simple geste.</p></div>
            <Link href="/register" className="inline-flex shrink-0 items-center gap-3 rounded-xl border border-indigo-300/30 bg-indigo-500/20 px-5 py-3.5 text-sm font-extrabold text-indigo-100 transition hover:-translate-y-0.5 hover:bg-indigo-500/35">Créer ma carte <Arrow /></Link>
          </div>
        </div>
      </section>
      <section id="tarifs" className="bg-[#f7f7ff] px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
        <div className="mx-auto max-w-[1280px]">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-black uppercase tracking-[.22em] text-indigo-600">Des offres adaptées à vos ambitions</p>
            <h2 className="mt-5 text-4xl font-black tracking-[-.045em] sm:text-5xl">Choisissez votre <span className="text-indigo-600">prochaine étape.</span></h2>
            <p className="mt-5 text-lg leading-8 text-slate-500">Des formules pensées pour démarrer seul, développer votre activité ou équiper toute une organisation.</p>
          </div>
          <div className="mt-14 grid items-stretch gap-5 lg:grid-cols-3">
            {[
              {name:"Starter",tag:"Pour démarrer",desc:"L'essentiel pour créer votre présence professionnelle.",items:["Profil digital personnalisé","Partage par QR code et lien","Coordonnées et liens professionnels","Accès à votre espace personnel"]},
              {name:"Business",tag:"Pour développer",desc:"Les outils pour gérer vos contacts et développer votre réseau.",items:["Tout Starter","Gestion des contacts et prospects","Statistiques des interactions","Campagnes et fidélisation","Personnalisation avancée"],featured:true},
              {name:"Entreprise",tag:"Pour vos équipes",desc:"Une gestion centralisée pour votre organisation.",items:["Tout Business","Gestion des collaborateurs","Rôles et accès par équipe","Vue centralisée de l'organisation","Accompagnement de déploiement"]}
            ].map((plan) => <article key={plan.name} className={`relative flex flex-col rounded-[2rem] border p-7 sm:p-8 ${plan.featured ? "border-indigo-500 bg-[#11132d] text-white shadow-2xl shadow-indigo-900/20 lg:-translate-y-3" : "border-slate-200 bg-white text-slate-950"}`}>
              {plan.featured && <span className="absolute -top-3 left-7 rounded-full bg-indigo-500 px-4 py-1.5 text-[10px] font-black uppercase tracking-[.15em] text-white">Offre recommandée</span>}
              <p className={`text-xs font-bold uppercase tracking-[.16em] ${plan.featured ? "text-indigo-300" : "text-indigo-600"}`}>{plan.tag}</p>
              <h3 className="mt-4 text-3xl font-black">{plan.name}</h3>
              <p className={`mt-3 min-h-12 text-sm leading-6 ${plan.featured ? "text-slate-300" : "text-slate-500"}`}>{plan.desc}</p>
              <div className={`mt-7 border-y py-5 ${plan.featured ? "border-white/10" : "border-slate-100"}`}><p className="text-2xl font-black">Tarif à définir</p><p className={`mt-1 text-xs ${plan.featured ? "text-slate-400" : "text-slate-400"}`}>Contactez-nous pour les conditions de l'offre</p></div>
              <ul className="mt-7 flex-1 space-y-4">{plan.items.map((item) => <li key={item} className={`flex gap-3 text-sm ${plan.featured ? "text-slate-200" : "text-slate-600"}`}><span className="font-black text-emerald-500">✓</span>{item}</li>)}</ul>
              <Link href="/register" className={`mt-9 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-4 text-sm font-bold transition hover:-translate-y-0.5 ${plan.featured ? "bg-white text-indigo-700 hover:bg-indigo-50" : "bg-indigo-600 text-white hover:bg-indigo-700"}`}>Choisir {plan.name} <Arrow /></Link>
            </article>)}
          </div>
          <p className="mt-8 text-center text-xs leading-6 text-slate-500">Les tarifs définitifs, les limites d'utilisation et les options seront précisés avant l'ouverture commerciale.</p>
        </div>
      </section>

      <section id="faq" className="px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
        <div className="mx-auto grid max-w-[1180px] gap-12 lg:grid-cols-[.8fr_1.2fr]">
          <div><p className="text-xs font-black uppercase tracking-[.22em] text-indigo-600">Questions fréquentes</p><h2 className="mt-5 text-4xl font-black leading-tight tracking-[-.045em] sm:text-5xl">Vous souhaitez en savoir <span className="text-indigo-600">plus ?</span></h2><p className="mt-6 text-base leading-8 text-slate-500">Voici quelques réponses pour mieux comprendre le fonctionnement de TouchCard Business.</p><Link href="/register" className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-indigo-700 hover:text-indigo-900">Créer mon espace <Arrow /></Link></div>
          <div className="space-y-3">
            {[
              ["Qu'est-ce qu'une carte de visite digitale ?", "C'est un profil professionnel en ligne qui rassemble vos coordonnées, vos liens et vos informations. Vous pouvez le partager par QR code, lien ou carte NFC compatible."],
              ["Le destinataire doit-il installer une application ?", "Non. Le profil public s'ouvre dans le navigateur du téléphone. Le destinataire n'a pas besoin d'installer une application pour consulter vos informations."],
              ["Puis-je gérer plusieurs collaborateurs ?", "La formule Entreprise est pensée pour centraliser les profils et les accès des membres d'une organisation."],
              ["Puis-je modifier mes informations après création ?", "Oui. Les informations de votre profil sont gérées depuis votre espace professionnel et peuvent être mises à jour."],
              ["Les cartes NFC sont-elles incluses ?", "La plateforme prend en charge le partage via NFC et QR code. La fourniture et le prix des supports physiques seront précisés dans les offres commerciales."],
              ["Comment connaître les tarifs ?", "Les tarifs définitifs sont en cours de définition. Vous pouvez créer votre espace ou nous contacter pour discuter de votre besoin."]
            ].map(([question, answer]) => <details key={question} className="group rounded-2xl border border-slate-200 bg-white p-5 open:border-indigo-200 open:bg-indigo-50/40 sm:p-6"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-extrabold text-slate-900 [&::-webkit-details-marker]:hidden">{question}<span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-lg text-indigo-700 transition group-open:rotate-45">+</span></summary><p className="mt-4 max-w-2xl pr-8 text-sm leading-7 text-slate-600">{answer}</p></details>)}
          </div>
        </div>
      </section>

      <section className="px-5 pb-24 sm:px-8 lg:px-12 lg:pb-32">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 42, scale: 0.97 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
          className="group relative mx-auto max-w-[1440px] overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#090b1b] px-6 py-20 text-center text-white shadow-[0_35px_100px_-35px_rgba(79,70,229,.65)] sm:px-12 sm:py-24 lg:py-28"
        >
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(99,102,241,.34),transparent_55%),radial-gradient(ellipse_at_0%_100%,rgba(217,70,239,.16),transparent_42%)]" />
            <div className="absolute inset-0 opacity-[.12] [background-image:linear-gradient(rgba(255,255,255,.18)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.18)_1px,transparent_1px)] [background-size:54px_54px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
            <motion.div
              className="absolute left-1/2 top-1/2 h-[540px] w-[540px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-indigo-300/20"
              animate={reduceMotion ? undefined : { rotate: 360, scale: [1, 1.06, 1] }}
              transition={{ duration: 32, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="absolute left-1/2 top-1/2 h-[390px] w-[390px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-fuchsia-300/25"
              animate={reduceMotion ? undefined : { rotate: -360 }}
              transition={{ duration: 42, repeat: Infinity, ease: "linear" }}
            />
            <motion.div className="absolute left-[12%] top-[24%] h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_24px_8px_rgba(103,232,249,.35)]" animate={reduceMotion ? undefined : { y: [0, -18, 0], opacity: [.45, 1, .45] }} transition={{ duration: 4, repeat: Infinity }} />
            <motion.div className="absolute right-[14%] bottom-[22%] h-3 w-3 rounded-full bg-fuchsia-300 shadow-[0_0_28px_8px_rgba(232,121,249,.35)]" animate={reduceMotion ? undefined : { y: [0, 16, 0], opacity: [.5, 1, .5] }} transition={{ duration: 5, repeat: Infinity }} />
            <motion.div className="absolute left-[8%] bottom-[18%] hidden rounded-2xl border border-white/10 bg-white/[.06] px-4 py-3 text-left backdrop-blur-md md:block" animate={reduceMotion ? undefined : { y: [0, -10, 0], rotate: [-3, 0, -3] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}>
              <span className="block text-[10px] font-bold uppercase tracking-[.18em] text-indigo-200">NFC connecté</span><span className="mt-1 block text-sm font-semibold text-white">Un geste. Un contact.</span>
            </motion.div>
            <motion.div className="absolute right-[8%] top-[18%] hidden rounded-2xl border border-white/10 bg-white/[.06] px-4 py-3 text-left backdrop-blur-md md:block" animate={reduceMotion ? undefined : { y: [0, 12, 0], rotate: [3, 0, 3] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}>
              <span className="block text-[10px] font-bold uppercase tracking-[.18em] text-fuchsia-200">Nouvelle opportunité</span><span className="mt-1 block text-sm font-semibold text-white">Relation activée <span className="text-emerald-300">↗</span></span>
            </motion.div>
          </div>
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15, duration: 0.7 }}
            className="relative z-10 mx-auto max-w-4xl"
          >
            <motion.div className="mx-auto mb-7 flex h-14 w-14 items-center justify-center rounded-2xl border border-indigo-300/30 bg-indigo-400/10 text-2xl text-indigo-200 shadow-[0_0_45px_rgba(129,140,248,.22)]" animate={reduceMotion ? undefined : { y: [0, -7, 0], rotate: [0, 4, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}>✳</motion.div>
            <p className="text-xs font-black uppercase tracking-[.24em] text-indigo-200">Le prochain échange peut tout changer</p>
            <h2 className="mt-6 text-4xl font-black leading-[1.08] tracking-[-.055em] sm:text-5xl lg:text-7xl">
              Votre prochain contact<br className="hidden sm:block" /> commence <span className="bg-gradient-to-r from-cyan-200 via-indigo-200 to-fuchsia-300 bg-clip-text text-transparent">ici.</span>
            </h2>
            <p className="mx-auto mt-7 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">Une identité qui vous ressemble. Un partage sans friction. Des relations professionnelles qui durent.</p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <motion.div whileHover={reduceMotion ? undefined : { scale: 1.045, y: -4 }} whileTap={reduceMotion ? undefined : { scale: .97 }}>
                <Link href="/register" className="group/cta inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 px-8 py-4 text-sm font-extrabold text-white shadow-[0_12px_40px_rgba(99,102,241,.4)] transition-shadow hover:shadow-[0_16px_55px_rgba(168,85,247,.55)]">Créer mon compte <span className="text-lg transition-transform duration-300 group-hover/cta:translate-x-1 group-hover/cta:-translate-y-1"><Arrow /></span></Link>
              </motion.div>
              <a href="#fonctionnement" className="rounded-2xl border border-white/15 bg-white/[.06] px-7 py-4 text-sm font-bold text-slate-200 backdrop-blur transition hover:border-white/30 hover:bg-white/10">Découvrir comment ça marche</a>
            </div>
            <p className="mt-7 text-xs font-medium tracking-wide text-slate-400">Prêt en quelques minutes · Aucun téléchargement pour vos contacts</p>
          </motion.div>
        </motion.div>
      </section>

      <footer className="border-t border-slate-200 bg-[#0e1028] text-white">
        <div className="mx-auto grid max-w-[1440px] gap-12 px-5 py-16 sm:px-8 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr] lg:px-12 lg:py-20">
          <div>
            <Link href="/" className="inline-flex items-center gap-2.5"><img src="/brand/touchcard-mark.svg" alt="" className="h-11 w-11 object-contain" /><span className="text-xl font-black">Touch<span className="text-indigo-300">Card</span><span className="ml-2 text-[9px] font-extrabold tracking-[.18em] text-indigo-300">BUSINESS</span></span></Link>
            <p className="mt-5 max-w-sm text-sm leading-7 text-slate-400">La plateforme qui connecte votre identité professionnelle, vos contacts et votre relation client.</p>
            <Link href="/register" className="mt-7 inline-flex rounded-xl bg-indigo-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-400">Créer mon espace <Arrow /></Link>
          </div>
          <div><h3 className="text-sm font-extrabold">Plateforme</h3><ul className="mt-5 space-y-3 text-sm text-slate-400"><li><a className="hover:text-white" href="#solutions">Solutions</a></li><li><a className="hover:text-white" href="#experience">Fonctionnalités</a></li><li><a className="hover:text-white" href="#demo">Démonstration</a></li><li><a className="hover:text-white" href="#tarifs">Tarifs</a></li></ul></div>
          <div><h3 className="text-sm font-extrabold">Découvrir</h3><ul className="mt-5 space-y-3 text-sm text-slate-400"><li><a className="hover:text-white" href="#fonctionnement">Comment ça marche</a></li><li><a className="hover:text-white" href="#faq">Questions fréquentes</a></li><li><Link className="hover:text-white" href="/register">Créer un compte</Link></li><li><Link className="hover:text-white" href="/login">Connexion</Link></li></ul></div>
          <div><h3 className="text-sm font-extrabold">Votre espace</h3><p className="mt-5 text-sm leading-7 text-slate-400">Prêt à donner une nouvelle dimension à vos échanges professionnels ?</p><Link href="/register" className="mt-4 inline-flex text-sm font-bold text-indigo-300 hover:text-white">Commencer maintenant ↗</Link></div>
        </div>
        <div className="border-t border-white/10"><div className="mx-auto flex max-w-[1440px] flex-col gap-3 px-5 py-6 text-xs text-slate-500 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-12"><p>© 2026 TouchCard Business. Tous droits réservés.</p><p>Conçu pour connecter les opportunités.</p><div className="flex gap-5"><Link href="/login" className="hover:text-white">Connexion</Link><Link href="/register" className="hover:text-white">Inscription</Link></div></div></div>
      </footer>
    </main>
  );
}
