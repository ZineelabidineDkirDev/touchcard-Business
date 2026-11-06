import Link from "next/link";

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-12">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50">
        <Link href="/" className="inline-flex items-center gap-3">
          <img src="/brand/touchcard-mark.svg" alt="" className="h-11 w-11 object-contain" />
          <span className="text-xl font-black tracking-tight text-slate-950">Touch<span className="text-indigo-600">Card</span><span className="ml-2 text-[9px] font-extrabold tracking-[.18em] text-indigo-600">BUSINESS</span></span>
        </Link>
        <p className="mt-8 text-sm font-semibold uppercase tracking-[.18em] text-indigo-600">Sécurité du compte</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Mot de passe oublié ?</h1>
        <p className="mt-3 leading-6 text-slate-600">Pour éviter les liens de réinitialisation qui n'arrivent pas par e-mail, la récupération est traitée par le Super Admin.</p>
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          Contactez l'équipe TouchCard en utilisant le numéro de téléphone indiqué dans votre demande et communiquez l'adresse e-mail de votre compte. Après vérification de votre identité, le Super Admin pourra générer un mot de passe provisoire et vous le transmettre par un canal direct. Vous devrez ensuite choisir un nouveau mot de passe dès votre prochaine connexion.
        </div>
        <Link href="/login" className="btn-primary mt-7 block w-full text-center">Retour à la connexion</Link>
      </section>
    </main>
  );
}
