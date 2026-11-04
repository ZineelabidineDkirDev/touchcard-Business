import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { LandingPage } from "@/components/landing/landing-page";

// The landing page reads the current Supabase session, so it must be
// rendered per request instead of being prerendered as an instant page.
export const instant = false;

export default async function Home() {
  await connection();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userName = user
    ? String(user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "").trim()
    : "";

  return <LandingPage userName={userName || null} />;
}
