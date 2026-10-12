-- ============================================================================
-- ARCHIVA UBA — SCHÉMA POSTGRESQL COMPLET SUPABASE (Sites Maya-Maya & Mazala)
-- ============================================================================

-- Extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Table des Profils Utilisateurs (Liée à auth.users de Supabase)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nom_complet TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'stagiaire')),
    titre TEXT DEFAULT 'Archiviste Opérationnel',
    actif BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Table des Agences Bancaires UBA
CREATE TABLE IF NOT EXISTS public.agencies (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    nom TEXT NOT NULL UNIQUE,
    description TEXT,
    conventions_count INTEGER DEFAULT 0,
    cartons_count INTEGER DEFAULT 0,
    dossiers_count INTEGER DEFAULT 0,
    statut TEXT DEFAULT 'active' CHECK (statut IN ('active', 'terminee', 'en_cours')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Table des Membres de l'Équipe Archiviste
CREATE TABLE IF NOT EXISTS public.team_members (
    id TEXT PRIMARY KEY,
    nom_officiel TEXT NOT NULL,
    alias TEXT[] DEFAULT '{}',
    categorie TEXT NOT NULL CHECK (categorie IN ('chef', 'superviseur', 'ancien_stagiaire', 'nouveau_stagiaire')),
    site TEXT NOT NULL CHECK (site IN ('Maya-Maya', 'Mazala')),
    actif BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Entité Pivot : Lots d'Archives (Agence × Exercice)
CREATE TABLE IF NOT EXISTS public.lots (
    id TEXT PRIMARY KEY,
    agence_id TEXT NOT NULL REFERENCES public.agencies(id) ON DELETE RESTRICT,
    exercice INTEGER NOT NULL,
    site TEXT NOT NULL CHECK (site IN ('Maya-Maya', 'Mazala')),
    statut TEXT NOT NULL CHECK (statut IN ('recu', 'trie', 'mis_de_cote', 'en_transit', 'transmis', 'archive', 'T', 'A', 'O')),
    boites INTEGER DEFAULT 0,
    conventions INTEGER DEFAULT 0,
    notes TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (agence_id, exercice)
);

-- 5. Mouvements d'Archives (Tri, Transfert, Réception, Retour)
CREATE TABLE IF NOT EXISTS public.mouvements (
    id TEXT PRIMARY KEY,
    lot_id TEXT REFERENCES public.lots(id) ON DELETE SET NULL,
    agence_id TEXT NOT NULL REFERENCES public.agencies(id) ON DELETE RESTRICT,
    exercice INTEGER NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('tri', 'transfert', 'reception', 'retour')),
    date DATE NOT NULL,
    boites INTEGER NOT NULL DEFAULT 0,
    conventions INTEGER NOT NULL DEFAULT 0,
    rapport_id TEXT,
    bordereau_id TEXT,
    par_membre_id TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Rapports Journaliers d'Activité (R1)
CREATE TABLE IF NOT EXISTS public.daily_reports (
    id TEXT PRIMARY KEY,
    titre TEXT NOT NULL,
    date_debut DATE NOT NULL,
    date_fin DATE NOT NULL,
    horaires TEXT NOT NULL,
    chef_nom TEXT NOT NULL,
    superviseurs TEXT[] DEFAULT '{}',
    effectif_total INTEGER NOT NULL DEFAULT 0,
    presents INTEGER NOT NULL DEFAULT 0,
    absents INTEGER NOT NULL DEFAULT 0,
    absents_motifs TEXT,
    equipe_mazala TEXT[] DEFAULT '{}',
    equipe_ordinateur TEXT[] DEFAULT '{}',
    groupes JSONB DEFAULT '[]',
    taches JSONB DEFAULT '[]',
    transferts JSONB DEFAULT '[]',
    receptions JSONB DEFAULT '[]',
    chronologie JSONB DEFAULT '[]',
    observations JSONB DEFAULT '[]',
    total_declare INTEGER NOT NULL DEFAULT 0,
    total_calcule INTEGER NOT NULL DEFAULT 0,
    ecart INTEGER NOT NULL DEFAULT 0,
    statut TEXT NOT NULL CHECK (statut IN ('brouillon', 'valide', 'diffuse')),
    version INTEGER NOT NULL DEFAULT 1,
    cree_par TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Bordereaux de Transfert & Décharge
CREATE TABLE IF NOT EXISTS public.transfer_slips (
    id TEXT PRIMARY KEY,
    numero_bordereau TEXT NOT NULL UNIQUE,
    date_transfert DATE NOT NULL,
    site_depart TEXT NOT NULL,
    site_arrivee TEXT NOT NULL,
    chauffeur_nom TEXT NOT NULL,
    vehicule TEXT NOT NULL,
    responsable_depart TEXT NOT NULL,
    responsable_arrivee TEXT NOT NULL,
    lignes JSONB DEFAULT '[]',
    total_boites INTEGER NOT NULL DEFAULT 0,
    total_conventions INTEGER NOT NULL DEFAULT 0,
    statut TEXT NOT NULL CHECK (statut IN ('en_transit', 'receptionne', 'valide')),
    observations TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Inventaire des Cartons Physiques
CREATE TABLE IF NOT EXISTS public.cartons (
    id TEXT PRIMARY KEY,
    numero_carton TEXT NOT NULL UNIQUE,
    agence_id TEXT REFERENCES public.agencies(id) ON DELETE SET NULL,
    lot_id TEXT REFERENCES public.lots(id) ON DELETE SET NULL,
    agence_nom TEXT NOT NULL,
    code TEXT NOT NULL,
    exercice INTEGER NOT NULL,
    boites_count INTEGER NOT NULL DEFAULT 1,
    conventions_estimees INTEGER NOT NULL DEFAULT 0,
    emplacement TEXT NOT NULL,
    site TEXT NOT NULL CHECK (site IN ('Mazala', 'Maya-Maya')),
    etat TEXT NOT NULL CHECK (etat IN ('bon', 'abime', 'a_verifier')),
    notes TEXT,
    date_enregistrement DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Incidents & Anomalies
CREATE TABLE IF NOT EXISTS public.incidents (
    id TEXT PRIMARY KEY,
    date_signalement DATE NOT NULL,
    titre TEXT NOT NULL,
    agence_id TEXT REFERENCES public.agencies(id) ON DELETE SET NULL,
    agence_nom TEXT NOT NULL,
    code TEXT NOT NULL,
    severite TEXT NOT NULL CHECK (severite IN ('faible', 'moyen', 'critique')),
    statut TEXT NOT NULL CHECK (statut IN ('signale', 'en_cours', 'resolu')),
    description TEXT NOT NULL,
    actions_prises TEXT,
    signale_par TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. Journal d'Audit & Sécurité
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id TEXT PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    user_role TEXT NOT NULL,
    action TEXT NOT NULL,
    details TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('auth', 'rapport', 'agence', 'equipe', 'utilisateur', 'systeme'))
);

-- ============================================================================
-- SÉCURITÉ AU NIVEAU DES LIGNES (RLS - Row Level Security)
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mouvements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfer_slips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cartons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Fonctions utilitaires d'habilitation
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT LANGUAGE SQL STABLE AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_super()
RETURNS BOOLEAN LANGUAGE SQL STABLE AS $$
    SELECT current_user_role() IN ('super_admin', 'admin');
$$;

-- Politiques de lecture : Tout utilisateur connecté peut lire les données métier
CREATE POLICY "Lecture autorisée pour utilisateurs authentifiés" ON public.agencies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Lecture autorisée pour utilisateurs authentifiés" ON public.team_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Lecture autorisée pour utilisateurs authentifiés" ON public.lots FOR SELECT TO authenticated USING (true);
CREATE POLICY "Lecture autorisée pour utilisateurs authentifiés" ON public.mouvements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Lecture autorisée pour utilisateurs authentifiés" ON public.daily_reports FOR SELECT TO authenticated USING (true);
CREATE POLICY "Lecture autorisée pour utilisateurs authentifiés" ON public.transfer_slips FOR SELECT TO authenticated USING (true);
CREATE POLICY "Lecture autorisée pour utilisateurs authentifiés" ON public.cartons FOR SELECT TO authenticated USING (true);
CREATE POLICY "Lecture autorisée pour utilisateurs authentifiés" ON public.incidents FOR SELECT TO authenticated USING (true);

-- Politiques sur profiles et logs : Stagiaire INTERDIT en lecture sur les logs et profils
CREATE POLICY "Lecture profiles admin seulement" ON public.profiles FOR SELECT TO authenticated USING (is_admin_or_super() OR id = auth.uid());
CREATE POLICY "Lecture audit_logs admin seulement" ON public.audit_logs FOR SELECT TO authenticated USING (is_admin_or_super());

-- Politiques d'écriture : SEULS les Administrateurs et Super Admins peuvent écrire/modifier
CREATE POLICY "Écriture agences réservée admin" ON public.agencies FOR ALL TO authenticated USING (is_admin_or_super()) WITH CHECK (is_admin_or_super());
CREATE POLICY "Écriture membres réservée admin" ON public.team_members FOR ALL TO authenticated USING (is_admin_or_super()) WITH CHECK (is_admin_or_super());
CREATE POLICY "Écriture lots réservée admin" ON public.lots FOR ALL TO authenticated USING (is_admin_or_super()) WITH CHECK (is_admin_or_super());
CREATE POLICY "Écriture mouvements réservée admin" ON public.mouvements FOR ALL TO authenticated USING (is_admin_or_super()) WITH CHECK (is_admin_or_super());
CREATE POLICY "Écriture rapports réservée admin" ON public.daily_reports FOR ALL TO authenticated USING (is_admin_or_super()) WITH CHECK (is_admin_or_super());
CREATE POLICY "Écriture bordereaux réservée admin" ON public.transfer_slips FOR ALL TO authenticated USING (is_admin_or_super()) WITH CHECK (is_admin_or_super());
CREATE POLICY "Écriture cartons réservée admin" ON public.cartons FOR ALL TO authenticated USING (is_admin_or_super()) WITH CHECK (is_admin_or_super());
CREATE POLICY "Écriture incidents réservée admin" ON public.incidents FOR ALL TO authenticated USING (is_admin_or_super()) WITH CHECK (is_admin_or_super());
CREATE POLICY "Insertion logs autorisée" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);

-- Synchronisation Realtime pour multi-sites
ALTER PUBLICATION supabase_realtime ADD TABLE public.agencies, public.daily_reports, public.transfer_slips, public.cartons, public.incidents, public.lots;
