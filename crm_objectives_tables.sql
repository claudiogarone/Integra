-- ============================================================
-- INTEGRAOS — CRM OBJECTIVES / KPI OBIETTIVI
-- Tabella per gli obiettivi di vendita con soglie min/ideale
-- ============================================================

CREATE TABLE IF NOT EXISTS crm_objectives (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    name TEXT NOT NULL,
    ob_minimum NUMERIC DEFAULT 0,
    ob_ideal NUMERIC DEFAULT 0,
    current_value NUMERIC DEFAULT 0,
    timing TEXT DEFAULT 'Mensile' CHECK (timing IN ('Mensile','Trimestrale','Annuale')),
    category TEXT DEFAULT 'generale',
    unit TEXT DEFAULT 'numero', -- 'numero', 'euro', 'percentuale'
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE crm_objectives ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_crm_objectives" ON crm_objectives;
CREATE POLICY "user_crm_objectives" ON crm_objectives FOR ALL USING (auth.uid() = user_id);
