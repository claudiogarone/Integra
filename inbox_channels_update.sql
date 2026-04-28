-- =========================================================================
-- INTEGRAOS: Aggiornamento inbox_channels per supporto multi-tenant webhook
-- Esegui questo script nel SQL Editor di Supabase
-- =========================================================================

-- 1. Aggiunge colonna metadata a inbox_channels (se non esiste già)
ALTER TABLE inbox_channels 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- 2. Aggiunge indice per ricerca rapida per provider (usato dal webhook)
CREATE INDEX IF NOT EXISTS idx_inbox_channels_provider 
ON inbox_channels(provider);

-- 3. Indice per ricerca rapida su access_token (usato dal webhook Telegram)
CREATE INDEX IF NOT EXISTS idx_inbox_channels_token 
ON inbox_channels(access_token);

-- 4. Verifica che le tabelle esistano correttamente
SELECT 
  table_name,
  (SELECT count(*) FROM information_schema.columns c WHERE c.table_name = t.table_name AND c.table_schema = 'public') as col_count
FROM information_schema.tables t
WHERE table_schema = 'public'
AND table_name IN ('inbox_channels', 'inbox_contacts', 'inbox_messages')
ORDER BY table_name;
