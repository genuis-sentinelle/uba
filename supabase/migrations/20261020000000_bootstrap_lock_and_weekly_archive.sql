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
DO $$
BEGIN
    BEGIN
        CREATE EXTENSION IF NOT EXISTS pg_cron;
        PERFORM cron.unschedule('archiva-weekly-archive');
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    BEGIN
        PERFORM cron.schedule('archiva-weekly-archive', '0 22 * * 0', $$SELECT app_auth.run_weekly_archive();$$);
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
END $$;
