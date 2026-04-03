
-- Tabella per le integrazioni Nexus Hub (WhatsApp, POS, etc.)
CREATE TABLE IF NOT EXISTS integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    app_id TEXT NOT NULL, -- es: 'whatsapp_sync', 'pos_sumup'
    target_id UUID, -- Riferimento all'agente o al negozio (team_members.id)
    settings JSONB DEFAULT '{}', -- API keys, tokens, etc.
    status TEXT DEFAULT 'active', -- 'active', 'error', 'disconnected'
    last_sync TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- RLS
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

-- Policy (Gli utenti vedono solo le loro integrazioni)
DROP POLICY IF EXISTS "Gli utenti possono gestire le proprie integrazioni" ON integrations;
CREATE POLICY "Gli utenti possono gestire le proprie integrazioni" ON integrations FOR ALL USING (auth.uid() = user_id);
