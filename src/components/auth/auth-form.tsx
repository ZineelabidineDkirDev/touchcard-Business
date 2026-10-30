"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signIn, signUp, type AuthState } from "@/app/actions/auth";

const initialState: AuthState = {};

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const action = mode === "login" ? signIn : signUp;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="mt-8 space-y-5">
      {mode === "register" && <div>
        <label htmlFor="fullName" className="mb-2 block text-sm font-medium text-slate-700">Nom complet</label>
        <input id="fullName" name="fullName" required autoComplete="name" className="field" placeholder="Votre nom" />
      </div>}
      <div>
        <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">Adresse e-mail</label>
        <input id="email" name="email" type="email" required autoComplete="email" className="field" placeholder="vous@entreprise.com" />
      </div>
      <div>
        <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">Mot de passe</label>
        <input id="password" name="password" type="password" required minLength={8} autoComplete={mode === "login" ? "current-password" : "new-password"} className="field" placeholder="8 caractères minimum" />
      </div>
      {state.error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p>}
      <button disabled={pending} className="btn-primary w-full">{pending ? "Patientez..." : mode === "login" ? "Se connecter" : "Créer mon compte"}</button>
      <p className="text-center text-sm text-slate-500">
        {mode === "login" ? "Vous n’avez pas encore de compte ?" : "Vous avez déjà un compte ?"}{" "}
        <Link className="font-semibold text-indigo-600" href={mode === "login" ? "/register" : "/login"}>
          {mode === "login" ? "Créer un compte" : "Se connecter"}
        </Link>
      </p>
    </form>
  );
}