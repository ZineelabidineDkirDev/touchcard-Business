"use client";

import { useId } from "react";
import { motion, useReducedMotion } from "framer-motion";

export type CardColorTheme = "gold" | "metallic-black" | "dark-gray" | "white";

type Props = {
  title?: string;
  clientName?: string;
  cardType?: string;
  className?: string;
  interactivePreview?: boolean;
  colorTheme?: CardColorTheme;
  animateBrandColors?: boolean;
};

function NfcMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 32 32" className="h-6 w-6 shrink-0" fill="none">
      <path d="M7 10.5a8 8 0 0 0 0 11M11 13.5a4 4 0 0 0 0 5M16 8v16M21 13.5a4 4 0 0 1 0 5M25 10.5a8 8 0 0 1 0 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

function GoogleWordmark() {
  return (
    <span className="inline-flex items-center text-[clamp(16px,2.5vw,22px)] font-bold tracking-[-.07em]" aria-label="Google">
      <span className="text-[#4285F4]">G</span><span className="text-[#EA4335]">o</span><span className="text-[#FBBC05]">o</span><span className="text-[#4285F4]">g</span><span className="text-[#34A853]">l</span><span className="text-[#EA4335]">e</span>
    </span>
  );
}

function QrDemo() {
  const cells = [1,1,1,0,1,0,1,1,1,1,0,1,0,0,1,1,0,1,1,1,1,0,1,0,1,1,1,0,0,0,1,0,1,0,0,0,1,0,1,1,1,1,0,1,0,0,1,0,1,0,0,1,1,1,1,1,1,0,1,1,1,0,1,1,0,1,0,1,0,1,1,1,0,1,0,1,1,1];
  return <div className="grid aspect-square w-full grid-cols-9 gap-[3px] rounded-lg bg-white p-2">{cells.map((v,i)=><span key={i} className={v?"rounded-[1px] bg-[#111827]":"bg-white"}/>)}</div>;
}

function BrandWaves() {
  const id = useId().replace(/:/g, "");
  return (
    <svg aria-hidden="true" viewBox="0 0 400 252" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full">
      <defs>
        <linearGradient id={`w${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#00c8ff" stopOpacity=".15" /><stop offset=".45" stopColor="#087bff" stopOpacity=".85" /><stop offset="1" stopColor="#8b35f4" stopOpacity=".95" />
        </linearGradient>
      </defs>
      {Array.from({ length: 16 }, (_, i) => (
        <path key={i} d={`M-10 ${128 + i * 5} C 90 ${118 + i * 6}, 150 ${236 + i * 2}, 260 ${222 - i * 2} S 380 ${150 - i * 3}, 420 ${120 - i * 4}`} fill="none" stroke={`url(#w${id})`} strokeWidth=".7" opacity={0.75 - i * 0.025} />
      ))}
    </svg>
  );
}

function BrandFace({ service, displayName, isGoogle, interactivePreview }: { service: string; displayName: string; isGoogle: boolean; interactivePreview: boolean }) {
  return (
    <>
      <div className="absolute inset-0" style={{ background: "radial-gradient(120% 90% at 100% 100%, rgba(124,58,237,.78), transparent 55%), radial-gradient(70% 60% at 0% 0%, rgba(0,160,255,.16), transparent 60%)" }} />
      <BrandWaves />
      <div className="absolute inset-[1px] rounded-[1.08rem] border border-cyan-300/20" />
      <div className="relative z-10 flex h-full flex-col justify-between p-[6.2%]">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            {isGoogle ? (
              <div className="flex flex-col leading-tight">
                <GoogleWordmark />
                <span className="flex items-center gap-1 text-[clamp(7px,1.15vw,10px)] font-bold tracking-[.12em] text-white">AVIS <span className="text-[clamp(10px,1.55vw,13px)] tracking-[.04em] text-[#fbbc04]" aria-label="5 étoiles">★★★★★</span></span>
              </div>
            ) : interactivePreview ? (
              <span className="block truncate text-[clamp(8px,1.3vw,11px)] font-extrabold uppercase tracking-[.12em] text-white">{service}</span>
            ) : null}
          </div>
          <div className="flex shrink-0 flex-col items-center text-white">
            <span className="[&>svg]:h-[clamp(18px,3.4vw,30px)] [&>svg]:w-[clamp(18px,3.4vw,30px)]"><NfcMark /></span>
            <span className="text-[clamp(7px,1.15vw,10px)] font-black tracking-[.04em]">NFC</span>
          </div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 top-[21%] flex flex-col items-center">
          <img src="/brand/touchcard-mark.svg" alt="Logo TouchCard" className="w-[16%] object-contain drop-shadow-[0_0_10px_rgba(0,160,255,.5)]" />
          <span className="mt-[2%] text-[clamp(12px,2.7vw,28px)] font-bold leading-none tracking-[-.02em] text-white">TouchCard</span>
          <span className="mt-[1%] text-[clamp(8px,1.6vw,16px)] font-light leading-none tracking-[.03em] text-white/90">Business</span>
        </div>
        <div className="relative z-10 flex items-end justify-between gap-3">
          <span className="min-w-0 truncate text-[clamp(10px,1.7vw,15px)] font-semibold tracking-[.025em] text-white">{displayName}</span>
        </div>
      </div>
    </>
  );
}

