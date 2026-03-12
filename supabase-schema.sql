-- =============================================
-- SUPABASE SCHEMA: Angloville Tasks v2
-- Wklej to w SQL Editor na supabase.com
-- =============================================

-- Tabela tasks
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  links TEXT,
  market TEXT DEFAULT 'pl',
  status TEXT DEFAULT 'open',
  assignees TEXT[] DEFAULT '{}',
  comments JSONB DEFAULT '[]',
  subtasks JSONB DEFAULT '[]',
  created_by TEXT,
  submitted_by TEXT,
  submitter_email TEXT,
  is_external BOOLEAN DEFAULT false,
  language TEXT DEFAULT 'pl',
  approved_by TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_market ON tasks(market);
CREATE INDEX IF NOT EXISTS idx_tasks_language ON tasks(language);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at DESC);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tasks_updated_at ON tasks;
CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- SUBTASKS STRUCTURE (stored in JSONB):
-- [
--   {
--     "id": "abc123",
--     "title": "Zrobić kreacje",
--     "assignee": "damian_w",
--     "status": "open",
--     "createdAt": "2024-01-15T10:00:00Z"
--   }
-- ]
-- =============================================

-- Jeśli tabela już istnieje, dodaj kolumnę:
-- ALTER TABLE tasks ADD COLUMN IF NOT EXISTS subtasks JSONB DEFAULT '[]';
