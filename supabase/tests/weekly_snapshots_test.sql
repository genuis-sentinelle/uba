-- ============================================================================
-- ARCHIVA UBA — Test Suite: Clichés Hebdomadaires Scellés (Étape 4)
-- Exécution transactionnelle avec ROLLBACK automatique.
-- ============================================================================

BEGIN;

DO $$
DECLARE
  v_stagiaire_uid uuid := '00000000-0000-0000-0000-000000000001';
  v_admin_uid     uuid := '00000000-0000-0000-0000-000000000002';
  v_super_uid     uuid := '00000000-0000-0000-0000-000000000003';
  v_snapshot_id   uuid;
  v_err_caught    boolean;
  v_is_valid      boolean;
BEGIN
  RAISE NOTICE '=== DÉBUT DES TESTS ÉTAPE 4 : CLICHÉS HEBDOMADAIRES ===';

  -- --------------------------------------------------------------------------
  -- TEST 1 : Stagiaire ne peut PAS créer de cliché (Doit échouer)
  -- --------------------------------------------------------------------------
  PERFORM set_config('request.jwt.claims', json_build_object(
    'sub', v_stagiaire_uid::text,
    'user_metadata', json_build_object('role', 'stagiaire')
  )::text, true);

  v_err_caught := false;
  BEGIN
    PERFORM public.archive_now('2026-10-12'::date, '2026-10-18'::date);
  EXCEPTION WHEN OTHERS THEN
    v_err_caught := true;
    RAISE NOTICE 'TEST 1 RÉUSSI : Stagiaire bloqué sur archive_now (erreur: %)', SQLERRM;
  END;
  IF NOT v_err_caught THEN
    RAISE EXCEPTION 'TEST 1 ÉCHOUÉ : Un stagiaire a pu appeler archive_now !';
  END IF;

  -- --------------------------------------------------------------------------
  -- TEST 2 : Admin peut créer un cliché d'archives pour une période
  -- --------------------------------------------------------------------------
  PERFORM set_config('request.jwt.claims', json_build_object(
    'sub', v_admin_uid::text,
    'user_metadata', json_build_object('role', 'admin')
  )::text, true);

  v_snapshot_id := public.archive_now('2026-10-12'::date, '2026-10-18'::date);

  IF v_snapshot_id IS NULL THEN
    RAISE EXCEPTION 'TEST 2 ÉCHOUÉ : archive_now a retourné NULL pour un administrateur !';
  END IF;
  RAISE NOTICE 'TEST 2 RÉUSSI : Admin a généré le cliché ID: %', v_snapshot_id;

  -- --------------------------------------------------------------------------
  -- TEST 3 : Le cliché est scellé avec un checksum SHA-256 valide
  -- --------------------------------------------------------------------------
  v_is_valid := public.verify_archive(v_snapshot_id);
  IF NOT v_is_valid THEN
    RAISE EXCEPTION 'TEST 3 ÉCHOUÉ : Le checksum SHA-256 du cliché ne correspond pas au payload !';
  END IF;
  RAISE NOTICE 'TEST 3 RÉUSSI : Empreinte SHA-256 vérifiée et certifiée intègre.';

  -- --------------------------------------------------------------------------
  -- TEST 4 : Immutabilité absolue - UPDATE formellement interdit sur archive_snapshots
  -- --------------------------------------------------------------------------
  v_err_caught := false;
  BEGIN
    UPDATE public.archive_snapshots SET checksum = 'tampered_hash' WHERE id = v_snapshot_id;
  EXCEPTION WHEN OTHERS THEN
    v_err_caught := true;
    RAISE NOTICE 'TEST 4 RÉUSSI : UPDATE bloqué par trigger d''immutabilité (erreur: %)', SQLERRM;
  END;
  IF NOT v_err_caught THEN
    RAISE EXCEPTION 'TEST 4 ÉCHOUÉ : Une archive scellée a pu être modifiée !';
  END IF;

  -- --------------------------------------------------------------------------
  -- TEST 5 : Immutabilité absolue - DELETE formellement interdit sur archive_snapshots
  -- --------------------------------------------------------------------------
  v_err_caught := false;
  BEGIN
    DELETE FROM public.archive_snapshots WHERE id = v_snapshot_id;
  EXCEPTION WHEN OTHERS THEN
    v_err_caught := true;
    RAISE NOTICE 'TEST 5 RÉUSSI : DELETE bloqué par trigger d''immutabilité (erreur: %)', SQLERRM;
  END;
  IF NOT v_err_caught THEN
    RAISE EXCEPTION 'TEST 5 ÉCHOUÉ : Une archive scellée a pu être supprimée !';
  END IF;

  -- --------------------------------------------------------------------------
  -- TEST 6 : Stagiaire ne peut PAS appeler verify_archive
  -- --------------------------------------------------------------------------
  PERFORM set_config('request.jwt.claims', json_build_object(
    'sub', v_stagiaire_uid::text,
    'user_metadata', json_build_object('role', 'stagiaire')
  )::text, true);

  v_err_caught := false;
  BEGIN
    PERFORM public.verify_archive(v_snapshot_id);
  EXCEPTION WHEN OTHERS THEN
    v_err_caught := true;
    RAISE NOTICE 'TEST 6 RÉUSSI : Stagiaire bloqué sur verify_archive (erreur: %)', SQLERRM;
  END;
  IF NOT v_err_caught THEN
    RAISE EXCEPTION 'TEST 6 ÉCHOUÉ : Un stagiaire a pu appeler verify_archive !';
  END IF;

  RAISE NOTICE '=== TOUS LES TESTS ÉTAPE 4 ONT RÉUSSI AVEC SUCCÈS ===';
END $$;

ROLLBACK;
