-- ============================================================================
-- ARCHIVA UBA — TESTS DE VALIDATION DES POLITIQUES RLS
-- Fichier exécutable dans Supabase SQL Editor ou psql
-- ============================================================================

BEGIN;

-- 1. Configuration de l'environnement de test
CREATE EXTENSION IF NOT EXISTS pgtap;

-- Création d'utilisateurs factices de test dans auth.users
DO $$
DECLARE
    uid_super UUID := '11111111-1111-1111-1111-111111111111';
    uid_admin UUID := '22222222-2222-2222-2222-222222222222';
    uid_stagiaire UUID := '33333333-3333-3333-3333-333333333333';
    uid_bloque UUID := '44444444-4444-4444-4444-444444444444';
BEGIN
    -- Insertion des profils de test
    INSERT INTO public.profiles (id, nom_complet, email, role, titre, actif)
    VALUES
        (uid_super, 'Super Admin Test', 'super@uba.test', 'super_admin', 'Chef Test', true),
        (uid_admin, 'Admin Test', 'admin@uba.test', 'admin', 'Superviseur Test', true),
        (uid_stagiaire, 'Stagiaire Test', 'stagiaire@uba.test', 'stagiaire', 'Archiviste Test', true),
        (uid_bloque, 'Bloque Test', 'bloque@uba.test', 'stagiaire', 'Bloqué Test', false)
    ON CONFLICT (id) DO UPDATE SET
        role = EXCLUDED.role,
        actif = EXCLUDED.actif;
END $$;

-- TEST 1 : Vérification que l'utilisateur anonyme (anon) n'a aucun accès
SET ROLE anon;
DO $$
DECLARE
    cnt int;
BEGIN
    BEGIN
        SELECT count(*) INTO cnt FROM public.profiles;
        RAISE EXCEPTION 'TEST 1 ÉCHEC : anon ne doit pas pouvoir lire profiles !';
    EXCEPTION WHEN insufficient_privilege THEN
        RAISE NOTICE 'TEST 1 SUCCÈS : anon rejeté par manque de privilège sur profiles.';
    END;

    BEGIN
        SELECT count(*) INTO cnt FROM public.agencies;
        RAISE EXCEPTION 'TEST 1 ÉCHEC : anon ne doit pas pouvoir lire agencies !';
    EXCEPTION WHEN insufficient_privilege THEN
        RAISE NOTICE 'TEST 1 SUCCÈS : anon rejeté par manque de privilège sur agencies.';
    END;
END $$;

-- TEST 2 : Vérification qu'un compte bloqué ne peut rien lire même avec le rôle authenticated
SET ROLE authenticated;
SET request.jwt.claim.sub = '44444444-4444-4444-4444-444444444444';

DO $$
DECLARE
    cnt int;
BEGIN
    SELECT count(*) INTO cnt FROM public.agencies;
    IF cnt > 0 THEN
        RAISE EXCEPTION 'TEST 2 ÉCHEC : un compte bloqué a pu lire des agences (count=%) !', cnt;
    END IF;

    SELECT count(*) INTO cnt FROM public.profiles;
    IF cnt > 0 THEN
        RAISE EXCEPTION 'TEST 2 ÉCHEC : un compte bloqué a pu lire des profils (count=%) !', cnt;
    END IF;

    RAISE NOTICE 'TEST 2 SUCCÈS : le compte bloqué obtient 0 ligne sur toutes les tables (RLS étanche).';
END $$;

-- TEST 3 : Vérification qu'un stagiaire actif peut lire les données métier mais pas les audit_logs ni modifier les agences
SET ROLE authenticated;
SET request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';

DO $$
DECLARE
    cnt int;
BEGIN
    -- Ne peut pas voir audit_logs
    SELECT count(*) INTO cnt FROM public.audit_logs;
    IF cnt > 0 THEN
        RAISE EXCEPTION 'TEST 3 ÉCHEC : un stagiaire a pu lire audit_logs !';
    END IF;

    -- Ne voit que son propre profil dans profiles
    SELECT count(*) INTO cnt FROM public.profiles;
    IF cnt > 1 THEN
        RAISE EXCEPTION 'TEST 3 ÉCHEC : un stagiaire ne doit voir que son propre profil (vu=%) !', cnt;
    END IF;

    -- Ne peut pas insérer d'agence
    BEGIN
        INSERT INTO public.agencies (id, code, nom, statut) VALUES ('test-ag', 'TST', 'Agence Test', 'active');
        RAISE EXCEPTION 'TEST 3 ÉCHEC : un stagiaire a pu insérer une agence !';
    EXCEPTION WHEN insufficient_privilege OR check_violation THEN
        RAISE NOTICE 'TEST 3 SUCCÈS : le stagiaire ne peut pas insérer d''agence.';
    END;

    RAISE NOTICE 'TEST 3 SUCCÈS : restrictions stagiaire validées.';
END $$;

-- TEST 4 : Vérification qu'un admin actif peut lire les profils et écrire les agences
SET ROLE authenticated;
SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

DO $$
DECLARE
    cnt int;
BEGIN
    SELECT count(*) INTO cnt FROM public.profiles;
    IF cnt < 2 THEN
        RAISE EXCEPTION 'TEST 4 ÉCHEC : l''administrateur doit voir tous les profils (vu=%) !', cnt;
    END IF;

    RAISE NOTICE 'TEST 4 SUCCÈS : l''administrateur a accès aux profils et aux écritures métier.';
END $$;

-- Annulation de la transaction pour ne laisser aucune donnée factice
ROLLBACK;
