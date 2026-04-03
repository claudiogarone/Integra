
-- Tabella per i membri del team (Human, Store, AI Bot)
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id), -- Admin/Host della piattaforma
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    role TEXT DEFAULT 'Agente Vendite',
    branch TEXT DEFAULT 'Sede Centrale',
    type TEXT DEFAULT 'human', -- 'human', 'store', 'ai'
    social_linkedin TEXT,
    social_instagram TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- RLS
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Policy (L'admin vede solo i propri membri del team)
DROP POLICY IF EXISTS "Gli utenti possono gestire il proprio team" ON team_members;
CREATE POLICY "Gli utenti possono gestire il proprio team" ON team_members FOR ALL USING (auth.uid() = user_id);
