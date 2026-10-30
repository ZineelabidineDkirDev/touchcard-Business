import Link from "next/link";

const features = [
  { number: "01", title: "Cartes NFC & QR", text: "Partagez vos coordonnées en un geste et transformez chaque rencontre en opportunité." },
  { number: "02", title: "CRM intégré", text: "Collectez vos contacts, organisez vos prospects et gardez le fil de vos échanges." },
  { number: "03", title: "Analyses intelligentes", text: "Comprenez les scans, les vues et les interactions qui comptent vraiment." },
  { number: "04", title: "Fidélité client", text: "Animez votre communauté avec des points, des récompenses et des campagnes." },
];

export default function Home() {
  return (
    <main className="overflow-hidden bg-white text-slate-950">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-8">
        <Link href="/" className="text-2xl font-black tracking-tight">Touch<span className="text-indigo-600">Card</span><span className="ml-2 rounded-md bg-indigo-50 px-2 py-1 align-middle text-[9px] font-bold tracking-[.18em] text-indigo-700">BUSINESS</span></Link>
        <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex"><a href="#solutions">Solutions</a><a href="#fonctionnement">Comment ça marche</a><a href="#contact">Contact</a></nav>
        <div className="flex items-center gap-3"><Link href="/login" className="hidden text-sm font-semibold text-slate-700 hover:text-indigo-600 sm:inline">Connexion</Link><Link href="/register" className="btn-primary">Commencer</Link></div>
      </header>

      <section className="relative isolate border-y border-slate-100 bg-[#f8f9ff]">
        <div className="absolute -right-40 -top-48 -z-10 h-[36rem] w-[36rem] rounded-full bg-indigo-200/40 blur-3xl" />
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-6 py-20 lg:grid-cols-[1.1fr_.9fr] lg:px-8 lg:py-28">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[.16em] text-indigo-700"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Votre réseau, sans limites</p>
            <h1 className="mt-7 max-w-3xl text-5xl font-black leading-[1.06] tracking-tight sm:text-6xl lg:text-7xl">Votre carte de visite mérite <span className="text-indigo-600">plus qu’un papier.</span></h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-slate-600">La plateforme professionnelle qui réunit carte digitale, NFC, QR code, gestion des contacts et fidélisation client.</p>
            <div className="mt-9 flex flex-wrap gap-3"><Link href="/register" className="btn-primary px-6 py-4">Créer mon espace <span className="ml-2">→</span></Link><a href="#solutions" className="btn-secondary px-6 py-4">Découvrir la plateforme</a></div>
            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-slate-500"><span>✓ Sans application à installer</span><span>✓ NFC et QR code</span><span>✓ Pensé pour les équipes</span></div>
          </div>
          <div className="relative mx-auto w-full max-w-lg">
            <div className="absolute -inset-5 rounded-[2.5rem] bg-gradient-to-br from-indigo-200 to-violet-100 blur-2xl" />
            <div className="relative rounded-[2rem] border border-white/80 bg-slate-950 p-5 shadow-2xl shadow-indigo-900/20">
              <div className="flex items-center justify-between px-2 py-3 text-xs text-slate-400"><span>TOUCHCARD DIGITAL PROFILE</span><span className="rounded-full bg-emerald-400/10 px-3 py-1 text-emerald-300">● En ligne</span></div>
              <div className="rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-slate-900 p-7 text-white">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-2xl font-black">TC</div>
                <p className="mt-8 text-2xl font-bold">Votre nom ici</p><p className="mt-1 text-sm text-indigo-100">Fondateur · Votre entreprise</p>
                <div className="mt-7 grid grid-cols-2 gap-3">{["✉ E-mail professionnel","↗ Site internet","☎ Téléphone","in Réseaux sociaux"].map((label)=><div key={label} className="rounded-xl border border-white/15 bg-white/10 p-3 text-xs">{label}</div>)}</div>
              </div>
              <div className="mt-4 flex items-center justify-between rounded-2xl bg-white p-4"><div><p className="text-xs font-bold text-slate-900">Partager mon profil</p><p className="mt-1 text-[11px] text-slate-500">Un scan. Une connexion.</p></div><div className="grid h-14 w-14 grid-cols-4 gap-1 rounded-lg border border-slate-200 p-2">{Array.from({length:16},(_,i)=><span key={i} className={"rounded-[2px] " + ([0,1,3,4,6,9,10,12,14,15].includes(i) ? "bg-slate-900" : "bg-slate-200")} />)}</div></div>
            </div>
          </div>
        </div>
      </section>

      <section id="solutions" className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
        <div className="max-w-2xl"><p className="text-sm font-bold uppercase tracking-[.18em] text-indigo-600">Une plateforme complète</p><h2 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">Tout votre réseau professionnel. <span className="text-slate-400">Au même endroit.</span></h2><p className="mt-5 leading-7 text-slate-600">TouchCard transforme votre carte de visite en un véritable outil de développement commercial.</p></div>
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{features.map((feature)=><article key={feature.number} className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-900/5"><p className="text-sm font-black text-indigo-600">{feature.number}</p><h3 className="mt-8 text-xl font-bold">{feature.title}</h3><p className="mt-3 text-sm leading-6 text-slate-500">{feature.text}</p></article>)}</div>
      </section>

      <section id="fonctionnement" className="bg-slate-950 py-24 text-white"><div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-2 lg:px-8"><div><p className="text-sm font-bold uppercase tracking-[.18em] text-indigo-300">Simple à adopter</p><h2 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">Du premier scan à la relation durable.</h2><p className="mt-6 max-w-lg leading-7 text-slate-400">Créez votre profil, partagez-le avec votre NFC ou votre QR code, puis suivez vos interactions depuis votre espace.</p></div><div className="grid gap-4 sm:grid-cols-3">{[["01","Créez","Personnalisez votre carte."],["02","Partagez","NFC, QR code ou lien."],["03","Développez","Suivez et fidélisez."]].map(([n,t,d])=><div key={n} className="rounded-2xl border border-white/10 bg-white/5 p-5"><p className="text-sm font-bold text-indigo-300">{n}</p><h3 className="mt-8 text-xl font-bold">{t}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{d}</p></div>)}</div></div></section>

      <section id="contact" className="mx-auto max-w-7xl px-6 py-24 text-center lg:px-8"><p className="text-sm font-bold uppercase tracking-[.18em] text-indigo-600">Prêt à passer au digital ?</p><h2 className="mx-auto mt-4 max-w-2xl text-4xl font-black tracking-tight sm:text-5xl">Faites de chaque rencontre une opportunité.</h2><p className="mx-auto mt-5 max-w-xl text-slate-500">Lancez votre espace TouchCard et préparez votre première carte digitale.</p><Link href="/register" className="btn-primary mt-8 px-7 py-4">Créer mon compte gratuitement →</Link></section>
      <footer className="border-t border-slate-100 px-6 py-8 text-center text-xs text-slate-400">© 2026 TouchCard Business. Tous droits réservés.</footer>
    </main>
  );
}