-- ============================================================================
-- ARCHIVA UBA — Test Suite: Archivage Unitaire des Documents (Étape 3)
-- Exécution sécurisée transactionnelle avec ROLLBACK automatique.
-- ============================================================================

BEGIN;

DO $$
DECLARE
  v_stagiaire_uid uuid := '00000000-0000-0000-0000-000000000001';
  v_admin_uid     uuid := '00000000-0000-0000-0000-000000000002';
  v_super_uid     uuid := '00000000-0000-0000-0000-000000000003';
  v_report_id     text := 'test-rep-arch-001';
  v_slip_id       text := 'test-slip-arch-001';
  v_err_caught    boolean;
  v_is_archived   boolean;
BEGIN
  RAISE NOTICE '=== DÉBUT DES TESTS ÉTAPE 3 : ARCHIVAGE UNITAIRE ===';

  -- Préparation : créer un rapport au statut valide et un bordereau au statut valide
  INSERT INTO public.daily_reports (
    id, titre, date_debut, date_fin, horaires, chef_nom, total_declare, total_calcule, ecart, statut
  ) VALUES (
    v_report_id, 'Rapport Test Archivage', '2026-10-20', '2026-10-20', '07h30 - 16h30', 'Chef Test', 100, 100, 0, 'valide'
  );

  INSERT INTO public.transfer_slips (
    id, numero_bordereau, date_transfert, site_depart, site_arrivee, chauffeur_nom, vehicule, responsable_depart, responsable_arrivee, total_boites, total_conventions, statut
  ) VALUES (
    v_slip_id, 'BT-2026-TEST', '2026-10-20', 'Maya-Maya', 'Mazala', 'Chauffeur Test', 'Toyota', 'Resp 1', 'Resp 2', 5, 500, 'valide'
  );

  -- --------------------------------------------------------------------------
  -- TEST 1 : Stagiaire ne peut PAS archiver un document (Doit lever 42501)
  -- --------------------------------------------------------------------------
  PERFORM set_config('request.jwt.claims', json_build_object(
    'sub', v_stagiaire_uid::text,
    'user_metadata', json_build_object('role', 'stagiaire')
  )::text, true);

  v_err_caught := false;
  BEGIN
    PERFORM public.archive_report('daily', v_report_id, 'Note stagiaire illicite');
  EXCEPTION WHEN OTHERS THEN
    v_err_caught := true;
    RAISE NOTICE 'TEST 1 REUSSI : Stagiaire bloqué sur archive_report (erreur: %)', SQLERRM;
  END;
  IF NOT v_err_caught THEN
    RAISE EXCEPTION 'TEST 1 ECHOUE : Le stagiaire a pu appeler archive_report !';
  END IF;

  -- --------------------------------------------------------------------------
  -- TEST 2 : Admin peut archiver un rapport éligible
  -- --------------------------------------------------------------------------
  PERFORM set_config('request.jwt.claims', json_build_object(
    'sub', v_admin_uid::text,
    'user_metadata', json_build_object('role', 'admin')
  )::text, true);

  PERFORM public.archive_report('daily', v_report_id, 'Archivage conforme par admin');

  SELECT archived INTO v_is_archived FROM public.daily_reports WHERE id = v_report_id;
  IF NOT v_is_archived THEN
    RAISE EXCEPTION 'TEST 2 ECHOUE : Le rapport n''est pas marqué comme archivé !';
  END IF;
  RAISE NOTICE 'TEST 2 REUSSI : Admin a archivé le rapport avec succès.';

  -- --------------------------------------------------------------------------
  -- TEST 3 : Une fois archivé, UPDATE est formellement bloqué par le trigger
  -- --------------------------------------------------------------------------
  v_err_caught := false;
  BEGIN
    UPDATE public.daily_reports SET titre = 'Titre Modifié Illicite' WHERE id = v_report_id;
  EXCEPTION WHEN OTHERS THEN
    v_err_caught := true;
    RAISE NOTICE 'TEST 3 REUSSI : UPDATE bloqué sur rapport archivé (trigger: %)', SQLERRM;
  END;
  IF NOT v_err_caught THEN
    RAISE EXCEPTION 'TEST 3 ECHOUE : Un rapport archivé a pu être modifié !';
  END IF;

  -- --------------------------------------------------------------------------
  -- TEST 4 : Une fois archivé, DELETE est formellement bloqué par le trigger
  -- --------------------------------------------------------------------------
  v_err_caught := false;
  BEGIN
    DELETE FROM public.daily_reports WHERE id = v_report_id;
  EXCEPTION WHEN OTHERS THEN
    v_err_caught := true;
    RAISE NOTICE 'TEST 4 REUSSI : DELETE bloqué sur rapport archivé (trigger: %)', SQLERRM;
  END;
  IF NOT v_err_caught THEN
    RAISE EXCEPTION 'TEST 4 ECHOUE : Un rapport archivé a pu être supprimé !';
  END IF;

  -- --------------------------------------------------------------------------
  -- TEST 5 : Admin ne peut PAS désarchiver (Seul Super Admin peut)
  -- --------------------------------------------------------------------------
  v_err_caught := false;
  BEGIN
    PERFORM public.unarchive_report('daily', v_report_id);
  EXCEPTION WHEN OTHERS THEN
    v_err_caught := true;
    RAISE NOTICE 'TEST 5 REUSSI : Admin bloqué sur unarchive_report (erreur: %)', SQLERRM;
  END;
  IF NOT v_err_caught THEN
    RAISE EXCEPTION 'TEST 5 ECHOUE : Un admin standard a pu désarchiver un document !';
  END IF;

  -- --------------------------------------------------------------------------
  -- TEST 6 : Super Admin peut désarchiver
  -- --------------------------------------------------------------------------
  PERFORM set_config('request.jwt.claims', json_build_object(
    'sub', v_super_uid::text,
    'user_metadata', json_build_object('role', 'super_admin')
  )::text, true);

  PERFORM public.unarchive_report('daily', v_report_id);

  SELECT archived INTO v_is_archived FROM public.daily_reports WHERE id = v_report_id;
  IF v_is_archived THEN
    RAISE EXCEPTION 'TEST 6 ECHOUE : Le rapport est toujours marqué comme archivé après désarchivage !';
  END IF;
  RAISE NOTICE 'TEST 6 REUSSI : Super Admin a désarchivé le rapport avec succès.';

  RAISE NOTICE '=== TOUS LES TESTS ÉTAPE 3 ONT RÉUSSI AVEC SUCCÈS ===';
END $$;

ROLLBACK;
