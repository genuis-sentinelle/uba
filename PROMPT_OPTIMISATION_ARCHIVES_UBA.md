# PROMPT MAÎTRE --- Optimisation du logiciel de gestion des archives UBA

**Projet analysé :** `UBA.zip`\
**Nom de travail :** UBA Archives Manager\
**Stack observée :** React 18, TypeScript, Vite, CSS, Lucide React,
html2canvas, jsPDF\
**Objectif :** améliorer l'application existante sans casser les
fonctionnalités métier ni perdre les données.

------------------------------------------------------------------------

## 1. Rôle et mission

Tu es un développeur senior full-stack, architecte UX/UI, spécialiste
des applications métier, de l'accessibilité, de la sécurité et de
l'impression de rapports administratifs.

Tu dois **examiner le code existant avant de modifier quoi que ce
soit**, puis moderniser le logiciel de gestion des archives UBA.
Travaille sur le projet existant, pas sur une maquette isolée. Réutilise
les composants, types et règles métier quand ils sont corrects. Ne
supprime aucune fonctionnalité utile sans justification et validation.

Le résultat doit être professionnel, rapide, clair, cohérent, responsive
et exploitable au bureau comme sur téléphone.

## 2. Analyse initiale du dépôt

Le projet fourni contient notamment :

-   `src/App.tsx` : composition de l'application, navigation et
    affichage des modules.
-   `src/components/Layout/Navbar.tsx` et `Sidebar.tsx` : navigation
    principale.
-   `src/components/Auth/LoginView.tsx` et `src/context/AuthContext.tsx`
    : connexion et contexte utilisateur.
-   `src/context/DataContext.tsx` et `src/data/initialData.ts` : état et
    données de l'application.
-   `src/components/Dashboard/DashboardView.tsx` : tableau de bord.
-   `src/components/DailyReport/` : saisie, liste et aperçu imprimable
    des rapports journaliers.
-   `src/components/Synthesis/SynthesisView.tsx` : synthèses, dont une
    version confidentielle chef et une version équipe.
-   `src/components/TransferSlips/` : bordereaux de décharge et aperçu
    imprimable.
-   `src/components/Cartons/CartonsView.tsx` : inventaire des cartons.
-   `src/components/Attendance/QuickAttendanceView.tsx` : pointage
    rapide.
-   `src/components/Incidents/IncidentsView.tsx` : incidents et
    anomalies.
-   `src/components/Agencies/AgenciesView.tsx` : agences.
-   `src/components/Conventions/ConventionsView.tsx` : conventions et
    matrice.
-   `src/components/Team/TeamView.tsx` : équipe archiviste.
-   `src/components/AuditLogs/AuditLogsView.tsx` : journal d'audit.
-   `src/components/Users/UsersManagementView.tsx` : utilisateurs et
    droits.
-   `src/components/Settings/SettingsView.tsx` : paramètres et données.
-   `src/styles/index.css` : styles partagés.
-   `src/types/index.ts` : types métier.
-   `src/utils/pdfExport.ts` : export PDF.
-   `PLAN_LOGICIEL_ARCHIVES_UBA.md` : documentation métier existante à
    consulter avant toute évolution.

Le projet présente déjà des fonctionnalités de rapports, de synthèse, de
pointage, d'inventaire, d'incidents, d'équipe, d'utilisateurs et
d'export. Certaines vues utilisent beaucoup de styles en ligne. Le
tableau de bord et les pages doivent donc être harmonisés
progressivement, sans réécriture aveugle.

**Important :** le dépôt fourni semble inclure un dossier `dist/` et
`node_modules/`. Modifie les sources `src/` et les fichiers de
configuration utiles. N'édite pas seulement les fichiers compilés dans
`dist/`. Vérifie le `package.json`, les scripts, les dépendances et le
fonctionnement actuel avant d'ajouter une bibliothèque.

## 3. Direction artistique et design system

### 3.1 Palette

Adopter un thème **dark / blanc**, professionnel et sobre, compatible
avec l'identité UBA :

-   Fond principal sombre : `#0B0F14` ou équivalent.
-   Surfaces et panneaux : `#151A21` / `#1C232D`.
-   Texte principal sur fond sombre : `#F5F7FA`.
-   Texte secondaire : `#AAB3C0`, avec contraste accessible.
-   Blanc pour les documents et zones de lecture : `#FFFFFF`.
-   Rouge UBA comme couleur d'action et de repérage : conserver un rouge
    proche de `#E41E26`.
