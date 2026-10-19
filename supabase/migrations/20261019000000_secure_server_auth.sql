-- ============================================================================
-- ARCHIVA UBA — MIGRATION DE SÉCURISATION SERVEUR & SCHÉMA COMPLET IDEMPOTENT
-- Date : 2026-10-19
-- ============================================================================

-- Extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Schéma interne d'authentification non exposé à l'API publique
CREATE SCHEMA IF NOT EXISTS app_auth;
REVOKE ALL ON SCHEMA app_auth FROM PUBLIC;
REVOKE ALL ON SCHEMA app_auth FROM anon;
GRANT USAGE ON SCHEMA app_auth TO authenticated, service_role;

-- 2. Table des Profils Utilisateurs (Liée à auth.users de Supabase)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nom_complet TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'stagiaire')),
    titre TEXT DEFAULT 'Archiviste Opérationnel',
    actif BOOLEAN DEFAULT TRUE NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    blocked_at TIMESTAMP WITH TIME ZONE,
    blocked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Si la table existait déjà, s'assurer des colonnes de gouvernance
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'created_by') THEN
        ALTER TABLE public.profiles ADD COLUMN created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'blocked_at') THEN
        ALTER TABLE public.profiles ADD COLUMN blocked_at TIMESTAMP WITH TIME ZONE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'blocked_by') THEN
        ALTER TABLE public.profiles ADD COLUMN blocked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'deleted_at') THEN
        ALTER TABLE public.profiles ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
    END IF;
    ALTER TABLE public.profiles ALTER COLUMN actif SET DEFAULT TRUE;
    ALTER TABLE public.profiles ALTER COLUMN actif SET NOT NULL;
END $$;

-- Indexation profils
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_email_lower ON public.profiles (lower(email));
CREATE INDEX IF NOT EXISTS idx_profiles_actif_role ON public.profiles (actif, role);
CREATE INDEX IF NOT EXISTS idx_profiles_created_by ON public.profiles (created_by);
CREATE INDEX IF NOT EXISTS idx_profiles_blocked_by ON public.profiles (blocked_by);

-- 3. Table des Agences Bancaires UBA
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

-- 4. Table des Membres de l'Équipe Archiviste
CREATE TABLE IF NOT EXISTS public.team_members (
    id TEXT PRIMARY KEY,
    nom_officiel TEXT NOT NULL,
    alias TEXT[] DEFAULT '{}',
    categorie TEXT NOT NULL CHECK (categorie IN ('chef', 'superviseur', 'ancien_stagiaire', 'nouveau_stagiaire')),
    site TEXT NOT NULL CHECK (site IN ('Maya-Maya', 'Mazala')),
    actif BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Lots d'Archives (Agence × Exercice)
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

-- 6. Mouvements d'Archives
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

-- 7. Rapports Journaliers d'Activité (R1)
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

-- 8. Synthèses Périodiques d'Activité
CREATE TABLE IF NOT EXISTS public.synthesis_reports (
    id TEXT PRIMARY KEY,
    titre TEXT NOT NULL,
    date_debut DATE NOT NULL,
    date_fin DATE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('chef_confidentiel', 'equipe_public')),
    dossiers_traites INTEGER NOT NULL DEFAULT 0,
    dossiers_en_attente INTEGER NOT NULL DEFAULT 0,
    total_global INTEGER NOT NULL DEFAULT 0,
    boites_total INTEGER NOT NULL DEFAULT 0,
    agences_count INTEGER NOT NULL DEFAULT 7,
    jours_couverts INTEGER NOT NULL DEFAULT 0,
    jours_manquants JSONB DEFAULT '[]',
    matrice JSONB DEFAULT '[]',
    repartition_agences JSONB DEFAULT '[]',
    points_a_confirmer JSONB DEFAULT '[]',
    cree_par TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Bordereaux de Transfert & Décharge
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

-- 10. Inventaire des Cartons Physiques
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

-- 11. Incidents & Anomalies
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

-- 12. Pointage Présence
CREATE TABLE IF NOT EXISTS public.attendance_records (
    id TEXT PRIMARY KEY,
    date DATE NOT NULL,
    member_id TEXT NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
    statut TEXT NOT NULL CHECK (statut IN ('present', 'mazala', 'ordinateur', 'absent')),
    motif TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (date, member_id)
);

-- 13. Journal d'Audit & Sécurité Immuable
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

-- 14. Trigger updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 15. Fonctions d'habilitation dans app_auth (schéma privé)
CREATE OR REPLACE FUNCTION app_auth.is_active_user()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = (SELECT auth.uid())
          AND actif = true
    );
$$;

CREATE OR REPLACE FUNCTION app_auth.current_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
    SELECT role
    FROM public.profiles
    WHERE id = (SELECT auth.uid())
      AND actif = true
    LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION app_auth.is_admin_or_super()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = (SELECT auth.uid())
          AND actif = true
          AND role IN ('admin', 'super_admin')
    );
