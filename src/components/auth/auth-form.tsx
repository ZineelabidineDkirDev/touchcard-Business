"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { signIn, signUp, type AuthState } from "@/app/actions/auth";
import { useI18n } from "@/i18n/provider";

const initialState: AuthState = {};

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const { t } = useI18n();
  const action = mode === "login" ? signIn : signUp;
  const [state, formAction, pending] = useActionState(action, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="mt-8 space-y-5">
      {mode === "register" && <div>
        <label htmlFor="fullName" className="mb-2 block text-sm font-medium text-slate-700">{t("fullName")}</label>
        <input id="fullName" name="fullName" required autoComplete="name" className="field" placeholder={t("yourName")} />
      </div>}
      <div>
        <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">{t("email")}</label>
        <input id="email" name="email" type="email" required autoComplete="email" className="field" placeholder={t("emailPlaceholder")} />
      </div>
      <div>
        <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">{t("password")}</label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            minLength={8}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            className="field pr-12"
            placeholder={t("minPassword")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
            aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            aria-pressed={showPassword}
            title={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-slate-400 transition hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500"
          >
            {showPassword ? (
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.9 5.2A10.8 10.8 0 0112 5c5 0 8.5 4.2 9.5 7-.4 1.1-1.3 2.4-2.6 3.6M6.2 6.2C3.9 7.6 2.8 9.7 2.5 12c.7 2.1 3.5 6 9.5 6 1 0 1.9-.1 2.7-.4" />
              </svg>
            ) : (
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 12S6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7z" />
                <circle cx="12" cy="12" r="2.8" />
              </svg>
            )}
          </button>
        </div>
        {mode === "login" && (
          <div className="mt-2 text-right">
            <Link href="/forgot-password" className="text-sm font-semibold text-indigo-600 transition hover:text-indigo-800">
              Mot de passe oublié ?
            </Link>
          </div>
        )}
      </div>
      {state.error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p>}
      {state.success && <p role="status" className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{state.success}</p>}
      <button disabled={pending} className="btn-primary w-full">{pending ? t("wait") : mode === "login" ? t("login") : t("createAccount")}</button>
      <p className="text-center text-sm text-slate-500">
        {mode === "login" ? t("noAccount") : t("hasAccount")}{" "}
        <Link className="font-semibold text-indigo-600" href={mode === "login" ? "/demande" : "/login"}>
          {mode === "login" ? "Déposer une demande" : t("login")}
        </Link>
      </p>
    </form>
  );
}
