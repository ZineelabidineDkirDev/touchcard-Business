"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signIn, signUp, type AuthState } from "@/app/actions/auth";
import { useI18n } from "@/i18n/provider";

const initialState: AuthState = {};

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const { t } = useI18n();
  const action = mode === "login" ? signIn : signUp;
  const [state, formAction, pending] = useActionState(action, initialState);

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
        <input id="password" name="password" type="password" required minLength={8} autoComplete={mode === "login" ? "current-password" : "new-password"} className="field" placeholder={t("minPassword")} />
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
