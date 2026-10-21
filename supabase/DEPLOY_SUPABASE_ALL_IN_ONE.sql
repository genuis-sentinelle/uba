-- ============================================================================
-- ARCHIVA UBA — DÉPLOIEMENT GLOBAL ET COMPLET SUPABASE (ALL-IN-ONE)
-- À coller et exécuter en UNE SEULE FOIS dans Supabase -> SQL Editor -> Run
-- ============================================================================

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


-- ============================================================================
-- PARTIE 2 : VERROU DU SUPER ADMIN ET ARCHIVAGE HEBDOMADAIRE
-- ============================================================================

-- ============================================================================
-- ARCHIVA UBA — MIGRATION 2 : Verrou du Super Admin & Archivage Hebdomadaire
-- Date : 2026-10-20
-- ============================================================================

-- 1) État système : une seule ligne, inaccessible depuis le navigateur ---------
CREATE TABLE IF NOT EXISTS public.system_state (
    id BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (id),          -- force une ligne unique
    super_admin_created BOOLEAN NOT NULL DEFAULT FALSE,
    super_admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    locked_at TIMESTAMPTZ
);
INSERT INTO public.system_state (id) VALUES (TRUE) ON CONFLICT DO NOTHING;

-- Si un super admin existe déjà, synchroniser l'état initial
UPDATE public.system_state
SET super_admin_created = EXISTS (SELECT 1 FROM public.profiles WHERE role = 'super_admin'),
    super_admin_id = (SELECT id FROM public.profiles WHERE role = 'super_admin' LIMIT 1),
    locked_at = CASE WHEN EXISTS (SELECT 1 FROM public.profiles WHERE role = 'super_admin') THEN now() END
WHERE id = TRUE;

ALTER TABLE public.system_state ENABLE ROW LEVEL SECURITY;      -- aucune politique = aucun accès client
REVOKE ALL ON public.system_state FROM anon, authenticated;

-- 2) Un seul super admin, garanti par la base ----------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS uq_single_super_admin
    ON public.profiles ((role)) WHERE role = 'super_admin';

-- Le super admin ne peut être ni supprimé, ni rétrogradé, ni bloqué
-- (sauf opération de maintenance explicite : SET LOCAL app.allow_super_admin_change = 'on')
CREATE OR REPLACE FUNCTION app_auth.protect_super_admin()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
    IF COALESCE(current_setting('app.allow_super_admin_change', true), '') = 'on' THEN
        RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
    END IF;

    IF TG_OP = 'DELETE' THEN
        IF OLD.role = 'super_admin' THEN
            RAISE EXCEPTION 'Le Super Administrateur ne peut pas être supprimé.';
        END IF;
        RETURN OLD;
    END IF;

    IF OLD.role = 'super_admin' AND (NEW.role <> 'super_admin' OR NEW.actif = FALSE) THEN
        RAISE EXCEPTION 'Le Super Administrateur ne peut être ni rétrogradé ni bloqué.';
    END IF;
    IF OLD.role <> 'super_admin' AND NEW.role = 'super_admin' THEN
        RAISE EXCEPTION 'Promotion en Super Administrateur interdite.';
    END IF;
    RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_protect_super_admin ON public.profiles;
CREATE TRIGGER trg_protect_super_admin
    BEFORE UPDATE OR DELETE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION app_auth.protect_super_admin();

-- 3) Statut du verrou : seule chose lisible par la page de connexion ----------
CREATE OR REPLACE FUNCTION public.is_bootstrap_locked()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
    SELECT COALESCE((SELECT super_admin_created FROM public.system_state WHERE id), FALSE)
        OR EXISTS (SELECT 1 FROM public.profiles WHERE role = 'super_admin');
$$;
REVOKE ALL ON FUNCTION public.is_bootstrap_locked() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_bootstrap_locked() TO anon, authenticated;