export function PhysicalNfcCard({ title = "Contact", clientName = "Votre nom", cardType = "contact", className = "", interactivePreview = false, colorTheme = "metallic-black", animateBrandColors = false }: Props) {
  const reduceMotion = useReducedMotion();
  const isGoogle = cardType === "google-review" || /avis google|google/i.test(title);
  const service = title || (cardType === "e-business" ? "E-Business" : cardType === "service" ? "Personnalisée" : "Contact");
  const rawName = clientName.trim();
  const displayName = rawName || "Nom du client";
  const palettes = {
    gold: {
      surface: "linear-gradient(132deg, #fff0b8 0%, #c99b3d 24%, #76501b 58%, #e5c16b 100%)",
      text: "#241707",
      muted: "rgba(36,23,7,.78)",
      border: "rgba(255,248,220,.72)",
      logo: "brightness(0) saturate(100%)",
      sheen: "rgba(255,255,255,.30)",
      shade: "rgba(62,38,7,.22)",
    },
    "metallic-black": {
      surface: "linear-gradient(145deg, #0b1230 0%, #05081a 58%, #02040d 100%)",
      text: "#ffffff",
      muted: "rgba(226,236,255,.86)",
      border: "rgba(0,200,255,.62)",
      logo: "none",
      sheen: "rgba(60,150,255,.16)",
      shade: "rgba(0,0,0,.4)",
    },
    "dark-gray": {
      surface: "linear-gradient(132deg, #747b83 0%, #424951 28%, #252b32 66%, #555d66 100%)",
      text: "#ffffff",
      muted: "rgba(241,245,249,.82)",
      border: "rgba(255,255,255,.32)",
      logo: "grayscale(1) brightness(2)",
      sheen: "rgba(255,255,255,.20)",
      shade: "rgba(0,0,0,.30)",
    },
    white: {
      surface: "linear-gradient(132deg, #ffffff 0%, #f4f6f8 48%, #dce2e8 100%)",
      text: "#17202b",
      muted: "rgba(51,65,85,.78)",
      border: "rgba(71,85,105,.25)",
      logo: "grayscale(1) brightness(.45)",
      sheen: "rgba(255,255,255,.78)",
      shade: "rgba(15,23,42,.10)",
    },
  } as const;
  const palette = palettes[colorTheme];
  const isBrand = colorTheme === "metallic-black";

  return (
    <div className={`group relative h-full w-full [perspective:1400px] ${className}`}>
      <motion.div
        className="relative h-full w-full [transform-style:preserve-3d]"
        whileHover={reduceMotion ? undefined : (interactivePreview ? { rotateY: 180 } : { rotateX: 3, rotateY: -4, y: -3 })}
        transition={{ type: "spring", stiffness: interactivePreview ? 120 : 180, damping: 20 }}
      >
        <div className="absolute inset-0 overflow-hidden rounded-[1.15rem] border text-white shadow-[0_22px_55px_-22px_rgba(0,0,0,.85)] [backface-visibility:hidden]" style={{ background: palette.surface, borderColor: palette.border, color: palette.text, ...(isBrand ? { boxShadow: "0 0 26px rgba(0,170,255,.45), 0 22px 55px -22px rgba(0,0,0,.85)" } : {}) }}>
        {isBrand ? <BrandFace service={service} displayName={displayName} isGoogle={isGoogle} interactivePreview={interactivePreview} /> : (<>
        {animateBrandColors && !isBrand && <motion.div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ mixBlendMode: "color", opacity: 0.28 }} animate={reduceMotion ? undefined : { backgroundColor: ["#6366f1", "#8b5cf6", "#22d3ee", "#d946ef", "#6366f1"] }} transition={{ duration: 40, repeat: Infinity, ease: "easeInOut" }} />}
        <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at 18% 12%, ${palette.sheen}, transparent 38%), repeating-linear-gradient(118deg, rgba(255,255,255,.035) 0px, rgba(255,255,255,.035) 1px, transparent 1px, transparent 5px)` }}/>
        <div className="absolute inset-[1px] rounded-[1.08rem] border border-white/10"/>
        <div className="absolute -right-[12%] -top-[38%] h-[115%] w-[58%] rotate-[28deg] border-l border-white/10 bg-gradient-to-r from-white/[.045] via-white/[.10] to-transparent"/>
        <div className="absolute bottom-0 left-0 h-[42%] w-full" style={{ background: `linear-gradient(to top, ${palette.shade}, transparent)` }}/>
        {interactivePreview && <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center"><img src="/brand/touchcard-mark.svg" alt="" className="h-[42%] w-[42%] object-contain" style={{ opacity: 0.075, filter: palette.logo }}/></div>}
        <div className="relative z-10 flex h-full flex-col justify-between p-[6.2%]">
          <div className="flex min-w-0 items-start justify-between gap-2">
            {interactivePreview ? (
              <div className="flex min-w-0 items-center gap-1.5">
                <span className="truncate text-[clamp(8px,1.3vw,11px)] font-extrabold uppercase tracking-[.12em]" style={{ color: palette.text }}>{service}</span>
                <span className="[&>svg]:h-5 [&>svg]:w-5"><NfcMark/></span>
              </div>
            ) : (
              <div className="flex min-w-0 items-center gap-2">
                <img src="/brand/touchcard-mark.svg" alt="Logo TouchCard" className="h-5 w-5 shrink-0 object-contain opacity-90" style={{ filter: palette.logo }}/>
                <span className="flex min-w-0 flex-col leading-[.92]"><span className="whitespace-nowrap text-[clamp(10px,1.8vw,16px)] font-black tracking-[-.055em]" style={{ color: palette.muted }}>TouchCard</span><span className="mt-1 text-[clamp(6px,1vw,9px)] font-medium tracking-[.04em]" style={{ color: palette.muted }}>Business</span></span>
              </div>
            )}
            {isGoogle && (
              <div className="flex max-w-[48%] shrink-0 flex-col items-end leading-tight text-right">
                <GoogleWordmark/>
                <span className="flex items-center gap-1 text-[clamp(7px,1.15vw,10px)] font-bold tracking-[.12em]" style={{ color: palette.text }}>
                  AVIS <span className="text-[clamp(10px,1.55vw,13px)] tracking-[.04em] text-[#fbbc04]" aria-label="5 étoiles">★★★★★</span>
                </span>
              </div>
            )}
          </div>

          <div className="relative z-10 flex items-end justify-between gap-3">
            <span className="min-w-0 truncate text-[clamp(11px,1.8vw,16px)] font-semibold tracking-[.025em]" style={{ color: palette.text }}>{displayName}</span>
            <span className="shrink-0 text-[clamp(7px,1.1vw,9px)] font-bold tracking-[.2em]" style={{ color: palette.muted }}>NFC</span>
          </div>
        </div>
        </>)}
        </div>
        {interactivePreview && <div className="absolute inset-0 overflow-hidden rounded-[1.15rem] [backface-visibility:hidden] [transform:rotateY(180deg)]"><PhysicalNfcCardBack colorTheme={colorTheme}/></div>}
      </motion.div>
    </div>
  );
}

export function PhysicalNfcCardBack({ colorTheme = "metallic-black" }: { colorTheme?: CardColorTheme }) {
  const backBackgrounds = {
    gold: "linear-gradient(132deg, #fff0b8 0%, #c99b3d 35%, #76501b 100%)",
    "metallic-black": "linear-gradient(145deg, #0b1230 0%, #05081a 60%, #02040d 100%)",
    "dark-gray": "linear-gradient(132deg, #747b83 0%, #424951 48%, #252b32 100%)",
    white: "linear-gradient(132deg, #ffffff 0%, #f4f6f8 55%, #dce2e8 100%)",
  } as const;
  const lightTheme = colorTheme === "gold" || colorTheme === "white";
  const ink = colorTheme === "gold" ? "#241707" : "#17202b";
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-[1.15rem] border p-[7%]" style={{ background: backBackgrounds[colorTheme], borderColor: lightTheme ? "rgba(71,85,105,.25)" : colorTheme === "metallic-black" ? "rgba(0,200,255,.55)" : "rgba(255,255,255,.2)", color: lightTheme ? ink : "#ffffff", ...(colorTheme === "metallic-black" ? { boxShadow: "0 0 26px rgba(0,170,255,.35)" } : {}) }}>
      <div className="absolute left-[7%] top-[8%] flex items-center gap-2 opacity-100">
        <img src="/brand/touchcard-mark.svg" alt="Logo TouchCard" className="h-5 w-5" style={{ filter: lightTheme ? "grayscale(1) brightness(.45)" : colorTheme === "metallic-black" ? "none" : "grayscale(1) brightness(2)" }}/>
        <span className="flex flex-col leading-[.92]"><span className="text-xs font-black tracking-[-.04em]" style={{ color: lightTheme ? "rgba(36,23,7,.78)" : "#d0d5dc" }}>TouchCard</span><span className="mt-1 text-[8px] font-medium tracking-[.04em]" style={{ color: lightTheme ? "rgba(36,23,7,.68)" : "#aeb7c4" }}>Business</span></span>
      </div>
      <div className="w-[36%] max-w-28"><QrDemo/></div>
      <span className="mt-2 text-[clamp(7px,1.1vw,10px)] font-bold tracking-[.2em]" style={{ color: lightTheme ? "rgba(36,23,7,.78)" : "#cbd5e1" }}>TAP · SCAN · CONNECT</span>
    </div>
  );
}