-   Bordures : gris foncé en thème sombre, gris clair en zone claire.
-   États : vert pour succès, ambre pour avertissement, rouge pour
    erreur, bleu/gris pour information.

Créer des variables CSS centralisées (`:root`) : couleurs, espacements,
rayons, ombres, tailles, transitions et niveaux de superposition. Éviter
les valeurs contradictoires recopiées dans tous les composants.

### 3.2 Formes et composants

-   Toutes les cartes, fenêtres, champs et boutons doivent avoir une
    forme rectangulaire avec des coins légèrement arrondis.
-   Rayon recommandé : 6 à 10 px ; éviter les capsules et les formes
    excessivement rondes.
-   Boutons cohérents : primaire, secondaire, discret, danger, icône
    seule avec infobulle.
-   Zones cliquables d'au moins 40--44 px de hauteur sur écran tactile.
-   Ajouter les états `hover`, `focus-visible`, `active`, `disabled`,
    chargement et erreur.
-   Icônes cohérentes (Lucide React), tailles harmonisées.
-   Textes courts, titres explicites, libellés compréhensibles ; éviter
    les paragraphes trop longs dans l'interface.
-   Conserver une hiérarchie visuelle nette : titre, description courte,
    actions, filtres, contenu, pagination.

### 3.3 Motif de fond UBA

Préparer l'intégration d'une image fournie ultérieurement par
l'utilisateur représentant les traits/symbole graphique UBA.

-   Prévoir un emplacement d'asset clair, par exemple
    `public/images/uba-pattern.png` ou SVG si un fichier vectoriel
    officiel est fourni.
-   Le motif doit être décoratif, fixe ou très discret, et ne jamais
    gêner la lecture.
-   Utiliser un pseudo-élément `::before` dédié avec `background-image`,
    `background-repeat`, `background-position`, `background-size` et une
    opacité très faible (point de départ : 0,04 à 0,08).
-   Ajouter une couche de fond opaque/translucide derrière le contenu
    pour garantir le contraste.
-   Appliquer le motif à la page de connexion et à l'espace connecté,
    avec des réglages distincts si nécessaire.
-   `pointer-events: none`, `aria-hidden="true"` si un élément HTML est
    utilisé.
-   Ne pas inventer ni redessiner le logo officiel. Ne pas étirer
    l'image ni la déformer.
-   Si l'image n'est pas encore disponible, créer uniquement le point
    d'intégration et un fond de remplacement ; ne pas bloquer le
    développement.

## 4. Tableau de bord --- priorité P0

Repenser le dashboard comme un véritable poste de pilotage des archives.

### Résumé en haut de page

Afficher des cartes de statistiques lisibles : - Rapports de la
période. - Rapports en brouillon / à valider. - Agences actives. -
Cartons recensés. - Incidents ouverts, dont incidents critiques. -
Présences du jour. - Archives traitées et en attente, en indiquant
clairement l'unité.

Les chiffres doivent provenir des données de l'application. **Ne pas
inventer de chiffres ni laisser des valeurs statiques en production.**
Si aucune donnée n'existe, afficher un état vide explicite.

### Visualisations et activité

-   Graphique d'activité par jour/semaine.
-   Répartition par agence.
-   État des incidents par gravité et statut.
-   Présences du jour et répartition des affectations.
-   Liste des derniers rapports et derniers mouvements.
-   Alertes utiles : rapports manquants, brouillons incomplets, écarts
    de totaux, transferts à confirmer, incidents non résolus.
-   Raccourcis : créer un rapport, enregistrer un pointage, ajouter un
    carton, déclarer un incident, ouvrir une synthèse.
-   Chaque carte ou ligne cliquable doit ouvrir le module ou
    l'enregistrement correspondant.
-   Prévoir chargement, erreur, absence de données et mise à jour après
    une action.
-   Ne pas surcharger l'écran : grille responsive, priorités visuelles
    et filtres de période.

## 5. Navigation, menu principal et responsive

### Menu

-   Sur ordinateur : barre latérale repliable en mode complet ou compact
    (icônes seules), avec bouton visible pour replier/réafficher.
-   Mémoriser la préférence localement si cela ne compromet pas la
    sécurité.
