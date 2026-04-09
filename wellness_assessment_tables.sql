-- ============================================================
-- INTEGRAOS — SCHEDA BENESSERE AZIENDALE
-- 8 dimensioni con punteggio 1-10 e calcolo rischio/opportunità
-- ============================================================

CREATE TABLE IF NOT EXISTS wellness_assessments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    period TEXT NOT NULL,                   -- "Q1 2026", "Aprile 2026"
    communication SMALLINT DEFAULT 5 CHECK (communication BETWEEN 1 AND 10),
    procedures SMALLINT DEFAULT 5 CHECK (procedures BETWEEN 1 AND 10),
    training SMALLINT DEFAULT 5 CHECK (training BETWEEN 1 AND 10),
    goal_alignment SMALLINT DEFAULT 5 CHECK (goal_alignment BETWEEN 1 AND 10),
    reward_system SMALLINT DEFAULT 5 CHECK (reward_system BETWEEN 1 AND 10),
    brand_status SMALLINT DEFAULT 5 CHECK (brand_status BETWEEN 1 AND 10),
    career_opportunities SMALLINT DEFAULT 5 CHECK (career_opportunities BETWEEN 1 AND 10),
    benefits SMALLINT DEFAULT 5 CHECK (benefits BETWEEN 1 AND 10),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE wellness_assessments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_wellness_assessments" ON wellness_assessments;
CREATE POLICY "user_wellness_assessments" ON wellness_assessments FOR ALL USING (auth.uid() = user_id);
