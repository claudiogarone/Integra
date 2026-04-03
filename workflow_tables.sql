
-- Tabella per le configurazioni dei Workflow CRM
CREATE TABLE IF NOT EXISTS workflows (
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

-- Tabella per le entrate nei workflow (per gestire i ritardi e gli stati dei contatti)
CREATE TABLE IF NOT EXISTS workflow_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
    contact_id UUID, -- Riferimento al contatto/lead
    current_node_id TEXT,
    status TEXT, -- 'in_progress', 'completed', 'waiting'
    next_execution TIMESTAMP WITH TIME ZONE,
    payload JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Tabella per i log di esecuzione dei workflow
CREATE TABLE IF NOT EXISTS workflow_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    time_stamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    workflow_name TEXT,
    trigger_event TEXT,
    status TEXT, -- 'success', 'failed'
    error_message TEXT,
    payload JSONB
);

-- RLS
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_logs ENABLE ROW LEVEL SECURITY;

-- Policy
DROP POLICY IF EXISTS "Gli utenti possono gestire i propri workflow" ON workflows;
CREATE POLICY "Gli utenti possono gestire i propri workflow" ON workflows FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Gli utenti possono vedere i propri workflow entries" ON workflow_entries;
CREATE POLICY "Gli utenti possono vedere i propri workflow entries" ON workflow_entries FOR ALL USING (
    EXISTS (SELECT 1 FROM workflows WHERE workflows.id = workflow_entries.workflow_id AND workflows.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Gli utenti possono vedere i propri workflow logs" ON workflow_logs;
CREATE POLICY "Gli utenti possono vedere i propri workflow logs" ON workflow_logs FOR ALL USING (auth.uid() = user_id);