-   Sur mobile : menu en tiroir, ouvert depuis la barre supérieure,
    fermé par la croix, par clic sur le voile, par Échap et après
    navigation.
-   Empêcher le défilement de l'arrière-plan lorsque le tiroir mobile
    est ouvert.
-   Mettre en évidence le module actif et proposer une infobulle en mode
    compact.
-   Prévoir un menu accessible au clavier et des attributs ARIA
    appropriés.

### Tailles à tester

Tester au minimum 320, 360, 375, 390, 430, 768, 1024, 1280 et 1440 px.
Vérifier Android (Huawei, Samsung et autres tailles), tablette et
ordinateur.

### Règles responsive

-   Aucun débordement horizontal global.
-   Les cartes passent en 1 colonne sur petits écrans, puis en 2/3/4
    colonnes selon l'espace.
-   Les formulaires deviennent une colonne sur mobile.
-   Les tableaux larges disposent d'une zone de défilement clairement
    indiquée ou d'une présentation adaptée en cartes ; ne pas écraser
    les textes.
-   Les actions essentielles restent accessibles sans survol.
-   Les modales ne dépassent pas la hauteur de l'écran ; contenu
    scrollable, pied de fenêtre utilisable.
-   Les graphiques s'adaptent à la largeur disponible.
-   La taille des caractères et les contrastes restent lisibles.
-   Ajouter des media queries dans les styles partagés plutôt que
    disperser des corrections fragiles.

## 6. Authentification, compte et profil --- priorité P0

### Retirer les comptes de démonstration

-   Enlever de l'écran de connexion la section « Comptes de
    démonstration » et les boutons qui préremplissent des identifiants.
-   Supprimer les identifiants de démonstration du parcours utilisateur
    et vérifier qu'aucun secret ou mot de passe de test n'est embarqué
    dans le code livré.
-   Retirer ou protéger l'action de chargement de données de
    démonstration dans les paramètres : elle ne doit jamais être
    accessible par erreur en environnement réel. Si elle reste pour le
    développement, activer une protection explicite réservée à
    l'environnement de développement.

### Création de compte dans le portail d'archives

-   Ajouter « Créer un compte » depuis la page publique / connexion.
-   Formulaire minimal : nom complet, email professionnel, mot de passe,
    confirmation, acceptation des règles d'accès si nécessaire.
-   Validation côté interface et côté serveur/service d'authentification
    ; messages courts et compréhensibles.
-   Ne pas permettre à un utilisateur de s'attribuer le rôle
    administrateur.
-   Le compte créé doit être en attente d'approbation par un
    administrateur, sauf si une politique d'inscription contrôlée existe
    déjà.
-   Ajouter confirmation d'email, récupération/réinitialisation du mot
    de passe et messages d'erreur sans révéler si un email existe.
-   Protéger contre les doubles soumissions et limiter les tentatives
    abusives.
-   Si le projet ne possède pas de backend sécurisé, ne pas simuler une
    sécurité réelle avec `localStorage` : documenter ce qui doit être
    connecté à un service backend fiable.

### Profil

Ajouter une page/zone profil accessible depuis la barre supérieure : -
Informations personnelles : nom, email, fonction/titre, avatar
facultatif. - Modifier le profil, enregistrer, annuler, voir un retour
de succès/erreur. - Changer le mot de passe via le mécanisme sécurisé
d'authentification. - Afficher le rôle et l'état du compte en lecture
seule. - Dernière connexion si l'information est réellement
disponible. - Déconnexion et confirmation avant action si nécessaire. -
Les changements de rôle et les droits restent exclusivement dans la
gestion administrateur, avec journalisation. - Ne pas permettre de
modifier directement un identifiant immuable ou un rôle privilégié
depuis le profil.

## 7. Améliorations module par module

### 7.1 Rapports journaliers

-   Formulaire organisé en étapes/sections avec indicateur de
    progression et validation claire.
-   Brouillon automatique et sauvegarde explicite avec indicateur «
    Enregistré / Modifications non enregistrées ».
-   Duplication d'un rapport existant avec nouvelle période et nouvel
    identifiant.
-   Recherche, filtres par dates, statut, rédacteur et période.
-   Afficher complétude, version, auteur, date de modification.
-   Avant validation, contrôler les champs obligatoires, les dates, les
    effectifs et les totaux.
