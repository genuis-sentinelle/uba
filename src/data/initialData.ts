import { Agency, TeamMember, DailyReport, SynthesisReport, User, LogEntry, ArchiveIncident, CartonInventory, TransferSlip } from '../types';

/**
 * ARCHIVA UBA — Données Opérationnelles Initiales
 * Source : Notes de terrain & Carnet de supervision (13 au 16 octobre 2026)
 * Équipe Archiviste UBA Congo (Sites Maya-Maya & Mazala)
 * Toutes les données sont modifiables et synchronisées avec le backend Supabase.
 */

export const INITIAL_AGENCIES: Agency[] = [
  {
    id: 'ag-901',
    code: '901',
    nom: 'City Center',
    description: 'Agence Principale City Center — Traitement & Contrôle',
    conventionsCount: 111,
    cartonsCount: 11,
    dossiersCount: 581,
    statut: 'active',
    dateCreation: '2026-01-01'
  },
  {
    id: 'ag-902',
    code: '902',
    nom: 'Poto-Poto',
    description: 'Agence Poto-Poto — Traitement & Vérification',
    conventionsCount: 17,
    cartonsCount: 3,
    dossiersCount: 2,
    statut: 'active',
    dateCreation: '2026-01-01'
  },
  {
    id: 'ag-904',
    code: '904',
    nom: 'Bacongo',
    description: 'Agence Bacongo (BAX) — Tri, Contrôle & Attente',
    conventionsCount: 39,
    cartonsCount: 6,
    dossiersCount: 242,
    statut: 'active',
    dateCreation: '2026-01-01'
  },
  {
    id: 'ag-906',
    code: '906',
    nom: 'Maya-Maya',
    description: 'Agence & Site Central Maya-Maya — Réception & Contrôle',
    conventionsCount: 105,
    cartonsCount: 4,
    dossiersCount: 0,
    statut: 'active',
    dateCreation: '2026-01-01'
  },
  {
    id: 'ag-907',
    code: '907',
    nom: 'Moungali',
    description: 'Agence Moungali — Conventions Oubliées & Prolongation',
    conventionsCount: 0,
    cartonsCount: 1,
    dossiersCount: 23,
    statut: 'active',
    dateCreation: '2026-01-01'
  },
  {
    id: 'ag-909',
    code: '909',
    nom: 'Plateau-Ville',
    description: 'Agence Plateau-Ville — Recensement Oubliés',
    conventionsCount: 0,
    cartonsCount: 2,
    dossiersCount: 68,
    statut: 'active',
    dateCreation: '2026-01-01'
  },
  {
    id: 'ag-910',
    code: '910',
    nom: 'Mazala',
    description: 'Site Central de Traitement & Dépôt Mazala',
    conventionsCount: 1441,
    cartonsCount: 15,
    dossiersCount: 9612,
    statut: 'active',
    dateCreation: '2026-01-01'
  }
];

export const INITIAL_USERS: User[] = [];

export const INITIAL_MEMBERS: TeamMember[] = [
  {
    id: 'tm-1',
    nomOfficiel: "Chef d'Équipe Archiviste",
    alias: ['Chef', 'Archiviste'],
    categorie: 'chef',
    site: 'Maya-Maya',
    actif: true
  },
  {
    id: 'tm-2',
    nomOfficiel: 'Superviseur Maya-Maya',
    alias: ['Superviseur'],
    categorie: 'superviseur',
    site: 'Maya-Maya',
    actif: true
  },
  {
    id: 'tm-3',
    nomOfficiel: 'Superviseur Mazala',
    alias: ['Superviseur Mazala'],
    categorie: 'superviseur',
    site: 'Mazala',
    actif: true
  },
  {
    id: 'tm-4',
    nomOfficiel: 'Lorich',
    alias: ['Lorich'],
    categorie: 'nouveau_stagiaire',
    site: 'Mazala',
    actif: true
  },
  {
    id: 'tm-5',
    nomOfficiel: 'Déo',
    alias: ['Déo'],
    categorie: 'nouveau_stagiaire',
    site: 'Mazala',
    actif: true
  }
];

