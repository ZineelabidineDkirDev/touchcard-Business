"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useI18n } from "@/i18n/provider";
import { motion, useReducedMotion } from "framer-motion";

const rise = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0 },
};




function JourneyStepIcon({ step }: { step: number }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-7 w-7" {...common}>
      {step === 0 && <><rect x="3" y="4" width="18" height="16" rx="2.5" /><circle cx="9" cy="10" r="2.5" /><path d="M5.5 17c.8-2 2-3 3.5-3s2.7 1 3.5 3M15 9h3M15 13h3M15 17h2" /></>}
      {step === 1 && <><rect x="7" y="2.5" width="10" height="19" rx="2" /><path d="M11 18.5h2M19.5 8.5a4 4 0 0 1 0 7M21.5 6a7.5 7.5 0 0 1 0 12" /></>}
      {step === 2 && <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="m16 11 2 2 4-4M16 4.5a4 4 0 0 1 3 3.9" /></>}
    </svg>
  );
}

function FeatureIcon({ name }: { name: string }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-7 w-7" {...common}>
      {name === "contact" && <><rect x="3" y="4" width="18" height="16" rx="2.5" /><circle cx="9" cy="10" r="2.5" /><path d="M5.5 17c.8-2 2-3 3.5-3s2.7 1 3.5 3M15 9h3M15 13h3M15 17h2" /></>}
      {name === "prospects" && <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>}
      {name === "analytics" && <><path d="M3 3v18h18" /><path d="m7 14 4-4 4 3 6-7" /><path d="M17 6h4v4" /></>}
      {name === "loyalty" && <><path d="M20 12v8H4v-8M2 7h20v5H2zM12 7v13" /><path d="M12 7H7.5a2.5 2.5 0 1 1 2.2-3.7L12 7ZM12 7h4.5a2.5 2.5 0 1 0-2.2-3.7L12 7Z" /></>}
      {name === "team" && <><circle cx="9" cy="8" r="3" /><circle cx="17" cy="9" r="2.5" /><path d="M3 20v-1a6 6 0 0 1 12 0v1M16 15a5 5 0 0 1 5 5" /></>}
      {name === "shop" && <><path d="M3 8h18l-1.5 12h-15L3 8Z" /><path d="m5 8 2-5h10l2 5M9 11v2a3 3 0 0 0 6 0v-2" /></>}
    </svg>
  );
}

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
  const { t } = useI18n();
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
            <p className="text-xs font-bold text-slate-900">{t("mockContactSaved")}</p>
            <p className="mt-1 text-[11px] text-slate-500">{t("mockNewLead")}</p>
          </div>
        </div>
      </motion.div>

      <div className="rounded-[2.25rem] border border-white/10 bg-[#10132c] p-3 shadow-[0_35px_100px_-30px_rgba(49,46,129,.55)] sm:p-4">
        <div className="flex items-center justify-between px-3 py-3">
          <div className="flex items-center gap-2.5">
            <img src="/brand/touchcard-mark.svg" alt="" className="h-8 w-8 object-contain" />
            <span className="text-sm font-bold tracking-tight text-white">TouchCard <span className="font-medium text-indigo-300">Business</span></span>
          </div>
          <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[10px] font-semibold text-emerald-300">{t("mockProfileActive")}</span>
        </div>

        <div className="grid gap-3 md:grid-cols-[1.05fr_.95fr]">
          <div className="relative overflow-hidden rounded-[1.7rem] bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-6 text-white sm:p-7">
            <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full border border-white/10" />
            <div className="absolute -right-8 -top-8 h-36 w-36 rounded-full border border-white/10" />
            <div className="relative flex items-center justify-between">
              <span className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-[10px] font-bold tracking-[.18em]">{t("mockCardLabel")}</span>
              <span className="text-xl text-indigo-100">✳</span>
            </div>
            <div className="relative mt-12">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/15 text-xl font-black">JD</div>
              <p className="mt-5 text-2xl font-bold tracking-tight">{t("mockPersonName")}</p>
              <p className="mt-1 text-sm text-indigo-100">{t("mockDirector")}</p>
            </div>
            <div className="relative mt-7 grid grid-cols-2 gap-2">
              {[t("mockPhone"), t("mockEmail"), t("mockWebsite"), t("mockLinkedin")].map((item) => (
                <div key={item} className="rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 text-xs text-white/90">{item} <span className="float-right">↗</span></div>
              ))}
            </div>
            <p className="mt-7 text-[10px] font-semibold tracking-[.2em] text-indigo-200">{t("mockBrandLine")}</p>
          </div>

          <div className="grid gap-3">
            <div className="rounded-[1.7rem] bg-white p-5">
              <div className="flex items-center justify-between">
                <div><p className="text-xs font-semibold text-slate-500">{t("mockInteractions")}</p><p className="mt-1 text-2xl font-black tracking-tight text-slate-950">{t("mockAtGlance")}</p></div>
                <span className="rounded-xl bg-indigo-50 p-2.5 text-lg text-indigo-600">↗</span>
              </div>
              <div className="mt-6 flex h-24 items-end gap-2">
                {[28, 42, 34, 62, 48, 78, 58, 92, 70, 100, 77, 88].map((height, i) => (
                  <span key={i} style={{ height: `${height}%` }} className={`flex-1 rounded-t-md ${i === 9 ? "bg-violet-500" : "bg-indigo-100"}`} />
                ))}
              </div>
              <div className="mt-3 flex justify-between text-[10px] text-slate-400"><span>{t("mockActivity")}</span><span>{t("mockInterface")}</span></div>
            </div>
            <div className="flex items-center justify-between rounded-[1.7rem] bg-[#f0edff] p-5">
              <div><p className="text-xs font-bold text-indigo-700">{t("mockInstantShare")}</p><p className="mt-1 text-sm text-slate-600">{t("mockProfileEverywhere")}</p><p className="mt-4 text-[10px] font-semibold tracking-[.16em] text-indigo-500">{t("mockScanLine")}</p></div>
              <QrPattern />
            </div>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {[t("mockCardsProfiles"), t("mockContactsCRM"), t("mockLoyalty")].map((label, i) => (
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
          <div><p className="text-xs font-bold text-slate-900">{t("mockNfcQr")}</p><p className="mt-1 text-[11px] text-slate-500">{t("mockShareWays")}</p></div>
        </div>
      </motion.div>
    </div>
  );
}

export function LandingPage() {
  const { t, locale, setLocale } = useI18n();
  const features = [
    {
      number: "01",
      icon: "contact",
      title: t("feature1Title"),
      description:
        t("feature1Desc"),
      detail: t("feature1Detail"),
    },
    {
      number: "02",
      icon: "prospects",
      title: t("feature2Title"),
      description:
        t("feature2Desc"),
      detail: t("feature2Detail"),
    },
    {
      number: "03",
      icon: "analytics",
      title: t("feature3Title"),
      description:
        t("feature3Desc"),
      detail: t("feature3Detail"),
    },
    {
      number: "04",
      icon: "loyalty",
      title: t("feature4Title"),
      description:
        t("feature4Desc"),
      detail: t("feature4Detail"),
    },
    {
      number: "05",
      icon: "team",
      title: t("feature5Title"),
      description:
        t("feature5Desc"),
      detail: t("feature5Detail"),
    },
    {
      number: "06",
      icon: "shop",
      title: t("feature6Title"),
      description:
        t("feature6Desc"),
      detail: t("feature6Detail"),
    },
  ];
  
  const steps = [
    ["01", t("step1Title"), t("step1Desc")],
    ["02", t("step2Title"), t("step2Desc")],
    ["03", t("step3Title"), t("step3Desc")],
  ];
  const reduceMotion = useReducedMotion();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [pricingIndex, setPricingIndex] = useState(0);
  const [flippedPricingCard, setFlippedPricingCard] = useState(-1);

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
              <summary className="flex cursor-pointer list-none items-center gap-2 transition hover:text-indigo-600 [&::-webkit-details-marker]:hidden">{t("navSolutions")} <span className="text-[10px] transition group-open:rotate-180">⌄</span></summary>
              <div className="absolute left-0 top-full z-50 mt-4 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-950/10">
                <a className="block rounded-xl px-4 py-3 hover:bg-indigo-50 hover:text-indigo-700" href="#solutions"><span className="block text-sm font-bold">{t("navFeatures")}</span><span className="mt-1 block text-xs font-normal text-slate-500">{t("allToolsTag")}</span></a>
                <a className="block rounded-xl px-4 py-3 hover:bg-indigo-50 hover:text-indigo-700" href="#tarifs"><span className="block text-sm font-bold">{t("navBySector")}</span><span className="mt-1 block text-xs font-normal text-slate-500">{t("navSectorDesc")}</span></a>
              </div>
            </details>
            <a className="transition hover:text-indigo-600" href="#experience">{t("navPlatform")}</a>
            <a className="transition hover:text-indigo-600" href="#fonctionnement">{t("navHow")}</a>
            <a className="transition hover:text-indigo-600" href="#demo">{t("navDemo")}</a>
            <a className="transition hover:text-indigo-600" href="#tarifs">{t("navPricing")}</a>
            <a className="transition hover:text-indigo-600" href="#faq">{t("navFaq")}</a>
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/login" className={`hidden rounded-xl px-4 py-2.5 text-sm font-bold transition sm:inline-flex text-white hover:bg-white/10`}>{t("navLogin")}</Link>
            <div className="inline-flex items-center rounded-full border border-white/25 bg-transparent px-2.5 py-1.5 transition hover:bg-white/10">
  <select
    aria-label={t("language")}
    value={locale}
    onChange={(event) => setLocale(event.target.value as "fr" | "ar" | "en")}
    className="cursor-pointer appearance-none bg-transparent pr-1 text-xs font-bold text-white outline-none"
  >
    <option value="fr" className="bg-[#17143b] text-white">🇫🇷 FR</option>
    <option value="ar" className="bg-[#17143b] text-white">🇲🇦 AR</option>
    <option value="en" className="bg-[#17143b] text-white">🇬🇧 ENG</option>
  </select>
  <span aria-hidden="true" className="pointer-events-none ml-1 text-[10px] text-white/70">▾</span>
</div>
<Link href="/register" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:-translate-y-0.5 hover:bg-indigo-700 sm:px-5">{t("navCreate")} <Arrow /></Link>
            <button type="button" aria-label={mobileMenuOpen ? t("menuClose") : t("menuOpen")} aria-expanded={mobileMenuOpen} onClick={() => setMobileMenuOpen((open) => !open)} className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border text-xl transition-colors xl:hidden border-white/20 bg-white/10 text-white`}>
              {mobileMenuOpen ? "×" : "☰"}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <nav aria-label="Navigation mobile" className="border-t border-white/10 bg-gradient-to-r from-[#090b1b] via-[#17143b] to-[#090b1b] px-5 py-4 text-white shadow-xl xl:hidden">
            <div className="mx-auto grid max-w-[1440px] gap-1">
              {[[t("navSolutions"), "#solutions"], [t("navPlatform"), "#experience"], [t("navDemo"), "#demo"], [t("navHow"), "#fonctionnement"], [t("navPricing"), "#tarifs"], [t("navFaq"), "#faq"]].map(([label, href]) => (
                <a key={href} href={href} onClick={() => setMobileMenuOpen(false)} className="rounded-xl px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 hover:text-white">{label}</a>
              ))}
              <div className="mt-2 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
                <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="rounded-xl border border-white/20 px-3 py-3 text-center text-sm font-bold text-white transition hover:bg-white/10 hover:text-white">{t("navLogin")}</Link>
                <Link href="/register" onClick={() => setMobileMenuOpen(false)} className="rounded-xl bg-indigo-600 px-3 py-3 text-center text-sm font-bold text-white">{t("navCreateShort")}</Link>
              </div>
            </div>
          </nav>
        )}
      </header>

      <section className="relative isolate overflow-hidden bg-[#090b1b] text-white">
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          {/* Vidéo d'ambiance NFC : les motifs Framer Motion ci-dessous restent inchangés. */}
          <video
            className="absolute inset-0 h-full w-full object-cover opacity-55"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            aria-hidden="true"
            poster="https://images.pexels.com/videos/5101679/free-video-5101679.jpg?auto=compress&cs=tinysrgb&w=1920"
          >
            <source src="https://videos.pexels.com/video-files/5101679/5101679-hd_1920_1080_25fps.mp4" type="video/mp4" />
            <source src="https://videos.pexels.com/video-files/4109600/4109600-hd_1920_1080_25fps.mp4" type="video/mp4" />
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
        <div className="relative z-10 mx-auto grid min-h-[760px] max-w-[1440px] items-center gap-16 px-5 py-20 sm:px-8 lg:grid-cols-[1fr_1.08fr] lg:px-12 lg:py-28">
          <motion.div initial="hidden" animate="visible" variants={reveal} transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}>
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-300/20 bg-white/[.06] px-4 py-2 text-[11px] font-extrabold uppercase tracking-[.16em] text-indigo-200 shadow-sm backdrop-blur">
              <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" /><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" /></span>
              {t("heroEyebrow")}
            </div>
            <h2 className="mt-8 max-w-3xl text-[clamp(3.25rem,4.5vw,4.4rem)] font-black leading-[.99] tracking-[-.065em] text-white">
              {t("heroStart")} <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-500 bg-clip-text text-transparent">{t("heroLead")}</span>
            </h2>
            <p className="mt-8 max-w-xl text-lg leading-8 text-slate-300 sm:text-xl sm:leading-9">
              {t("heroDescription")}
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link href="/register" className="group inline-flex items-center justify-center gap-3 rounded-2xl border border-white/25 bg-gradient-to-r from-indigo-500/35 via-violet-500/30 to-fuchsia-500/25 px-7 py-[1.125rem] text-base font-bold text-white shadow-[0_12px_40px_-18px_rgba(99,102,241,.8)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-white/40 hover:from-indigo-500/55 hover:to-violet-500/45">
                Commencer maintenant <span className="transition-transform group-hover:translate-x-1">→</span>
              </Link>
              <a href="#solutions" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/[.035] px-7 py-[1.125rem] text-base font-bold text-white/95 shadow-sm backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-indigo-200/50 hover:bg-white/[.09]">Explorer les solutions <span className="text-indigo-200">↓</span></a>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-sm font-medium text-slate-300">
              <span className="inline-flex items-center gap-2"><span className="text-emerald-500">✓</span> {t("noAppInstall")}</span>
              <span className="inline-flex items-center gap-2"><span className="text-emerald-500">✓</span> NFC, QR code et lien</span>
              <span className="inline-flex items-center gap-2"><span className="text-emerald-500">✓</span> {t("forTeams")}</span>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.94, x: 30 }} animate={{ opacity: 1, scale: 1, x: 0 }} transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }} className="py-8 lg:py-0">
            <div className="mx-auto flex min-h-[420px] max-w-[560px] items-center justify-center"><div className="w-full max-w-[430px] rounded-[2rem] border border-white/20 bg-gradient-to-br from-[#34315f] via-[#171936] to-[#090b1b] p-8 shadow-2xl shadow-indigo-950/50 [transform:perspective(1000px)_rotateY(-14deg)_rotateX(7deg)]"><div className="flex items-center justify-between"><img src="/brand/touchcard-mark.svg" alt="TouchCard" className="h-12 w-12"/><span className="text-xs font-bold tracking-widest text-indigo-200">E-BUSINESS · NFC</span></div><h3 className="mt-14 text-3xl font-black text-white">Votre identité.</h3><p className="mt-2 text-2xl font-bold text-indigo-200">Tous vos services.</p><div className="mt-8 h-1.5 w-2/3 rounded-full bg-white/30"/><p className="mt-5 text-xs tracking-widest text-white/50">TAP · SCAN · CONNECT</p></div></div>
          </motion.div>
        </div>

      </section>

      <section id="experience" className="relative isolate overflow-hidden bg-[#11132d] py-24 text-white lg:py-32">
        {/* Animated atmosphere: flowing waves, soft orbits and light particles */}
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
          <motion.div
            className="absolute -left-[12%] top-[8%] h-[26rem] w-[26rem] rounded-full border border-indigo-300/[.10]"
            animate={{ x: [0, 34, 0], y: [0, 22, 0], rotate: [0, 90, 180] }}
            transition={{ duration: 32, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute -right-[8%] top-[12%] h-[34rem] w-[34rem] rounded-full border border-violet-300/[.12]"
            animate={{ x: [0, -28, 0], y: [0, 24, 0], rotate: [0, -90, -180] }}
            transition={{ duration: 38, repeat: Infinity, ease: "linear" }}
          />
          <motion.svg
            viewBox="0 0 1600 360"
            preserveAspectRatio="none"
            className="absolute -bottom-2 left-0 h-[48%] w-[200%] min-w-[1200px] opacity-35"
            animate={{ x: ["-8%", "0%", "-8%"] }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          >
            <path d="M0 150 C180 70 300 230 500 150 S820 70 1000 150 S1320 230 1600 130" fill="none" stroke="#818cf8" strokeWidth="2" />
            <path d="M0 205 C190 125 310 285 520 205 S830 125 1040 205 S1350 285 1600 185" fill="none" stroke="#a78bfa" strokeWidth="1.5" />
            <path d="M0 260 C180 180 330 340 540 260 S850 180 1060 260 S1370 340 1600 240" fill="none" stroke="#c084fc" strokeWidth="1" />
          </motion.svg>
          <motion.div
            className="absolute left-[12%] top-[24%] h-2 w-2 rounded-full bg-indigo-300 shadow-[0_0_22px_5px_rgba(129,140,248,.45)]"
            animate={{ y: [0, -22, 0], opacity: [0.35, 1, 0.35], scale: [0.8, 1.25, 0.8] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute right-[18%] bottom-[22%] h-1.5 w-1.5 rounded-full bg-fuchsia-300 shadow-[0_0_20px_5px_rgba(216,180,254,.4)]"
            animate={{ y: [0, 18, 0], opacity: [0.25, 1, 0.25] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          />

          {/* Floating 3D digital business cards */}
          <motion.div
            className="absolute right-[4%] top-[12%] hidden w-52 rounded-[1.35rem] border border-white/20 bg-gradient-to-br from-[#29265a]/95 via-[#171936]/95 to-[#101226]/95 p-4 shadow-[0_24px_80px_rgba(79,70,229,.28)] backdrop-blur-xl lg:block"
            style={{ perspective: 900, rotateY: -18, rotateX: 8 }}
            animate={{ y: [0, -18, 0], rotateZ: [-5, -1, -5], rotateY: [-18, -12, -18] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-400 to-fuchsia-500 text-lg font-black text-white shadow-lg shadow-indigo-500/30">T</div>
              <div><p className="text-xs font-bold text-white">TouchCard</p><p className="mt-1 text-[9px] tracking-widest text-indigo-200">BUSINESS PROFILE</p></div>
            </div>
            <div className="mt-5 h-px bg-gradient-to-r from-indigo-300/60 to-transparent" />
            <div className="mt-4 space-y-2"><div className="h-1.5 w-3/4 rounded-full bg-white/45" /><div className="h-1.5 w-1/2 rounded-full bg-white/20" /></div>
            <div className="mt-5 flex items-center justify-between"><span className="text-[9px] font-semibold text-indigo-200">TAP • CONNECT • GROW</span><span className="text-xl text-violet-200">⌁</span></div>
          </motion.div>

          <motion.div
            className="absolute bottom-[9%] left-[42%] hidden w-44 rounded-[1.25rem] border border-violet-200/20 bg-gradient-to-br from-[#34245d]/90 to-[#15152f]/95 p-4 shadow-[0_22px_65px_rgba(168,85,247,.22)] backdrop-blur-xl lg:block"
            style={{ rotateY: 16, rotateX: -7 }}
            animate={{ y: [0, 15, 0], rotateZ: [7, 3, 7], rotateY: [16, 10, 16] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
          >
            <div className="flex items-center justify-between"><span className="text-[9px] font-bold tracking-widest text-violet-200">NEW CONTACT</span><span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_12px_3px_rgba(110,231,183,.35)]" /></div>
            <div className="mt-4 flex items-center gap-3"><div className="h-9 w-9 rounded-full bg-gradient-to-br from-fuchsia-300 to-indigo-400" /><div className="space-y-1.5"><div className="h-1.5 w-20 rounded-full bg-white/50" /><div className="h-1 w-14 rounded-full bg-white/20" /></div></div>
            <div className="mt-4 rounded-lg border border-white/10 bg-white/[.06] px-3 py-2 text-[9px] text-violet-100">{t("contactSuccess")}</div>
          </motion.div>

          <motion.div
            className="absolute bottom-[16%] right-[3%] hidden w-36 rounded-[1.1rem] border border-indigo-200/20 bg-[#11152f]/90 p-3 shadow-[0_20px_55px_rgba(99,102,241,.2)] backdrop-blur-xl lg:block"
            animate={{ y: [0, -12, 0], rotateZ: [-7, -3, -7] }}
            transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut", delay: 1.4 }}
          >
            <div className="flex h-16 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500/20 to-violet-500/20"><div className="grid grid-cols-5 gap-1">{Array.from({ length: 25 }, (_, i) => <span key={i} className={`h-1.5 w-1.5 rounded-[2px] ${[0, 2, 6, 8, 12, 16, 18, 20, 22, 24].includes(i) ? "bg-indigo-200" : "bg-white/35"}`} />)}</div></div>
            <p className="mt-2 text-center text-[9px] font-bold tracking-widest text-indigo-200">SCAN & CONNECT</p>
          </motion.div>
        </div>
        <div className="absolute -right-48 top-0 h-[35rem] w-[35rem] rounded-full bg-indigo-600/20 blur-[110px]" />
        <div className="absolute -bottom-48 -left-40 h-[30rem] w-[30rem] rounded-full bg-violet-600/20 blur-[100px]" />
        <div className="relative mx-auto grid max-w-[1440px] items-center gap-16 px-5 sm:px-8 lg:grid-cols-2 lg:px-12">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={reveal} transition={{ duration: 0.65 }}>
            <p className="text-xs font-black uppercase tracking-[.22em] text-indigo-300">{t("connectedActivity")}</p>
            <h2 className="mt-5 text-4xl font-black leading-tight tracking-[-.045em] sm:text-5xl lg:text-6xl">{t("smoothExperienceTitle")} <span className="text-indigo-300">{t("growingNetwork")}</span></h2>
            <p className="mt-7 max-w-xl text-lg leading-8 text-slate-300">{t("connectedDesc")}</p>
            <div className="mt-10 space-y-5">
              {[
                [t("onePresence"), t("allInfoProfile")],
                [t("centralizedManagement"), t("manageEverything")],
                [t("clearerDecisions"), t("reviewInteractions")],
              ].map(([title, description]) => (
                <div key={title} className="flex gap-4">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-400/15 text-sm text-indigo-300">✓</span>
                  <div><h3 className="font-bold text-white">{title}</h3><p className="mt-1 text-sm leading-6 text-slate-400">{description}</p></div>
                </div>
              ))}
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.7 }} className="relative isolate px-3 pb-12 pt-10 sm:px-6 lg:px-8">
            {/* Visible 3D cards layered over the product preview */}
            <motion.div
              className="absolute -right-1 top-0 z-20 w-44 rounded-2xl border border-indigo-200/30 bg-gradient-to-br from-[#34306d] via-[#1d2048] to-[#11132d] p-4 shadow-[0_24px_65px_rgba(79,70,229,.42)] sm:-right-2 sm:w-52"
              style={{ transformPerspective: 900 }}
              animate={{ y: [0, -16, 0], rotateY: [-14, -5, -14], rotateZ: [5, 1, 5] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="flex items-center gap-2.5">
                <img src="/brand/touchcard-mark.svg" alt="" className="h-9 w-9 rounded-xl" />
                <div><p className="text-xs font-extrabold text-white">TouchCard</p><p className="text-[8px] tracking-[.18em] text-indigo-200">BUSINESS</p></div>
              </div>
              <div className="mt-4 h-px bg-gradient-to-r from-indigo-200/70 to-transparent" />
              <p className="mt-3 text-[9px] font-semibold tracking-widest text-indigo-100">TAP TO CONNECT</p>
              <div className="mt-3 flex gap-1"><span className="h-1 w-10 rounded-full bg-white/50" /><span className="h-1 w-6 rounded-full bg-white/20" /></div>
            </motion.div>
            <motion.div
              className="absolute -bottom-1 -left-1 z-20 w-40 rounded-2xl border border-fuchsia-200/25 bg-gradient-to-br from-[#49285f] to-[#171633] p-3.5 shadow-[0_22px_60px_rgba(192,132,252,.35)] sm:-left-3 sm:w-48"
              animate={{ y: [0, 13, 0], rotateY: [12, 4, 12], rotateZ: [-6, -2, -6] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
            >
              <div className="flex items-center justify-between"><span className="text-[9px] font-bold tracking-widest text-fuchsia-100">{t("newContact")}</span><span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_12px_3px_rgba(110,231,183,.4)]" /></div>
              <div className="mt-3 flex items-center gap-2"><span className="h-8 w-8 rounded-full bg-gradient-to-br from-fuchsia-300 to-indigo-400" /><div className="space-y-1"><div className="h-1.5 w-16 rounded-full bg-white/60" /><div className="h-1 w-11 rounded-full bg-white/25" /></div></div>
              <p className="mt-3 rounded-lg border border-white/10 bg-white/[.07] px-2 py-1.5 text-[9px] text-fuchsia-100">{t("savedContact")}</p>
            </motion.div>
            <div className="relative z-10 rounded-[2rem] border border-white/10 bg-white/[.06] p-5 shadow-2xl shadow-black/20 backdrop-blur sm:p-7">
              <div className="flex items-center justify-between border-b border-white/10 pb-5">
                <div><p className="text-xs font-semibold text-slate-400">{t("workspacePreview")}</p><p className="mt-1 text-lg font-bold">{t("activityOnePlace")}</p></div>
                <span className="rounded-xl bg-indigo-400/15 px-3 py-2 text-xs font-bold text-indigo-200">TouchCard</span>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3">
                {[["Cartes digitales", t("yourIdentityLabel")], ["Contacts", t("yourOpportunities")], [t("teamLabel"), "Vos collaborateurs"], [t("loyaltyLabel"), "Vos clients"]].map(([title, sub], i) => (
                  <div key={title} className="rounded-2xl border border-white/10 bg-[#1b1e3e] p-4 sm:p-5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-400/15 text-lg text-indigo-200">{["▣", "◎", "♧", "✳"][i]}</span>
                    <p className="mt-5 text-sm font-bold">{title}</p><p className="mt-1 text-xs text-slate-400">{sub}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 rounded-2xl border border-indigo-300/15 bg-gradient-to-r from-indigo-500/15 to-violet-500/10 p-5">
                <div className="flex items-center justify-between"><div><p className="text-xs font-semibold text-indigo-200">{t("evolvingPlatform")}</p><p className="mt-1 text-sm font-bold">{t("buildPresence")}</p></div><span className="text-2xl text-indigo-200">✦</span></div>
              </div>
            </div>
          </motion.div>
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
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-300/20 bg-indigo-400/[.08] px-4 py-2 text-[10px] font-extrabold uppercase tracking-[.2em] text-indigo-200"><span className="h-1.5 w-1.5 rounded-full bg-fuchsia-400" /> {t("ecosystemEyebrow")}</span>
            <h2 className="mt-6 text-4xl font-black leading-tight tracking-[-.045em] text-white sm:text-5xl lg:text-6xl"><span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-fuchsia-300 bg-clip-text text-transparent">{t("ecosystemTitle")}</span></h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-400">{t("ecosystemDesc")}</p>
          </motion.div>
          <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <motion.article key={feature.number} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.16 }} variants={reveal} transition={{ duration: 0.55, delay: index * 0.07 }} whileHover={reduceMotion ? undefined : { y: -8, scale: 1.012 }} className="group relative isolate overflow-hidden rounded-[1.65rem] border border-white/[.09] bg-white/[.045] p-7 shadow-[0_18px_55px_-35px_rgba(0,0,0,.8)] backdrop-blur-xl transition-all duration-300 hover:border-indigo-300/35 hover:bg-white/[.075] hover:shadow-[0_25px_70px_-35px_rgba(99,102,241,.35)] sm:p-8">
                <div className="pointer-events-none absolute -right-16 -top-20 -z-10 h-48 w-48 rounded-full bg-indigo-500/0 blur-3xl transition-colors duration-500 group-hover:bg-indigo-500/20" />
                <div className="relative flex items-center justify-between">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-indigo-300/20 bg-gradient-to-br from-indigo-400/20 to-fuchsia-400/10 text-indigo-200 shadow-inner shadow-white/[.04] transition duration-300 group-hover:scale-110 group-hover:border-violet-300/40 group-hover:text-white"><FeatureIcon name={feature.icon} /></span>
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

      <section id="fonctionnement" className="relative isolate overflow-hidden bg-[#090b1b] px-5 py-24 text-white sm:px-8 lg:px-12 lg:py-32">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -left-40 top-0 h-[34rem] w-[34rem] rounded-full bg-indigo-700/20 blur-[130px]" />
          <div className="absolute -right-40 bottom-0 h-[34rem] w-[34rem] rounded-full bg-fuchsia-700/15 blur-[130px]" />
          <div className="absolute inset-0 opacity-[.12]" style={{backgroundImage:"linear-gradient(rgba(148,163,184,.22) 1px,transparent 1px),linear-gradient(90deg,rgba(148,163,184,.22) 1px,transparent 1px)",backgroundSize:"54px 54px"}} />
          <motion.div className="absolute -right-28 top-12 h-[38rem] w-[38rem] rounded-full border border-indigo-300/10" animate={reduceMotion ? undefined : {rotate:360}} transition={{duration:90,repeat:Infinity,ease:"linear"}} />
          <motion.div className="absolute -right-4 top-36 h-[26rem] w-[26rem] rounded-full border border-dashed border-violet-300/15" animate={reduceMotion ? undefined : {rotate:-360}} transition={{duration:75,repeat:Infinity,ease:"linear"}} />
        </div>
        <div className="relative mx-auto max-w-[1440px]">
          <motion.div initial="hidden" whileInView="visible" viewport={{once:true,amount:.25}} variants={reveal} className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-300/20 bg-white/[.06] px-4 py-2 text-[10px] font-black uppercase tracking-[.22em] text-indigo-200 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-fuchsia-400 shadow-[0_0_12px_rgba(232,121,249,.9)]" /> {t("touchcardExperience")}
            </span>
            <h2 className="mt-7 text-4xl font-black leading-[1.04] tracking-[-.055em] sm:text-5xl lg:text-6xl">
              {t("journeyTitle")} <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-fuchsia-300 bg-clip-text text-transparent">{t("journeyEnd")}</span>
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-400 sm:text-lg">
              {t("journeyIntro")}
            </p>
          </motion.div>
          <div className="relative mt-20">
            <div className="absolute left-[12%] right-[12%] top-[3.15rem] hidden h-px bg-gradient-to-r from-indigo-500/10 via-violet-400/80 to-fuchsia-500/10 lg:block" />
            <motion.div className="absolute left-[12%] right-[12%] top-[3.15rem] hidden h-px origin-left bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400 lg:block" initial={{scaleX:0}} whileInView={{scaleX:1}} viewport={{once:true}} transition={{duration:1.8,ease:"easeOut",delay:.3}} />
            <div className="grid gap-5 md:grid-cols-3">
              {steps.map(([number,title,description],index)=>(
                <motion.article key={number} initial={{opacity:0,y:35,rotateX:8}} whileInView={{opacity:1,y:0,rotateX:0}} viewport={{once:true,amount:.2}} transition={{duration:.75,delay:index*.16,ease:[.22,1,.36,1]}} whileHover={reduceMotion?undefined:{y:-10,rotateY:index===1?0:index===0?3:-3,scale:1.02}} style={{transformPerspective:1200}} className="group relative overflow-hidden rounded-[1.8rem] border border-white/10 bg-gradient-to-b from-white/[.09] to-white/[.025] p-7 shadow-[0_25px_70px_-45px_rgba(99,102,241,.65)] backdrop-blur-xl transition-all duration-500 hover:border-indigo-300/35 hover:shadow-[0_35px_80px_-40px_rgba(124,58,237,.55)] sm:p-8">
                  <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl transition-colors duration-500 group-hover:bg-fuchsia-500/20" />
                  <div className="relative flex items-center justify-between">
                    <span className="text-[11px] font-black tracking-[.24em] text-slate-500">{t("stepLabel")} {number}</span>
                    <motion.div whileHover={reduceMotion?undefined:{rotate:12,scale:1.08}} className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-indigo-300/25 bg-gradient-to-br from-indigo-500/20 to-fuchsia-500/10 text-xl font-black text-indigo-100 shadow-[0_0_35px_-12px_rgba(129,140,248,.65)]">
                      <JourneyStepIcon step={index} />
                      <span className="absolute -inset-1 rounded-[1.1rem] border border-indigo-300/10" />
                    </motion.div>
                  </div>
                  <div className="relative mt-9">
                    <h3 className="text-xl font-extrabold tracking-tight text-white sm:text-2xl">{title}</h3>
                    <p className="mt-3 min-h-[3.5rem] text-sm leading-7 text-slate-400">{description}</p>
                  </div>
                  <div className="relative mt-8 flex items-center justify-between border-t border-white/10 pt-5">
                    <span className="text-[10px] font-bold uppercase tracking-[.18em] text-indigo-200/70">TouchCard Business</span>
                    <motion.span className="text-lg text-indigo-300" animate={reduceMotion?undefined:{x:[0,5,0]}} transition={{duration:2,repeat:Infinity,delay:index*.3}}>↗</motion.span>
                  </div>
                  <motion.div className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400" initial={{width:"0%"}} whileInView={{width:"100%"}} viewport={{once:true}} transition={{duration:1.2,delay:.4+index*.15}} />
                </motion.article>
              ))}
            </div>
          </div>
          <motion.div initial={{opacity:0,y:18}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{duration:.65,delay:.25}} className="mt-12 flex flex-col items-center justify-between gap-6 rounded-[1.7rem] border border-indigo-300/15 bg-gradient-to-r from-indigo-500/[.12] via-violet-500/[.10] to-fuchsia-500/[.12] p-6 backdrop-blur-xl sm:flex-row sm:px-9 sm:py-7">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/[.08]"><img src="/brand/touchcard-mark.svg" alt="" className="h-8 w-8 object-contain" /></div>
              <div><p className="text-base font-extrabold text-white">{t("nextConnection")}</p><p className="mt-1 text-sm text-slate-400">{t("digitalIdentity")}</p></div>
            </div>
            <motion.div whileHover={reduceMotion?undefined:{y:-3,scale:1.025}} whileTap={reduceMotion?undefined:{scale:.97}}>
              <Link href="/register" className="group inline-flex items-center gap-4 rounded-xl bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 px-6 py-4 text-sm font-extrabold text-white shadow-[0_15px_40px_-15px_rgba(139,92,246,.8)] ring-1 ring-white/20 transition-shadow hover:shadow-[0_20px_50px_-15px_rgba(217,70,239,.65)]">
                {t("createWorkspaceCta")} <span className="transition-transform duration-300 group-hover:translate-x-1"><Arrow /></span>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>


      <section id="tarifs" className="bg-[#f7f7ff] px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
        <div className="mx-auto max-w-[1440px]">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-black uppercase tracking-[.22em] text-indigo-600">{t("nfcPricing")}</p>
            <h2 className="mt-5 text-4xl font-black tracking-[-.045em] text-[#11132d] sm:text-5xl">{t("pricingTitle")} <span className="text-indigo-600">{t("chooseCard")}</span></h2>
            <p className="mt-5 text-lg leading-8 text-slate-500">{t("cardPriceDesc")}</p>
          </div>
          <div className="mt-14 flex justify-end gap-3">
            <button type="button" aria-label="Précédent" onClick={() => setPricingIndex((v) => Math.max(0, v - 1))} className="h-11 w-11 rounded-full border border-indigo-200 bg-white text-indigo-700">←</button>
            <button type="button" aria-label="Suivant" onClick={() => setPricingIndex((v) => Math.min(1, v + 1))} className="h-11 w-11 rounded-full border border-indigo-200 bg-white text-indigo-700">→</button>
          </div>
          <div className="mt-5 overflow-hidden"><div className="flex items-stretch gap-6 transition-transform duration-500" style={{ transform: `translateX(-${pricingIndex * 34}%)` }}>
            {[
              {name:"E-Business",type:"Carte professionnelle tout-en-un",desc:"Carte de visite et services digitaux réunis : profil, coordonnées, liens et prestations.",price:"399 DH",tone:"metal",number:"01",features:["Profil professionnel complet","Coordonnées, liens et services digitaux","Partage NFC et QR code"]},
              {name:t("cardContactName"),type:t("cardContactType"),desc:t("cardContactDesc"),price:"149 DH",tone:"metal",number:"02",features:[t("contactDetails"),t("quickSharing"),t("easySaving")]},
              {name:t("cardGoogleName"),type:t("cardGoogleType"),desc:t("cardGoogleDesc"),price:"199 DH",tone:"google",number:"03",features:[t("googlePageAccess"),t("oneTapSharing"),t("reviewRequests")]},
              {name:t("customCardName"),type:t("cardCustomType"),desc:t("customCardDescription"),price:"499 DH",tone:"custom",number:"04",features:[t("customLogoDesign"),t("tailoredDigitalService"),t("businessTailoredExperience"),t("customNfcCard")]}
            ].map((card,index) => (
              <motion.article key={card.name} className="w-full shrink-0 sm:w-[calc(50%-12px)] xl:w-[calc(33.333%-16px)]">
                <button type="button" onClick={() => setFlippedPricingCard(flippedPricingCard === index ? -1 : index)} className="mb-6 block h-[190px] w-full [perspective:1000px]" aria-label="Retourner la carte pour voir le QR code">
                  <motion.div className="relative h-full w-full [transform-style:preserve-3d]" animate={{rotateY:flippedPricingCard === index ? 180 : 0}} transition={{duration:.6}}>
                    <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-white/20 bg-gradient-to-br from-[#34315f] via-[#171936] to-[#090b1b] text-white [backface-visibility:hidden]"><img src="/brand/touchcard-mark.svg" alt="TouchCard" className="h-12 w-12"/><span className="mt-3 text-xs font-black uppercase tracking-widest">{card.name}</span></div>
                    <div className="absolute inset-0 flex flex-col items-center justify-between rounded-2xl border border-indigo-200/30 bg-[#11132d] p-3 text-white [backface-visibility:hidden] [transform:rotateY(180deg)]"><div className="flex w-full items-center justify-between text-[9px] text-indigo-200"><span>APERÇU QR</span><img src="/brand/touchcard-mark.svg" alt="" className="h-7 w-7"/></div><div className="scale-[.68]"><QrPattern /></div><span className="text-[8px] text-slate-300">QR de démonstration à connecter au profil</span></div>
                  </motion.div>
                </button>
                <p className="text-[9px] font-extrabold uppercase tracking-widest text-indigo-600">{card.type}</p><h3 className="mt-2 text-xl font-black text-[#11132d]">{card.name}</h3><p className="mt-3 min-h-[90px] text-sm leading-6 text-slate-500">{card.desc}</p><p className="mt-4 text-3xl font-black text-[#11132d]">{card.price}</p>
                <ul className="mt-4 space-y-2">{card.features.map((feature) => <li key={feature} className="text-xs text-slate-600">✓ {feature}</li>)}</ul>
                <Link href="/register" className="mt-6 inline-flex w-full justify-center rounded-xl border border-indigo-300 bg-indigo-50 px-4 py-3 text-xs font-extrabold text-indigo-700">Choisir {card.name} <Arrow /></Link>
              </motion.article>
            ))}
          </div></div>
          <p className="mt-8 text-center text-xs leading-6 text-slate-500">{t("pricingNote")}</p>
        </div>
      </section>

      <section id="faq" className="px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
        <div className="mx-auto grid max-w-[1180px] gap-12 lg:grid-cols-[.8fr_1.2fr]">
          <div><p className="text-xs font-black uppercase tracking-[.22em] text-indigo-600">{t("faqTitle")}</p><h2 className="mt-5 text-4xl font-black leading-tight tracking-[-.045em] sm:text-5xl">{t("faqSubtitle")}</h2><p className="mt-6 text-base leading-8 text-slate-500">{t("faqDesc")}</p><Link href="/register" className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-indigo-700 hover:text-indigo-900">{t("navCreate")} <Arrow /></Link></div>
          <div className="space-y-3">
            {[
              [t("faqQ1"), t("faqA1")],
              [t("faqQ2"), t("faqA2")],
              [t("faqQ3"), t("faqA3")],
              [t("faqQ4"), t("faqA4")],
              [t("faqQ5"), t("faqA5")],
              [t("faqQ6"), t("faqA6")]
            ].map(([question, answer]) => <details key={question} className="group rounded-2xl border border-slate-200 bg-white p-5 open:border-indigo-200 open:bg-indigo-50/40 sm:p-6"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-extrabold text-slate-900 [&::-webkit-details-marker]:hidden">{question}<span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-lg text-indigo-700 transition group-open:rotate-45">+</span></summary><p className="mt-4 max-w-2xl pr-8 text-sm leading-7 text-slate-600">{answer}</p></details>)}
          </div>
        </div>
      </section>

<section id="demo" className="bg-[#f7f7ff] px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
        <div className="mx-auto grid max-w-[1280px] items-center gap-14 lg:grid-cols-[.85fr_1.15fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-[.22em] text-indigo-600">{t("discoverTouch")}</p>
            <h2 className="mt-5 text-4xl font-black leading-tight tracking-[-.045em] sm:text-5xl">{t("betterShowcase")}</h2>
            <p className="mt-6 text-lg leading-8 text-slate-600">{t("betterShowcaseDesc")}</p>
            <ul className="mt-8 space-y-4 text-sm font-semibold text-slate-700">
              {[t("profileOneScan"), t("centralizedContactsTeam"), t("interactionInsights")].map((item) => <li key={item} className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">✓</span>{item}</li>)}
            </ul>
            <Link href="/register" className="mt-9 inline-flex rounded-xl bg-indigo-600 px-6 py-4 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:-translate-y-1 hover:bg-indigo-700">Essayer la plateforme <Arrow /></Link>
          </div>
          <div className="relative">
            <div className="absolute -inset-5 rounded-[2.5rem] bg-gradient-to-br from-indigo-200/70 to-violet-200/70 blur-2xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white bg-[#11132d] p-3 shadow-2xl shadow-indigo-950/20 sm:p-5">
              <div className="flex items-center gap-2 px-3 py-3"><span className="h-2.5 w-2.5 rounded-full bg-rose-400"/><span className="h-2.5 w-2.5 rounded-full bg-amber-300"/><span className="h-2.5 w-2.5 rounded-full bg-emerald-400"/><span className="ml-3 text-xs font-semibold text-slate-400">{t("platformPresentation")}</span></div>
              <div className="relative flex min-h-[290px] flex-col items-center justify-center overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-indigo-600 via-[#3530a2] to-violet-800 px-6 py-10 text-center sm:min-h-[390px]">
                <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full border border-white/10"/><div className="absolute -bottom-28 -right-16 h-80 w-80 rounded-full border border-white/10"/>
                <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl border border-white/20 bg-white/15 text-4xl text-white shadow-xl backdrop-blur">▶</div>
                <p className="relative mt-7 text-2xl font-black text-white sm:text-3xl">TouchCard Business</p>
                <p className="relative mt-3 max-w-md text-sm leading-6 text-indigo-100">{t("videoIntro")}</p>
                <span className="relative mt-6 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[10px] font-bold uppercase tracking-[.18em] text-white/90">{t("videoReady")}</span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-4 text-xs text-slate-400"><span>{t("platformModules")}</span><span className="font-semibold text-indigo-200">{t("onePlatform")}</span></div>
            </div>
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
              <span className="block text-[10px] font-bold uppercase tracking-[.18em] text-indigo-200">{t("mockNfc")}</span><span className="mt-1 block text-sm font-semibold text-white">{t("mockOneTap")}</span>
            </motion.div>
            <motion.div className="absolute right-[8%] top-[18%] hidden rounded-2xl border border-white/10 bg-white/[.06] px-4 py-3 text-left backdrop-blur-md md:block" animate={reduceMotion ? undefined : { y: [0, 12, 0], rotate: [3, 0, 3] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}>
              <span className="block text-[10px] font-bold uppercase tracking-[.18em] text-fuchsia-200">{t("mockOpportunity")}</span><span className="mt-1 block text-sm font-semibold text-white">{t("mockRelation")} <span className="text-emerald-300">↗</span></span>
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
            <p className="text-xs font-black uppercase tracking-[.24em] text-indigo-200">{t("finalTitle")}</p>
            <h2 className="mt-6 text-4xl font-black leading-[1.08] tracking-[-.055em] sm:text-5xl lg:text-7xl">
              {t("finalTitle")}<br className="hidden sm:block" /> commence <span className="bg-gradient-to-r from-cyan-200 via-indigo-200 to-fuchsia-300 bg-clip-text text-transparent">{t("finalLead")}</span>
            </h2>
            <p className="mx-auto mt-7 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">{t("finalDesc")}</p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <motion.div whileHover={reduceMotion ? undefined : { scale: 1.045, y: -4 }} whileTap={reduceMotion ? undefined : { scale: .97 }}>
                <Link href="/register" className="group/cta inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 px-8 py-4 text-sm font-extrabold text-white shadow-[0_12px_40px_rgba(99,102,241,.4)] transition-shadow hover:shadow-[0_16px_55px_rgba(168,85,247,.55)]">{t("createMyAccountLabel")} <span className="text-lg transition-transform duration-300 group-hover/cta:translate-x-1 group-hover/cta:-translate-y-1"><Arrow /></span></Link>
              </motion.div>
              <a href="#fonctionnement" className="rounded-2xl border border-white/15 bg-white/[.06] px-7 py-4 text-sm font-bold text-slate-200 backdrop-blur transition hover:border-white/30 hover:bg-white/10">{t("howItWorks")}</a>
            </div>
            <p className="mt-7 text-xs font-medium tracking-wide text-slate-400">{t("quickStart")}</p>
          </motion.div>
        </motion.div>
      </section>

      <footer className="border-t border-slate-200 bg-[#0e1028] text-white">
        <div className="mx-auto grid max-w-[1440px] gap-12 px-5 py-16 sm:px-8 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr] lg:px-12 lg:py-20">
          <div>
            <Link href="/" className="inline-flex items-center gap-2.5"><img src="/brand/touchcard-mark.svg" alt="" className="h-11 w-11 object-contain" /><span className="text-xl font-black">Touch<span className="text-indigo-300">Card</span><span className="ml-2 text-[9px] font-extrabold tracking-[.18em] text-indigo-300">BUSINESS</span></span></Link>
            <p className="mt-5 max-w-sm text-sm leading-7 text-slate-400">{t("footerDesc")}</p>
            <Link href="/register" className="mt-7 inline-flex rounded-xl bg-indigo-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-400">{t("navCreate")} <Arrow /></Link>
          </div>
          <div><h3 className="text-sm font-extrabold">{t("footerPlatformHeading")}</h3><ul className="mt-5 space-y-3 text-sm text-slate-400"><li><a className="hover:text-white" href="#solutions">{t("footerSolutions")}</a></li><li><a className="hover:text-white" href="#experience">{t("footerFeatures")}</a></li><li><a className="hover:text-white" href="#demo">{t("footerDemo")}</a></li><li><a className="hover:text-white" href="#tarifs">{t("navPricing")}</a></li></ul></div>
          <div><h3 className="text-sm font-extrabold">{t("footerDiscover")}</h3><ul className="mt-5 space-y-3 text-sm text-slate-400"><li><a className="hover:text-white" href="#fonctionnement">{t("navHow")}</a></li><li><a className="hover:text-white" href="#faq">{t("faqTitle")}</a></li><li><Link className="hover:text-white" href="/register">{t("footerSignup")}</Link></li><li><Link className="hover:text-white" href="/login">{t("navLogin")}</Link></li></ul></div>
          <div><h3 className="text-sm font-extrabold">{t("footerWorkspace")}</h3><p className="mt-5 text-sm leading-7 text-slate-400">{t("footerCTA")}</p><Link href="/register" className="mt-4 inline-flex text-sm font-bold text-indigo-300 hover:text-white">{t("footerStart")}</Link></div>
        </div>
        <div className="border-t border-white/10"><div className="mx-auto flex max-w-[1440px] flex-col gap-3 px-5 py-6 text-xs text-slate-500 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-12"><p>{t("copyright")}</p><p>{t("footerTagline")}</p><div className="flex gap-5"><Link href="/login" className="hover:text-white">{t("navLogin")}</Link><Link href="/register" className="hover:text-white">{t("signup")}</Link></div></div></div>
      </footer>
    </main>
  );
}
