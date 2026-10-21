# ARCHIVA UBA

Système de gestion et d'archivage des opérations d'archives UBA (Congo).
Application React 18 + TypeScript + Vite, fonctions serverless Vercel (`/api`) et base de données Supabase Postgres avec RLS.

## Développement Local

* **Interface uniquement (Vite)** :
  ```bash
  npm run dev
  ```
  > ⚠️ **Note importante** : `npm run dev` ne sert **pas** le dossier `/api` (fonctions serverless Vercel). Les appels `/api/admin/users`, `/api/health`, etc. échoueront.

* **Environnement complet (avec API serverless)** :
  ```bash
  npm run dev:full
  # ou directement :
  vercel dev
  ```
  Permet de tester l'ensemble de l'application, notamment la gestion des utilisateurs, les diagnostics serveur et les fonctions d'administration.

## Configuration des Variables d'Environnement (Vercel)

| Variable | Environnements | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | Production, Preview, Dev | URL publique du projet Supabase |
| `VITE_SUPABASE_ANON_KEY` | Production, Preview, Dev | Clé publique anonyme Supabase |
| `SUPABASE_URL` | Production, Preview, Dev | URL du projet Supabase pour les fonctions `/api` |
| `SUPABASE_SERVICE_ROLE_KEY` | Production, Preview, Dev (Sensitive) | Clé de service Supabase (secrète serveur, jamais préfixée VITE_) |
| `ALLOWED_ORIGINS` | Production, Preview, Dev | Domaines autorisés séparés par des virgules (ex: `https://archiva-uba.vercel.app,http://localhost:5173`) |
| `SUPABASE_PROD_URL` | Production, Preview, Dev | URL du projet Supabase de production (garde-fou) |

Vérification du statut serveur en production :
```bash
curl -s https://<votre-domaine>/api/health
```
