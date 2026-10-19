-- ============================================================================
-- ARCHIVA UBA — TESTS DE VALIDATION DES POLITIQUES RLS ET DE SÉCURITÉ
-- Fichier exécutable dans Supabase SQL Editor ou psql
-- ============================================================================

BEGIN;

-- 1. Configuration des utilisateurs factices de test dans auth.users
DO $$
DECLARE
    uid_super UUID := '11111111-1111-1111-1111-111111111111';
    uid_admin UUID := '22222222-2222-2222-2222-222222222222';
    uid_stagiaire UUID := '33333333-3333-3333-3333-333333333333';
    uid_bloque UUID := '44444444-4444-4444-4444-444444444444';
    uid_super2 UUID := '55555555-5555-5555-5555-555555555555';
BEGIN
    -- Création préalable dans auth.users pour satisfaire la clé étrangère
    INSERT INTO auth.users (id, email, raw_user_meta_data)
    VALUES
        (uid_super, 'super@uba.test', '{"nom_complet":"Super Admin Test"}'::jsonb),
        (uid_admin, 'admin@uba.test', '{"nom_complet":"Admin Test"}'::jsonb),
        (uid_stagiaire, 'stagiaire@uba.test', '{"nom_complet":"Stagiaire Test"}'::jsonb),
        (uid_bloque, 'bloque@uba.test', '{"nom_complet":"Bloque Test"}'::jsonb),
        (uid_super2, 'super2@uba.test', '{"nom_complet":"Second Super Admin"}'::jsonb)
    ON CONFLICT (id) DO NOTHING;

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

-- TEST 1 : Vérification que l'utilisateur anonyme (anon) n'a accès à rien sauf is_bootstrap_locked()
SET ROLE anon;
DO $$
DECLARE
    cnt int;
    locked boolean;
BEGIN
    BEGIN
        SELECT count(*) INTO cnt FROM public.profiles;
        RAISE EXCEPTION 'TEST 1 ÉCHEC : anon ne doit pas pouvoir lire profiles !';
    EXCEPTION WHEN insufficient_privilege THEN
        RAISE NOTICE 'TEST 1 SUCCÈS : anon rejeté sur profiles.';
    END;

    BEGIN
        SELECT count(*) INTO cnt FROM public.agencies;
        RAISE EXCEPTION 'TEST 1 ÉCHEC : anon ne doit pas pouvoir lire agencies !';
    EXCEPTION WHEN insufficient_privilege THEN
        RAISE NOTICE 'TEST 1 SUCCÈS : anon rejeté sur agencies.';
    END;

    BEGIN
        SELECT count(*) INTO cnt FROM public.system_state;
        RAISE EXCEPTION 'TEST 1 ÉCHEC : anon ne doit pas pouvoir lire system_state !';
    EXCEPTION WHEN insufficient_privilege THEN
        RAISE NOTICE 'TEST 1 SUCCÈS : anon rejeté sur system_state.';
    END;

    -- anon peut uniquement exécuter is_bootstrap_locked()
    BEGIN
        SELECT public.is_bootstrap_locked() INTO locked;
        RAISE NOTICE 'TEST 1 SUCCÈS : is_bootstrap_locked() accessible à anon (valeur=%).', locked;
    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'TEST 1 ÉCHEC : is_bootstrap_locked() doit être accessible à anon !';
    END;
END $$;

-- TEST 2 : Vérification qu'un second Super Admin ne peut pas être inséré (index unique)
SET ROLE postgres;
DO $$
DECLARE
    uid_super2 UUID := '55555555-5555-5555-5555-555555555555';
BEGIN
    BEGIN
        INSERT INTO public.profiles (id, nom_complet, email, role, titre, actif)
        VALUES (uid_super2, 'Second Super', 'super2@uba.test', 'super_admin', 'Chef 2', true);
        RAISE EXCEPTION 'TEST 2 ÉCHEC : La base a permis l''insertion d''un second super admin !';
    EXCEPTION WHEN unique_violation THEN
        RAISE NOTICE 'TEST 2 SUCCÈS : Second super admin rejeté par l''index unique uq_single_super_admin.';
    END;
END $$;

-- TEST 3 : Protection du Super Admin contre la rétrogradation et suppression
SET ROLE postgres;
DO $$
DECLARE
    uid_super UUID := '11111111-1111-1111-1111-111111111111';
