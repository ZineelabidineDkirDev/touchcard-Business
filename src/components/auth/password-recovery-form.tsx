"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordReset, updatePassword, type AuthState } from "@/app/actions/auth";

const initialState: AuthState = {};

export function PasswordRecoveryForm({ mode }: { mode: "request" | "update" | "setup" }) {
  const action = mode === "request" ? requestPasswordReset : updatePassword;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="mt-8 space-y-5">\n      {mode === "setup" && <input type="hidden" name="clientSetup" value="1" />}
      {mode === "request" ? (
        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">Adresse e-mail</label>
          <input id="email" name="email" type="email" required autoComplete="email" className="field" placeholder="vous@entreprise.com" />
        </div>
      ) : (
        <>
          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">Nouveau mot de passe</label>
            <input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" className="field" placeholder="8 caractères minimum" />
          </div>
          <div>
            <label htmlFor="confirmation" className="mb-2 block text-sm font-medium text-slate-700">Confirmer le mot de passe</label>
            <input id="confirmation" name="confirmation" type="password" required minLength={8} autoComplete="new-password" className="field" placeholder="Répétez le nouveau mot de passe" />
          </div>
        </>
      )}
      {state.error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p>}
      {state.success && <p role="status" className="rounded-xl bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-700">{state.success}</p>}
      <button disabled={pending} className="btn-primary w-full">
        {pending ? "Patientez..." : mode === "request" ? "Envoyer le lien de réinitialisation" : mode === "setup" ? "Définir mon mot de passe et continuer" : "Enregistrer le nouveau mot de passe"}
      </button>
      <p className="text-center text-sm text-slate-500">
        <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-800">Retour à la connexion</Link>
      </p>
    </form>
  );
}
