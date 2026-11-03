import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { LandingPage } from "@/components/landing/landing-page";

export default async function Home() {
  // Session cookies are request-specific; opt out of static prerendering
  // for this page before reading the authenticated Supabase user.
  await connection();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userName = user
    ? String(user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "").trim()
    : "";

  return <LandingPage userName={userName || null} />;
}