-   Conserver un historique des versions et des corrections.
-   Confirmation avant suppression ; journaliser la suppression.
-   Distinguer clairement enregistrer en brouillon, soumettre/valider et
    diffuser.

### 7.2 Synthèses de période

-   Filtres de dates, agences, sites et statut.
-   Générer la synthèse depuis les données enregistrées, pas par
    ressaisie.
-   Modes distincts : « Chef --- confidentiel » et « Équipe --- version
    publique ».
-   Contrôler les droits côté logique métier, pas uniquement en masquant
    un bouton.
-   La version équipe ne doit pas contenir la matrice confidentielle,
    les points sensibles ni des informations personnelles non
    nécessaires.
-   Montrer les jours couverts/manquants, les totaux, les écarts et les
    éléments à confirmer.
-   Permettre aperçu, impression et export.
-   Ajouter une confirmation claire avant génération/diffusion d'un
    rapport confidentiel.

### 7.3 Bordereaux de décharge / transferts

-   Numéro de bordereau unique, date, site de départ et d'arrivée,
    responsables et lignes d'archives.
-   Calcul automatique des totaux de boîtes et conventions sans mélanger
    les unités.
-   Statuts visibles : en transit, réceptionné, validé.
-   Actions : ouvrir, modifier selon droits, imprimer, dupliquer,
    annuler avec motif.
-   Confirmer la réception et tracer l'utilisateur/date.
-   Détecter les incohérences entre départ et réception.

### 7.4 Inventaire des cartons

-   Recherche par numéro, agence, code, exercice, site, emplacement et
    état.
-   Filtres rapides et tri des colonnes.
-   Ajouter, modifier, archiver et supprimer selon les droits.
-   Prévenir les doublons de numéro de carton.
-   États : bon, abîmé, à vérifier, avec indicateurs textuels en plus de
    la couleur.
-   Historique des changements d'emplacement et de site.
-   Vue compacte mobile et fiche détaillée du carton.

### 7.5 Pointage rapide

-   Saisie rapide depuis téléphone, avec date, équipe, site et statut.
-   Actions complètes : ajouter, éditer, supprimer, consulter.
-   Possibilité de modifier le statut (présent, affecté à Mazala,
    travail sur ordinateur, absent) selon le modèle métier existant.
-   Demander une confirmation avant suppression et afficher le nom/date
    du pointage concerné.
-   Contrôler les doublons personne + date et journaliser les
    corrections.
-   Filtres par jour, personne, site, statut et équipe.
-   Récapitulatif automatique : effectif attendu, présents, absents,
    affectations et taux de présence.
-   Prévoir une annulation/restauration si possible, ou une corbeille
    avec délai de rétention, plutôt qu'une suppression irréversible
    immédiate.

### 7.6 Incidents et anomalies

-   Gravité clairement identifiable : faible, moyenne, critique.
-   Statuts : signalé, en cours, résolu.
-   Ajouter responsable du suivi, date cible, actions prises, pièces
    jointes si le stockage est sécurisé.
-   Filtres et tri ; alerte sur incident critique non résolu.
-   Historique des changements de statut.
-   Confirmation avant clôture et commentaire de résolution.

### 7.7 Agences

-   Recherche par nom/code, filtres par statut.
-   Fiche agence avec coordonnées facultatives, conventions, cartons et
    dossiers --- chaque unité reste distincte.
-   Empêcher les codes en double.
-   Ne pas supprimer physiquement une agence déjà utilisée dans les
    rapports : proposer désactivation/archivage.
-   Normaliser les noms tout en conservant les alias utiles.

### 7.8 Conventions et matrice

-   Chaque ligne de données doit être clairement interactive comme une
    action/bouton, sans donner l'impression que toute la ligne est
    cliquable si ce n'est pas le cas.
-   Ajouter un focus clavier visible, un état au survol et une sélection
    active.
-   Colorer sobrement les cellules T / A / O / --- en gardant la palette
    UBA et un contraste suffisant.
-   Ne pas se baser uniquement sur la couleur : afficher code/texte ou
    infobulle.
-   Filtres par agence, exercice, statut et unité.
-   Afficher l'unité à côté de chaque quantité ; ne jamais additionner
    conventions, boîtes et dossiers.
-   Modifier une cellule avec un formulaire contrôlé, validation et
    journal d'audit.
