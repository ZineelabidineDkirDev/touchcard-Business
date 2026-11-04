import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isPlatformSuperAdmin } from "@/lib/auth/platform-admin";
import { ProspectAITest } from "@/components/prospects/prospect-ai-test";

export default async function ProspectAITestPage({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!isPlatformSuperAdmin(user.email)) notFound();

  const { data: prospect, error } = await supabase
    .from("prospect_requests")
    .select("id, card_type, status, user_id")
    .eq("id", id)
    .maybeSingle();

  if (error || !prospect || prospect.status !== "in_production" || !prospect.user_id) notFound();

  return <ProspectAITest prospectId={prospect.id} cardType={prospect.card_type} />;
}
