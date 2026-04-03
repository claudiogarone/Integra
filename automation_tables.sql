
-- Tabella per le configurazioni delle automazioni
CREATE TABLE IF NOT EXISTS automations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    name TEXT NOT NULL,
    status BOOLEAN DEFAULT true,
    nodes INTEGER DEFAULT 0,
    runs INTEGER DEFAULT 0,
    configuration JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Tabella per i log di esecuzione
CREATE TABLE IF NOT EXISTS automation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    automation_id UUID REFERENCES automations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    time_stamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    workflow_name TEXT,
    trigger_event TEXT,
    status TEXT, -- 'success', 'failed'
    saved_time TEXT, -- es: '5 min'
    error_message TEXT,
    payload JSONB -- Dati processati
);

-- RLS (Row Level Security)
ALTER TABLE automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;

-- Policy per automations
DROP POLICY IF EXISTS "Gli utenti possono gestire le proprie automazioni" ON automations;
CREATE POLICY "Gli utenti possono gestire le proprie automazioni" 
ON automations FOR ALL 
USING (auth.uid() = user_id);

-- Policy per automation_logs
DROP POLICY IF EXISTS "Gli utenti possono vedere i propri log" ON automation_logs;
CREATE POLICY "Gli utenti possono vedere i propri log" 
ON automation_logs FOR SELECT 
USING (auth.uid() = user_id);