-   Ajouter une légende visible, une recherche et un export/print
    adapté.
-   Ajouter un avertissement si un exercice marqué traité est encore en
    attente ailleurs.

### 7.9 Équipe archiviste

-   Recherche, filtres par site, catégorie, statut et groupe.
-   Fiche membre avec nom officiel, alias, catégorie, site et état
    actif.
-   Ajouter, modifier, désactiver et supprimer selon les droits.
-   Avertir avant suppression si le membre apparaît dans d'anciens
    rapports ; préférer la désactivation pour préserver l'historique.
-   Harmoniser les noms et alias sans fusion automatique destructive.
-   Améliorer la lisibilité du tableau et les actions sur mobile.

### 7.10 Journal d'audit

-   Afficher date/heure, utilisateur, action, module, cible et résultat.
-   Recherche et filtres par période, utilisateur, module et type
    d'action.
-   Journal non modifiable par les utilisateurs ordinaires.
-   Tracer connexions, créations, modifications, suppressions,
    validations, exports et changements de droits.
-   Ne pas enregistrer les mots de passe, jetons ou secrets.
-   Prévoir export restreint selon les droits.

### 7.11 Utilisateurs et droits

-   Gestion claire des rôles existants (super_admin, admin, user), puis
    évolution contrôlée si de nouveaux rôles métier sont nécessaires.
-   Création/désactivation de compte, réinitialisation sécurisée,
    attribution de droits avec confirmation.
-   Vérifier les permissions sur chaque action sensible, y compris au
    niveau des données.
-   Protéger le dernier super-administrateur contre une désactivation
    accidentelle.
-   Tracer les changements de rôle et d'état.
-   Ne pas exposer les comptes ni données sensibles dans les messages
    d'erreur.

### 7.12 Paramètres et données

-   Séparer paramètres d'affichage, préférences utilisateur,
    référentiels, sauvegardes et maintenance.
-   Ajouter confirmation avant import, restauration, purge ou
    réinitialisation.
-   Prévisualiser un import et signaler les lignes erronées avant
    validation.
-   Fournir export de sauvegarde et procédure de restauration
    documentée.
-   Afficher l'état réel des données et le dernier succès d'une
    opération, sans faux message de réussite.
-   Garder les données de démonstration hors production.
-   Ne jamais proposer une suppression globale sans confirmation
    renforcée, résumé des éléments touchés et possibilité de sauvegarde.

## 8. Rapports imprimés et PDF --- priorité P0

La qualité des documents imprimés est essentielle. Créer une feuille de
style d'impression dédiée, indépendante du thème dark.

### Résultat attendu

-   Document blanc, net et administratif.
-   Identité UBA et emplacement réservé au logo officiel fourni.
-   En-tête : titre, période, agence/site, statut et niveau de
    confidentialité.
-   Métadonnées utiles : auteur, date de génération, numéro/version du
    rapport.
-   Sections hiérarchisées, tableaux alignés, bordures discrètes et
    lignes alternées.
-   Pied de page avec pagination, date d'édition et mention de
    confidentialité si nécessaire.
-   Espacement régulier, police lisible, nombres alignés, unités
    explicites.
-   Aucune barre latérale, navbar, bouton, filtre, modal ou arrière-plan
    décoratif dans le document imprimé.
-   Le motif UBA en arrière-plan de l'application ne doit pas nuire à
    l'impression. Par défaut, le retirer à l'impression ; ajouter un
    filigrane très discret uniquement si validé.
-   Respecter A4 portrait/paysage selon le document. Définir des marges
    et éviter les coupures de titres ou de lignes.
-   Utiliser `@media print`, `@page`, `break-inside: avoid`,
    `break-before`/`break-after` avec discernement.
-   Les tableaux longs répètent leur en-tête sur chaque page si
    possible.
-   Prévoir aperçu avant impression et vérifier les exports PDF sur
    plusieurs navigateurs.
-   Éviter les captures d'écran comme unique méthode de production d'un
    document administratif si un PDF texte/structuré est possible.
-   Si `html2canvas` + `jsPDF` est conservé, vérifier le texte lisible,
    la netteté, la pagination et les longues tables. Choisir la méthode
    la plus fiable pour chaque type de rapport.

### Modèles à vérifier

