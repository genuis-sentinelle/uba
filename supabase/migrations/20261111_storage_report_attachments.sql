-- ============================================================================
-- ARCHIVA UBA — MIGRATION SUPABASE STORAGE : report-attachments
-- ============================================================================

-- 1. Création du bucket de stockage pour les pièces jointes des rapports
INSERT INTO storage.buckets (id, name, public)
VALUES ('report-attachments', 'report-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Politiques RLS pour storage.objects
-- Lecture publique ou pour tout utilisateur authentifié
CREATE POLICY "Public Read Access on report-attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'report-attachments');

-- Insertion réservée aux utilisateurs connectés avec rôle admin ou super_admin
CREATE POLICY "Admin Upload Access on report-attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'report-attachments'
  AND (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('super_admin', 'admin')
    OR (auth.jwt() ->> 'role') = 'service_role'
  )
);

-- Suppression réservée aux super_admins
CREATE POLICY "SuperAdmin Delete Access on report-attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'report-attachments'
  AND (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin'
    OR (auth.jwt() ->> 'role') = 'service_role'
  )
);

