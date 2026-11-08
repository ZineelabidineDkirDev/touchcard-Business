"use client";

import { motion, useReducedMotion } from "framer-motion";

type Props = {
  title?: string;
  clientName?: string;
  cardType?: string;
  className?: string;
};

function NfcMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 32 32" className="h-7 w-7 shrink-0" fill="none">
      <path d="M7 10.5a8 8 0 0 0 0 11M11 13.5a4 4 0 0 0 0 5M16 8v16M21 13.5a4 4 0 0 1 0 5M25 10.5a8 8 0 0 1 0 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

function GoogleWordmark() {
  return (
    <span className="inline-flex items-center text-[25px] font-semibold tracking-[-.07em]" aria-label="Google">
      <span className="text-[#4285F4]">G</span>
      <span className="ml-1 text-white">oogle</span>
    </span>
  );
}

function QrDemo() {
  const cells = [1,1,1,0,1,0,1,1,1,1,0,1,0,0,1,1,0,1,1,1,1,0,1,0,1,1,1,0,0,0,1,0,1,0,0,0,1,0,1,1,1,1,0,1,0,0,1,0,1,0,0,1,1,1,1,1,1,0,1,1,1,0,1,1,0,1,0,1,0,1,1,1,0,1,0,1,1,1];
  return <div className="grid aspect-square w-full grid-cols-9 gap-[3px] rounded-lg bg-white p-2">{cells.map((v,i)=><span key={i} className={v?"rounded-[1px] bg-[#111827]":"bg-white"}/>)}</div>;
}

export function PhysicalNfcCard({ title = "Contact", clientName = "Votre nom", cardType = "contact", className = "" }: Props) {
  const reduceMotion = useReducedMotion();
  const isGoogle = cardType === "google-review" || /avis google|google/i.test(title);
  const service = title || (cardType === "e-business" ? "E-Business" : cardType === "service" ? "Personnalisée" : "Contact");
  const displayName = clientName.trim() || "M./Mme Client";

  return (
    <div className={`group relative h-full w-full [perspective:1400px] ${className}`}>
      <motion.div
        className="relative h-full w-full overflow-hidden rounded-[1.15rem] border border-white/25 bg-[#11151d] text-white shadow-[0_22px_55px_-22px_rgba(0,0,0,.85)] [transform-style:preserve-3d]"
        whileHover={reduceMotion ? undefined : { rotateX: 3, rotateY: -4, y: -3 }}
        transition={{ type: "spring", stiffness: 180, damping: 20 }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_18%_12%,rgba(255,255,255,.2),transparent_38%),linear-gradient(132deg,#4b5563_0%,#202833_24%,#090d13_62%,#343b45_100%)]"/>
        <div className="absolute inset-[1px] rounded-[1.08rem] border border-white/10"/>
        <div className="absolute -right-[12%] -top-[38%] h-[115%] w-[58%] rotate-[28deg] border-l border-white/10 bg-gradient-to-r from-white/[.045] via-white/[.10] to-transparent"/>
        <div className="absolute bottom-0 left-0 h-[42%] w-full bg-gradient-to-t from-black/45 to-transparent"/>
        <div className="relative flex h-full flex-col justify-between p-[6.2%]">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <img src="/brand/touchcard-mark.svg" alt="" className="h-7 w-7 shrink-0 object-contain grayscale brightness-200 opacity-90"/>
              <span className="truncate text-[clamp(12px,2.3vw,20px)] font-black tracking-[-.055em] text-transparent [background:linear-gradient(110deg,#f8fafc_0%,#aeb7c2_35%,#f8fafc_52%,#747e89_75%,#e2e8f0_100%)] bg-clip-text">TouchCard</span>
            </div>
            <span className="max-w-[46%] truncate pt-1 text-right text-[clamp(8px,1.35vw,12px)] font-semibold tracking-[.04em] text-slate-200/90">{displayName}</span>
          </div>

          <div className="relative z-10 flex items-end justify-between gap-3">
            {isGoogle ? (
              <div className="flex min-w-0 flex-col items-start">
                <GoogleWordmark/>
                <div className="mt-[-2px] flex items-center gap-2">
                  <span className="text-[clamp(8px,1.3vw,11px)] font-bold tracking-[.16em] text-slate-100">AVIS</span>
                  <span className="text-[clamp(11px,1.8vw,15px)] leading-none tracking-[.08em] text-[#fbbc04]" aria-label="5 étoiles">★★★★★</span>
                </div>
              </div>
            ) : (
              <div className="flex min-w-0 items-center gap-2 text-slate-100">
                <NfcMark/>
                <span className="truncate text-[clamp(9px,1.65vw,14px)] font-extrabold uppercase tracking-[.13em]">{service}</span>
              </div>
            )}
            <span className="shrink-0 text-[clamp(7px,1.1vw,9px)] font-bold tracking-[.2em] text-slate-300/75">NFC</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export function PhysicalNfcCardBack() {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-[1.15rem] border border-white/20 bg-gradient-to-br from-[#303945] via-[#11151d] to-[#05070a] p-[7%] text-white">
      <div className="absolute left-[7%] top-[8%] flex items-center gap-2 opacity-80">
        <img src="/brand/touchcard-mark.svg" alt="" className="h-6 w-6 grayscale brightness-200"/>
        <span className="text-sm font-black text-slate-200">TouchCard</span>
      </div>
      <div className="w-[36%] max-w-28"><QrDemo/></div>
      <span className="mt-2 text-[clamp(7px,1.1vw,10px)] font-bold tracking-[.2em] text-slate-300">TAP · SCAN · CONNECT</span>
    </div>
  );
}
