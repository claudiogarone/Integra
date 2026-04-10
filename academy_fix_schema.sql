-- ESEGUI QUESTO SCRIPT IN SUPABASE -> SQL EDITOR PER FIXARE IL BACKEND FORMAZIONE

-- Aggiunge le due colonne obbligatorie mancanti alla tabella academy_courses
ALTER TABLE academy_courses ADD COLUMN IF NOT EXISTS price NUMERIC DEFAULT 0;
ALTER TABLE academy_courses ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Bozza';
