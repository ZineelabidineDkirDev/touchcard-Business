import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isPlatformSuperAdmin } from "@/lib/auth/platform-admin";
import { ProspectWorkspaceConfigurator } from "@/components/prospects/prospect-workspace-configurator";

export default async function ConfigureProspectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  await connection();
  const { id } = await params;
  const query = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!isPlatformSuperAdmin(user.email)) notFound();

  const { data: prospect, error } = await supabase
    .from("prospect_requests")
    .select("id,user_id,full_name,city,activity_sector,email,phone,card_type,reason,customization_requested,brand_name,logo_url,business_address,business_phone,project_needs,status")
    .eq("id", id)
    .maybeSingle();

  if (error || !prospect) notFound();
  if (prospect.user_id) {
    const { data: existingOrganization } = await supabase.from("organizations")
      .select("id").eq("owner_id", prospect.user_id).maybeSingle();
    if (existingOrganization) redirect("/dashboard/prospects?already_created=1");
  }
  if (!["approved", "in_production", "completed"].includes(prospect.status)) redirect("/dashboard/prospects?approval_required=1");

  return (
    <ProspectWorkspaceConfigurator
      prospect={prospect}
      errorMessage={query.error ? decodeURIComponent(query.error) : undefined}
    />
  );
}