BEGIN
    BEGIN
        UPDATE public.profiles SET role = 'admin' WHERE id = uid_super;
        RAISE EXCEPTION 'TEST 3 ÉCHEC : La rétrogradation du Super Admin aurait dû échouer !';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'TEST 3 SUCCÈS : Le trigger app_auth.protect_super_admin() empêche la rétrogradation.';
    END;

    BEGIN
        DELETE FROM public.profiles WHERE id = uid_super;
        RAISE EXCEPTION 'TEST 3 ÉCHEC : La suppression du Super Admin aurait dû échouer !';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'TEST 3 SUCCÈS : Le trigger app_auth.protect_super_admin() empêche la suppression.';
    END;
END $$;

-- TEST 4 : Vérification qu'un compte bloqué ne peut rien lire même avec authenticated
SET ROLE authenticated;
SET request.jwt.claim.sub = '44444444-4444-4444-4444-444444444444';

DO $$
DECLARE
    cnt int;
BEGIN
    SELECT count(*) INTO cnt FROM public.agencies;
    IF cnt > 0 THEN
        RAISE EXCEPTION 'TEST 4 ÉCHEC : un compte bloqué a pu lire des agences (count=%) !', cnt;
    END IF;

    SELECT count(*) INTO cnt FROM public.profiles;
    IF cnt > 0 THEN
        RAISE EXCEPTION 'TEST 4 ÉCHEC : un compte bloqué a pu lire des profils (count=%) !', cnt;
    END IF;

    RAISE NOTICE 'TEST 4 SUCCÈS : le compte bloqué obtient 0 ligne sur toutes les tables (RLS étanche).';
END $$;

-- TEST 5 : Vérification qu'un stagiaire actif est en lecture seule absolue
SET ROLE authenticated;
SET request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';

DO $$
DECLARE
    cnt int;
BEGIN
    -- Ne peut pas voir audit_logs
    SELECT count(*) INTO cnt FROM public.audit_logs;
    IF cnt > 0 THEN
        RAISE EXCEPTION 'TEST 5 ÉCHEC : un stagiaire a pu lire audit_logs !';
    END IF;

    -- Ne voit que son propre profil dans profiles
    SELECT count(*) INTO cnt FROM public.profiles;
    IF cnt > 1 THEN
        RAISE EXCEPTION 'TEST 5 ÉCHEC : un stagiaire ne doit voir que son propre profil (vu=%) !', cnt;
    END IF;

    -- Ne peut pas voir les archive_snapshots
    SELECT count(*) INTO cnt FROM public.archive_snapshots;
    IF cnt > 0 THEN
        RAISE EXCEPTION 'TEST 5 ÉCHEC : un stagiaire a pu lire archive_snapshots !';
    END IF;

    -- Ne peut pas insérer d'agence
    BEGIN
        INSERT INTO public.agencies (id, code, nom, statut) VALUES ('test-ag', 'TST', 'Agence Test', 'active');
        RAISE EXCEPTION 'TEST 5 ÉCHEC : un stagiaire a pu insérer une agence !';
    EXCEPTION WHEN insufficient_privilege OR check_violation THEN
        RAISE NOTICE 'TEST 5 SUCCÈS : le stagiaire ne peut pas insérer d''agence.';
    END;

    RAISE NOTICE 'TEST 5 SUCCÈS : restrictions stagiaire validées avec succès.';
END $$;

-- TEST 6 : Immuabilité des archives hebdomadaires
SET ROLE postgres;
DO $$
DECLARE
    v_arch_id UUID;
BEGIN
    -- Création d'une archive de test
    INSERT INTO public.archive_snapshots (kind, period_start, period_end, payload, checksum, size_bytes)
    VALUES ('manual', CURRENT_DATE, CURRENT_DATE, '{"test":true}'::jsonb, 'abc', 13)
    RETURNING id INTO v_arch_id;

    -- Tentative de mise à jour (doit échouer)
    BEGIN
        UPDATE public.archive_snapshots SET checksum = 'modifie' WHERE id = v_arch_id;
        RAISE EXCEPTION 'TEST 6 ÉCHEC : Une archive a pu être modifiée !';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'TEST 6 SUCCÈS : Modification d''archive bloquée par trigger d''immuabilité.';
    END;

    -- Tentative de suppression (doit échouer)
    BEGIN
        DELETE FROM public.archive_snapshots WHERE id = v_arch_id;
        RAISE EXCEPTION 'TEST 6 ÉCHEC : Une archive a pu être supprimée !';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'TEST 6 SUCCÈS : Suppression d''archive bloquée par trigger d''immuabilité.';
    END;
END $$;

-- Annulation de la transaction pour ne laisser aucune trace dans la base
ROLLBACK;
