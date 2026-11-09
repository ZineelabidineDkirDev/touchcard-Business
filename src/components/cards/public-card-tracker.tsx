"use client";

import { useEffect } from "react";

export function PublicCardTracker({ cardId, eventType = "view" }: { cardId: string; eventType?: "view" | "qr_scan" | "nfc_scan" }) {
  useEffect(() => {
    void fetch("/api/public-card-events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardId, eventType }),
      keepalive: true,
    });
  }, [cardId, eventType]);
  return null;
}

export function TrackedPublicLink({ cardId, linkId, href, children, className, style, eventType = "click" }: {
  cardId: string; linkId?: string; href: string; children: React.ReactNode; className?: string; style?: React.CSSProperties; eventType?: "click" | "contact_save";
}) {
  return <a href={href} className={className} style={style} target={href.startsWith("http") ? "_blank" : undefined}
    rel={href.startsWith("http") ? "noreferrer" : undefined}
    onClick={() => {
      void fetch("/api/public-card-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId, eventType, linkId: linkId ?? null }),
        keepalive: true,
      });
    }}>{children}</a>;
}