$$;

CREATE OR REPLACE FUNCTION app_auth.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = (SELECT auth.uid())
          AND actif = true
          AND role = 'super_admin'
    );
$$;

REVOKE ALL ON FUNCTION app_auth.is_active_user() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION app_auth.is_active_user() TO authenticated, service_role;

REVOKE ALL ON FUNCTION app_auth.current_role() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION app_auth.current_role() TO authenticated, service_role;

REVOKE ALL ON FUNCTION app_auth.is_admin_or_super() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION app_auth.is_admin_or_super() TO authenticated, service_role;

REVOKE ALL ON FUNCTION app_auth.is_super_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION app_auth.is_super_admin() TO authenticated, service_role;

-- Fonctions publiques déléguées pour rétro-compatibilité
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT LANGUAGE sql STABLE AS $$
    SELECT app_auth.current_role();
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_super()
RETURNS BOOLEAN LANGUAGE sql STABLE AS $$
    SELECT app_auth.is_admin_or_super();
$$;

CREATE OR REPLACE FUNCTION public.is_active_user()
RETURNS BOOLEAN LANGUAGE sql STABLE AS $$
    SELECT app_auth.is_active_user();
$$;

REVOKE ALL ON FUNCTION public.current_user_role() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.is_admin_or_super() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin_or_super() TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.is_active_user() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_active_user() TO authenticated, service_role;

