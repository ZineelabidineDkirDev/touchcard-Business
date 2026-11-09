import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isPlatformSuperAdmin } from "@/lib/auth/platform-admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !isPlatformSuperAdmin(user.email)) {
    return NextResponse.json({ notifications: [], count: 0 }, { status: 403 });
  }

  const { data, error, count } = await supabase
    .from("prospect_requests")
    .select("id, full_name, brand_name, card_type, city, created_at", { count: "exact" })
    .eq("status", "new")
    .order("created_at", { ascending: false })
    .limit(12);

  if (error) {
    console.error("Admin notifications query failed", error);
    return NextResponse.json({ error: "Impossible de charger les notifications." }, { status: 500 });
  }

  return NextResponse.json(
    { notifications: data ?? [], count: count ?? 0 },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
