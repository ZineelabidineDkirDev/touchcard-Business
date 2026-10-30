# TouchCard Business

Plateforme SaaS de cartes de visite digitales, NFC/QR, CRM et fidélisation.

## Stack
- Next.js App Router + TypeScript + Tailwind CSS
- Supabase Auth, PostgreSQL et Row Level Security
- Déploiement prévu sur Vercel

## Démarrage local
1. Cloner le dépôt et se placer sur `main`.
2. Installer les dépendances : `npm install`.
3. Copier `.env.example` vers `.env.local`.
4. Renseigner l'URL Supabase et la clé publishable du projet TouchCard.
5. Démarrer : `npm run dev`.
6. Vérifier la compilation : `npm run build`.

## Base de données
Appliquer `supabase/migrations/202610300001_touchcard_core.sql` au projet Supabase **SmartCard-Business**. Ne jamais exécuter cette migration sur le projet Supabase de SchoolPlans.

## Routes
- `/` : site de présentation
- `/register` : création de compte
- `/login` : connexion Supabase
- `/dashboard` : espace protégé
- `/dashboard/cards`, `/contacts`, `/team`, `/analytics`, `/loyalty`, `/settings` : modules en cours de construction
- `/p/[slug]` : profil public d'une carte publiée

## Sécurité et limites de cette première base
- Les pages privées vérifient la session côté serveur.
- Les tables métier sont isolées par organisation avec RLS.
- La clé service-role ne doit jamais être utilisée dans le navigateur ni commitée.
- Le suivi public d'événements devra être protégé contre les abus (Edge Function / limitation de débit) avant mise en production.
- Les opérations de points de fidélité devront passer par des RPC transactionnelles.
- Paiements, facturation, campagnes WhatsApp, avis Google et boutique seront intégrés dans des étapes distinctes après validation de cette fondation.

Les chiffres du tableau de bord sont volontairement des espaces réservés tant que les modules de données correspondants ne sont pas implémentés.