export const INITIAL_DAILY_REPORTS: DailyReport[] = [
  {
    id: 'dr-2026-10-12-14-mazala',
    titre: "Rapport d'Activité — Site de Mazala (Période du 12 au 14/10/2026)",
    dateDebut: '2026-10-12',
    dateFin: '2026-10-14',
    horaires: '07:30 - 16:30',
    chefNom: 'Équipe Archiviste UBA',
    superviseurs: ['Lorich', 'Déo'],
    effectifTotal: 2,
    presents: 2,
    absents: 0,
    equipeMazala: ['Lorich (Stagiaire)', 'Déo (Stagiaire)'],
    equipeOrdinateur: [],
    groupes: [
      {
        nom: 'Équipe Archiviste Mazala',
        membres: ['Lorich', 'Déo'],
        tachesAssignees: 'Comptage physique et récolement des dossiers par agence et par année (2018–2024)'
      }
    ],
    taches: [
      {
        numero: 1,
        titre: 'Comptage physique des dossiers 2018 par agence (9 069 dossiers)',
        horaire: '12 au 14/10/2026',
        description: 'Dénombrement physique exhaustif de l\'exercice 2018 sur Mazala : 9 069 dossiers recensés représentant 98,7 % du volume total (BaCongo : 2 445, Mougali : 2 291, City Center : 2 260, Poto Poto : 2 073).'
      },
      {
        numero: 2,
        titre: 'Recensement des exercices 2019 à 2024 (120 dossiers)',
        horaire: '12 au 14/10/2026',
        description: 'Inventaire des exercices secondaires : 2019 (21 dossiers), 2020 (6 dossiers), 2021 (69 dossiers dont 61 Maya Maya), 2022 (8 dossiers dont 1 Plateau-Ville), 2023 (4 dossiers), 2024 (12 dossiers).'
      },
      {
        numero: 3,
        titre: 'Vérification arithmétique et concordance des relevés manuscrits',
        horaire: '14 au 15/10/2026',
        description: 'Vérification ligne par ligne et agence par agence : concordance certifiée à 100% sur un total général de 9 189 dossiers. Validation de la case barrée d\'une croix pour BaCongo 2022 (aucun dossier).'
      }
    ],
    transferts: [
      // 901 City Center — Total 2 272 (24,7 %)
      {
        id: 'mv-mazala-901-2018',
        agenceId: 'ag-901',
        agenceNom: 'City Center',
        code: '901',
        exercice: 2018,
        conventions: 2260,
        boites: 0,
        traitement: 'Dossiers recensés à Mazala'
      },
      {
        id: 'mv-mazala-901-2019',
        agenceId: 'ag-901',
        agenceNom: 'City Center',
        code: '901',
        exercice: 2019,
        conventions: 8,
        boites: 0,
        traitement: 'Dossiers recensés à Mazala'
      },
      {
        id: 'mv-mazala-901-2022',
        agenceId: 'ag-901',
        agenceNom: 'City Center',
        code: '901',
        exercice: 2022,
        conventions: 3,
        boites: 0,
        traitement: 'Dossiers recensés à Mazala'
      },
      {
        id: 'mv-mazala-901-2023',
        agenceId: 'ag-901',
        agenceNom: 'City Center',
        code: '901',
        exercice: 2023,
        conventions: 1,
        boites: 0,
        traitement: 'Dossiers recensés à Mazala'
      },

      // 902 Poto Poto — Total 2 093 (22,8 %)
      {
        id: 'mv-mazala-902-2018',
        agenceId: 'ag-902',
        agenceNom: 'Poto Poto',
        code: '902',
        exercice: 2018,
        conventions: 2073,
        boites: 0,
        traitement: 'Dossiers recensés à Mazala'
      },
      {
        id: 'mv-mazala-902-2019',
        agenceId: 'ag-902',
        agenceNom: 'Poto Poto',
        code: '902',
        exercice: 2019,
        conventions: 3,
        boites: 0,
        traitement: 'Dossiers recensés à Mazala'
      },
      {
        id: 'mv-mazala-902-2021',
        agenceId: 'ag-902',
        agenceNom: 'Poto Poto',
        code: '902',
        exercice: 2021,
        conventions: 6,
        boites: 0,
        traitement: 'Dossiers recensés à Mazala'
      },
      {
        id: 'mv-mazala-902-2022',
        agenceId: 'ag-902',
        agenceNom: 'Poto Poto',
        code: '902',
        exercice: 2022,
        conventions: 3,
        boites: 0,
        traitement: 'Dossiers recensés à Mazala'
      },
      {
        id: 'mv-mazala-902-2024',
        agenceId: 'ag-902',
        agenceNom: 'Poto Poto',
        code: '902',
        exercice: 2024,
        conventions: 8,
        boites: 0,
        traitement: 'Dossiers recensés à Mazala'
      },

      // 904 BaCongo — Total 2 461 (26,8 %)
      {
        id: 'mv-mazala-904-2018',
        agenceId: 'ag-904',
        agenceNom: 'BaCongo',
        code: '904',
        exercice: 2018,
        conventions: 2445,
        boites: 0,
        traitement: 'Dossiers recensés à Mazala'
      },
      {
        id: 'mv-mazala-904-2019',
        agenceId: 'ag-904',
        agenceNom: 'BaCongo',
        code: '904',
        exercice: 2019,
        conventions: 10,
        boites: 0,
        traitement: 'Dossiers recensés à Mazala'
      },
      {
        id: 'mv-mazala-904-2020',
        agenceId: 'ag-904',
        agenceNom: 'BaCongo',
        code: '904',
        exercice: 2020,
        conventions: 3,
        boites: 0,
        traitement: 'Dossiers recensés à Mazala'
      },
      {
        id: 'mv-mazala-904-2021',
        agenceId: 'ag-904',
        agenceNom: 'BaCongo',
        code: '904',
        exercice: 2021,
        conventions: 1,
        boites: 0,
        traitement: 'Dossiers recensés à Mazala'
      },
      {
        id: 'mv-mazala-904-2023',
        agenceId: 'ag-904',
        agenceNom: 'BaCongo',
        code: '904',
        exercice: 2023,
        conventions: 1,
        boites: 0,
        traitement: 'Dossiers recensés à Mazala'
      },
      {
        id: 'mv-mazala-904-2024',
        agenceId: 'ag-904',
        agenceNom: 'BaCongo',
        code: '904',
        exercice: 2024,
        conventions: 1,
        boites: 0,
        traitement: 'Dossiers recensés à Mazala'
      },

      // 906 Maya Maya — Total 67 (0,7 %)
      {
        id: 'mv-mazala-906-2021',
        agenceId: 'ag-906',
        agenceNom: 'Maya Maya',
        code: '906',
        exercice: 2021,
        conventions: 61,
        boites: 0,
        traitement: 'Dossiers recensés à Mazala'
      },
      {
        id: 'mv-mazala-906-2022',
        agenceId: 'ag-906',
        agenceNom: 'Maya Maya',
        code: '906',
        exercice: 2022,
        conventions: 1,
        boites: 0,
        traitement: 'Dossiers recensés à Mazala'
      },
      {
        id: 'mv-mazala-906-2023',
        agenceId: 'ag-906',
        agenceNom: 'Maya Maya',
        code: '906',
        exercice: 2023,
        conventions: 2,
        boites: 0,
        traitement: 'Dossiers recensés à Mazala'
      },
      {
        id: 'mv-mazala-906-2024',
        agenceId: 'ag-906',
        agenceNom: 'Maya Maya',
        code: '906',
        exercice: 2024,
        conventions: 3,
        boites: 0,
        traitement: 'Dossiers recensés à Mazala'
      },

      // 907 Mougali — Total 2 295 (25,0 %)
      {
        id: 'mv-mazala-907-2018',
        agenceId: 'ag-907',
        agenceNom: 'Mougali',
        code: '907',
        exercice: 2018,
        conventions: 2291,
        boites: 0,
        traitement: 'Dossiers recensés à Mazala'
      },
      {
        id: 'mv-mazala-907-2020',
        agenceId: 'ag-907',
        agenceNom: 'Mougali',
        code: '907',
        exercice: 2020,
        conventions: 3,
        boites: 0,
        traitement: 'Dossiers recensés à Mazala'
      },
      {
        id: 'mv-mazala-907-2021',
        agenceId: 'ag-907',
        agenceNom: 'Mougali',
        code: '907',
        exercice: 2021,
        conventions: 1,
        boites: 0,
        traitement: 'Dossiers recensés à Mazala'
      },

      // 909 Plateau-Ville — Total 1 (0,0 %)
      {
        id: 'mv-mazala-909-2022',
        agenceId: 'ag-909',
        agenceNom: 'Plateau-Ville',
        code: '909',
        exercice: 2022,
        conventions: 1,
        boites: 0,
        traitement: 'Dossiers recensés à Mazala'
      }
    ],
    receptions: [],
    chronologie: [
      { heure: 'Lundi 12/10', evenement: 'Démarrage du comptage sur le site de Mazala — Focus BaCongo (2 445) et Mougali (2 291) 2018' },
      { heure: 'Mardi 13/10', evenement: 'Comptage physique City Center (2 260) et Poto Poto (2 073) 2018' },
      { heure: 'Mercredi 14/10', evenement: 'Recensement des exercices 2019 à 2024, Maya Maya (67) et Plateau-Ville (1)' },
      { heure: 'Jeudi 15/10', evenement: 'Arrêté définitif des comptes, réconciliation générale des 9 189 dossiers et validation' }
    ],
    observations: [
      {
        point: 'Totaux vérifiés',
        constat: 'La somme de chaque ligne correspond au total noté, et la somme des totaux d\'agences donne bien 9 189 dossiers.',
        estIncident: false
      },
      {
        point: '2018 domine',
        constat: 'Les dossiers 2018 (9 069) forment la quasi-totalité du volume (98,7 %) ; les exercices 2019 à 2024 totalisent 120 dossiers.',
        estIncident: false
      },
      {
        point: 'Maya Maya',
        constat: 'Aucun dossier de 2018 à 2020 ; l\'essentiel de ses 67 dossiers se situe en 2021 (61 dossiers).',
        estIncident: false
      },
      {
        point: 'Plateau-Ville',
        constat: 'Un seul dossier relevé sur l\'ensemble des exercices (année 2022).',
        estIncident: false
      },
      {
        point: 'BaCongo 2022',
        constat: 'Case barrée d\'une croix sur le relevé manuscrit ; comptée comme « aucun dossier » (cohérent avec le total 2 461).',
        estIncident: false
      }
    ],
    totalDeclare: 9189,
    totalCalcule: 9189,
    ecart: 0,
    statut: 'valide',
    version: 1,
    creePar: 'Lorich & Déo (Stagiaires)',
    dateCreation: '2026-10-15'
  },
  {
    id: 'dr-2026-10-13',
    titre: 'Rapport Journalier du Mardi 13/10/2026 — Cartographie & Conventions Oubliées',
    dateDebut: '2026-10-13',
    dateFin: '2026-10-13',
    horaires: '07:30 - 16:30',
    chefNom: 'Équipe Archiviste UBA Congo',
    superviseurs: ['Superviseur Maya-Maya', 'Superviseur Mazala'],
    effectifTotal: 6,
    presents: 6,
    absents: 0,
    equipeMazala: ['Équipe Tri Mazala'],
    equipeOrdinateur: ['Équipe Saisie Maya-Maya'],
    groupes: [
      {
        nom: 'Groupe Cartographie & Tri',
        membres: ['Archiviste 1', 'Archiviste 2'],
        tachesAssignees: 'Cartographie et tri typologique des archives'
      },
      {
        nom: 'Groupe Recensement Oubliés',
        membres: ['Archiviste 3', 'Archiviste 4'],
        tachesAssignees: 'Recensement et comptage des conventions oubliées'
      }
    ],
    taches: [
      {
        numero: 1,
        titre: 'Cartographie des archives',
        horaire: '08:00 - 10:30',
        description: 'Établissement du plan de classement et cartographie physique des rayons d\'archives.'
      },
      {
        numero: 2,
        titre: 'Restitution des conventions d\'années différentes',
        horaire: '10:30 - 12:30',
        description: 'Rapprochement et réaffectation des liasses dispersées par année d\'exercice.'
      },
      {
        numero: 3,
        titre: 'Tri par typologie des documents',
        horaire: '13:00 - 14:30',
        description: 'Séparation rigoureuse conventions, pièces d\'identité, formulaires et pièces annexes.'
      },
      {
        numero: 4,
        titre: 'Mise de côté des documents à détruire',
        horaire: '14:30 - 15:30',
        description: 'Conditionnement à part des documents périmés ou hors périmètre réglementaire.'
      },
      {
        numero: 5,
        titre: 'Recensement des conventions oubliées (753 conventions, 10 boîtes)',
        horaire: '15:30 - 16:30',
        description: 'Dénombrement physique : Moungali 2025 (23 conv, 1 boîte), City Center 2021 (253 conv, 3 boîtes [101+52+100]), City Center 2020 (164 conv, 1 boîte), City Center 2019 (143 conv, 2 boîtes [99+44]), Plateau Ville 2023 (67 conv, 1 boîte), City Center 2016 (21 conv, 1 boîte), Bacongo 2017 (82 conv, 1 boîte).'
      }
    ],
    transferts: [
      {
        id: 'mv-13-1',
        agenceId: 'ag-907',
        agenceNom: 'Moungali',
        code: '907',
        exercice: 2025,
        conventions: 23,
        boites: 1,
        traitement: 'Oublié recensé'
      },
      {
        id: 'mv-13-2',
        agenceId: 'ag-901',
        agenceNom: 'City Center',
        code: '901',
        exercice: 2021,
        conventions: 253,
        boites: 3,
        traitement: 'Oublié recensé (101+52+100)'
      },
      {
        id: 'mv-13-3',
        agenceId: 'ag-901',
        agenceNom: 'City Center',
        code: '901',
        exercice: 2020,
        conventions: 164,
        boites: 1,
        traitement: 'Oublié recensé'
      },
      {
        id: 'mv-13-4',
        agenceId: 'ag-901',
        agenceNom: 'City Center',
        code: '901',
        exercice: 2019,
        conventions: 143,
        boites: 2,
        traitement: 'Oublié recensé (99+44)'
      },
      {
        id: 'mv-13-5',
        agenceId: 'ag-909',
        agenceNom: 'Plateau-Ville',
        code: '909',
        exercice: 2023,
        conventions: 67,
        boites: 1,
        traitement: 'Oublié recensé'
      },
      {
        id: 'mv-13-6',
        agenceId: 'ag-901',
        agenceNom: 'City Center',
        code: '901',
        exercice: 2016,
        conventions: 21,
        boites: 1,
        traitement: 'Oublié recensé'
      },
      {
        id: 'mv-13-7',
        agenceId: 'ag-904',
        agenceNom: 'Bacongo',
        code: '904',
        exercice: 2017,
        conventions: 82,
        boites: 1,
        traitement: 'Oublié recensé'
      }
    ],
    receptions: [],
    chronologie: [
      { heure: '07:30', evenement: 'Ouverture de séance et pointage rapide 7h30' },
      { heure: '08:00', evenement: 'Démarrage de la cartographie des archives' },
      { heure: '12:30', evenement: 'Pause déjeuner' },
      { heure: '13:00', evenement: 'Reprise et tri des conventions par typologie' },
      { heure: '15:30', evenement: 'Finalisation du comptage des 753 conventions oubliées' },
      { heure: '16:30', evenement: 'Clôture de la séance et validation du rapport' }
    ],
    observations: [
      {
        point: 'Recensement conventions oubliées',
        constat: 'Total de 753 conventions réparties dans 10 boîtes identifiées et tracées.',
        estIncident: false
      },
      {
        point: 'Documents à détruire',
        constat: 'Documents périmés isolés dans une zone sécurisée en attente du PV de destruction réglementaire.',
        estIncident: false
      }
    ],
    totalDeclare: 753,
    totalCalcule: 753,
    ecart: 0,
    statut: 'valide',
    version: 1,
    creePar: 'Équipe Archiviste — UBA Congo',
    dateCreation: '2026-10-13'
  },
  {
    id: 'dr-2026-10-14',
    titre: 'Rapport Journalier du Mercredi 14/10/2026 — Recensement Attentes & TAF',
    dateDebut: '2026-10-14',
    dateFin: '2026-10-14',
    horaires: '07:30 - 16:30',
    chefNom: 'Équipe Archiviste UBA Congo',
    superviseurs: ['Superviseur Maya-Maya', 'Superviseur Mazala'],
    effectifTotal: 6,
    presents: 6,
    absents: 0,
    equipeMazala: ['Équipe Tri Mazala'],
    equipeOrdinateur: ['Équipe Saisie Maya-Maya'],
    groupes: [
      {
        nom: 'Groupe Recensement Attentes',
        membres: ['Archiviste 1', 'Archiviste 2'],
        tachesAssignees: 'Inventaire des dossiers en attente de tri'
      },
      {
        nom: 'Groupe Planification TAF',
        membres: ['Archiviste 3', 'Archiviste 4'],
        tachesAssignees: 'Établissement du registre des tâches à faire'
      }
    ],
    taches: [
      {
        numero: 1,
        titre: 'Recensement des oubliés complémentaires (45 conventions)',
        horaire: '08:00 - 10:30',
        description: 'Recensement BAX 2019 (44 conventions, 1 boîte) et Plateau Ville 2022 (1 convention).'
      },
      {
        numero: 2,
        titre: 'Recensement des dossiers en attente (365 conventions, 7-8 boîtes)',
        horaire: '10:30 - 14:00',
        description: 'City Center 2015 (174 conv, 2 boîtes [110+55+8+1]), City Center 2016 (8 conv, 1 boîte [6+2]), City Center 2014 (15 conv), City Center 2013 (1 conv), City Center 2011 (2 conv), BAX 2017 (83 conv, 2 boîtes [51+32]), Bacongo 2016 (16 conv, 1 boîte), Bacongo 2021 (1 conv), Bacongo 2017 ajout (63 conv, 1 boîte), Poto-Poto 2017 (2 conv, 1 boîte).'
      },
      {
        numero: 3,
        titre: 'Planification Travaux à Faire (TAF)',
        horaire: '14:00 - 16:30',
        description: 'Enregistrement des actions requises : Prolongation 2022 MGL, changement de signature, mise à jour des prénoms, registre 1 boîte ; Prolongation Bacongo 2016-2014 ; Changement de signature Bacongo 2024.'
      }
    ],
    transferts: [
      {
        id: 'mv-14-1',
        agenceId: 'ag-904',
        agenceNom: 'Bacongo',
        code: '904',
        exercice: 2019,
        conventions: 44,
        boites: 1,
        traitement: 'Oublié recensé (BAX)'
      },
      {
        id: 'mv-14-2',
        agenceId: 'ag-909',
        agenceNom: 'Plateau-Ville',
        code: '909',
        exercice: 2022,
        conventions: 1,
        boites: 0,
        traitement: 'Oublié recensé'
      },
      {
        id: 'mv-14-3',
        agenceId: 'ag-901',
        agenceNom: 'City Center',
        code: '901',
        exercice: 2015,
        conventions: 174,
        boites: 2,
        traitement: 'En attente de tri (110+55+8+1)'
      },
      {
        id: 'mv-14-4',
        agenceId: 'ag-904',
        agenceNom: 'Bacongo',
        code: '904',
        exercice: 2017,
        conventions: 83,
        boites: 2,
        traitement: 'En attente de tri (51+32)'
      },
      {
        id: 'mv-14-5',
        agenceId: 'ag-904',
        agenceNom: 'Bacongo',
        code: '904',
        exercice: 2017,
        conventions: 63,
        boites: 1,
        traitement: 'En attente ajoutée en bas de feuille'
      },
      {
        id: 'mv-14-6',
        agenceId: 'ag-904',
        agenceNom: 'Bacongo',
        code: '904',
        exercice: 2016,
        conventions: 16,
        boites: 1,
        traitement: 'En attente de tri'
      },
      {
        id: 'mv-14-7',
        agenceId: 'ag-901',
        agenceNom: 'City Center',
        code: '901',
        exercice: 2014,
        conventions: 15,
        boites: 0,
        traitement: 'En attente de tri'
      },
      {
        id: 'mv-14-8',
        agenceId: 'ag-901',
        agenceNom: 'City Center',
        code: '901',
        exercice: 2016,
        conventions: 8,
        boites: 1,
        traitement: 'En attente de tri (6+2)'
      },
      {
        id: 'mv-14-9',
        agenceId: 'ag-902',
        agenceNom: 'Poto-Poto',
        code: '902',
        exercice: 2017,
        conventions: 2,
        boites: 1,
        traitement: 'En attente de tri'
      },
      {
        id: 'mv-14-10',
        agenceId: 'ag-901',
        agenceNom: 'City Center',
        code: '901',
        exercice: 2011,
        conventions: 2,
        boites: 0,
        traitement: 'En attente de tri'
      },
      {
        id: 'mv-14-11',
        agenceId: 'ag-901',
        agenceNom: 'City Center',
        code: '901',
        exercice: 2013,
        conventions: 1,
        boites: 0,
        traitement: 'En attente de tri'
      },
      {
        id: 'mv-14-12',
        agenceId: 'ag-904',
        agenceNom: 'Bacongo',
        code: '904',
        exercice: 2021,
        conventions: 1,
        boites: 0,
        traitement: 'En attente de tri'
      }
    ],
    receptions: [],
    chronologie: [
      { heure: '07:30', evenement: 'Pointage de l\'équipe et répartition des charges' },
      { heure: '08:00', evenement: 'Inventaire des conventions oubliées complémentaires' },
      { heure: '10:30', evenement: 'Recensement complet des 365 dossiers en attente' },
      { heure: '14:00', evenement: 'Planification du registre TAF' },
      { heure: '16:30', evenement: 'Fin de séance et signature' }
    ],
    observations: [
      {
        point: 'Écart de comptage de boîtes en attente',
        constat: 'Le total manuscrit (7 boîtes) omet la boîte Bacongo 2017 ajoutée en bas ; total réel ajusté à 8 boîtes.',
        estIncident: false
      },
      {
        point: 'Vérification BAX 2019',
        constat: 'BAX 2019 (44 conventions) présente une ressemblance avec la boîte City Center 2019 (44 conventions) ; contrôle agence préconisé.',
        estIncident: false
      }
    ],
    totalDeclare: 410,
    totalCalcule: 410,
    ecart: 0,
    statut: 'valide',
    version: 1,
    creePar: 'Équipe Archiviste — UBA Congo',
    dateCreation: '2026-10-14'
  },
  {
    id: 'dr-2026-10-15',
    titre: 'Rapport Journalier du Jeudi 15/10/2026 — Pointage & Conventions Checkées',
    dateDebut: '2026-10-15',
    dateFin: '2026-10-15',
    horaires: '07:30 - 16:30',
    chefNom: 'Équipe Archiviste UBA Congo',
    superviseurs: ['Superviseur Maya-Maya', 'Superviseur Mazala'],
    effectifTotal: 6,
    presents: 6,
    absents: 0,
    equipeMazala: ['Équipe Tri Mazala'],
    equipeOrdinateur: ['Équipe Saisie Maya-Maya'],
    groupes: [
      {
        nom: 'Groupe Contrôle Qualité',
        membres: ['Archiviste 1', 'Archiviste 2'],
        tachesAssignees: 'Contrôle et validation des numéros de série (NS)'
      }
    ],
    taches: [
      {
        numero: 1,
        titre: 'Conventions checkées City Center 2015 (102 conventions)',
        horaire: '08:00 - 12:00',
        description: 'Vérification et check de 102 conventions City Center 2015 (destination CC, plusieurs numéros de série).'
      },
      {
        numero: 2,
        titre: 'Conventions checkées Bacongo 2017 (34 conventions)',
        horaire: '13:00 - 15:30',
        description: 'Contrôle Bacongo 2017 : 9 conventions (NS 2058 / carnet 2088) + 25 conventions (NS 2055), destination CC.'
      },
      {
        numero: 3,
        titre: 'Vérification convention City Center 2015 NS 2085 (1 convention)',
        horaire: '15:30 - 16:30',
        description: 'Pointage spécifique NS 2085, destination CC.'
      }
    ],
    transferts: [
      {
        id: 'mv-15-1',
        agenceId: 'ag-901',
        agenceNom: 'City Center',
        code: '901',
        exercice: 2015,
        conventions: 102,
        boites: 1,
        traitement: 'Checké CC (NS multiples)'
      },
      {
        id: 'mv-15-2',
        agenceId: 'ag-904',
        agenceNom: 'Bacongo',
        code: '904',
        exercice: 2017,
        conventions: 25,
        boites: 1,
        traitement: 'Checké CC (NS 2055)'
      },
      {
        id: 'mv-15-3',
        agenceId: 'ag-904',
        agenceNom: 'Bacongo',
        code: '904',
        exercice: 2017,
        conventions: 9,
        boites: 1,
        traitement: 'Checké CC (NS 2058/2088)'
      },
      {
        id: 'mv-15-4',
        agenceId: 'ag-901',
        agenceNom: 'City Center',
        code: '901',
        exercice: 2015,
        conventions: 1,
        boites: 0,
        traitement: 'Checké CC (NS 2085)'
      }
    ],
    receptions: [],
    chronologie: [
      { heure: '07:30', evenement: 'Pointage de l\'équipe à Maya-Maya' },
      { heure: '08:00', evenement: 'Démarrage du contrôle des 102 conventions City Center 2015' },
      { heure: '13:00', evenement: 'Contrôle des 34 conventions Bacongo 2017' },
      { heure: '16:00', evenement: 'Vérification unitaire NS 2085' },
      { heure: '16:30', evenement: 'Clôture de séance — 137 conventions validées' }
    ],
    observations: [
      {
        point: 'Numérotation de série Bacongo 2017',
        constat: 'Numéro de série 2058 sur la feuille du 15/10, noté 2088 dans le carnet (9 conventions).',
        estIncident: false
      }
    ],
    totalDeclare: 137,
    totalCalcule: 137,
    ecart: 0,
    statut: 'valide',
    version: 1,
    creePar: 'Équipe Archiviste — UBA Congo',
    dateCreation: '2026-10-15'
  },
  {
    id: 'dr-2026-10-16',
    titre: 'Rapport Journalier du Vendredi 16/10/2026 — Contrôle Final & Bilan Hebdomadaire',
    dateDebut: '2026-10-16',
    dateFin: '2026-10-16',
    horaires: '07:30 - 16:30',
    chefNom: 'Équipe Archiviste UBA Congo',
    superviseurs: ['Superviseur Maya-Maya', 'Superviseur Mazala'],
    effectifTotal: 6,
    presents: 6,
    absents: 0,
    equipeMazala: ['Équipe Tri Mazala'],
    equipeOrdinateur: ['Équipe Saisie Maya-Maya'],
    groupes: [
      {
        nom: 'Groupe Contrôle Maya-Maya',
        membres: ['Archiviste 1', 'Archiviste 2'],
        tachesAssignees: 'Contrôle des 105 conventions Maya-Maya'
      },
      {
        nom: 'Groupe Consolidation & Clôture',
        membres: ['Archiviste 3', 'Archiviste 4'],
        tachesAssignees: 'Arrêté des totaux hebdomadaires'
      }
    ],
    taches: [
      {
        numero: 1,
        titre: 'Conventions checkées Maya-Maya 2021 & 2020 (105 conventions)',
        horaire: '08:00 - 12:00',
        description: 'Maya-Maya 2021 CE (92 conventions : 60 [3+28+8+21] + 30 [1+2+1+16+10] + 2) ; Maya-Maya 2020 CE (13 conventions : 9 + 4).'
      },
      {
        numero: 2,
        titre: 'Conventions checkées Poto-Poto 2018 & 2019 (17 conventions)',
        horaire: '13:00 - 14:30',
        description: 'Poto-Poto 2018 CE (15 conventions) et Poto-Poto 2019 CC (2 conventions [1+1]).'
      },
      {
        numero: 3,
        titre: 'Conventions checkées City Center 2017, 2020, 2021, 2013, 2015 (8 conventions)',
        horaire: '14:30 - 15:30',
        description: 'City Center 2017 CE (1 conv NS 2117), 2020 CE (2 conv), 2021 CC (1 conv), 2013 CC (1 conv), 2015 CE (3 conv).'
      },
      {
        numero: 4,
        titre: 'Conventions checkées BAX 2017 (5 conventions)',
        horaire: '15:30 - 16:00',
        description: 'Contrôle BAX 2017 CC (5 conventions, NS 2061).'
      },
      {
        numero: 5,
        titre: 'Arrêté du Bilan Hebdomadaire (1713 traitées / 10528 en attente)',
        horaire: '16:00 - 16:30',
        description: 'Consolidation finale des données du carnet : 1578 + 135 = 1713 traitées ; 10393 + 135 = 10528 en attente. Total général : 12241 conventions.'
      }
    ],
    transferts: [
      {
        id: 'mv-16-1',
        agenceId: 'ag-906',
        agenceNom: 'Maya-Maya',
        code: '906',
        exercice: 2021,
        conventions: 92,
        boites: 2,
        traitement: 'Checké CE (60+30+2)'
      },
      {
        id: 'mv-16-2',
        agenceId: 'ag-906',
        agenceNom: 'Maya-Maya',
        code: '906',
        exercice: 2020,
        conventions: 13,
        boites: 1,
        traitement: 'Checké CE (9+4)'
      },
      {
        id: 'mv-16-3',
        agenceId: 'ag-902',
        agenceNom: 'Poto-Poto',
        code: '902',
        exercice: 2018,
        conventions: 15,
        boites: 1,
        traitement: 'Checké CE'
      },
      {
        id: 'mv-16-4',
        agenceId: 'ag-902',
        agenceNom: 'Poto-Poto',
        code: '902',
        exercice: 2019,
        conventions: 2,
        boites: 1,
        traitement: 'Checké CC (1+1)'
      },
      {
        id: 'mv-16-5',
        agenceId: 'ag-901',
        agenceNom: 'City Center',
        code: '901',
        exercice: 2015,
        conventions: 3,
        boites: 0,
        traitement: 'Checké CE'
      },
      {
        id: 'mv-16-6',
        agenceId: 'ag-901',
        agenceNom: 'City Center',
        code: '901',
        exercice: 2020,
        conventions: 2,
        boites: 0,
        traitement: 'Checké CE'
      },
      {
        id: 'mv-16-7',
        agenceId: 'ag-901',
        agenceNom: 'City Center',
        code: '901',
        exercice: 2017,
        conventions: 1,
        boites: 0,
        traitement: 'Checké CE (NS 2117)'
      },
      {
        id: 'mv-16-8',
        agenceId: 'ag-901',
        agenceNom: 'City Center',
        code: '901',
        exercice: 2021,
        conventions: 1,
        boites: 0,
        traitement: 'Checké CC'
      },
      {
        id: 'mv-16-9',
        agenceId: 'ag-901',
        agenceNom: 'City Center',
        code: '901',
        exercice: 2013,
        conventions: 1,
        boites: 0,
        traitement: 'Checké CC'
      },
      {
        id: 'mv-16-10',
        agenceId: 'ag-904',
        agenceNom: 'Bacongo',
        code: '904',
        exercice: 2017,
        conventions: 5,
        boites: 1,
        traitement: 'Checké CC (NS 2061)'
      }
    ],
    receptions: [],
    chronologie: [
      { heure: '07:30', evenement: 'Pointage de présence' },
      { heure: '08:00', evenement: 'Vérification des 105 conventions Maya-Maya' },
      { heure: '13:00', evenement: 'Pointage Poto-Poto et City Center' },
      { heure: '15:30', evenement: 'Contrôle BAX 2017 NS 2061' },
      { heure: '16:00', evenement: 'Arrêté du bilan hebdomadaire' },
      { heure: '16:30', evenement: 'Clôture de semaine' }
    ],
    observations: [
      {
        point: 'Bilan Hebdomadaire certifié',
        constat: '1713 conventions traitées cumulées du lundi au vendredi, 10528 en attente au total.',
        estIncident: false
      }
    ],
    totalDeclare: 135,
    totalCalcule: 135,
    ecart: 0,
    statut: 'valide',
    version: 1,
    creePar: 'Équipe Archiviste — UBA Congo',
    dateCreation: '2026-10-16'
  }
];

