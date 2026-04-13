-- 1. Modifica della Tabella Profiles (Gestione Budget Voice AI)
-- Aggiungiamo i controlli di sicurezza per impedire spese extra rispetto al desiderato
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS voice_budget_limit NUMERIC DEFAULT 100.0,
ADD COLUMN IF NOT EXISTS voice_current_spend NUMERIC DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS voice_ai_prompt TEXT DEFAULT 'Sei un assistente AI cordiale ed efficiente.',
ADD COLUMN IF NOT EXISTS voice_ai_provider_key TEXT; -- Per eventuale custom key dell'azienda se porta il suo trunk

-- 2. Creazione della Tabella Voice Logs (Per Trascrizione e storico chiamate)
CREATE TABLE IF NOT EXISTS voice_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    contact_id BIGINT REFERENCES contacts(id) ON DELETE SET NULL, -- Collegamento alla scheda CRM
    phone_number TEXT NOT NULL,
    direction TEXT CHECK (direction IN ('inbound', 'outbound')),
    status TEXT, -- 'completed', 'failed', 'voicemail'
    duration_minutes NUMERIC DEFAULT 0,
    cost_charged NUMERIC DEFAULT 0, -- Costo addebitato all'utente
    transcript TEXT, -- La trascrizione testuale dell'intera chiamata (inviata da Vapi)
    summary TEXT, -- Mini-riassunto generato da AI a fine chiamata
    recording_url TEXT, -- Link all'audio se disponibile
    call_id TEXT, -- ID univoco della chiamata lato Vapi/Twilio
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Sicurezza: Abilitazione RLS e Policies per la privacy multi-tenant
ALTER TABLE voice_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Gli utenti possono vedere le proprie chiamate voice" ON voice_logs;
CREATE POLICY "Gli utenti possono vedere le proprie chiamate voice" ON voice_logs 
FOR ALL USING (auth.uid() = user_id);

-- Creazione dell'indice per ricerca veloce sul CRM
CREATE INDEX IF NOT EXISTS idx_voice_logs_user_id ON voice_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_logs_contact_id ON voice_logs(contact_id);

-- NOTA: Aggiungiamo il tipo risorsa 'voice_min_ai' in utils/billing se richiesto,
-- anche se lo script usa campi separati