-- Création automatique et atomique du profil Super Admin pour le tout premier utilisateur créé dans auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE role = 'super_admin') THEN
        INSERT INTO public.profiles (id, nom_complet, email, role, titre, actif)
        VALUES (
            NEW.id,
            COALESCE(NEW.raw_user_meta_data->>'nom_complet', 'Super Administrateur'),
            NEW.email,
            'super_admin',
            COALESCE(NEW.raw_user_meta_data->>'titre', 'Super Administrateur des Archives UBA'),
            TRUE
        ) ON CONFLICT (id) DO UPDATE SET role = 'super_admin', actif = TRUE;

        UPDATE public.system_state
        SET super_admin_created = TRUE,
            super_admin_id = NEW.id,
            locked_at = now()
        WHERE id = TRUE;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4) Archives hebdomadaires -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.archive_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kind TEXT NOT NULL CHECK (kind IN ('weekly', 'manual')),
    iso_week TEXT,                                   -- ex. 2026-W43 (null pour manuel)
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    row_counts JSONB NOT NULL DEFAULT '{}',
    payload JSONB NOT NULL,
    checksum TEXT NOT NULL,                          -- SHA-256 du payload
    size_bytes INTEGER NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,   -- null = automatique
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (period_end >= period_start)
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_archive_weekly
    ON public.archive_snapshots (iso_week) WHERE kind = 'weekly';
CREATE INDEX IF NOT EXISTS idx_archive_period ON public.archive_snapshots (period_start DESC);

ALTER TABLE public.archive_snapshots ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.archive_snapshots FROM anon, authenticated;
GRANT SELECT ON public.archive_snapshots TO authenticated;
DROP POLICY IF EXISTS "archive_select_admin" ON public.archive_snapshots;
CREATE POLICY "archive_select_admin" ON public.archive_snapshots FOR SELECT TO authenticated
    USING (app_auth.is_admin_or_super());

-- Immuabilité : modification et suppression formellement interdites
CREATE OR REPLACE FUNCTION app_auth.archive_immutable()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
    RAISE EXCEPTION 'Les archives sont immuables (modification et suppression interdites).';
END $$;
DROP TRIGGER IF EXISTS trg_archive_immutable ON public.archive_snapshots;
CREATE TRIGGER trg_archive_immutable
    BEFORE UPDATE OR DELETE ON public.archive_snapshots
    FOR EACH ROW EXECUTE FUNCTION app_auth.archive_immutable();