export const INITIAL_SYNTHESIS_REPORTS: SynthesisReport[] = [
  {
    id: 'syn-2026-10-13-16',
    titre: 'Rapport de synthèse — Équipe Archiviste UBA Congo',
    dateDebut: '2026-10-13',
    dateFin: '2026-10-16',
    type: 'chef_confidentiel',
    dossiersTraites: 1713,
    dossiersEnAttente: 10528,
    totalGlobal: 12241,
    boitesTotal: 19,
    agencesCount: 7,
    joursCouverts: 4,
    joursManquants: [],
    matrice: [
      {
        agenceNom: 'City Center',
        code: '901',
        annees: {
          2011: 'A',
          2013: 'T',
          2014: 'A',
          2015: 'T',
          2016: 'O',
          2017: 'T',
          2019: 'O',
          2020: 'O',
          2021: 'O',
          2022: '-',
          2023: '-',
          2024: '-',
          2025: '-'
        }
      },
      {
        agenceNom: 'Poto-Poto',
        code: '902',
        annees: {
          2011: '-',
          2013: '-',
          2014: '-',
          2015: '-',
          2016: '-',
          2017: 'A',
          2018: 'T',
          2019: 'T',
          2020: '-',
          2021: '-',
          2022: '-',
          2023: '-',
          2024: '-',
          2025: '-'
        }
      },
      {
        agenceNom: 'Bacongo',
        code: '904',
        annees: {
          2011: '-',
          2013: '-',
          2014: 'A',
          2015: '-',
          2016: 'A',
          2017: 'T',
          2018: '-',
          2019: 'O',
          2020: '-',
          2021: 'A',
          2022: '-',
          2023: '-',
          2024: 'A',
          2025: '-'
        }
      },
      {
        agenceNom: 'Maya-Maya',
        code: '906',
        annees: {
          2011: '-',
          2013: '-',
          2014: '-',
          2015: '-',
          2016: '-',
          2017: '-',
          2018: '-',
          2019: '-',
          2020: 'T',
          2021: 'T',
          2022: '-',
          2023: '-',
          2024: '-',
          2025: '-'
        }
      },
      {
        agenceNom: 'Moungali',
        code: '907',
        annees: {
          2011: '-',
          2013: '-',
          2014: '-',
          2015: '-',
          2016: '-',
          2017: '-',
          2018: '-',
          2019: '-',
          2020: '-',
          2021: '-',
          2022: 'A',
          2023: '-',
          2024: '-',
          2025: 'O'
        }
      },
      {
        agenceNom: 'Plateau-Ville',
        code: '909',
        annees: {
          2011: '-',
          2013: '-',
          2014: '-',
          2015: '-',
          2016: '-',
          2017: '-',
          2018: '-',
          2019: '-',
          2020: '-',
          2021: '-',
          2022: 'O',
          2023: 'O',
          2024: '-',
          2025: '-'
        }
      },
      {
        agenceNom: 'Mazala',
        code: '910',
        annees: {
          2011: 'T',
          2013: 'T',
          2014: 'T',
          2015: 'T',
          2016: 'T',
          2017: 'T',
          2018: 'T',
          2019: 'T',
          2020: 'T',
          2021: 'T',
          2022: 'T',
          2023: 'T',
          2024: 'A',
          2025: 'A'
        }
      }
    ],
    repartitionAgences: [
      {
        nom: 'City Center',
        code: '901',
        traite: 111,
        attente: 581,
        total: 692,
        taux: 16
      },
      {
        nom: 'Bacongo',
        code: '904',
        traite: 39,
        attente: 242,
        total: 281,
        taux: 14
      },
      {
        nom: 'Maya-Maya',
        code: '906',
        traite: 105,
        attente: 0,
        total: 105,
        taux: 100
      },
      {
        nom: 'Poto-Poto',
        code: '902',
        traite: 17,
        attente: 2,
        total: 19,
        taux: 89
      },
      {
        nom: 'Moungali',
        code: '907',
        traite: 0,
        attente: 23,
        total: 23,
        taux: 0
      },
      {
        nom: 'Plateau-Ville',
        code: '909',
        traite: 0,
        attente: 68,
        total: 68,
        taux: 0
      },
      {
        nom: 'Mazala',
        code: '910',
        traite: 1441,
        attente: 9612,
        total: 11053,
        taux: 13
      }
    ],
    pointsAConfirmer: [
      'Conventions checkées (jeudi 137 + vendredi 135) : 272 conventions certifiées.',
      'Conventions oubliées recensées : 753 (10 boîtes le 13/10) + 45 (le 14/10) = 798 au total.',
      'Conventions en attente recensées : 365 conventions (7 boîtes écrites, 8 avec l\'ajout Bacongo 2017).',
      'Boîtes en attente : le total écrit (7) ne compte pas la boîte Bacongo 2017 ajoutée (total réel de 8 boîtes).',
      'BAX 2019 (44 conventions, oubliés du 14/10) ressemble à la 2e boîte City Center 2019 (44) recensée le 13/10 : agence à vérifier.',
      'Numéro de série Bacongo 2017 (9 conventions) : 2058 sur la feuille du 15/10, 2088 dans le carnet.',
      'Le total du jeudi (137) n\'apparaît pas dans le bilan, qui ne reprend que 135 : il est probablement déjà inclus dans les 1578 du jeudi.',
      '« Balongo » et « Bacongo » apparaissent selon les pages ; « Bacongo » retenu. « BAX » en est l\'abréviation officielle.',
      'Suite à donner : Prolongation 2022 MGL, prolongation Bacongo 2016-2014, changement de signature Bacongo 2024.'
    ],
    creePar: 'Équipe Archiviste — UBA Congo',
    dateCreation: '2026-10-18'
  },
  {
    id: 'syn-2026-10-12-14-mazala',
    titre: "Rapport d'Activité — Site de Mazala (Comptage des dossiers par agence et par année)",
    dateDebut: '2026-10-12',
    dateFin: '2026-10-14',
    type: 'equipe_public',
    dossiersTraites: 9189,
    dossiersEnAttente: 0,
    totalGlobal: 9189,
    boitesTotal: 0,
    agencesCount: 6,
    joursCouverts: 3,
    joursManquants: [],
    matrice: [
      {
        agenceNom: 'City Center',
        code: '901',
        annees: {
          2018: '2 260',
          2019: '8',
          2020: '—',
          2021: '—',
          2022: '3',
          2023: '1',
          2024: '—'
        }
      },
      {
        agenceNom: 'Poto Poto',
        code: '902',
        annees: {
          2018: '2 073',
          2019: '3',
          2020: '—',
          2021: '6',
          2022: '3',
          2023: '—',
          2024: '8'
        }
      },
      {
        agenceNom: 'BaCongo',
        code: '904',
        annees: {
          2018: '2 445',
          2019: '10',
          2020: '3',
          2021: '1',
          2022: '—',
          2023: '1',
          2024: '1'
        }
      },
      {
        agenceNom: 'Maya Maya',
        code: '906',
        annees: {
          2018: '—',
          2019: '—',
          2020: '—',
          2021: '61',
          2022: '1',
          2023: '2',
          2024: '3'
        }
      },
      {
        agenceNom: 'Mougali',
        code: '907',
        annees: {
          2018: '2 291',
          2019: '—',
          2020: '3',
          2021: '1',
          2022: '—',
          2023: '—',
          2024: '—'
        }
      },
      {
        agenceNom: 'Plateau-Ville',
        code: '909',
        annees: {
          2018: '—',
          2019: '—',
          2020: '—',
          2021: '—',
          2022: '1',
          2023: '—',
          2024: '—'
        }
      }
    ],
    repartitionAgences: [
      {
        nom: 'BaCongo',
        code: '904',
        traite: 2461,
        attente: 0,
        total: 2461,
        taux: 26.8
      },
      {
        nom: 'Mougali',
        code: '907',
        traite: 2295,
        attente: 0,
        total: 2295,
        taux: 25.0
      },
      {
        nom: 'City Center',
        code: '901',
        traite: 2272,
        attente: 0,
        total: 2272,
        taux: 24.7
      },
      {
        nom: 'Poto Poto',
        code: '902',
        traite: 2093,
        attente: 0,
        total: 2093,
        taux: 22.8
      },
      {
        nom: 'Maya Maya',
        code: '906',
        traite: 67,
        attente: 0,
        total: 67,
        taux: 0.7
      },
      {
        nom: 'Plateau-Ville',
        code: '909',
        traite: 1,
        attente: 0,
        total: 1,
        taux: 0.0
      }
    ],
    pointsAConfirmer: [
      'Synthèse générale : 9 189 dossiers au total, 6 agences concernées, 7 années (2018–2024), 2 stagiaires (Lorich et Déo). 98,7 % des dossiers sont concentrés sur l\'exercice 2018 (9 069 dossiers).',
      'Classement par agence : BaCongo en tête (2 461 dossiers, 26,8 %) · Mougali (2 295 dossiers, 25,0 %) · City Center (2 272 dossiers, 24,7 %) · Poto Poto (2 093 dossiers, 22,8 %).',
      'Agences marginales : Maya Maya (67 dossiers, 0,7 % — dont 61 en 2021) · Plateau-Ville (1 seul dossier relevé en 2022).',
      'Totaux vérifiés : La somme de chaque ligne correspond au total noté, et la somme des totaux d\'agences donne bien 9 189 dossiers.',
      '2018 domine : Les dossiers 2018 (9 069) forment la quasi-totalité du volume ; 2019 à 2024 totalisent 120 dossiers.',
      'Maya Maya : Aucun dossier de 2018 à 2020 ; l\'essentiel de ses 67 dossiers se situe en 2021 (61 dossiers).',
      'Plateau-Ville : Un seul dossier relevé sur l\'ensemble des exercices (année 2022).',
      'BaCongo 2022 : Case barrée d\'une croix sur le relevé manuscrit ; comptée comme « aucun dossier » (cohérent avec le total 2 461).',
      'Validation : Relevé effectué et validé par les stagiaires Lorich et Déo le 15/10/2026.'
    ],
    creePar: 'Lorich & Déo (Stagiaires)',
    dateCreation: '2026-10-15'
  }
];

