import { createClient } from "@/lib/supabase/server";

function escapeVCard(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: card } = await supabase.from("cards")
    .select("full_name,job_title,company_name,email,phone,website")
    .eq("slug", slug).eq("is_published", true).maybeSingle();
  if (!card) return new Response("Not found", { status: 404 });
  const lines = [
    "BEGIN:VCARD", "VERSION:3.0",
    "FN:" + escapeVCard(card.full_name),
    card.job_title ? "TITLE:" + escapeVCard(card.job_title) : "",
    card.company_name ? "ORG:" + escapeVCard(card.company_name) : "",
    card.phone ? "TEL;TYPE=WORK,VOICE:" + escapeVCard(card.phone) : "",
    card.email ? "EMAIL;TYPE=WORK:" + escapeVCard(card.email) : "",
    card.website ? "URL:" + escapeVCard(card.website) : "",
    "END:VCARD",
  ].filter(Boolean);
  return new Response(lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": 'attachment; filename="' + slug + '.vcf"',
      "Cache-Control": "public, max-age=300",
    },
  });
}
