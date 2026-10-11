# 📁 ARCHIVA — Plan de construction du logiciel de gestion d'archives et de rapports UBA

> **Nom de travail :** `ARCHIVA` (à renommer librement : *UBA Archives Manager*, *Sentinelle Archives*…)
> **Auteur du besoin :** Kali — Équipe Archiviste UBA (Maya-Maya / Mazala)
> **Base d'analyse :** les 9 fichiers du dossier `uba-rapport.zip` + la structure en 6 documents (PRD, TRD, App Flow, UI/UX, Backend Schema, Implementation Plan)
> **Stack recommandée :** React + Vite + TypeScript + Supabase + Vercel (celle que tu maîtrises déjà)

---

## 0. Ce que j'ai analysé et extrait

### 0.1 Inventaire des fichiers

| # | Fichier | Nature | Ce qu'il m'apprend |
|---|---------|--------|--------------------|
| 1 | `Modele_Rapport_Journalier_UBA_Vierge.docx` | **Modèle vierge** | La structure officielle : 9 sections, champs « À remplir ». C'est le **contrat de données** du logiciel. |
| 2 | `Rapport_Equipe_Archiviste_UBA_28-09-2026-1.pdf` | Rapport journalier (v1) | Version brouillon : noms mal orthographiés, groupe 4 incomplet, après-midi « à compléter ». |
| 3 | `Rapport_Equipe_Archiviste_UBA_28-09-2026.pdf` | Rapport journalier (v2) | Version corrigée : chef = Thony Obaki, bloc « Travail sur ordinateur ». Prouve qu'**un rapport a plusieurs versions**. |
| 4 | `Rapport_Journalier_UBA_05-06-10-2026.docx` / `-26.docx` / `.pdf` | Rapport journalier 05→06/10 | Rapport sur **2 jours**, 3 agences, réception Mazala, écarts détectés. |
| 5 | `Rapport_Journalier_UBA_07-08_10_2026.docx` | Rapport journalier 07→08/10 | Rapport **partiellement rempli** (champs vides) : le logiciel doit gérer les brouillons. |
| 6 | `Rapport_Archives_UBA_28-09_09-10_CHEF_EQUIPE_confidentiel_rouge.pdf` | **Synthèse 2 semaines (chef)** | Suivi jour/agence, matrice agence × année (T/A/O), chiffre global, points à confirmer. Confidentiel. |
| 7 | `Rapport_Archives_UBA_28-09_09-10_EQUIPE_stagiaires_rouge.pdf` | **Synthèse 2 semaines (équipe)** | Même données, **version allégée** (sans la matrice ni les points sensibles). |
| 8 | `Capture_d_écran…png` | Schéma de méthode | Les **6 documents** d'un projet logiciel : PRD, TRD, AppFlow, UI/UX Design, Backend Schema, Implementation Plan → structure de ce plan. |

### 0.2 Les types de rapports que le logiciel doit produire

| Type | Période | Public | Pages | Source |
|------|---------|--------|-------|--------|
| **R1 — Rapport journalier d'activité** | 1 jour (ou 2 jours consécutifs) | Chef d'équipe, hiérarchie UBA | 3 | Modèle vierge |
| **R2 — Rapport de synthèse des archives (Chef)** | N jours ouvrés | Chef d'équipe, **confidentiel** | 3+ | PDF synthèse chef |
| **R3 — Rapport de synthèse des archives (Équipe)** | N jours ouvrés | Stagiaires | 2 | PDF synthèse équipe |
| **R4 — Rapport d'activité 1 page** | Libre | Direction | 1 | Mentionné dans ton historique |
| **R5 — Fiche agence** *(à ajouter)* | Cumul | Chef | 1 | Nouveau |
| **R6 — Rapport de présence / effectif** *(à ajouter)* | Période | RH / Chef | 1-2 | Nouveau |

### 0.3 Les données métier extraites (le « vocabulaire » du logiciel)

**Lieux / sites**
- **Maya-Maya** : site principal de travail de l'équipe.
- **Mazala** : site de stockage/tri ; une partie de l'équipe y est affectée (2 personnes) ; on lui **transfère** des agences et on en **reçoit** des cartons.

**Agences et codes (extraits des rapports)**

| Agence | Code | Remarque |
|--------|------|----------|
| City-Center (City Center) | **901** | Orthographe variable |
| Poto-Poto | **902** | |
| Bacongo (Bakongo) | **904** | Orthographe variable : *Bakongo / Bacongo* |
| Moungali | **907** | |
| Maya-Maya (agence) | *à confirmer* | Apparaît en 2021 |
| Plateau-Ville | *à confirmer* | Apparaît en attente 2024 |

