-- AGGIORNAMENTO TABELLA AI AVATARS (Video Support)
-- Esegui questo script nel SQL Editor di Supabase

ALTER TABLE IF EXISTS ai_avatars 
ADD COLUMN IF NOT EXISTS avatar_video_url TEXT;
