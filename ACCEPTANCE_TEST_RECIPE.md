# ARCHIVA UBA — Cahier de Recette & Validation E2E

Ce document détaille les scénarios de test d'acceptation fonctionnelle, technique et de sécurité pour certifier la version modernisée d'**ARCHIVA UBA**.

---

## Matrice Récapitulative des Rôles & Droits

| Module / Action | Stagiaire | Administrateur | Super Administrateur |
|---|:---:|:---:|:---:|
| **Consultation générale** (Rapports, Inventaire, Bordereaux) | ✅ Lecture seule | ✅ Lecture | ✅ Lecture |
| **Saisie / Modification** (Rapports, Inventaire, Bordereaux) | ❌ Non | ✅ Oui (si non archivé) | ✅ Oui (si non archivé) |
| **Archivage unitaire de document** | ❌ Non | ✅ Oui | ✅ Oui |
| **Désarchivage de document** | ❌ Non | ✅ Oui | ✅ Oui |
| **Suppression définitive d'un document** | ❌ Non | ❌ Formellement interdit | ✅ Oui |
| **Génération / Inspection des clichés hebdomadaires** | ❌ Non | ✅ Oui | ✅ Oui |
| **Création d'utilisateurs** | ❌ Non | ✅ Stagiaires uniquement | ✅ Stagiaires & Administrateurs |
| **Blocage / Déblocage d'utilisateurs** | ❌ Non | ✅ Stagiaires uniquement | ✅ Stagiaires & Administrateurs |
| **Suppression définitive d'un utilisateur** | ❌ Non | ❌ Formellement interdit | ✅ Oui (sauf compte propre & super_admin unique) |
| **Export / Impression papier & raccourcis (Ctrl+P, Ctrl+S)** | ❌ Bloqué par politique | ✅ Autorisé | ✅ Autorisé |

---

## Scénarios de Test d'Acceptation

### 1. Initialisation Sécurisée (Bootstrap Super Admin)
- [ ] **1.1. Verrou unique** : Sur une base fraîche, ouvrir `/`. L'interface de configuration du Super Administrateur s'affiche.
- [ ] **1.2. Règles de mot de passe** : Tenter un mot de passe de moins de 10 caractères ou sans combinaison lettre + chiffre. Le système refuse avec un message explicite.
- [ ] **1.3. Création atomique** : Renseigner les champs valides et valider. Le compte est créé et la table `bootstrap_lock` est verrouillée.
- [ ] **1.4. Inviolabilité** : Une tentative ultérieure d'appel POST sur `/api/auth/bootstrap` renvoie immédiatement une erreur HTTP `403 Verrouillé`.

### 2. Gestion des Utilisateurs & Révocation
- [ ] **2.1. Création par un Administrateur** : Connecté en tant qu'administrateur, tenter de créer un autre administrateur. Le système refuse (seul le rôle `stagiaire` est disponible).
- [ ] **2.2. Générateur cryptographique** : Cliquer sur "Générer un mot de passe sécurisé". Un mot de passe de 14 caractères haute entropie est généré et copiable en un clic.
- [ ] **2.3. Blocage immédiat** : Bloquer un compte utilisateur. Dans les 20 secondes, la session active de cet utilisateur est révoquée, il est redirigé vers l'écran de connexion avec une bannière explicative : *"Votre compte a été désactivé ou bloqué par un administrateur."*
- [ ] **2.4. Suppression contrôlée** : Tenter de supprimer un utilisateur en tant qu'administrateur standard (bouton masqué, API rejette en 403). Seul le Super Administrateur peut supprimer un compte.

### 3. Archivage Unitaire des Documents
- [ ] **3.1. Bouton "Archiver"** : Sur un rapport journalier, bordereau ou synthèse, cliquer sur "Archiver". Une boîte de dialogue de confirmation s'affiche.
- [ ] **3.2. Immuabilité stricte** : Une fois archivé, les boutons d'édition sont masqués. Toute tentative d'UPDATE ou DELETE directe en base PostgreSQL est rejetée par le trigger `guard_archived_rows`.
- [ ] **3.3. Filtre "Actifs / Archivés / Tous"** : Changer le filtre dans la vue. Les documents archivés apparaissent avec le badge "ARCHIVÉ" et la date d'archivage.
- [ ] **3.4. Module Archives (Onglet 1)** : Aller dans le module "Archives", onglet "Documents archivés". Retrouver tous les documents unitaires archivés avec recherche textuelle et filtrage par type.

### 4. Clichés Hebdomadaires & Inspection Deep
- [ ] **4.1. Génération de cliché (Onglet 2)** :
  - Option A : "Semaine en cours" (lundi à dimanche).
  - Option B : "Période personnalisée" avec sélecteur de dates locales.
- [ ] **4.2. Empreinte SHA-256** : Vérifier que le hash SHA-256 est calculé et stocké de manière immuable.
- [ ] **4.3. Trigger de protection** : Tenter une modification du cliché (bloqué par `guard_snapshots`).
- [ ] **4.4. Modal d'inspection** : Cliquer sur l'œil d'un cliché pour inspecter la répartition des lignes, copier le hash SHA-256, prévisualiser le JSON et le télécharger.

### 5. Résilience & Expérience Utilisateur
- [ ] **5.1. Déconnexion réseau (Mode hors-ligne)** : Couper la connexion internet (ou passer le navigateur en mode Offline). Un badge ambre "Mode Hors-ligne" s'affiche discrètement dans la barre supérieure.
- [ ] **5.2. Gestion des erreurs React (Error Boundary)** : En cas d'erreur de rendu inattendue, un écran sombre aux couleurs UBA s'affiche avec la possibilité de copier le diagnostic technique et de recharger en un clic.
- [ ] **5.3. Synchronisation matrice** : Ajouter un carton ou un transfert. Se rendre sur la "Matrice Conventions" : les indicateurs et statuts (T / A / O) sont recalculés instantanément.
