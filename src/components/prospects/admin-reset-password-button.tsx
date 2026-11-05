"use client";

import { useState, useTransition } from "react";
import { resetProspectClientPassword } from "@/app/actions/prospects";

export function AdminResetPasswordButton({ requestId }: { requestId: string }) {
  const [busy, startTransition] = useTransition();
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  function reset() {
    if (!window.confirm("Générer un nouveau mot de passe provisoire ? L'ancien mot de passe cessera immédiatement de fonctionner et l'accès client sera reverrouillé.")) return;
    setError("");
    setTemporaryPassword("");
    setCopied(false);
    startTransition(async () => {
      const result = await resetProspectClientPassword(requestId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setTemporaryPassword(result.temporaryPassword);
    });
  }

  async function copyPassword() {
    if (!temporaryPassword) return;
    try {
      await navigator.clipboard.writeText(temporaryPassword);
      setCopied(true);
    } catch {
      setError("La copie automatique a échoué. Sélectionnez le mot de passe pour le copier.");
    }
  }

  return (
    <div className="space-y-2">
      <button type="button" onClick={reset} disabled={busy} className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-bold text-amber-800 hover:bg-amber-100 disabled:opacity-50">
        {busy ? "Génération..." : "Réinitialiser le mot de passe"}
      </button>
      {error && <p role="alert" className="max-w-sm rounded-lg bg-rose-50 p-3 text-xs text-rose-700">{error}</p>}
      {temporaryPassword && (
        <div className="max-w-md rounded-xl border border-amber-200 bg-amber-50 p-3">
          <p className="text-xs font-bold text-amber-900">Mot de passe provisoire — affiché une seule fois</p>
          <code className="mt-2 block break-all rounded-lg bg-white p-3 text-sm font-bold text-slate-900">{temporaryPassword}</code>
          <button type="button" onClick={copyPassword} className="mt-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white">{copied ? "Copié ✓" : "Copier le mot de passe"}</button>
          <p className="mt-2 text-xs leading-5 text-amber-900">Vérifiez l'identité du client par téléphone avant de lui communiquer ce mot de passe. Il devra en choisir un nouveau à sa prochaine connexion.</p>
        </div>
      )}
    </div>
  );
}
