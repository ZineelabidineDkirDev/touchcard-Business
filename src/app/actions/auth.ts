"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string; success?: string };

function getSafeAuthError(error: unknown): string {
  const message = error instanceof Error ? error.message : "";

  if (message.includes("Variables Supabase manquantes")) {
    return "La connexion à Supabase n'est pas configurée correctement. Vérifiez les variables d'environnement du projet.";
  }

  if (/fetch failed|failed to fetch|network/i.test(message)) {
    return "Impossible de joindre le service. Vérifiez la connexion et réessayez.";
  }

  return "Une erreur technique est survenue. Réessayez dans quelques instants.";
}

async function getAppOrigin() {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (configuredUrl) return configuredUrl.replace(/\/$/, "");

  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  if (!host) return null;

  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}

export async function signIn(_state: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Renseignez votre e-mail et votre mot de passe." };

  try {
    const supabase = await createClient();
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

  if (data.session) redirect("/dashboard");
  return { success: "Compte créé. Consultez votre boîte e-mail pour confirmer l'adresse, puis connectez-vous." };
}

export async function requestPasswordReset(_state: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) return { error: "Saisissez votre adresse e-mail." };

  const origin = await getAppOrigin();
  if (!origin) return { error: "Impossible de déterminer l'adresse du site. Réessayez depuis la page de connexion." };

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/callback?next=/reset-password/update`,
    });
    if (error) return { error: "L'envoi du lien a échoué. Vérifiez la configuration e-mail Supabase et réessayez." };
  } catch (error) {
    return { error: getSafeAuthError(error) };
  }

  // Même réponse que le compte existe ou non : ne pas révéler les adresses enregistrées.
  return { success: "Si un compte correspond à cette adresse, un lien de réinitialisation vient d'être envoyé. Vérifiez votre boîte e-mail et vos courriers indésirables." };
}

export async function updatePassword(_state: AuthState, formData: FormData): Promise<AuthState> {
  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");
  if (password.length < 8) return { error: "Le nouveau mot de passe doit contenir au moins 8 caractères." };
  if (password !== confirmation) return { error: "Les deux mots de passe ne correspondent pas." };

  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { error: "Votre lien est invalide ou a expiré. Demandez un nouveau lien de réinitialisation." };
    }

    const { error } = await supabase.auth.updateUser({ password });
    if (error) return { error: "Le changement de mot de passe a échoué. Demandez un nouveau lien et réessayez." };
  } catch (error) {
    return { error: getSafeAuthError(error) };
  }

  redirect("/login?password_updated=1");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
