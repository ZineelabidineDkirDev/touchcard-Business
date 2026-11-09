"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateWorkspaceRequestStatus(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const status = String(formData.get("status") ?? "");
  const allowed = ["pending", "confirmed", "in_progress", "completed", "rejected", "cancelled"];
  if (!id || !allowed.includes(status)) return;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { data: membership } = await supabase.from("organization_members")
    .select("organization_id").eq("user_id", user.id).limit(1).maybeSingle();
  if (!membership?.organization_id) return;

  const { error } = await supabase.from("workspace_requests").update({
    status,
    updated_at: new Date().toISOString(),
  }).eq("id", id).eq("organization_id", membership.organization_id);
  if (error) {
    console.error("Workspace request status update failed", error);
    return;
  }
  revalidatePath("/dashboard/requests");
  revalidatePath("/dashboard");
}
