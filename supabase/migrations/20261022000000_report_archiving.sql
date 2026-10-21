-- ============================================================================
-- ARCHIVA UBA — MIGRATION 20261022000000_report_archiving.sql
-- Module d'archivage unitaire :
-- - Colonnes archived, archived_at, archived_by, archive_note sur daily_reports, synthesis_reports, transfer_slips
-- - Garde d'immuabilité (trigger app_auth.guard_archived_rows)
-- - Fonctions sécurisées public.archive_report() et public.unarchive_report()
-- ============================================================================

-- 1. Ajout des colonnes sur les trois tables
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

-- 2. Index de performance pour le filtrage
CREATE INDEX IF NOT EXISTS idx_daily_reports_archived ON public.daily_reports (archived, date_debut DESC);
CREATE INDEX IF NOT EXISTS idx_synthesis_reports_archived ON public.synthesis_reports (archived, date_debut DESC);
CREATE INDEX IF NOT EXISTS idx_transfer_slips_archived ON public.transfer_slips (archived, date_transfert DESC);

-- 3. Contraintes de cohérence
ALTER TABLE public.daily_reports DROP CONSTRAINT IF EXISTS chk_daily_reports_archived_at;
ALTER TABLE public.daily_reports ADD CONSTRAINT chk_daily_reports_archived_at CHECK (NOT archived OR archived_at IS NOT NULL);

ALTER TABLE public.synthesis_reports DROP CONSTRAINT IF EXISTS chk_synthesis_reports_archived_at;
ALTER TABLE public.synthesis_reports ADD CONSTRAINT chk_synthesis_reports_archived_at CHECK (NOT archived OR archived_at IS NOT NULL);

ALTER TABLE public.transfer_slips DROP CONSTRAINT IF EXISTS chk_transfer_slips_archived_at;
ALTER TABLE public.transfer_slips ADD CONSTRAINT chk_transfer_slips_archived_at CHECK (NOT archived OR archived_at IS NOT NULL);

-- 4. Garde d'immuabilité
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

-- Triggers d'immuabilité sur les 3 tables
DROP TRIGGER IF EXISTS trg_guard_archived ON public.daily_reports;
CREATE TRIGGER trg_guard_archived BEFORE INSERT OR UPDATE OR DELETE ON public.daily_reports
  FOR EACH ROW EXECUTE FUNCTION app_auth.guard_archived_rows();

DROP TRIGGER IF EXISTS trg_guard_archived ON public.synthesis_reports;
CREATE TRIGGER trg_guard_archived BEFORE INSERT OR UPDATE OR DELETE ON public.synthesis_reports
  FOR EACH ROW EXECUTE FUNCTION app_auth.guard_archived_rows();

DROP TRIGGER IF EXISTS trg_guard_archived ON public.transfer_slips;
CREATE TRIGGER trg_guard_archived BEFORE INSERT OR UPDATE OR DELETE ON public.transfer_slips
  FOR EACH ROW EXECUTE FUNCTION app_auth.guard_archived_rows();

-- 5. Procédure stockée sécurisée d'archivage
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

-- 6. Procédure stockée sécurisée de désarchivage (Super Admin uniquement)
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

-- 7. Droits d'exécution RPC
REVOKE ALL ON FUNCTION public.archive_report(TEXT, TEXT, TEXT)   FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.unarchive_report(TEXT, TEXT)       FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.archive_report(TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.unarchive_report(TEXT, TEXT)     TO authenticated;
