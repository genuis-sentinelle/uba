# 🚀 PROMPT D'INGÉNIERIE : MOTEUR D'ULTRA-DENSITÉ, ISOLATION D'IMPRESSION BLANCHE & ERGONOMIE MOBILE / IOS

## 🎯 OBJECTIF GLOBAL
Améliore cette application web en intégrant un **Moteur d'Ultra-Densité à 4 niveaux**, une **responsivité mobile/iOS native de haute volée**, une **isolation hermétique des documents d'impression (fond blanc pur sans fuite du mode sombre)**, et un **inspecteur de personnalisation intégrale des documents**.

---

### 🛠️ SKILLS RECOMMANDÉS À MOBILISER
Pour garantir une exécution rigoureuse sans régressions visuelles :
* **`frontend-design` & `frontend-design-pro`** : Pour l'architecture des variables CSS, la hiérarchie tactile et les finitions visuelles.
* **`systematic-debugging`** : Pour éliminer tout conflit d'héritage CSS sombre lors de l'impression papier et des exports PDF (`html2canvas` / `jsPDF`).
* **`verification-before-completion`** : Pour exécuter la vérification stricte du build (`npm run build` / `tsc`) avant toute livraison.

---

## 1. 🔬 MOTEUR D'ULTRA-DENSITÉ & RÉDUCTION MICRO-ÉCHELLE (GLOBAL APP)

Mets en place un système de densité d'interface globale piloté par un attribut racine `[data-density="..."]` sur `<html>` ou `<body>`, stocké dans le `localStorage` et administrable via un Context ou Store réactif.

### 📊 Matrice Stricte des 4 Niveaux de Densité :
| Niveau de Densité | Boutons (hauteur) | Tables (padding cellule) | Textes & Formulaires | Usage Idéal |
| :--- | :---: | :---: | :---: | :--- |
| **🖥️ Normal (100%)** | `40px` | `10px 12px` | `14px` / Base 100% | Confort standard sur grand écran |
| **📐 Compact (88%)** | `32px` | `6px 10px` | `12.5px` / Réduction 15% | Écrans portables et fenêtres réduites |
| **⚡ Ultra-Compact (75%)** | `26px` | `4px 6px` | `11px` / Réduction 25% | Visualisation dense de listes volumineuses |
| **🔬 Micro (65%)** | `22px` | `2px 4px` | `9.5-10px` / Réduction 35% | Affichage compact maximal sans défilement |

### 🎛️ Découplage Taille des Composants / Taille des Textes :
* Permets la réduction drastique de l'encombrement des tables et boutons **sans forcément rapetisser les écrits** si l'utilisateur souhaite préserver sa lisibilité (séparation de `data-density` pour les paddings/hauteurs et `data-font-size` pour l'échelle typographique).
* Intègre un bouton de bascule rapide (Cycle : `Normal ➔ Compact ➔ Ultra ➔ Micro`) dans la barre de navigation supérieure, ainsi qu'une section dédiée dans les Paramètres.

---

## 2. 📄 ISOLATION HERMÉTIQUE DES DOCUMENTS D'IMPRESSION (FOND BLANC PUR)

Élimine formellement le problème classique où le mode sombre de l'application bave sur les aperçus A4, les exports PDF ou l'impression papier :
1. **Conteneur Isolé `.doc-sheet-isolated` :**
   * Encapsule tout document imprimable avec des variables dédiées forcées :  
     `--doc-bg: #FFFFFF !important`, `--doc-text: #111111 !important`, `--doc-border: #E5E7EB !important`.
   * Interdis formellement l'utilisation de classes du thème d'application (comme `.card`, `.panel` ou `var(--surface)`) qui héritent du fond noir ou gris.
2. **Support `@media print` & `html2canvas` / `jsPDF` :**
   * Neutralise les ombres (`box-shadow: none`), supprime les lueurs et force `-webkit-print-color-adjust: exact`.
   * Détecte automatiquement l'orientation (`A4 portrait` vs `A4 landscape`) pour générer un PDF aux dimensions exactes sans rognage.

---

## 3. 🎨 INSPECTEUR DE PERSONNALISATION INTÉGRALE DES DOCUMENTS

Crée un modal ou tiroir inspecteur interactif permettant de modifier **absolument tous les éléments du document** avant impression ou export :
* **Titres & Textes :** Surcharge de chaque titre officiel, sous-titre de mission, sigle/logo, et intitulés de chaque section (y compris les libellés initialement codés en dur).
* **Tableaux & Colonnes :** Renommage individuel de chaque en-tête de colonne, visibilité colonne par colonne, et densité dédiée au document (`Micro 7pt`, `Compact 8pt`, `Normal 9pt`).
* **Couleurs & Fond :** Sélecteur de fond de page (Blanc pur standard `#FFFFFF`, Ivoire doux `#FAFAF8`, papier écru ou couleur libre), couleur du bandeau, couleur du texte, couleur des zébrures alternées et bordures.
* **Typographies & Marges :** Choix de la police (Chakra Petch, Inter, JetBrains Mono, Arial, Times/Serif), échelle de taille de police et marges de page (Étroites 8mm, Normales 14mm, Larges 20mm).
* **Signatures & Bas de page :** Rôles et noms personnalisables pour les signataires, plus clause de confidentialité libre.

---

## 4. 📱 ERGONOMIE MOBILE & COMPATIBILITÉ IOS

1. **Tables Tactiles Fluides :**
   * Enveloppe tous les tableaux dans un conteneur défilant horizontalement avec `-webkit-overflow-scrolling: touch` et scrollbars fines adaptées.
   * Empêche tout débordement hors écran sur les smartphones (< 768px).
2. **Modales Bottom-Sheet :**
   * Transforme automatiquement les fenêtres modales en feuilles glissantes ancrées au bas de l'écran sur mobile.
   * Respecte scrupuleusement les zones sécurisées d'Apple :  
     `padding-bottom: calc(16px + env(safe-area-inset-bottom, 0px))`.
3. **Barres d'outils et zooms adaptatifs :**
   * Pour les prévisualisations A4, fournis une barre d'actions compacte avec curseur de zoom et boutons `Zoom -`, `Zoom +` et `100%` pour inspecter facilement le document sur petit écran.

---

## 5. ✅ CRITÈRES DE RECETTE & VÉRIFICATION
Avant de considérer le travail terminé :
1. Lance la commande de compilation de production (`npm run build` ou équivalent) et vérifie qu'il y a `0 erreur`.
2. Vérifie qu'en basculant en mode sombre et en mode clair, le document A4 reste **100% blanc pur et parfaitement lisible**.
3. Teste les 4 niveaux de densité (`Normal`, `Compact`, `Ultra`, `Micro`) pour attester de la réduction effective des composants.
