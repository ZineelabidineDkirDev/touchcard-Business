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

export function PhysicalNfcCard({ title = "Contact", clientName = "Votre nom", cardType = "contact", className = "" }: Props) {
  const reduceMotion = useReducedMotion();
  const isGoogle = cardType === "google-review" || /avis google|google/i.test(title);
  const service = title || (cardType === "e-business" ? "E-Business" : cardType === "service" ? "Personnalisée" : "Contact");
  const rawName = clientName.trim();
  const displayName = !rawName ? "M./Mme Client" : /^(M\.|Mme|Mlle)\s/i.test(rawName) ? rawName : `M./Mme ${rawName}`;

  return (
    <div className={`group relative h-full w-full [perspective:1400px] ${className}`}>
      <motion.div
        className="relative h-full w-full overflow-hidden rounded-[1.15rem] border border-white/25 bg-[#11151d] text-white shadow-[0_22px_55px_-22px_rgba(0,0,0,.85)] [transform-style:preserve-3d]"
        whileHover={reduceMotion ? undefined : { rotateX: 3, rotateY: -4, y: -3 }}
        transition={{ type: "spring", stiffness: 180, damping: 20 }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_18%_12%,rgba(255,255,255,.13),transparent_38%),repeating-linear-gradient(118deg,rgba(255,255,255,.018)_0px,rgba(255,255,255,.018)_1px,transparent_1px,transparent_5px),linear-gradient(132deg,#343a43_0%,#171c24_24%,#07090d_62%,#252b33_100%)]"/>
        <div className="absolute inset-[1px] rounded-[1.08rem] border border-white/10"/>
        <div className="absolute -right-[12%] -top-[38%] h-[115%] w-[58%] rotate-[28deg] border-l border-white/10 bg-gradient-to-r from-white/[.045] via-white/[.10] to-transparent"/>
        <div className="absolute bottom-0 left-0 h-[42%] w-full bg-gradient-to-t from-black/45 to-transparent"/>
        <div className="relative flex h-full flex-col justify-between p-[6.2%]">
          <div className="flex min-w-0 items-start justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <img src="/brand/touchcard-mark.svg" alt="Logo TouchCard" className="h-5 w-5 shrink-0 object-contain grayscale brightness-200 opacity-100"/>
              <span className="whitespace-nowrap text-[clamp(10px,1.8vw,16px)] font-black tracking-[-.055em] text-[#d0d5dc] drop-shadow-[0_0_7px_rgba(220,230,245,.42)]">TouchCard</span>
            </div>
            <div className="flex max-w-[48%] shrink-0 items-center justify-end gap-1.5 text-right text-slate-100">
              {isGoogle ? (
                <div className="flex flex-col items-end leading-tight">
                  <GoogleWordmark/>
                  <span className="flex items-center gap-1 text-[clamp(7px,1.15vw,10px)] font-bold tracking-[.12em] text-slate-100">
                    AVIS <span className="text-[clamp(10px,1.55vw,13px)] tracking-[.04em] text-[#fbbc04]" aria-label="5 étoiles">★★★★★</span>
                  </span>
                </div>
              ) : (
                <>
                  <span className="truncate text-[clamp(7px,1.15vw,10px)] font-extrabold uppercase tracking-[.12em]">{service}</span>
                  <span className="[&>svg]:h-5 [&>svg]:w-5"><NfcMark/></span>
                </>
              )}
            </div>
          </div>

          <div className="relative z-10 flex items-end justify-between gap-3">
            <span className="min-w-0 truncate text-[clamp(9px,1.55vw,13px)] font-semibold tracking-[.035em] text-slate-200">{displayName}</span>
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
      <div className="absolute left-[7%] top-[8%] flex items-center gap-2 opacity-100">
        <img src="/brand/touchcard-mark.svg" alt="Logo TouchCard" className="h-5 w-5 grayscale brightness-200"/>
        <span className="text-xs font-black tracking-[-.04em] text-[#d0d5dc] drop-shadow-[0_0_7px_rgba(220,230,245,.42)]">TouchCard</span>
      </div>
      <div className="w-[36%] max-w-28"><QrDemo/></div>
      <span className="mt-2 text-[clamp(7px,1.1vw,10px)] font-bold tracking-[.2em] text-slate-300">TAP · SCAN · CONNECT</span>
    </div>
  );
}