-- Journalisation vérifiée
CREATE OR REPLACE FUNCTION public.log_audit_event(
    p_action TEXT,
    p_details TEXT,
    p_category TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_user_id UUID;
    v_user_name TEXT;
    v_user_role TEXT;
    v_log_id UUID;
BEGIN
    v_user_id := (SELECT auth.uid());
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentification requise pour enregistrer un journal d''audit';
    END IF;

    SELECT nom_complet, role INTO v_user_name, v_user_role
    FROM public.profiles
    WHERE id = v_user_id AND actif = true;

    IF v_user_role IS NULL THEN
        RAISE EXCEPTION 'Profil utilisateur actif introuvable';
    END IF;

    v_log_id := gen_random_uuid();

    INSERT INTO public.audit_logs (
        id,
        timestamp,
        user_id,
        user_name,
        user_role,
        action,
        details,
        category
    ) VALUES (
        v_log_id::text,
        timezone('utc'::text, now()),
        v_user_id::text,
        v_user_name,
        v_user_role,
        p_action,
        p_details,
        p_category
    );

    RETURN v_log_id;
END;
$$;

REVOKE ALL ON FUNCTION public.log_audit_event(TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.log_audit_event(TEXT, TEXT, TEXT) TO authenticated, service_role;

-- Modification restreinte de son propre profil
CREATE OR REPLACE FUNCTION public.update_my_profile(
    p_nom_complet TEXT,
    p_titre TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_user_id UUID;
    v_res JSONB;
BEGIN
    v_user_id := (SELECT auth.uid());
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Non authentifié';
    END IF;

    UPDATE public.profiles
    SET
        nom_complet = COALESCE(NULLIF(TRIM(p_nom_complet), ''), nom_complet),
        titre = COALESCE(TRIM(p_titre), titre),
        updated_at = timezone('utc'::text, now())
    WHERE id = v_user_id AND actif = true;

    SELECT to_jsonb(p) INTO v_res
    FROM public.profiles p
    WHERE p.id = v_user_id;

    RETURN v_res;
END;
$$;

REVOKE ALL ON FUNCTION public.update_my_profile(TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_my_profile(TEXT, TEXT) TO authenticated, service_role;

-- 16. Révocation des privilèges par défaut
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL ROUTINES IN SCHEMA public FROM anon;

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM authenticated;
REVOKE ALL ON ALL ROUTINES IN SCHEMA public FROM authenticated;

-- Accès granulaires accordés
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
    public.agencies,
    public.team_members,
    public.lots,
    public.mouvements,
    public.daily_reports,
    public.synthesis_reports,
    public.transfer_slips,
    public.cartons,
    public.incidents,
    public.attendance_records
TO authenticated;

GRANT SELECT ON TABLE public.profiles TO authenticated;
GRANT SELECT ON TABLE public.audit_logs TO authenticated;

-- 17. Activation RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mouvements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.synthesis_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfer_slips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cartons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Suppression préalable des politiques pour idempotence
DO $$
DECLARE
    tbl text;
    pol record;
BEGIN
    FOR tbl IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
        FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = tbl LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, tbl);
        END LOOP;
    END LOOP;
END $$;

-- Politiques RLS de lecture : utilisateur ACTIF requis
CREATE POLICY "agencies_select_active" ON public.agencies FOR SELECT TO authenticated
    USING (app_auth.is_active_user());

CREATE POLICY "team_members_select_active" ON public.team_members FOR SELECT TO authenticated
    USING (app_auth.is_active_user());

CREATE POLICY "lots_select_active" ON public.lots FOR SELECT TO authenticated
    USING (app_auth.is_active_user());

CREATE POLICY "mouvements_select_active" ON public.mouvements FOR SELECT TO authenticated
    USING (app_auth.is_active_user());

CREATE POLICY "daily_reports_select_active" ON public.daily_reports FOR SELECT TO authenticated
    USING (app_auth.is_active_user());

CREATE POLICY "synthesis_reports_select_active" ON public.synthesis_reports FOR SELECT TO authenticated
    USING (app_auth.is_active_user());

CREATE POLICY "transfer_slips_select_active" ON public.transfer_slips FOR SELECT TO authenticated
    USING (app_auth.is_active_user());

CREATE POLICY "cartons_select_active" ON public.cartons FOR SELECT TO authenticated
    USING (app_auth.is_active_user());

CREATE POLICY "incidents_select_active" ON public.incidents FOR SELECT TO authenticated
    USING (app_auth.is_active_user());

CREATE POLICY "attendance_records_select_active" ON public.attendance_records FOR SELECT TO authenticated
    USING (app_auth.is_active_user());

-- Politiques RLS d'écriture : administrateurs ou super administrateurs ACTIFS
CREATE POLICY "agencies_write_admin" ON public.agencies FOR ALL TO authenticated
    USING (app_auth.is_admin_or_super())
    WITH CHECK (app_auth.is_admin_or_super());

CREATE POLICY "team_members_write_admin" ON public.team_members FOR ALL TO authenticated
    USING (app_auth.is_admin_or_super())
    WITH CHECK (app_auth.is_admin_or_super());

CREATE POLICY "lots_write_admin" ON public.lots FOR ALL TO authenticated
    USING (app_auth.is_admin_or_super())
    WITH CHECK (app_auth.is_admin_or_super());

CREATE POLICY "mouvements_write_admin" ON public.mouvements FOR ALL TO authenticated
    USING (app_auth.is_admin_or_super())
    WITH CHECK (app_auth.is_admin_or_super());

CREATE POLICY "daily_reports_write_admin" ON public.daily_reports FOR ALL TO authenticated
    USING (app_auth.is_admin_or_super())
    WITH CHECK (app_auth.is_admin_or_super());

CREATE POLICY "synthesis_reports_write_admin" ON public.synthesis_reports FOR ALL TO authenticated
    USING (app_auth.is_admin_or_super())
    WITH CHECK (app_auth.is_admin_or_super());

CREATE POLICY "transfer_slips_write_admin" ON public.transfer_slips FOR ALL TO authenticated
    USING (app_auth.is_admin_or_super())
    WITH CHECK (app_auth.is_admin_or_super());

CREATE POLICY "cartons_write_admin" ON public.cartons FOR ALL TO authenticated
    USING (app_auth.is_admin_or_super())
    WITH CHECK (app_auth.is_admin_or_super());

CREATE POLICY "incidents_write_admin" ON public.incidents FOR ALL TO authenticated
    USING (app_auth.is_admin_or_super())
    WITH CHECK (app_auth.is_admin_or_super());

CREATE POLICY "attendance_records_write_admin" ON public.attendance_records FOR ALL TO authenticated
    USING (app_auth.is_admin_or_super())
    WITH CHECK (app_auth.is_admin_or_super());

-- Politiques sur profiles :
CREATE POLICY "profiles_select_policy" ON public.profiles FOR SELECT TO authenticated
    USING (
        app_auth.is_active_user() AND (
            app_auth.is_admin_or_super() OR id = (SELECT auth.uid())
        )
    );

-- Politiques sur audit_logs :
CREATE POLICY "audit_logs_select_admin" ON public.audit_logs FOR SELECT TO authenticated
    USING (app_auth.is_admin_or_super());

-- Index de performance
CREATE INDEX IF NOT EXISTS idx_lots_agence_id ON public.lots(agence_id);
CREATE INDEX IF NOT EXISTS idx_mouvements_lot_id ON public.mouvements(lot_id);
CREATE INDEX IF NOT EXISTS idx_mouvements_agence_id ON public.mouvements(agence_id);
CREATE INDEX IF NOT EXISTS idx_cartons_agence_id ON public.cartons(agence_id);
CREATE INDEX IF NOT EXISTS idx_cartons_lot_id ON public.cartons(lot_id);
CREATE INDEX IF NOT EXISTS idx_incidents_agence_id ON public.incidents(agence_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs(timestamp DESC);

-- Synchronisation Realtime sécurisée
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.agencies, public.daily_reports, public.synthesis_reports, public.transfer_slips, public.cartons, public.incidents, public.lots;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
END $$;
