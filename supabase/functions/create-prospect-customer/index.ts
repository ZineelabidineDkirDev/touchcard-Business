import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const PLATFORM_SUPER_ADMIN_EMAIL = "zainmawada@gmail.com";
const allowedModules = new Set([
  "dashboard", "digital_card", "contact_profile", "social_links", "qr_nfc",
  "company_profile", "service_catalog", "product_catalog", "orders",
  "quote_requests", "bookings", "availability_calendar", "team",
  "gallery", "crm_contacts", "analytics", "whatsapp",
  "edit_business_details", "manage_services_prices", "manage_bookings",
  "manage_content", "view_analytics", "manage_team",
]);

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("SITE_URL") ?? "https://touchcard-zayn-dk.vercel.app",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let invitedUserId: string | null = null;
  let organizationId: string | null = null;
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  try {
    const authorization = req.headers.get("Authorization");
    if (!authorization?.startsWith("Bearer ")) return json({ error: "Authentication required" }, 401);

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: { headers: { Authorization: authorization } },
        auth: { persistSession: false, autoRefreshToken: false },
      },
    );
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) return json({ error: "Invalid session" }, 401);

    // Global admin authorization uses the verified Auth email, never editable user_metadata.
    if (user.email?.trim().toLowerCase() !== PLATFORM_SUPER_ADMIN_EMAIL) {
      return json({ error: "Administrator access required" }, 403);
    }

    const body = await req.json();
    const requestId = String(body.request_id ?? "");
    if (!requestId) return json({ error: "Missing prospect request ID" }, 400);

    const submitted = body.workspace_config ?? {};
    const cardType = String(submitted.template ?? "");
    const validCardTypes = ["e-business", "contact", "service"];
    if (!validCardTypes.includes(cardType)) return json({ error: "Invalid card template" }, 400);

    const selectedModules = Array.isArray(submitted.modules)
      ? [...new Set(submitted.modules.map((value: unknown) => String(value)))]
      : [];
    if (selectedModules.some((module) => !allowedModules.has(module))) {
      return json({ error: "Unknown workspace module" }, 400);
    }
    if (!selectedModules.includes("dashboard")) selectedModules.unshift("dashboard");

    const { data: prospect, error: prospectError } = await admin
      .from("prospect_requests")
      .select("id,user_id,full_name,email,phone,city,status,brand_name,card_type,activity_sector,project_needs")
      .eq("id", requestId)
      .maybeSingle();

    if (prospectError || !prospect) return json({ error: "Prospect not found" }, 404);
    if (prospect.status !== "approved") return json({ error: "Approve the prospect before creating an account" }, 409);
    if (prospect.user_id) return json({ error: "A customer account is already linked to this prospect" }, 409);
    if (prospect.card_type !== cardType) return json({ error: "The selected template must match the prospect's original card choice" }, 400);

    const siteUrl = Deno.env.get("SITE_URL") ?? "https://touchcard-zayn-dk.vercel.app";
    const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(
      prospect.email,
      {
        data: { full_name: prospect.full_name, prospect_request_id: prospect.id },
        redirectTo: `${siteUrl.replace(/\/$/, "")}/auth/callback?next=/dashboard`,
      },
    );
    if (inviteError || !invited.user) {
      return json({ error: inviteError?.message ?? "Unable to invite customer" }, 400);
    }
    invitedUserId = invited.user.id;

    const organizationName = String(prospect.brand_name || prospect.full_name).trim();
    const slugBase = organizationName.normalize("NFD").toLowerCase()
      .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 36) || "client";
    const organizationSlug = `${slugBase}-${crypto.randomUUID().slice(0, 8)}`;

    const workspaceConfig = {
      version: 1,
      template: cardType,
      modules: selectedModules,
      plan: { code: String(submitted.plan_code ?? "to_define"), status: "pending" },
      original_client_choices: {
        card_type: prospect.card_type,
        activity_sector: prospect.activity_sector,
        project_needs: prospect.project_needs,
        city: prospect.city,
      },
      approved_by: user.id,
      approved_at: new Date().toISOString(),
    };

    const { data: organization, error: organizationError } = await admin
      .from("organizations")
      .insert({
        name: organizationName,
        slug: organizationSlug,
        owner_id: invited.user.id,
        phone: prospect.phone,
        workspace_config: workspaceConfig,
      })
      .select("id")
      .single();

    if (organizationError || !organization) throw new Error("The customer workspace could not be created.");
    organizationId = organization.id;

    const { data: linked, error: linkError } = await admin
      .from("prospect_requests")
      .update({ user_id: invited.user.id, status: "in_production", updated_at: new Date().toISOString() })
      .eq("id", prospect.id)
      .is("user_id", null)
      .select("id")
      .maybeSingle();

    if (linkError || !linked) throw new Error("The customer account could not be linked to the approved request.");

    return json({ ok: true, user_id: invited.user.id, organization_id: organization.id });
  } catch (error) {
    if (organizationId) await admin.from("organizations").delete().eq("id", organizationId);
    if (invitedUserId) await admin.auth.admin.deleteUser(invitedUserId);
    const message = error instanceof Error ? error.message : "Unexpected error";
    return json({ error: message }, 400);
  }
});