export const INITIAL_LOGS: LogEntry[] = [
  {
    id: 'log-init-1',
    timestamp: '2026-10-18T18:00:00Z',
    userId: 'u-system',
    userName: 'Système ARCHIVA',
    userRole: 'super_admin',
    action: 'Initialisation des Données Opérationnelles',
    details: 'Chargement des rapports de la période du 13 au 16 octobre 2026 (1713 traitées / 10528 en attente)',
    category: 'systeme'
  }
];

export const INITIAL_INCIDENTS: ArchiveIncident[] = [
  {
    id: 'inc-001',
    dateSignalement: '2026-10-14',
    titre: 'Divergence numéro de série Bacongo 2017 (NS 2058 vs 2088)',
    agenceId: 'ag-904',
    agenceNom: 'Bacongo',
    code: '904',
    severite: 'faible',
    statut: 'en_cours',
    description: 'Numéro de série Bacongo 2017 (9 conventions) inscrit 2058 sur la fiche du 15/10 mais 2088 dans le carnet de contrôle.',
    actionsPrises: 'Vérification physique demandée lors de la prochaine séance.',
    signalePar: "Chef d'équipe"
  },
  {
    id: 'inc-002',
    dateSignalement: '2026-10-14',
    titre: 'Confusion possible BAX 2019 vs City Center 2019 (44 conventions)',
    agenceId: 'ag-904',
    agenceNom: 'Bacongo',
    code: '904',
    severite: 'moyen',
    statut: 'en_cours',
    description: 'La boîte BAX 2019 (44 conventions) recensée le 14/10 présente un volume identique à la 2e boîte City Center 2019 (44 conventions).',
    actionsPrises: 'Contrôle croisé des bordereaux d\'origine.',
    signalePar: 'Superviseur Maya-Maya'
  }
];