-- Construction du cliché (interne, non exposée à l'API)
CREATE OR REPLACE FUNCTION app_auth.create_snapshot(
    p_start DATE, p_end DATE, p_kind TEXT, p_week TEXT, p_user UUID
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
    v_payload JSONB;
    v_counts  JSONB;
    v_id      UUID;
BEGIN
    v_payload := jsonb_build_object(
        'meta', jsonb_build_object('periode_debut', p_start, 'periode_fin', p_end, 'genere_le', now()),
        'agencies',          COALESCE((SELECT jsonb_agg(to_jsonb(t)) FROM public.agencies t), '[]'::jsonb),
        'team_members',      COALESCE((SELECT jsonb_agg(to_jsonb(t)) FROM public.team_members t), '[]'::jsonb),
        'lots',              COALESCE((SELECT jsonb_agg(to_jsonb(t)) FROM public.lots t), '[]'::jsonb),
        'daily_reports',     COALESCE((SELECT jsonb_agg(to_jsonb(t)) FROM public.daily_reports t     WHERE t.date_debut BETWEEN p_start AND p_end), '[]'::jsonb),
        'synthesis_reports', COALESCE((SELECT jsonb_agg(to_jsonb(t)) FROM public.synthesis_reports t WHERE t.date_debut BETWEEN p_start AND p_end), '[]'::jsonb),
        'transfer_slips',    COALESCE((SELECT jsonb_agg(to_jsonb(t)) FROM public.transfer_slips t    WHERE t.date_transfert BETWEEN p_start AND p_end), '[]'::jsonb),
        'incidents',         COALESCE((SELECT jsonb_agg(to_jsonb(t)) FROM public.incidents t         WHERE t.date_signalement BETWEEN p_start AND p_end), '[]'::jsonb),
        'attendance_records',COALESCE((SELECT jsonb_agg(to_jsonb(t)) FROM public.attendance_records t WHERE t.date BETWEEN p_start AND p_end), '[]'::jsonb),
        'mouvements',        COALESCE((SELECT jsonb_agg(to_jsonb(t)) FROM public.mouvements t        WHERE t.date BETWEEN p_start AND p_end), '[]'::jsonb),
        'cartons',           COALESCE((SELECT jsonb_agg(to_jsonb(t)) FROM public.cartons t           WHERE t.date_enregistrement BETWEEN p_start AND p_end), '[]'::jsonb),
        'audit_logs',        COALESCE((SELECT jsonb_agg(to_jsonb(t)) FROM public.audit_logs t        WHERE t."timestamp" >= p_start AND t."timestamp" < (p_end + 1)), '[]'::jsonb)
    );

    SELECT jsonb_object_agg(key, jsonb_array_length(value))
      INTO v_counts
      FROM jsonb_each(v_payload) WHERE jsonb_typeof(value) = 'array';

    INSERT INTO public.archive_snapshots
        (kind, iso_week, period_start, period_end, row_counts, payload, checksum, size_bytes, created_by)
    VALUES
        (p_kind, p_week, p_start, p_end, v_counts, v_payload,
         encode(sha256(convert_to(v_payload::text, 'UTF8')), 'hex'),
         octet_length(v_payload::text), p_user)
    ON CONFLICT (iso_week) WHERE kind = 'weekly' DO NOTHING
    RETURNING id INTO v_id;

    IF v_id IS NOT NULL THEN
        INSERT INTO public.audit_logs (id, user_id, user_name, user_role, action, details, category)
        VALUES (gen_random_uuid()::text, COALESCE(p_user::text, 'system'), 'Système', 'system',
                'Archivage', format('Archive %s créée pour la période %s → %s', p_kind, p_start, p_end), 'systeme');
    END IF;
    RETURN v_id;
END $$;
REVOKE ALL ON FUNCTION app_auth.create_snapshot(DATE, DATE, TEXT, TEXT, UUID) FROM PUBLIC, anon, authenticated;

-- Archivage automatique de la semaine courante (lundi → dimanche, heure de Brazzaville)
CREATE OR REPLACE FUNCTION app_auth.run_weekly_archive()
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
    v_start DATE := date_trunc('week', (now() AT TIME ZONE 'Africa/Brazzaville'))::date;
BEGIN
    RETURN app_auth.create_snapshot(v_start, v_start + 6, 'weekly', to_char(v_start, 'IYYY-"W"IW'), NULL);
END $$;
REVOKE ALL ON FUNCTION app_auth.run_weekly_archive() FROM PUBLIC, anon, authenticated;

-- Archivage manuel (bouton « Archiver maintenant »), réservé admin / super admin
CREATE OR REPLACE FUNCTION public.archive_now(p_start DATE DEFAULT NULL, p_end DATE DEFAULT NULL)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
    v_start DATE := COALESCE(p_start, date_trunc('week', (now() AT TIME ZONE 'Africa/Brazzaville'))::date);
BEGIN
    IF NOT app_auth.is_admin_or_super() THEN
        RAISE EXCEPTION 'Droits insuffisants pour archiver.';
    END IF;
    RETURN app_auth.create_snapshot(v_start, COALESCE(p_end, v_start + 6), 'manual', NULL, (SELECT auth.uid()));
END $$;
REVOKE ALL ON FUNCTION public.archive_now(DATE, DATE) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.archive_now(DATE, DATE) TO authenticated;

-- Vérification d'intégrité d'une archive (recalcule le SHA-256 en base)
CREATE OR REPLACE FUNCTION public.verify_archive(p_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
BEGIN
    IF NOT app_auth.is_admin_or_super() THEN
        RAISE EXCEPTION 'Droits insuffisants.';
    END IF;
    RETURN COALESCE((SELECT checksum = encode(sha256(convert_to(payload::text, 'UTF8')), 'hex')
                       FROM public.archive_snapshots WHERE id = p_id), FALSE);
END $$;
REVOKE ALL ON FUNCTION public.verify_archive(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.verify_archive(UUID) TO authenticated;

-- 5) Planification pg_cron si l'extension est disponible
CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $cron$
BEGIN
    PERFORM cron.unschedule('archiva-weekly-archive');
EXCEPTION WHEN OTHERS THEN
    NULL;
END;
$cron$;

DO $cron$
BEGIN
    PERFORM cron.schedule('archiva-weekly-archive', '0 22 * * 0', $job$SELECT app_auth.run_weekly_archive();$job$);
EXCEPTION WHEN OTHERS THEN
    NULL;
END;
$cron$;

-- ============================================================================
-- ARCHIVA UBA — MATRICE DES DROITS RLS STRICTE & ARCHIVAGE UNITAIRE
-- ============================================================================

-- 1) Droits des tables métier : INSERT/UPDATE pour admin+super ; DELETE pour super uniquement
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['agencies','team_members','lots','mouvements','daily_reports',
                           'synthesis_reports','transfer_slips','cartons','incidents','attendance_records']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "%s_write_admin" ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "%s_insert_admin" ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "%s_update_admin" ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "%s_delete_super" ON public.%I', t, t);
    EXECUTE format('CREATE POLICY "%s_insert_admin" ON public.%I FOR INSERT TO authenticated WITH CHECK (app_auth.is_admin_or_super())', t, t);
    EXECUTE format('CREATE POLICY "%s_update_admin" ON public.%I FOR UPDATE TO authenticated USING (app_auth.is_admin_or_super()) WITH CHECK (app_auth.is_admin_or_super())', t, t);
    EXECUTE format('CREATE POLICY "%s_delete_super" ON public.%I FOR DELETE TO authenticated USING (app_auth.is_super_admin())', t, t);
  END LOOP;
END $$;

-- 2) Synthèses confidentielles : lisibles par admin/super uniquement
DROP POLICY IF EXISTS "synthesis_reports_select_active" ON public.synthesis_reports;
DROP POLICY IF EXISTS "synthesis_reports_select_scoped" ON public.synthesis_reports;
CREATE POLICY "synthesis_reports_select_scoped" ON public.synthesis_reports
  FOR SELECT TO authenticated
  USING (app_auth.is_active_user() AND (type = 'equipe_public' OR app_auth.is_admin_or_super()));

-- 3) Colonnes d'archivage unitaire
ALTER TABLE public.daily_reports
  ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS archived_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS archive_note TEXT;

