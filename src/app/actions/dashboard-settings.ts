"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function updateClientProfile(formData: FormData) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");

  const fullName = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const jobTitle = String(formData.get("job_title") ?? "").trim();
  const avatarRaw = String(formData.get("avatar_url") ?? "").trim();
  let avatarUrl = "";
  if (avatarRaw) {
    try { const parsed = new URL(avatarRaw); if (["https:", "http:"].includes(parsed.protocol)) avatarUrl = parsed.toString(); } catch {}
  }
  if (!fullName) redirect("/dashboard/profile?error=name");

  const { error } = await supabase.auth.updateUser({
    data: { ...user.user_metadata, full_name: fullName, phone, job_title: jobTitle, avatar_url: avatarUrl || null },
  });
  if (error) redirect("/dashboard/profile?error=save");

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/profile");
  redirect("/dashboard/profile?saved=1");
}

export async function saveDashboardSettings(formData: FormData) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");

  const allowedModules = ["digital_card", "requests", "crm_contacts", "analytics"];
  // Seuls les modules affichés (inclus dans la formule du client) sont modifiés ; les autres gardent leur état.
  const rendered = formData.getAll("rendered_module").map(String).filter((module) => allowedModules.includes(module));
  const previousHidden = (Array.isArray((user.user_metadata?.dashboard_preferences as { hidden_modules?: string[] } | undefined)?.hidden_modules)
    ? (user.user_metadata.dashboard_preferences as { hidden_modules: string[] }).hidden_modules : []).filter((module) => !rendered.includes(module));
  const hiddenModules = [...new Set([...previousHidden, ...rendered.filter((module) => formData.get(module) !== "on")])];
  const preferences = {
    hidden_modules: hiddenModules,
    notifications_enabled: formData.get("notifications_enabled") === "on",
    email_notifications: formData.get("email_notifications") === "on",
    browser_notifications: formData.get("browser_notifications") === "on",
  };

  const { error } = await supabase.auth.updateUser({
    data: { ...user.user_metadata, dashboard_preferences: preferences },
  });
  if (error) redirect("/dashboard/settings?error=save");

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");
  redirect("/dashboard/settings?saved=1");
}
