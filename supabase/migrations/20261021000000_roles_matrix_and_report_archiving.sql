-- ============================================================================
-- ARCHIVA UBA — MIGRATION 20261021000000_roles_matrix_and_report_archiving.sql
-- Matrice des droits stricte :
-- - INSERT/UPDATE : Administrateurs et Super Administrateurs uniquement
-- - DELETE : Super Administrateur UNIQUEMENT (les administrateurs ne peuvent rien supprimer)
-- - Synthèses confidentielles : Administrateurs et Super Administrateurs uniquement
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

-- 2) Synthèses confidentielles : lisibles par admin/super uniquement (les stagiaires ne voient que equipe_public)
DROP POLICY IF EXISTS "synthesis_reports_select_active" ON public.synthesis_reports;
DROP POLICY IF EXISTS "synthesis_reports_select_scoped" ON public.synthesis_reports;
CREATE POLICY "synthesis_reports_select_scoped" ON public.synthesis_reports
  FOR SELECT TO authenticated
  USING (app_auth.is_active_user() AND (type = 'equipe_public' OR app_auth.is_admin_or_super()));