-   Rapport journalier.
-   Synthèse confidentielle du chef.
-   Synthèse de l'équipe.
-   Bordereau de décharge/transfert.
-   Rapport de pointage.
-   Fiche agence et inventaire cartons.

Ajouter un mode « aperçu avant impression », des boutons distincts «
Imprimer » et « Exporter en PDF », et des noms de fichiers
compréhensibles.

## 9. Architecture, qualité et sécurité

### Préserver les données

-   Faire une copie de sauvegarde/branche Git avant modification.
-   Identifier comment les données sont réellement persistées
    aujourd'hui.
-   Vérifier `DataContext.tsx`, `AuthContext.tsx`, `initialData.ts` et
    les interactions entre modules.
-   Ne pas remplacer un stockage existant par un autre sans migration
    explicite.
-   Si les données sont actuellement seulement en mémoire ou dans le
    navigateur, le signaler clairement et proposer une migration
    sécurisée vers une base backend adaptée. Ne jamais prétendre qu'une
    connexion locale est une authentification bancaire sécurisée.

### Sécurité

-   Ne jamais stocker de mots de passe en clair.
-   Ne pas se fier uniquement au contrôle d'accès de l'interface.
-   Valider les données avant enregistrement et lors de la lecture.
-   Protéger les actions sensibles et les exports confidentiels.
-   Limiter les données personnelles affichées et exportées selon le
    rôle.
-   Journaliser les opérations sensibles sans enregistrer de secrets.
-   Ne pas inclure de vraies données bancaires dans les tests, captures
    d'écran ou jeux de démonstration.
-   Ne pas ajouter de backend, service externe ou dépendance payante
    sans l'expliquer et sans vérifier la compatibilité.

### Qualité du code

-   Réutiliser les composants communs : bouton, champ, badge, carte,
    tableau, modal, confirmation, état vide, chargement, alerte.
-   Extraire progressivement les styles en ligne vers des classes ou
    composants partagés.
-   Garder TypeScript strict et corriger les erreurs de compilation.
-   Éviter les réécritures complètes qui rendent le diagnostic
    difficile.
-   Ne pas ajouter de bibliothèque de graphiques si une solution légère
    et compatible suffit.
-   Utiliser des clés React stables, des formulaires contrôlés et des
    retours d'état accessibles.
-   Respecter les dépendances déjà présentes quand elles sont
    suffisantes.

## 10. Règles de calcul et intégrité métier

Le plan métier existant indique plusieurs règles importantes à préserver
et renforcer :

1.  Un rapport couvre une période (`dateDebut`, `dateFin`) et pas
    forcément une seule date.
2.  Le total calculé doit correspondre à la somme des lignes sources ;
    signaler et empêcher la validation si l'écart n'est pas résolu.
3.  Ne jamais mélanger conventions, boîtes/cartons et dossiers dans un
    même total.
4.  Séparer le code agence de la quantité.
5.  Normaliser les noms à l'aide de référentiels et d'alias.
6.  Gérer les brouillons incomplets et afficher le taux de complétude.
7.  Repérer les jours ouvrés sans rapport si le calendrier de travail
    est configuré.
8.  Détecter les incohérences entre transfert, réception et matrice des
    exercices.
9.  Préserver les anciennes versions des rapports validés.
10. La synthèse confidentielle et la synthèse publique doivent être
    générées à partir de la même source de données, avec filtrage des
    champs selon le rôle.

Toute règle métier nouvelle doit être documentée et testée.

## 11. Plan d'exécution par étapes

### Phase 0 --- Audit et sécurisation

-   Lire le plan métier et chaque composant.
-   Dresser l'inventaire des fonctionnalités présentes, manquantes et
    cassées.
-   Identifier le stockage, les accès, les calculs et la génération
    d'impression.
-   Sauvegarder le projet.
-   Écrire une liste de risques et un plan de test.

### Phase 1 --- Socle visuel

-   Mettre en place les variables CSS et composants communs.
-   Uniformiser boutons, champs, cartes, tableaux, modales, alertes et
    badges.
-   Définir le thème dark/blanc et les contrastes.
-   Préparer l'emplacement du motif UBA sans attendre l'image finale.

### Phase 2 --- Navigation et responsive

-   Ajouter le menu desktop repliable et le tiroir mobile.
-   Corriger les débordements, tableaux, formulaires et modales.
-   Tester toutes les largeurs prévues dans la section 5.

