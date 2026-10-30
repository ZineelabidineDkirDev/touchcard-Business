import { notFound } from "next/navigation";
import { connection } from "next/server";

const sections: Record<string, { title: string; description: string; status: string }> = {
  cards: { title: "Cartes digitales", description: "Créez vos profils professionnels, personnalisez leur design et préparez vos liens NFC et QR.", status: "La gestion des cartes sera connectée à la base de données lors de la prochaine étape." },
  contacts: { title: "Contacts & prospects", description: "Centralisez les contacts, qualifiez les prospects et suivez vos opportunités.", status: "Le CRM et la capture de prospects seront activés après la mise en place du schéma sécurisé." },
  team: { title: "Équipe & collaborateurs", description: "Organisez votre entreprise, vos équipes et les accès de vos collaborateurs.", status: "La gestion multi-utilisateur dépend de la configuration des organisations et des rôles." },
  analytics: { title: "Statistiques", description: "Analysez les vues, scans NFC/QR, clics et conversions de vos cartes.", status: "Les indicateurs seront alimentés dès que le suivi des événements sera activé." },
  loyalty: { title: "Fidélité & récompenses", description: "Créez des programmes de points, récompenses et campagnes clients.", status: "Le portefeuille fidélité sera connecté au registre de points sécurisé." },
  settings: { title: "Paramètres", description: "Gérez votre profil, votre entreprise et vos préférences.", status: "Les paramètres d'organisation seront disponibles après la création de votre entreprise." },
};

export default async function DashboardSection({ params }: { params: Promise<{ section: string }> }) {
  await connection();
  const { section } = await params;
  const content = sections[section];
  if (!content) notFound();
  return (
    <div className="mx-auto max-w-5xl">
      <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">TouchCard Workspace</p>
      <h1 className="mt-2 text-3xl font-bold text-slate-950">{content.title}</h1>
      <p className="mt-3 max-w-2xl text-slate-500">{content.description}</p>
      <section className="mt-8 rounded-2xl border border-indigo-100 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-semibold text-indigo-700"><span className="h-2 w-2 rounded-full bg-indigo-500" /> Module en préparation</div>
        <p className="mt-3 text-sm leading-6 text-slate-600">{content.status}</p>
      </section>
    </div>
  );
}