ALTER TABLE public.synthesis_reports
  ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS archived_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS archive_note TEXT;

ALTER TABLE public.transfer_slips
  ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS archived_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS archive_note TEXT;

-- Index de performance
CREATE INDEX IF NOT EXISTS idx_daily_reports_archived ON public.daily_reports (archived, date_debut DESC);
CREATE INDEX IF NOT EXISTS idx_synthesis_reports_archived ON public.synthesis_reports (archived, date_debut DESC);
CREATE INDEX IF NOT EXISTS idx_transfer_slips_archived ON public.transfer_slips (archived, date_transfert DESC);

-- Contraintes de cohérence
ALTER TABLE public.daily_reports DROP CONSTRAINT IF EXISTS chk_daily_reports_archived_at;
ALTER TABLE public.daily_reports ADD CONSTRAINT chk_daily_reports_archived_at CHECK (NOT archived OR archived_at IS NOT NULL);

ALTER TABLE public.synthesis_reports DROP CONSTRAINT IF EXISTS chk_synthesis_reports_archived_at;
ALTER TABLE public.synthesis_reports ADD CONSTRAINT chk_synthesis_reports_archived_at CHECK (NOT archived OR archived_at IS NOT NULL);

ALTER TABLE public.transfer_slips DROP CONSTRAINT IF EXISTS chk_transfer_slips_archived_at;
ALTER TABLE public.transfer_slips ADD CONSTRAINT chk_transfer_slips_archived_at CHECK (NOT archived OR archived_at IS NOT NULL);

-- 4) Garde d'immuabilité
CREATE OR REPLACE FUNCTION app_auth.guard_archived_rows()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF COALESCE(current_setting('app.archive_op', true), '') = 'on' THEN
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
  END IF;
  IF TG_OP = 'INSERT' THEN
    IF NEW.archived THEN RAISE EXCEPTION 'Utilisez archive_report() pour archiver un document.'; END IF;
    RETURN NEW;
  END IF;
  IF TG_OP = 'DELETE' THEN
    IF OLD.archived AND NOT app_auth.is_super_admin() THEN
      RAISE EXCEPTION 'Document archivé : suppression réservée au Super Administrateur.';
    END IF;
    RETURN OLD;
  END IF;
  IF OLD.archived THEN RAISE EXCEPTION 'Document archivé : modification interdite.'; END IF;
  IF NEW.archived THEN RAISE EXCEPTION 'Utilisez archive_report() pour archiver un document.'; END IF;
  RETURN NEW;
END $$;

-- Triggers d'immuabilité
DROP TRIGGER IF EXISTS trg_guard_archived ON public.daily_reports;
CREATE TRIGGER trg_guard_archived BEFORE INSERT OR UPDATE OR DELETE ON public.daily_reports
  FOR EACH ROW EXECUTE FUNCTION app_auth.guard_archived_rows();

DROP TRIGGER IF EXISTS trg_guard_archived ON public.synthesis_reports;
CREATE TRIGGER trg_guard_archived BEFORE INSERT OR UPDATE OR DELETE ON public.synthesis_reports
  FOR EACH ROW EXECUTE FUNCTION app_auth.guard_archived_rows();

