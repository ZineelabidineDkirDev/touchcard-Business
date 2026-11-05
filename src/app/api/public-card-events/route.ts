import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const allowedEvents = new Set(["view", "qr_scan", "nfc_scan", "click", "contact_save"]);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const cardId = typeof body.cardId === "string" ? body.cardId : "";
    const eventType = typeof body.eventType === "string" ? body.eventType : "";
    const linkId = typeof body.linkId === "string" ? body.linkId : null;
    if (!cardId || !allowedEvents.has(eventType)) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: card } = await supabase.from("cards")
      .select("id,organization_id").eq("id", cardId).eq("is_published", true).maybeSingle();
    if (!card) return NextResponse.json({ ok: false }, { status: 404 });

    const { error } = await supabase.from("card_events").insert({
      organization_id: card.organization_id,
      card_id: card.id,
      event_type: eventType,
      link_id: linkId,
      referrer: request.headers.get("referer")?.slice(0, 500) ?? null,
    });
    if (error) return NextResponse.json({ ok: false }, { status: 403 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