export const INITIAL_CARTONS: CartonInventory[] = [
  {
    id: 'cart-001',
    numeroCarton: 'CARTON-MGL-2025',
    agenceId: 'ag-907',
    agenceNom: 'Moungali',
    code: '907',
    exercice: 2025,
    boitesCount: 1,
    conventionsEstimees: 23,
    emplacement: 'Rayon MGL-01',
    site: 'Maya-Maya',
    etat: 'bon',
    notes: 'Conventions oubliées recensées le 13/10',
    dateEnregistrement: '2026-10-13'
  },
  {
    id: 'cart-002',
    numeroCarton: 'CARTON-CC-2021-A',
    agenceId: 'ag-901',
    agenceNom: 'City Center',
    code: '901',
    exercice: 2021,
    boitesCount: 1,
    conventionsEstimees: 101,
    emplacement: 'Rayon CC-01',
    site: 'Mazala',
    etat: 'bon',
    notes: 'Lot 1/3 (101 conv sur 253)',
    dateEnregistrement: '2026-10-13'
  },
  {
    id: 'cart-003',
    numeroCarton: 'CARTON-CC-2021-B',
    agenceId: 'ag-901',
    agenceNom: 'City Center',
    code: '901',
    exercice: 2021,
    boitesCount: 1,
    conventionsEstimees: 52,
    emplacement: 'Rayon CC-02',
    site: 'Mazala',
    etat: 'bon',
    notes: 'Lot 2/3 (52 conv sur 253)',
    dateEnregistrement: '2026-10-13'
  },
  {
    id: 'cart-004',
    numeroCarton: 'CARTON-CC-2021-C',
    agenceId: 'ag-901',
    agenceNom: 'City Center',
    code: '901',
    exercice: 2021,
    boitesCount: 1,
    conventionsEstimees: 100,
    emplacement: 'Rayon CC-03',
    site: 'Mazala',
    etat: 'bon',
    notes: 'Lot 3/3 (100 conv sur 253)',
    dateEnregistrement: '2026-10-13'
  },
  {
    id: 'cart-005',
    numeroCarton: 'CARTON-CC-2020',
    agenceId: 'ag-901',
    agenceNom: 'City Center',
    code: '901',
    exercice: 2020,
    boitesCount: 1,
    conventionsEstimees: 164,
    emplacement: 'Rayon CC-04',
    site: 'Mazala',
    etat: 'bon',
    notes: 'Oublié recensé le 13/10',
    dateEnregistrement: '2026-10-13'
  },
  {
    id: 'cart-006',
    numeroCarton: 'CARTON-CC-2019-A',
    agenceId: 'ag-901',
    agenceNom: 'City Center',
    code: '901',
    exercice: 2019,
    boitesCount: 1,
    conventionsEstimees: 99,
    emplacement: 'Rayon CC-05',
    site: 'Mazala',
    etat: 'bon',
    notes: 'Lot 1/2 (99 conv sur 143)',
    dateEnregistrement: '2026-10-13'
  },
  {
    id: 'cart-007',
    numeroCarton: 'CARTON-CC-2019-B',
    agenceId: 'ag-901',
    agenceNom: 'City Center',
    code: '901',
    exercice: 2019,
    boitesCount: 1,
    conventionsEstimees: 44,
    emplacement: 'Rayon CC-06',
    site: 'Mazala',
    etat: 'bon',
    notes: 'Lot 2/2 (44 conv sur 143)',
    dateEnregistrement: '2026-10-13'
  },
  {
    id: 'cart-008',
    numeroCarton: 'CARTON-PV-2023',
    agenceId: 'ag-909',
    agenceNom: 'Plateau-Ville',
    code: '909',
    exercice: 2023,
    boitesCount: 1,
    conventionsEstimees: 67,
    emplacement: 'Rayon PV-01',
    site: 'Mazala',
    etat: 'bon',
    notes: 'Oublié recensé le 13/10',
    dateEnregistrement: '2026-10-13'
  },
  {
    id: 'cart-009',
    numeroCarton: 'CARTON-CC-2016',
    agenceId: 'ag-901',
    agenceNom: 'City Center',
    code: '901',
    exercice: 2016,
    boitesCount: 1,
    conventionsEstimees: 21,
    emplacement: 'Rayon CC-07',
    site: 'Mazala',
    etat: 'bon',
    notes: 'Oublié recensé le 13/10',
    dateEnregistrement: '2026-10-13'
  },
  {
    id: 'cart-010',
    numeroCarton: 'CARTON-BAC-2017',
    agenceId: 'ag-904',
    agenceNom: 'Bacongo',
    code: '904',
    exercice: 2017,
    boitesCount: 1,
    conventionsEstimees: 82,
    emplacement: 'Rayon BAC-01',
    site: 'Mazala',
    etat: 'bon',
    notes: 'Oublié recensé le 13/10',
    dateEnregistrement: '2026-10-13'
  },
  {
    id: 'cart-011',
    numeroCarton: 'CARTON-BAX-2019',
    agenceId: 'ag-904',
    agenceNom: 'Bacongo',
    code: '904',
    exercice: 2019,
    boitesCount: 1,
    conventionsEstimees: 44,
    emplacement: 'Rayon BAC-02',
    site: 'Mazala',
    etat: 'bon',
    notes: 'Ajouté le 14/10',
    dateEnregistrement: '2026-10-14'
  },
  {
    id: 'cart-012',
    numeroCarton: 'CARTON-CC-2015-ATT',
    agenceId: 'ag-901',
    agenceNom: 'City Center',
    code: '901',
    exercice: 2015,
    boitesCount: 2,
    conventionsEstimees: 174,
    emplacement: 'Rayon CC-ATT-01',
    site: 'Maya-Maya',
    etat: 'a_verifier',
    notes: 'En attente recensement 14/10 : 110+55+8+1',
    dateEnregistrement: '2026-10-14'
  },
  {
    id: 'cart-013',
    numeroCarton: 'CARTON-BAC-2017-ATT',
    agenceId: 'ag-904',
    agenceNom: 'Bacongo',
    code: '904',
    exercice: 2017,
    boitesCount: 2,
    conventionsEstimees: 83,
    emplacement: 'Rayon BAC-ATT-01',
    site: 'Maya-Maya',
    etat: 'a_verifier',
    notes: 'En attente recensement 14/10 : 51+32',
    dateEnregistrement: '2026-10-14'
  },
  {
    id: 'cart-014',
    numeroCarton: 'CARTON-BAC-2017-AJ',
    agenceId: 'ag-904',
    agenceNom: 'Bacongo',
    code: '904',
    exercice: 2017,
    boitesCount: 1,
    conventionsEstimees: 63,
    emplacement: 'Rayon BAC-ATT-02',
    site: 'Maya-Maya',
    etat: 'a_verifier',
    notes: 'Boîte ajoutée en bas de feuille (14/10)',
    dateEnregistrement: '2026-10-14'
  }
];

export const INITIAL_SLIPS: TransferSlip[] = [
  {
    id: 'slip-001',
    numeroBordereau: 'BD-2026-001',
    dateTransfert: '2026-10-15',
    siteDepart: 'Maya-Maya',
    siteArrivee: 'Mazala',
    chauffeurNom: 'Transport UBA',
    vehicule: 'Toyota Hilux UBA-04',
    responsableDepart: 'Superviseur Maya-Maya',
    responsableArrivee: 'Superviseur Mazala',
    lignes: [
      {
        agenceNom: 'City Center',
        code: '901',
        exercice: 2015,
        boites: 1,
        conventions: 102,
        traitement: 'Conventions checkées CC'
      },
      {
        agenceNom: 'Bacongo',
        code: '904',
        exercice: 2017,
        boites: 1,
        conventions: 34,
        traitement: 'Conventions checkées CC (NS 2055 & 2058)'
      }
    ],
    totalBoites: 2,
    totalConventions: 136,
    statut: 'valide',
    observations: 'Transfert certifié des liasses checkées du 15/10/2026'
  }
];