**Unités de comptage** (⚠️ source d'ambiguïté dans tes rapports) : *conventions*, *boîtes / cartons*, *dossiers*. Le logiciel doit **typer l'unité** et ne jamais les additionner entre elles.

**Statuts d'un lot** (agence × année) : `Transmis/traité (T)`, `En attente (A)`, `Oublié probable (O)`, `Trié`, `Mis de côté`, `Dans les cartons oubliés`, `Reçu complet / à confirmer`.

**Exercices** : années comptables 2011 → 2025 (ex. 2015, 2016, 2017, 2018, 2019, 2021…).

**Personnes & rôles** : Chef d'équipe des archives, Superviseurs du jour (2 par jour), Stagiaires (**anciens** / **nouveaux**), affectés Mazala, travail sur ordinateur. Effectif : 19 (14 anciens + 5 nouveaux).

**Structure d'équipe** : Groupe 1 à 4, groupe Mazala, groupe Travail sur ordinateur.

**Tâches types** : Purification de l'espace de travail, Comptage (checking), Descente des boîtes, Transfert vers Mazala, Réception, Rapatriement des cartons, Reclassement, « Tchéké », Envoi à Mazala, Retour de cartons.

**Absences** : justifiée / non justifiée / raison (ex. santé).

### 0.4 🔍 Incohérences trouvées dans tes rapports (ce que le logiciel doit empêcher)

| # | Incohérence observée | Règle de validation à coder |
|---|----------------------|------------------------------|
| 1 | Rapport 05-06/10 : total annoncé **5 813** vs somme par agence **5 613** (1 322 + 741 + 3 550) | `total_déclaré = Σ lignes` sinon alerte bloquante |
| 2 | Même rapport : tâche n°5 = **85 boîtes** reçues vs section Mazala « **plus de 104** » | Une valeur unique saisie une fois, réutilisée partout |
| 3 | Rapport 28/09 : Poto-Poto **1 558** / City Center **3 683** vs synthèse chef **1 548** / **3 656** (+ 7 sans agence) | Source de vérité unique + historique des corrections |
| 4 | Rapport 28/09 : total 5 241 ; Poto-Poto 902 « 902 » dans un texte vs code agence 902 | Séparer **code** et **quantité** dans la saisie |
| 5 | Noms : *Thony Obaki / Monsieur Tony*, *Fredich / Freddy / Friedrich / Fred*, *Duskane / Duschane*, *Richi / Richy*, *Bakongo / Bacongo* | Table `personnes` avec **alias** (fusion des doublons) |
| 6 | Rapport 07-08/10 : champs vides (horaires, chef, agences, conventions, groupes) | Statut « brouillon » + taux de complétude |
| 7 | Synthèse : « 7 dossiers sans agence » le 28/09 | Champ agence **obligatoire** ou file « à rattacher » |
| 8 | 5 jours sans relevé (29/09, 30/09, 01/10, 02/10, 09/10) | Calendrier : jour ouvré **sans rapport** = alerte |
| 9 | Années « oubliées » (déjà transmises mais encore dans la liste d'attente) | Moteur de **réconciliation** lot par lot |
| 10 | Rapport sur 2 jours (`05→06/10`) | Un rapport = une **période** (début, fin), pas une date unique |

---

# 📘 DOCUMENT 01 — PRD (Product Requirements Document)

## 1.1 Vision

> **Remplacer la saisie manuelle dans Word et la compilation à la main des PDF par une application web unique où l'on saisit une seule fois les faits du terrain (présences, tâches, transferts, réceptions) et où tous les rapports officiels UBA sont générés automatiquement, cohérents, chiffrés et imprimables dans le design rouge/blanc UBA.**

## 1.2 Problèmes à résoudre

1. Les mêmes chiffres sont **ressaisis** dans plusieurs rapports → erreurs (cf. §0.4).
2. Les synthèses (2 semaines) demandent des **heures** de recompilation manuelle.
3. Impossible de **savoir en un clic** ce qui est transmis / en attente / oublié par agence et par année.
4. Les rapports successifs **ne se parlent pas** (pas de cumul fiable).
5. Deux publics (chef vs stagiaires) = deux documents à refaire à la main.
6. Pas de **traçabilité** (qui a corrigé quoi, quand).

## 1.3 Utilisateurs (personas)

| Persona | Rôle | Besoins clés | Droits |
|---------|------|--------------|--------|
| **Kali (rédacteur / coach)** | Rédige les rapports | Saisie rapide, génération PDF/Word, corrections | Éditeur + Admin |
| **Thony Obaki (Chef d'équipe)** | Valide et diffuse | Vue d'ensemble, alertes, rapport confidentiel, signature | Validateur |
| **Superviseur du jour** | Saisit le terrain | Pointage, tâches, comptage depuis téléphone | Saisie jour |
| **Stagiaire** | Consulte | Voir sa répartition, la synthèse « équipe » | Lecture limitée |
| **Direction UBA** *(optionnel)* | Lit | Rapport 1 page, tableau de bord | Lecture |

## 1.4 Périmètre fonctionnel — modules

### Modules MVP (indispensables)
| Code | Module | Description |
|------|--------|-------------|
| **M1** | Authentification & rôles | Connexion, rôles (Admin, Chef, Superviseur, Stagiaire, Lecteur) |
| **M2** | Référentiels | Agences (codes), personnes (+alias), groupes, types de tâches, exercices, sites |
| **M3** | Rapport journalier | Formulaire guidé en 9 sections = modèle Word |
| **M4** | Mouvements d'archives | Transferts vers Mazala, réceptions de Mazala, cartons, conventions |
| **M5** | Moteur de validation | Détection des écarts (§0.4) avant validation |
| **M6** | Génération de rapports | PDF (design UBA), Word (.docx), impression directe |
| **M7** | Synthèse période | Suivi jour par jour, par agence, cumuls, chiffre global |
| **M8** | Matrice agence × année | Statuts T / A / O, réconciliation, « oubliés » |

### Modules V2 (riches)
| Code | Module | Description |
|------|--------|-------------|
| **M9** | Tableau de bord | KPI, courbes de productivité, avancement par agence |
| **M10** | Présences & effectif | Pointage, absences justifiées, taux de présence, historique par personne |
| **M11** | Gestion des groupes | Composition automatique, rotation, équité des tâches |
| **M12** | Gestion des tâches | Planification, assignation, chronologie de la journée |
| **M13** | Inventaire cartons | Fiche carton (agence, exercice, état, emplacement), QR code |
| **M14** | Incidents & observations | Cartons abîmés, lots manquants, suivi jusqu'à résolution |
| **M15** | Import de données | Import Word/PDF/Excel/CSV des anciens rapports |
| **M16** | Notifications | Rappel « rapport du jour non saisi », alertes d'écart |
| **M17** | Historique & audit | Versions, qui a modifié quoi, restauration |
| **M18** | Signature & validation | Circuit brouillon → relu → validé → diffusé, signature du chef |
| **M19** | Paramétrage des modèles | L'admin personnalise logo, couleurs, sections, mentions |
| **M20** | Export & sauvegarde | Excel, CSV, sauvegarde complète, archivage annuel |

### Modules V3 (ambitieux)
- Mode **hors-ligne** (PWA) pour saisie sur le terrain sans réseau.
- Scan de feuilles manuscrites (OCR) → pré-remplissage.
- Assistant IA : *« rédige le résumé de la semaine »*, détection d'anomalies, questions en langage naturel (*« combien de dossiers 2019 à Bacongo ? »*).
- Application mobile installable, scan QR des cartons.
- Multi-équipes / multi-sites (extension à d'autres équipes UBA).

## 1.5 Exigences non fonctionnelles

| Domaine | Exigence |
|---------|----------|
| **Performance** | Génération d'un PDF < 5 s, tableaux de bord < 2 s |
| **Disponibilité** | Accessible 24h/24 (Vercel + Supabase) |
| **Connexion faible** | Brouillon enregistré automatiquement toutes les 10 s (localStorage + serveur) |
| **Sécurité** | Données confidentielles → RLS, audit, HTTPS, sauvegardes quotidiennes |
| **Langue** | Français (formats `1 234`, `dd/mm/yyyy`, fuseau Africa/Brazzaville) |
| **Impression** | A4 portrait, marges 15 mm, pagination « Page X / Y », zéro coupure de tableau |
| **Accessibilité** | Contraste AA, taille tactile ≥ 44 px, navigation clavier |
| **Fiabilité** | Aucun rapport validé modifiable sans création d'une nouvelle version |

## 1.6 Indicateurs de réussite (KPI)

- Temps de production d'un rapport journalier : **de ~45 min à < 10 min**.
- Temps de production d'une synthèse 2 semaines : **de plusieurs heures à < 1 min**.
- Incohérences de chiffres dans un rapport validé : **0**.
- 100 % des jours ouvrés couverts par un rapport.

## 1.7 Hors périmètre (pour l'instant)
Gestion comptable des conventions elles-mêmes, contenu juridique des conventions, paie des stagiaires.

---

# 📗 DOCUMENT 02 — TRD (Technical Requirements Document)

## 2.1 Architecture globale

```
┌──────────────────────────── NAVIGATEUR / MOBILE (PWA) ────────────────────────────┐
│  React 18 + Vite + TypeScript                                                     │
│  ├─ UI : Tailwind CSS + shadcn/ui (thème UBA)                                     │
│  ├─ État serveur : TanStack Query    ├─ Formulaires : React Hook Form + Zod       │
│  ├─ Routage : React Router           ├─ Graphiques : Recharts                     │
│  └─ Rendu PDF : @react-pdf/renderer  └─ Export Word : docx (lib)                  │
└───────────────────────────────────────┬───────────────────────────────────────────┘
                                        │ HTTPS (supabase-js)
┌───────────────────────────────────────▼───────────────────────────────────────────┐
│  SUPABASE                                                                         │
│  ├─ Auth (email + mot de passe, rôles via table profiles)                         │
│  ├─ PostgreSQL (tables, vues, fonctions SQL, triggers, RLS)                       │
│  ├─ Storage (logo, PDF générés, pièces jointes, photos de relevés)                │
│  ├─ Edge Functions (génération PDF lourde, import, envoi mail, IA)                │
│  └─ Realtime (alertes, présence multi-utilisateurs)                               │
└───────────────────────────────────────┬───────────────────────────────────────────┘
                                        │
                          VERCEL (hébergement, CI/CD depuis GitHub)
```

## 2.2 Choix technologiques et justification

| Besoin | Choix | Pourquoi |
|--------|-------|----------|
| Front | React + Vite + TS | Ta stack habituelle, typage fort pour des données chiffrées |
| UI | Tailwind + shadcn/ui | Rapide, thémable en rouge UBA |
| Base | Supabase Postgres | Relationnel (agences × années × jours), vues SQL pour les cumuls |
| Auth/droits | Supabase Auth + RLS | Sécurité au niveau des lignes (le stagiaire ne voit pas le confidentiel) |
| PDF | `@react-pdf/renderer` | Le **même composant React** sert l'aperçu écran et le PDF, design maîtrisé |
| Word | lib `docx` | Génération .docx fidèle au modèle UBA |
| Impression | CSS `@media print` + PDF | Double voie : impression directe ou PDF |
| Calculs | Vues/fonctions SQL | Les totaux ne sont **jamais** calculés à la main côté UI |
| Déploiement | Vercel | Déploiement automatique, domaine personnalisé |

## 2.3 Principes d'architecture (règles d'or)

1. **Saisir une fois, afficher partout** : un fait = une ligne en base ; tous les rapports sont des **vues** de ces faits.
2. **Les totaux sont calculés par la base**, jamais saisis (sauf « total déclaré » pour comparer et détecter l'écart).
3. **Un rapport validé est figé** (snapshot JSON + PDF archivé). Toute correction = nouvelle version.
4. **Le moteur de rapport est séparé des données** : `données → ReportModel (JSON) → gabarit (PDF / DOCX / écran)`.
5. **Un gabarit = un composant** : ajouter un nouveau type de rapport = ajouter un fichier, pas réécrire l'app.

## 2.4 Architecture du moteur de rapports (cœur du projet)

```
 Données brutes (Postgres)
        │  fonctions SQL / vues  (v_synthese_jour, v_matrice_agence_annee…)
        ▼
 ReportModel (JSON typé, Zod)   ← contient déjà tous les totaux, alertes, textes
        │
        ├──► Gabarit R1  Journalier ─────┐
        ├──► Gabarit R2  Synthèse Chef ──┤    ┌─► Aperçu écran (React)
        ├──► Gabarit R3  Synthèse Équipe ┼──► │─► PDF  (@react-pdf)
        ├──► Gabarit R4  Activité 1 page ┤    │─► DOCX (docx)
        └──► Gabarit R5/R6 …  ───────────┘    └─► Impression (CSS print)
                         ▲
              Design system UBA (tokens : couleurs, polices, composants de rapport)
```

**Composants de rapport réutilisables** (extraits de tes PDF) :
`<ReportHeader/>`, `<KpiStrip/>` (bandeau 5 chiffres), `<SectionTitle/>` (barre rouge verticale + titre), `<InfoTable/>`, `<DataTable/>` (en-tête rouge, lignes zébrées `#FDF1F1`), `<GroupGrid/>` (3 colonnes), `<Timeline/>`, `<AlertBox/>` (points à confirmer), `<StatusMatrix/>` (T/A/O), `<SignatureBlock/>`, `<ReportFooter/>` (« Page X / Y »).

## 2.5 Sécurité

| Couche | Mesure |
|--------|--------|
| Authentification | Mot de passe fort, option 2FA pour Chef/Admin, expiration de session |
| Autorisations | **RLS Postgres** par rôle ; le rapport « confidentiel » n'est lisible que Chef/Admin |
| Données | Chiffrement en transit (HTTPS) et au repos (Supabase) |
| Audit | Table `audit_log` alimentée par triggers (qui, quoi, avant/après, quand) |
| Sauvegarde | Sauvegarde quotidienne Supabase + export mensuel chiffré |
| Secrets | Variables d'environnement Vercel, jamais dans le code (`.env` non commité) |
| Entrées | Validation Zod (client) **et** contraintes CHECK (base) |
| Fichiers | Bucket privé, URLs signées à durée limitée |
| Mentions | Mention « CONFIDENTIEL » automatique sur R2 (en-tête) |

## 2.6 Environnements et qualité

- **3 environnements** : `local` → `preview` (Vercel, par branche) → `production`.
- Tests : Vitest (calculs), Playwright (parcours critiques : saisie → validation → PDF).
- Lint/format : ESLint + Prettier ; commits conventionnels ; GitHub Actions.
- **Jeu de données de démonstration** : charger tes rapports existants (28/09 → 09/10) pour tester.

---

# 📙 DOCUMENT 03 — APP FLOW (parcours et navigation)

## 3.1 Plan du site (arborescence)

```
/login
/                         → Tableau de bord
/rapports
   ├─ /journaliers        → liste + création
   │    └─ /:id           → éditeur en 9 étapes
   ├─ /syntheses          → liste + assistant de création
   │    └─ /:id
   └─ /archives-pdf       → bibliothèque des PDF générés
/archives
   ├─ /agences            → fiches agences
   ├─ /matrice            → agence × année (T/A/O)
   ├─ /mouvements         → transferts & réceptions
   └─ /cartons            → inventaire (V2)
/equipe
   ├─ /personnes
   ├─ /groupes
   ├─ /presences
   └─ /taches
/incidents
/import                    → import des anciens rapports
/parametres
   ├─ /modeles            → logo, couleurs, sections
   ├─ /referentiels
   ├─ /utilisateurs
   └─ /audit
```

## 3.2 Parcours principal A — Créer un rapport journalier (le plus fréquent)

```
[Tableau de bord] → « + Nouveau rapport journalier »
        │
        ▼
 ① Période        date début / fin (1 ou 2 jours), horaires, chef, superviseurs
        ▼
 ② Effectif       pointage : présent / absent (justifié ?) / Mazala / ordinateur
        ▼
 ③ Groupes        glisser-déposer des personnes (propositions auto depuis la veille)
        ▼
 ④ Tâches         liste type (cliquer pour ajouter) + horaires + descriptions
        ▼
 ⑤ Transferts     agences envoyées à Mazala : code, année, conventions, boîtes
        ▼
 ⑥ Réceptions     agences reçues de Mazala : exercices, trié / mis de côté, boîtes
        ▼
 ⑦ Chronologie    événements horodatés (générés depuis les tâches, modifiables)
        ▼
 ⑧ Observations   points / constats, incidents
        ▼
 ⑨ Contrôle       ✅ VALIDATION AUTOMATIQUE : écarts, champs vides, doublons
        │   ├─ erreurs bloquantes → retour à l'étape concernée
        │   └─ OK → Aperçu A4 temps réel
        ▼
 [Enregistrer brouillon] [Soumettre au chef] → [Chef valide + signe] → [PDF / Word / Imprimer]
```

**Règles d'UX du parcours** : enregistrement auto, indicateur de complétude (ex. « 78 % »), possibilité de sauter une étape, barre de progression, aperçu à droite sur ordinateur.

## 3.3 Parcours B — Générer une synthèse de période

1. Rapports → Synthèses → **« Nouvelle synthèse »**.
2. Choisir **période** (28/09 → 09/10), **public** (Chef confidentiel / Équipe), **sections** à inclure (cases à cocher).
3. Le système calcule : jours renseignés vs manquants → **alerte** « Aucun relevé pour 5 jours ».
4. Aperçu → ajuster les **points à confirmer** → export PDF / impression.

## 3.4 Parcours C — Réconcilier la matrice agence × année

1. Archives → Matrice : grille agences en lignes, années en colonnes.
2. Clic sur une case → panneau latéral : historique du lot (reçu, trié, transmis…).
3. Le système propose **« Oublié probable »** (O) quand une année est « transmise » dans un mouvement mais encore « en attente » dans la liste.
4. L'utilisateur confirme / corrige → la case change de statut, tracé dans l'audit.

## 3.5 Parcours D — Importer d'anciens rapports

`Import → déposer .docx/.pdf → extraction automatique → écran de vérification ligne par ligne (surlignage des champs douteux) → rattachement agences/personnes (suggestions d'alias) → création des enregistrements`.

## 3.6 Machine d'états d'un rapport

```
 BROUILLON ──soumettre──► À RELIRE ──valider──► VALIDÉ ──diffuser──► DIFFUSÉ
     ▲                       │                     │
     └──── rejeter ◄─────────┘                     └── corriger → NOUVELLE VERSION (v2, v3…)
```

## 3.7 Cas limites à gérer

- Rapport couvrant **2 jours** (05→06/10).
- Jour **sans travail** (week-end, férié) : exclu des « jours manquants ».
- Une personne **renommée** (alias) ne doit pas créer de doublon.
- Une agence reçue **partiellement** (« lot 2015 à confirmer »).
- Le total déclaré ≠ somme calculée : afficher les deux et exiger une justification.
- Connexion perdue pendant la saisie : file d'attente locale puis resynchronisation.

---

# 📕 DOCUMENT 04 — UI/UX DESIGN

## 4.1 Principes de design

1. **Lisibilité d'abord** : beaucoup de chiffres → grands nombres, séparateurs d'espace insécable (`16 163`), alignement à droite des colonnes numériques.
2. **Fidélité au modèle UBA** : rouge/blanc, barre de titre rouge, sections à barre verticale rouge.
3. **Une action principale par écran**, bouton rouge plein ; actions secondaires en contour.
4. **Saisie au pouce** (mobile) : le superviseur remplit sur téléphone.
5. **Le rouge signale l'important** (titres, chiffres clés), pas les erreurs : les erreurs utilisent un rouge plus sombre + icône + texte pour ne pas être confondues avec l'identité visuelle.

## 4.2 Design tokens (extraits de tes documents)

| Token | Valeur | Usage |
|-------|--------|-------|
| `--uba-red` | **`#E41E26`** | Bandeaux, titres de section, en-têtes de tableau, chiffres clés |
| `--uba-red-dark` | `#B3141B` | Survol, bordures actives, erreurs |
| `--uba-red-tint` | **`#FDF1F1`** | Lignes zébrées de tableaux, fonds d'info |
| `--uba-white` | `#FFFFFF` | Fond des rapports et de l'app |
| `--ink` | `#1F2328` | Texte principal |
| `--muted` | `#6B7280` | Libellés secondaires, pieds de page |
| `--line` | `#E5E7EB` | Filets |
| `--ok` | `#1E8E3E` | Statut **T** (transmis/traité) |
| `--wait` | `#8A8F98` | Statut **A** (en attente) |
| `--warn` | `#E41E26` | Statut **O** (oublié probable) |
| **Police** | **Arial** (modèle Word) → *Inter* en option pour l'interface | Cohérence avec les .docx |
| Rayon | 4 px (rapports) / 8 px (interface) | |
| Échelle texte (rapport) | titre 18 pt · section 12 pt gras · corps 9-10 pt · pied 8 pt | |

> 💡 **Mode interface** : fond blanc/gris très clair, rouge UBA en accent. Le **mode sombre « hacker »** (noir + rouge) peut être proposé en option dans les paramètres, mais **les rapports imprimés restent rouge/blanc UBA**.

## 4.3 Anatomie d'un rapport (fidèle à ton modèle)

```
┌──────────────────────────────────────────────────────────────┐
│ [ UBA ]   RAPPORT JOURNALIER D'ACTIVITÉ          ← bandeau rouge #E41E26
│           ÉQUIPE ARCHIVISTE UBA — 05/10/2026 au 06/10/2026   │
├──────────────────────────────────────────────────────────────┤
│ ▌SYNTHÈSE DE LA JOURNÉE            ← barre verticale rouge   │
│ ┌────────┬───────┬────────┬────────┬────────┐                │
│ │ 19/19  │   0   │ 5 813  │   45   │   3    │ ← chiffres rouges, gras
│ │Présents│Absents│Convent.│Boîtes  │Agences │ ← libellés gris │
│ └────────┴───────┴────────┴────────┴────────┘                │
│ ▌INFORMATIONS GÉNÉRALES                                      │
│ ┌────────────────────────────────────────────┐               │
│ │ Organisation                   (en-tête rouge)             │
│ │ Date .......... 05/10/2026 au 06/10/2026   │ ← valeurs en gras
│ │ …                                           │               │
│ └────────────────────────────────────────────┘               │
│ …                                                            │
├──────────────────────────────────────────────────────────────┤
│ Équipe Archiviste UBA — Rapport du …            Page 1 / 3   │
└──────────────────────────────────────────────────────────────┘
```

**Rapports de synthèse** : même bandeau + 4 grandes cartes chiffrées (*16 163 · 8 815 · 8 · 5/10*), encadré « Comment lire ce rapport », tableaux, matrice colorée, encadré **« Points à confirmer »**.

## 4.4 Écrans de l'application (wireframes textuels)

### Écran 1 — Tableau de bord
```
┌ Sidebar rouge sombre ┬──────────────────────────────────────────────┐
│ ◉ Tableau de bord    │ Bonjour Kali — Lundi 12 octobre 2026         │
│ ▤ Rapports           │ ┌─────────┬─────────┬─────────┬─────────┐    │
│ ▦ Archives           │ │ 16 163  │ 8 815   │ 5/10    │ 3 alertes│   │
│ ☺ Équipe             │ │ traités │ attente │ jours   │ à traiter│   │
│ ⚠ Incidents          │ └─────────┴─────────┴─────────┴─────────┘    │
│ ⇪ Import             │ [Courbe : dossiers traités / jour]           │
│ ⚙ Paramètres         │ [Barres : avancement par agence]             │
│                      │ ⚠ Rapports manquants : 29/09, 30/09 …        │
│                      │ [+ Rapport journalier] [+ Synthèse]          │
└──────────────────────┴──────────────────────────────────────────────┘
```

### Écran 2 — Éditeur de rapport (2 colonnes)
- **Gauche** : stepper vertical (9 étapes, ✓ / ⚠ / ○) + formulaire de l'étape.
- **Droite** : aperçu A4 qui se met à jour en direct, bouton *Plein écran*, zoom.
- **Barre haute collante** : titre, statut (badge), complétude, *Enregistrer*, *Contrôler*, *Exporter ▾*.
- **Mobile** : stepper en barre horizontale, aperçu en onglet séparé.

### Écran 3 — Matrice agence × année
- Grille avec **pastilles** : ● vert (T), ● gris (A), ● rouge (O) + **lettre dans la pastille** (accessibilité daltoniens).
- Filtre : agence, plage d'années, statut. Clic = panneau historique.
- Ligne de totaux et colonne de totaux.

### Écran 4 — Contrôle qualité avant validation
Liste de contrôles avec **icônes + texte** :
- ❌ *Total conventions : déclaré 5 813 ≠ calculé 5 613 (écart 200)* → [Corriger]
- ⚠ *Boîtes reçues : 85 (tâche 5) ≠ 104 (section Mazala)* → [Choisir la valeur]
- ⚠ *Champ « Chef d'équipe » vide*
- ✅ *Effectif cohérent (17 + 2 = 19)*

### Écran 5 — Export
Choix : format (PDF / Word / Imprimer), public (Chef / Équipe), **filigrane** (« Brouillon » / « Confidentiel »), inclure signature, enregistrer dans la bibliothèque.

## 4.5 Composants d'interface clés

| Composant | Détails UX |
|-----------|------------|
| **Stepper** | Étapes cliquables, état coloré, scroll auto |
| **Champ nombre** | Format `1 234`, clavier numérique mobile, bouton ± |
| **Sélecteur de personnes** | Recherche avec alias (« Fred » → Foundou Fredich), pastille groupe |
| **Glisser-déposer groupes** | Cartes de personnes, compteur par groupe |
| **Tableau éditable** | Ajout de ligne par `Entrée`, total recalculé instantanément |
| **Toast / bandeau d'alerte** | Rouge sombre + icône, jamais seul sans texte |
| **Badges de statut** | Brouillon (gris) · À relire (orange) · Validé (vert) · Diffusé (rouge UBA) |
| **Aperçu A4** | Fond gris, feuille blanche ombrée, pagination réelle |

## 4.6 Responsive et accessibilité

- **Desktop ≥ 1024** : sidebar + éditeur + aperçu.
- **Tablette** : sidebar réduite, aperçu en onglet.
- **Mobile** : barre de navigation basse (Accueil · Rapports · Archives · Équipe), formulaires en cartes plein écran.
- Contraste texte blanc sur `#E41E26` : **ratio ≈ 4,6:1** (conforme AA pour le gras/grand texte) ; pour le petit texte sur rouge, utiliser `#B3141B`.
- Focus visible, labels explicites, messages d'erreur liés aux champs, jamais la couleur seule.

## 4.7 Règles d'impression

- A4 portrait, marges 15 mm, bandeau rouge **imprimé en aplat** (`print-color-adjust: exact`).
- **Version « économie d'encre »** : bandeau blanc à filet rouge (option).
- `break-inside: avoid` sur les lignes de tableau ; en-tête de tableau répété sur chaque page.
- Pied : *« Équipe Archiviste UBA — Rapport du … · Page X / Y »*.
- Mention `CONFIDENTIEL – Chef d'équipe` en en-tête de R2 ; `Version équipe – stagiaires` sur R3.

---

# 📓 DOCUMENT 05 — BACKEND SCHEMA (Supabase / PostgreSQL)

## 5.1 Diagramme des relations (simplifié)

```
 profiles ──< audit_log
 sites ──< agences ──< lots (agence × exercice)
 personnes ──< personne_alias
 rapports (période, type, statut, version)
   ├──< rapport_presences ─> personnes
   ├──< rapport_groupes ──< groupe_membres ─> personnes
   ├──< rapport_taches ─> types_taches
   ├──< chronologie
   ├──< mouvements (transfert / réception) ─> agences, lots, cartons
   ├──< observations / incidents
   └──< rapport_exports (PDF/DOCX archivés)
 cartons ─> lots
```

## 5.2 Script SQL de base

```sql
-- ============ EXTENSIONS & TYPES ============
create extension if not exists "pgcrypto";

create type role_app        as enum ('admin','chef','superviseur','stagiaire','lecteur');
create type type_rapport    as enum ('journalier','synthese_chef','synthese_equipe','activite_1page','fiche_agence','presence');
create type statut_rapport  as enum ('brouillon','a_relire','valide','diffuse');
create type type_mouvement  as enum ('transfert_vers_mazala','reception_de_mazala','rapatriement','reclassement');
create type statut_lot      as enum ('en_attente','transmis','trie','mis_de_cote','carton_oublie','oublie_probable','a_confirmer');
create type unite_comptage  as enum ('convention','boite','dossier');
create type statut_presence as enum ('present','mazala','ordinateur','absent_justifie','absent_non_justifie');

-- ============ UTILISATEURS ============
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  nom_complet text not null,
  role role_app not null default 'lecteur',
  actif boolean not null default true,
  created_at timestamptz default now()
);

-- ============ RÉFÉRENTIELS ============
create table sites (                       -- Maya-Maya, Mazala
  id uuid primary key default gen_random_uuid(),
  nom text unique not null
);

create table agences (
  id uuid primary key default gen_random_uuid(),
  code text unique,                        -- 901, 902, 904, 907…
  nom text not null,                       -- City-Center, Poto-Poto, Bacongo, Moungali…
  actif boolean default true
);

create table personnes (
  id uuid primary key default gen_random_uuid(),
  nom_officiel text not null,
  categorie text check (categorie in ('chef','superviseur','ancien_stagiaire','nouveau_stagiaire')),
  actif boolean default true
);

create table personne_alias (               -- Fred / Fredich / Friedrich / Freddy
  alias text primary key,
  personne_id uuid not null references personnes on delete cascade
);

create table types_taches (
  id uuid primary key default gen_random_uuid(),
  libelle text unique not null,            -- Purification, Comptage, Descente…
  description_defaut text
);

-- ============ LOTS (agence × exercice) : cœur de la matrice ============
create table lots (
  id uuid primary key default gen_random_uuid(),
  agence_id uuid not null references agences,
  exercice int not null check (exercice between 2000 and 2100),
  statut statut_lot not null default 'en_attente',
  quantite int check (quantite >= 0),
  unite unite_comptage default 'dossier',
  note text,
  updated_at timestamptz default now(),
  unique (agence_id, exercice)
);

create table cartons (                      -- V2 : inventaire
  id uuid primary key default gen_random_uuid(),
  lot_id uuid references lots,
  numero text, etat text check (etat in ('bon','abime','a_verifier')),
  emplacement text, qr_code text unique
);

-- ============ RAPPORTS ============
create table rapports (
  id uuid primary key default gen_random_uuid(),
  type type_rapport not null,
  titre text,
  date_debut date not null,
  date_fin date not null,
  check (date_fin >= date_debut),
  horaires text default '7h30 – 16h30',
  chef_id uuid references personnes,
  statut statut_rapport not null default 'brouillon',
  version int not null default 1,
  parent_id uuid references rapports,       -- chaînage des versions
  total_conventions_declare int,            -- pour détecter l'écart
  snapshot jsonb,                           -- figé à la validation
  cree_par uuid references profiles,
  valide_par uuid references profiles,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table rapport_superviseurs (
  rapport_id uuid references rapports on delete cascade,
  personne_id uuid references personnes,
  primary key (rapport_id, personne_id)
);

create table rapport_presences (
  id uuid primary key default gen_random_uuid(),
  rapport_id uuid not null references rapports on delete cascade,
  personne_id uuid not null references personnes,
  statut statut_presence not null,
  motif text,
  unique (rapport_id, personne_id)
);

create table rapport_groupes (
  id uuid primary key default gen_random_uuid(),
  rapport_id uuid not null references rapports on delete cascade,
  nom text not null,                        -- Groupe 1…4, Mazala, Travail sur ordinateur
  ordre int default 0
);
create table groupe_membres (
  groupe_id uuid references rapport_groupes on delete cascade,
  personne_id uuid references personnes,
  rang int,
  primary key (groupe_id, personne_id)
);

create table rapport_taches (
  id uuid primary key default gen_random_uuid(),
  rapport_id uuid not null references rapports on delete cascade,
  type_tache_id uuid references types_taches,
  libelle text not null,
  description text,
  horaire text,
  ordre int default 0
);

create table chronologie (
  id uuid primary key default gen_random_uuid(),
  rapport_id uuid not null references rapports on delete cascade,
  heure text, evenement text not null, ordre int default 0
);

-- ============ MOUVEMENTS (transferts / réceptions) ============
create table mouvements (
  id uuid primary key default gen_random_uuid(),
  rapport_id uuid references rapports on delete set null,
  date_mouvement date not null,
  type type_mouvement not null,
  agence_id uuid references agences,        -- peut être NULL → file « à rattacher »
  exercice int,
  conventions int check (conventions >= 0),
  boites int check (boites >= 0),
  traitement text,                          -- trié / mis de côté / cartons oubliés
  lot_id uuid references lots,
  note text
);
create index on mouvements (date_mouvement, agence_id);

create table observations (
  id uuid primary key default gen_random_uuid(),
  rapport_id uuid not null references rapports on delete cascade,
  point text not null, constat text not null,
  est_incident boolean default false,
  resolu boolean default false
);

create table rapport_exports (
  id uuid primary key default gen_random_uuid(),
  rapport_id uuid references rapports on delete cascade,
  format text check (format in ('pdf','docx')),
  public_cible text,                        -- chef / equipe
  storage_path text not null,
  created_at timestamptz default now()
);

-- ============ AUDIT ============
create table audit_log (
  id bigserial primary key,
  table_name text, row_id uuid, action text,
  avant jsonb, apres jsonb,
  user_id uuid, created_at timestamptz default now()
);
```

## 5.3 Vues et fonctions de calcul (les totaux ne se saisissent jamais)

```sql
-- Totaux d'un rapport journalier
create view v_rapport_totaux as
select r.id as rapport_id,
  count(*) filter (where p.statut in ('present','mazala','ordinateur'))          as presents,
  count(*) filter (where p.statut like 'absent%')                                as absents,
  count(*)                                                                       as effectif,
  (select coalesce(sum(m.conventions),0) from mouvements m
     where m.rapport_id = r.id and m.type='transfert_vers_mazala')               as conventions,
  (select coalesce(sum(m.boites),0) from mouvements m
     where m.rapport_id = r.id and m.type='transfert_vers_mazala')               as boites,
  (select count(distinct m.agence_id) from mouvements m
     where m.rapport_id = r.id and m.type='transfert_vers_mazala')               as agences
from rapports r
left join rapport_presences p on p.rapport_id = r.id
group by r.id;

-- Détection d'écart (déclaré vs calculé)
create view v_ecarts_rapport as
select r.id, r.total_conventions_declare, t.conventions as calcule,
       r.total_conventions_declare - t.conventions as ecart
from rapports r join v_rapport_totaux t on t.rapport_id = r.id
where r.total_conventions_declare is not null
  and r.total_conventions_declare <> t.conventions;

-- Suivi jour par jour (synthèse)
create view v_suivi_journalier as
select m.date_mouvement, a.nom as agence, m.exercice,
       sum(m.conventions) as dossiers
from mouvements m left join agences a on a.id = m.agence_id
where m.type = 'transfert_vers_mazala'
group by 1,2,3;

-- Cumul progressif
create view v_cumul_journalier as
select date_mouvement, sum(dossiers) as total_jour,
       sum(sum(dossiers)) over (order by date_mouvement) as cumul
from v_suivi_journalier group by date_mouvement;

-- Matrice agence × année avec détection des « oubliés »
create view v_matrice as
select l.agence_id, l.exercice,
  case
    when l.statut = 'en_attente'
     and exists (select 1 from mouvements m
                 where m.agence_id=l.agence_id and m.exercice=l.exercice
                   and m.type='transfert_vers_mazala')
    then 'oublie_probable' else l.statut::text
  end as statut_calcule,
  l.quantite
from lots l;

-- Jours ouvrés sans rapport sur une période
create function jours_sans_rapport(d1 date, d2 date)
returns table(jour date) language sql as $$
  select d::date from generate_series(d1,d2,'1 day') d
  where extract(isodow from d) < 6
    and not exists (select 1 from rapports r
                    where r.type='journalier' and d between r.date_debut and r.date_fin);
$$;
```

## 5.4 Sécurité : Row Level Security (extrait)

```sql
alter table rapports enable row level security;

-- Lecture : tous les connectés voient les rapports diffusés ; le chef/admin voient tout
create policy rapports_lecture on rapports for select using (
  statut = 'diffuse' and type <> 'synthese_chef'
  or exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('admin','chef'))
  or cree_par = auth.uid()
);

-- Écriture : superviseur+ ; un rapport validé n'est plus modifiable
create policy rapports_ecriture on rapports for update using (
  statut in ('brouillon','a_relire')
  and exists (select 1 from profiles p where p.id = auth.uid()
              and p.role in ('admin','chef','superviseur'))
);

-- Validation : chef/admin uniquement (via fonction RPC valider_rapport())
```
*(Même principe sur `mouvements`, `lots`, `rapport_presences`… ; stagiaires en lecture seule sur leur propre répartition.)*

## 5.5 Fonctions RPC (Edge/SQL)

| Fonction | Rôle |
|----------|------|
| `valider_rapport(id)` | Contrôle les écarts, fige le `snapshot`, passe en `valide` |
| `creer_version(id)` | Duplique un rapport validé en `v+1` brouillon |
| `construire_synthese(d1,d2,public)` | Renvoie le **ReportModel** JSON prêt à rendre |
| `fusionner_personnes(a,b)` | Fusionne deux doublons + crée l'alias |
| `reconcilier_lots()` | Recalcule les statuts T/A/O |

## 5.6 Stockage (Supabase Storage)

| Bucket | Contenu | Accès |
|--------|---------|-------|
| `branding` | logo UBA, polices | public |
| `rapports-pdf` | PDF/DOCX générés | privé (URL signée) |
| `releves` | photos de relevés manuscrits | privé |
| `imports` | fichiers à importer | privé, purge 30 jours |

---

# 📔 DOCUMENT 06 — IMPLEMENTATION PLAN

## 6.1 Structure du dépôt

```
archiva/
├─ src/
│  ├─ app/               routes, layout, providers
│  ├─ features/
│  │   ├─ auth/  referentiels/  rapports/  archives/  equipe/  incidents/  import/
│  ├─ reports/           ← MOTEUR DE RAPPORTS
│  │   ├─ model/         types ReportModel (Zod)
│  │   ├─ builders/      buildJournalier.ts, buildSynthese.ts …
│  │   ├─ templates/     R1Journalier.tsx, R2Chef.tsx, R3Equipe.tsx, R4Activite.tsx
│  │   ├─ components/    ReportHeader, KpiStrip, DataTable, StatusMatrix…
│  │   ├─ docx/          générateurs Word
│  │   └─ theme.ts       tokens UBA
│  ├─ lib/               supabase client, formatters (nombres FR, dates)
│  ├─ components/ui/     shadcn
│  └─ validation/        règles d'écart (§0.4)
├─ supabase/
│  ├─ migrations/        schéma SQL versionné
│  ├─ functions/         Edge Functions
│  └─ seed.sql           données de démo (tes rapports 28/09–09/10)
├─ tests/                unitaires + e2e
└─ .github/workflows/    CI
```

## 6.2 Feuille de route par phases

### Phase 0 — Cadrage (3-4 jours)
- [ ] Valider ce plan, le nom du projet, les rôles.
- [ ] Lister les **champs réels** de chaque modèle de rapport (R1…R4).
- [ ] Confirmer les **codes agences** manquants (Maya-Maya, Plateau-Ville) et l'**unité** de comptage (conventions / dossiers / cartons).
- [ ] Rassembler **tous les anciens rapports** (jeu de test).
- ✅ *Livrable : cahier des charges validé.*

### Phase 1 — Fondations (1 semaine)
- [ ] Projet Vite + TS + Tailwind + shadcn, thème UBA (tokens §4.2).
- [ ] Projet Supabase, migrations §5.2, seed des référentiels.
- [ ] Auth + rôles + RLS de base.
- [ ] Layout (sidebar, topbar, responsive), déploiement Vercel.
- ✅ *Livrable : application vide connectée, déployée, login fonctionnel.*

### Phase 2 — Référentiels & équipe (1 semaine)
- [ ] CRUD agences, personnes (+ alias), types de tâches, utilisateurs.
- [ ] Import de la liste des 19 stagiaires.
- [ ] Écran Équipe (présences, groupes en glisser-déposer).
- ✅ *Livrable : base de données métier prête.*

### Phase 3 — Rapport journalier complet (2 semaines) ⭐ cœur MVP
- [ ] Éditeur en 9 étapes + sauvegarde automatique.
- [ ] Saisie des mouvements (transferts / réceptions) avec calcul des totaux.
- [ ] Moteur de validation (10 règles §0.4).
- [ ] Gabarit R1 en **PDF** identique au modèle UBA + aperçu A4.
- [ ] Export **Word** (.docx).
- [ ] Machine d'états (brouillon → validé) + versions.
- ✅ *Livrable : tu peux produire le rapport du 07-08/10 en < 10 minutes.*

### Phase 4 — Synthèses et matrice (1,5 semaine)
- [ ] Vues SQL de suivi / cumul / matrice (§5.3).
- [ ] Assistant de synthèse (période, public).
- [ ] Gabarits **R2 (chef)** et **R3 (équipe)** — mêmes données, sections filtrées.
- [ ] Écran Matrice agence × année + réconciliation « oubliés ».
- [ ] Alerte « jours sans rapport ».
- ✅ *Livrable : la synthèse 28/09 → 09/10 est régénérée automatiquement et correspond à tes PDF.*

### Phase 5 — Tableau de bord & qualité (1 semaine)
- [ ] KPI, graphiques (Recharts), alertes.
- [ ] Incidents & observations suivis.
- [ ] Audit log + écran d'historique.
- [ ] Tests e2e des parcours A, B, C.
- ✅ *Livrable : MVP complet, en usage réel pendant 2 semaines.*

### Phase 6 — Version riche (3-4 semaines, itératif)
- [ ] Import de rapports Word/PDF existants (M15).
- [ ] Gabarits R4 (1 page), R5 (fiche agence), R6 (présence).
- [ ] Paramétrage des modèles (logo, sections) (M19).
- [ ] Notifications e-mail, signature du chef.
- [ ] Inventaire cartons + QR codes.
- [ ] PWA hors-ligne.

### Phase 7 — Ambitieux (optionnel)
- [ ] OCR de relevés manuscrits.
- [ ] Assistant IA (résumés, questions en langage naturel, détection d'anomalies).
- [ ] Multi-équipes.

## 6.3 Calendrier indicatif (rythme de 1 personne, temps partiel)

| Semaine | Contenu | Jalon |
|---------|---------|-------|
| S1 | Phase 0 + début Phase 1 | Plan validé |
| S2 | Phase 1 + Phase 2 | App déployée, équipe saisie |
| S3-S4 | Phase 3 | **MVP : rapport journalier + PDF** |
| S5-S6 | Phase 4 | **Synthèses + matrice** |
| S7 | Phase 5 | **MVP complet** |
| S8+ | Phase 6/7 | Version riche |

## 6.4 Stratégie de test

| Niveau | Quoi | Outil |
|--------|------|-------|
| Unitaire | Formatage `1 234`, calcul des écarts, règles de validation | Vitest |
| Données | Rejouer **tes rapports réels** et comparer aux chiffres attendus (16 163 / 8 815 / 24 978) | Script + seed |
| Visuel | Comparer le PDF généré au PDF UBA original | Capture + comparaison manuelle |
| E2E | Saisie → contrôle → validation → export | Playwright |
| Impression | Test sur imprimante réelle A4 (couleur et N&B) | Manuel |
| Sécurité | Tentative de lecture du rapport chef avec un compte stagiaire | Manuel + test RLS |

## 6.5 Risques et parades

| Risque | Impact | Parade |
|--------|--------|--------|
| Chiffres des anciens rapports contradictoires | Données de départ fausses | Import **avec écran de vérification**, statut « à confirmer » |
| Unité de comptage floue | Totaux trompeurs | Champ `unite` obligatoire, jamais d'addition entre unités |
| PDF qui diffère du Word UBA | Rejet du rapport | Gabarit validé par le chef en Phase 3 avant d'aller plus loin |
| Saisie impossible sans réseau | Rapports non faits | Brouillon local + PWA (Phase 6) |
| Données confidentielles exposées | Sérieux | RLS testée, bucket privé, audit |
| Projet trop gros d'un coup | Abandon | **MVP d'abord (Phases 1-5)**, le reste ensuite |
| Dépendance à un seul développeur | Maintenance | Code documenté, migrations versionnées, README |

## 6.6 Checklist de livraison du MVP

- [ ] Je saisis un rapport journalier complet en < 10 min.
- [ ] Le PDF généré ressemble au modèle UBA (rouge, logo, 3 pages, pagination).
- [ ] Les totaux sont **identiques** entre toutes les sections.
- [ ] Un écart de chiffres bloque la validation.
- [ ] La synthèse 28/09 → 09/10 sort en 1 clic, version Chef **et** version Équipe.
- [ ] Un stagiaire **ne peut pas** ouvrir la version confidentielle.
- [ ] Un rapport validé ne peut plus être modifié (nouvelle version obligatoire).
- [ ] Sauvegarde et restauration testées.
- [ ] Documentation utilisateur (1 page) remise au chef d'équipe.

---

# 🚀 PAR OÙ COMMENCER CETTE SEMAINE ?

1. **Jour 1** — Relire ce plan, trancher : nom du projet, **unité de comptage**, codes d'agences manquants.
2. **Jour 2** — Créer le dépôt GitHub + projet Supabase + projet Vercel ; coller le script SQL §5.2.
3. **Jour 3** — Mettre en place le thème UBA (tokens §4.2) et le layout.
4. **Jour 4-5** — Construire les référentiels (agences, personnes + alias) et importer les 19 stagiaires.
5. **Semaine suivante** — Attaquer l'éditeur de rapport journalier (Phase 3), en visant à reproduire **à l'identique** le rapport du 05-06/10.

> 💡 **Astuce** : utilise tes vrais rapports comme *tests d'acceptation*. Le jour où l'application régénère exactement ton PDF de synthèse (16 163 · 8 815 · 24 978), le cœur du logiciel fonctionne.

---

## Annexe A — Glossaire

| Terme | Signification |
|-------|---------------|
| **Convention** | Document archivé (unité principale de comptage dans les rapports journaliers) |
| **Boîte / Carton** | Contenant physique d'archives |
| **Dossier** | Unité utilisée dans les synthèses (à harmoniser avec « convention ») |
| **Exercice** | Année comptable du lot (2015, 2019…) |
| **Mazala** | Site de tri/stockage recevant les agences transférées |
| **Maya-Maya** | Site principal de travail de l'équipe |
| **Tchéké** | Vérification/contrôle effectué sur les cartons (à préciser dans le référentiel) |
| **T / A / O** | Transmis-traité / En attente / Oublié probable |
| **Lot** | Ensemble agence × exercice |
| **Purification** | Nettoyage de l'espace de travail |

## Annexe B — Exemple de `ReportModel` (JSON) pour R1

```json
{
  "type": "journalier",
  "periode": { "debut": "2026-10-05", "fin": "2026-10-06" },
  "kpis": { "presents": 19, "effectif": 19, "absents": 0,
            "conventions": 5613, "boites": 45, "agences": 3 },
  "infos": { "horaires": "7h30 – 16h30", "chef": "Thony OBAKI",
             "superviseurs": ["Yoka", "Fred"], "mazala": ["Duskane", "Placy"] },
  "groupes": [{ "nom": "Groupe 1", "membres": ["Yoka","Parfait","Lauria","Déo"] }],
  "taches": [{ "n": 1, "titre": "Purification de l'espace de travail",
               "description": "Évacuation des boîtes vides, cartons et ordures",
               "horaire": "7h30" }],
  "transferts": [
    { "agence": "Bacongo",   "code": "904", "conventions": 1322 },
    { "agence": "Poto-Poto", "code": "902", "conventions": 741 },
    { "agence": "Moungali",  "code": "907", "conventions": 3550 }
  ],
  "alertes": [
    { "niveau": "erreur", "message": "Total déclaré 5 813 ≠ calculé 5 613 (écart 200)" }
  ]
}
```

## Annexe C — Questions à trancher avec le chef d'équipe

1. **Unité officielle** : conventions, dossiers ou cartons ? (une seule pour les totaux)
2. **Codes agences** : Maya-Maya, Plateau-Ville, et toute autre agence ?
3. Les rapports sont-ils **signés / tamponnés** ? Faut-il un espace de signature ?
4. Qui a le droit de **voir la version confidentielle** ?
5. Le rapport journalier couvre-t-il **toujours** 2 jours, ou parfois 1 ?
6. Que signifie exactement **« Tchéké »** pour le référentiel ?
7. Faut-il conserver les **rapports en Word** en plus du PDF ?
8. Quelle est la règle pour déclarer un lot « **oublié** » (délai, validation) ?

---

*Plan généré à partir de l'analyse des rapports UBA — à adapter au fil de ta conception. Bonne construction ! 🔴*