DROP TRIGGER IF EXISTS trg_guard_archived ON public.transfer_slips;
CREATE TRIGGER trg_guard_archived BEFORE INSERT OR UPDATE OR DELETE ON public.transfer_slips
  FOR EACH ROW EXECUTE FUNCTION app_auth.guard_archived_rows();

-- 5) Procédures stockées d'archivage / désarchivage
CREATE OR REPLACE FUNCTION public.archive_report(p_kind TEXT, p_id TEXT, p_note TEXT DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_uid UUID := (SELECT auth.uid());
  v_table TEXT; v_extra TEXT := ''; v_label TEXT; v_count INT;
  v_name TEXT; v_role TEXT;
BEGIN
  IF NOT app_auth.is_admin_or_super() THEN RAISE EXCEPTION 'Droits insuffisants pour archiver.'; END IF;
  CASE p_kind
    WHEN 'daily'     THEN v_table := 'daily_reports';     v_extra := ' AND statut <> ''brouillon''';  v_label := 'Rapport journalier';
    WHEN 'synthesis' THEN v_table := 'synthesis_reports'; v_label := 'Synthèse';
    WHEN 'slip'      THEN v_table := 'transfer_slips';    v_extra := ' AND statut <> ''en_transit'''; v_label := 'Bordereau';
    ELSE RAISE EXCEPTION 'Type de document invalide.';
  END CASE;

  PERFORM set_config('app.archive_op', 'on', true);
  EXECUTE format('UPDATE public.%I SET archived = TRUE, archived_at = now(), archived_by = $1, archive_note = $2 WHERE id = $3 AND archived = FALSE%s', v_table, v_extra)
    USING v_uid, NULLIF(trim(COALESCE(p_note, '')), ''), p_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  PERFORM set_config('app.archive_op', 'off', true);

  IF v_count = 0 THEN RAISE EXCEPTION 'Document introuvable, déjà archivé, ou non éligible (brouillon / en transit).'; END IF;

  SELECT nom_complet, role INTO v_name, v_role FROM public.profiles WHERE id = v_uid;
  INSERT INTO public.audit_logs (id, user_id, user_name, user_role, action, details, category)
  VALUES (gen_random_uuid()::text, v_uid::text, COALESCE(v_name,'?'), COALESCE(v_role,'?'),
          'Archivage', format('%s %s archivé', v_label, p_id), 'rapport');

  RETURN jsonb_build_object('ok', TRUE, 'kind', p_kind, 'id', p_id);
END $$;

CREATE OR REPLACE FUNCTION public.unarchive_report(p_kind TEXT, p_id TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_uid UUID := (SELECT auth.uid());
  v_table TEXT; v_label TEXT; v_count INT;
  v_name TEXT; v_role TEXT;
BEGIN
  IF NOT app_auth.is_super_admin() THEN RAISE EXCEPTION 'Seul le Super Administrateur peut désarchiver un document.'; END IF;
  CASE p_kind
    WHEN 'daily'     THEN v_table := 'daily_reports';     v_label := 'Rapport journalier';
    WHEN 'synthesis' THEN v_table := 'synthesis_reports'; v_label := 'Synthèse';
    WHEN 'slip'      THEN v_table := 'transfer_slips';    v_label := 'Bordereau';
    ELSE RAISE EXCEPTION 'Type de document invalide.';
  END CASE;

  PERFORM set_config('app.archive_op', 'on', true);
  EXECUTE format('UPDATE public.%I SET archived = FALSE, archived_at = NULL, archived_by = NULL, archive_note = NULL WHERE id = $1 AND archived = TRUE', v_table)
    USING p_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  PERFORM set_config('app.archive_op', 'off', true);

  IF v_count = 0 THEN RAISE EXCEPTION 'Document introuvable ou non archivé.'; END IF;

  SELECT nom_complet, role INTO v_name, v_role FROM public.profiles WHERE id = v_uid;
  INSERT INTO public.audit_logs (id, user_id, user_name, user_role, action, details, category)
  VALUES (gen_random_uuid()::text, v_uid::text, COALESCE(v_name,'?'), COALESCE(v_role,'?'),
          'Désarchivage', format('%s %s désarchivé', v_label, p_id), 'rapport');

  RETURN jsonb_build_object('ok', TRUE, 'kind', p_kind, 'id', p_id);
END $$;

REVOKE ALL ON FUNCTION public.archive_report(TEXT, TEXT, TEXT)   FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.unarchive_report(TEXT, TEXT)       FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.archive_report(TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.unarchive_report(TEXT, TEXT)     TO authenticated;

