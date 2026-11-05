"use client";

import { useEffect } from "react";

export function PublicCardTracker({ cardId }: { cardId: string }) {
  useEffect(() => {
    void fetch("/api/public-card-events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardId, eventType: "view" }),
      keepalive: true,
    });
  }, [cardId]);
  return null;
}

export function TrackedPublicLink({ cardId, linkId, href, children, className }: {
  cardId: string; linkId?: string; href: string; children: React.ReactNode; className?: string;
}) {
  return <a href={href} className={className} target={href.startsWith("http") ? "_blank" : undefined}
    rel={href.startsWith("http") ? "noreferrer" : undefined}
    onClick={() => {
      void fetch("/api/public-card-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId, eventType: "click", linkId: linkId ?? null }),
        keepalive: true,
      });
    }}>{children}</a>;
}
