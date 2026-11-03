import { createClient } from "@/lib/supabase/server";
import { LandingPage } from "@/components/landing/landing-page";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userName = user
    ? String(user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "").trim()
    : "";

  return <LandingPage userName={userName || null} />;
}