### Phase 3 --- Connexion et profil

-   Retirer les comptes de démonstration de l'interface.
-   Implémenter l'inscription contrôlée et le profil en cohérence avec
    l'architecture réelle.
-   Vérifier les rôles et permissions.

### Phase 4 --- Dashboard

-   Ajouter les indicateurs calculés, visualisations, activités
    récentes, alertes et raccourcis.
-   Brancher chaque indicateur à la source réelle.
-   Gérer les états vides et erreurs.

### Phase 5 --- Modules métier

Traiter dans cet ordre : rapports journaliers, synthèses, bordereaux,
pointage, conventions/matrice, cartons, agences, incidents, équipe,
utilisateurs, audit, paramètres.

### Phase 6 --- Impression

-   Définir les modèles d'impression.
-   Vérifier A4, sauts de page, tableaux longs, numéros, dates, en-têtes
    et pieds de page.
-   Tester les PDF et les versions confidentielle/publique.

### Phase 7 --- Vérification finale

-   Lancer les scripts existants de vérification et de build.
-   Corriger les erreurs TypeScript et de build.
-   Tester les parcours principaux manuellement.
-   Vérifier l'absence de débordement mobile et les interactions
    clavier.
-   Fournir un rapport des fichiers modifiés, fonctionnalités réalisées,
    tests exécutés et limites restantes.

## 12. Critères d'acceptation obligatoires

-   [ ] L'application démarre et compile sans erreur.
-   [ ] Aucune fonctionnalité métier existante n'a disparu sans décision
    documentée.
-   [ ] Thème dark/blanc cohérent sur toutes les pages.
-   [ ] Boutons et composants rectangulaires à coins légèrement
    arrondis.
-   [ ] Motif UBA prêt à recevoir l'image officielle et lisible en
    arrière-plan.
-   [ ] Menu repliable sur ordinateur et tiroir fonctionnel sur mobile.
-   [ ] Pages utilisables dès 320 px de largeur.
-   [ ] Inscription contrôlée disponible depuis la page publique.
-   [ ] Comptes de démonstration retirés du parcours de connexion.
-   [ ] Profil modifiable selon les droits, sans auto-attribution de
    rôle.
-   [ ] Dashboard alimenté par les données réelles.
-   [ ] Pointage : ajouter, modifier, supprimer avec confirmation et
    traçabilité.
-   [ ] Matrice conventions : lignes/cellules interactives, légende,
    contraste et unités visibles.
-   [ ] Synthèse confidentielle inaccessible aux rôles non autorisés.
-   [ ] Documents imprimés propres en A4, sans interface applicative.
-   [ ] Sauvegarde/export et opérations destructrices protégés.
-   [ ] Les erreurs, chargements et états vides sont gérés.
-   [ ] Aucun secret ou mot de passe réel dans le dépôt.
-   [ ] Les tests et limites sont rapportés honnêtement.

## 13. Consignes de travail à l'agent IA / développeur

1.  Commence par examiner l'intégralité du code source et le plan
    métier.
2.  Donne un audit court : état actuel, risques, priorités et fichiers
    concernés.
3.  Ensuite, effectue les modifications dans le dépôt existant, par
    étapes cohérentes.
4.  Ne te contente pas de fournir des recommandations ou une maquette :
    implémente les changements possibles.
5.  Avant toute modification destructive, sauvegarde les données et
    explique l'impact.
6.  Ne fabrique pas l'image UBA : utilise un emplacement temporaire
    jusqu'à ce que l'utilisateur fournisse le fichier officiel.
7.  Si une fonctionnalité nécessite un backend qui n'existe pas,
    explique précisément ce qui manque et implémente une interface prête
    à être connectée sans prétendre que la sécurité est complète.
8.  À la fin, fournis :
    -   le résumé des changements ;
    -   les fichiers principaux modifiés ;
    -   les commandes exécutées et leurs résultats ;
    -   les fonctionnalités restant à connecter ;
    -   les tests manuels recommandés ;
    -   les éventuelles migrations nécessaires.
9.  Ne déclare pas le projet « parfait » si les tests n'ont pas été
    exécutés.
10. Priorité absolue : fiabilité des données, lisibilité, sécurité,
    impression correcte, rapidité et simplicité d'utilisation.

**Commence par la Phase 0, puis avance étape par étape.**
