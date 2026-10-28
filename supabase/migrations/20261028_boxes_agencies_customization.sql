-- ============================================================================
-- ARCHIVA UBA — MIGRATION ADDITIVE SÉCURISÉE (Octobre 2026)
-- Ajout des champs de gestion des boîtes, agences et personnalisation des rapports
-- ============================================================================

-- 1. Cartons : Enrichissement des indicateurs de boîtes & tri
ALTER TABLE public.cartons
  ADD COLUMN IF NOT EXISTS boites_datees INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS boites_non_datees INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS boites_recues INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS boites_non_triees INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS statut_tri TEXT DEFAULT 'en_cours' CHECK (statut_tri IN ('non_commence', 'en_cours', 'termine'));

-- 2. Agences : Ordre d'affichage administrable
ALTER TABLE public.agencies
  ADD COLUMN IF NOT EXISTS ordre INTEGER DEFAULT 0;

-- 3. Rapports Journaliers : Personnalisation & gestion de sections
ALTER TABLE public.daily_reports
  ADD COLUMN IF NOT EXISTS custom_styles JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS hide_matrix BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS boites_datees INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS boites_non_datees INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS boites_recues INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS boites_non_triees INTEGER DEFAULT 0;

-- 4. Synthèses : Personnalisation & options d'affichage
ALTER TABLE public.synthesis_reports
  ADD COLUMN IF NOT EXISTS custom_styles JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS hide_matrix BOOLEAN DEFAULT FALSE;

-- 5. Publication Realtime pour synchronisation multi-appareils automatique
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'daily_reports'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_reports;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'cartons'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.cartons;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'agencies'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.agencies;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'transfer_slips'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.transfer_slips;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'synthesis_reports'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.synthesis_reports;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'attendance'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'incidents'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.incidents;
  END IF;
END $$;
