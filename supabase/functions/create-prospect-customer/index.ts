import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("SITE_URL") ?? "https://touchcard-three.vercel.app",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const authorization = req.headers.get("Authorization");
    if (!authorization?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const siteUrl = Deno.env.get("SITE_URL") ?? "https://touchcard-three.vercel.app";

    const userClient = createClient(url, anonKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: membership } = await admin
      .from("organization_members")
      .select("user_id")
      .eq("user_id", user.id)
      .eq("role", "super_admin")
      .limit(1)
      .maybeSingle();

    if (!membership) {
      return new Response(JSON.stringify({ error: "Administrator access required" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const requestId = String(body.request_id ?? "");
    if (!requestId) throw new Error("Missing prospect request ID");

    const { data: prospect, error: prospectError } = await admin
      .from("prospect_requests")
      .select("id, user_id, full_name, email, status, brand_name")
      .eq("id", requestId)
      .maybeSingle();

    if (prospectError || !prospect) throw new Error("Prospect not found");
    if (prospect.status !== "approved") throw new Error("Approve the prospect before creating an account");
    if (prospect.user_id) throw new Error("A customer account is already linked to this prospect");

    const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(
      prospect.email,
      {
        data: {
          full_name: prospect.full_name,
          prospect_request_id: prospect.id,
        },
        redirectTo: `${siteUrl.replace(/\/$/, "")}/auth/callback?next=/dashboard`,
      },
    );

    if (inviteError || !invited.user) {
      throw new Error(inviteError?.message ?? "Unable to invite customer");
    }

    const organizationName = String(prospect.brand_name || prospect.full_name).trim();
    const slugBase = organizationName
      .normalize("NFD")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 36) || "client";
    const organizationSlug = `${slugBase}-${crypto.randomUUID().slice(0, 8)}`;

    const { error: organizationError } = await admin
      .from("organizations")
      .insert({
        name: organizationName,
        slug: organizationSlug,
        owner_id: invited.user.id,
      });

    if (organizationError) {
      await admin.auth.admin.deleteUser(invited.user.id);
      throw new Error("The invitation could not be prepared because the customer workspace could not be created.");
    }

    const { error: linkError } = await admin
      .from("prospect_requests")
      .update({ user_id: invited.user.id, updated_at: new Date().toISOString() })
      .eq("id", prospect.id)
      .is("user_id", null);

    if (linkError) {
      await admin.from("organizations").delete().eq("owner_id", invited.user.id);
      await admin.auth.admin.deleteUser(invited.user.id);
      throw new Error("The customer account could not be linked to the approved request. Please retry.");
    }

    return new Response(JSON.stringify({ ok: true, user_id: invited.user.id }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return new Response(JSON.stringify({ error: message }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
