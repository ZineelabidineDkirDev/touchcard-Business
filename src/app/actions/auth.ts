"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string; success?: string };

function getSafeAuthError(error: unknown): string {
  const message = error instanceof Error ? error.message : "";

  if (message.includes("Variables Supabase manquantes")) {
    return "La connexion à Supabase n'est pas configurée correctement. Vérifiez les variables d'environnement du projet.";
  }

  if (/fetch failed|failed to fetch|network/i.test(message)) {
    return "Impossible de joindre le service d'inscription. Vérifiez la connexion et réessayez.";
  }

  return "Une erreur technique a empêché l'inscription. Réessayez dans quelques instants.";
}

export async function signIn(_state: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Renseignez votre e-mail et votre mot de passe." };

  let supabase;
  try {
    supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return { error: "Connexion impossible. Vérifiez vos identifiants et confirmez votre adresse e-mail si nécessaire." };
    }
  } catch (error) {
    return { error: getSafeAuthError(error) };
  }

  redirect("/dashboard");
}

export async function signUp(_state: AuthState, formData: FormData): Promise<AuthState> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!fullName || !email || password.length < 8) {
    return { error: "Complétez les champs. Le mot de passe doit contenir au moins 8 caractères." };
  }

  let data;
  try {
    const supabase = await createClient();
    const result = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (result.error) {
      if (result.error.message.toLowerCase().includes("already registered")) {
        return { error: "Cette adresse e-mail possède déjà un compte. Connectez-vous plutôt." };
      }
      return { error: "Inscription impossible. Vérifiez les informations saisies ou réessayez plus tard." };
    }
    data = result.data;
  } catch (error) {
    return { error: getSafeAuthError(error) };
  }

  // Avec la confirmation e-mail désactivée, Supabase renvoie une session :
  // l'utilisateur entre directement dans son dashboard.
  if (data.session) redirect("/dashboard");

  // Si la confirmation est activée dans Supabase, on ne contourne pas cette sécurité.
  return { success: "Compte créé. Consultez votre boîte e-mail pour confirmer l'adresse, puis connectez-vous." };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function sendMagicLink(_state: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email || !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) {
    return { error: "Saisissez une adresse e-mail valide." };
  }

  try {
    const supabase = await createClient();
    const origin = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL;
    if (!origin) return { error: "L'adresse du site n'est pas configurée." };
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${origin}/auth/callback?next=/dashboard`, shouldCreateUser: false },
    });
    if (error) return { error: "Impossible d'envoyer le lien. Vérifiez l'adresse e-mail et réessayez." };
    return { success: "Lien de connexion envoyé. Consultez votre boîte e-mail." };
  } catch (error) {
    return { error: getSafeAuthError(error) };
  }
}
