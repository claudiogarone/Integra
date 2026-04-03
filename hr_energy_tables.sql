
--- 1. VALUTAZIONE PERFORMANCE (Feedback & KPI Agenti)
CREATE TABLE IF NOT EXISTS performance_evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    agent_id UUID REFERENCES auth.users(id), -- L'agente valutato
    score INTEGER CHECK (score >= 1 AND score <= 10),
    feedback TEXT,
    kpis JSONB, -- { "sales": 100, "conversion_rate": 0.25, ... }
    period_start DATE,
    period_end DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

--- 2. WELLNESS AZIENDALE (Check-in & Sentiment)
CREATE TABLE IF NOT EXISTS wellness_checkins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    agent_id UUID REFERENCES auth.users(id),
    mood_score INTEGER CHECK (mood_score >= 1 AND mood_score <= 5),
    stress_level INTEGER CHECK (stress_level >= 1 AND stress_level <= 5),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

--- 3. ENERGY MONITOR (Consumi & Efficientamento)
CREATE TABLE IF NOT EXISTS energy_readings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    location TEXT, -- Ufficio A, Sede Centrale, ecc.
    consumption_kwh DECIMAL(10,2) NOT NULL,
    cost_estimated DECIMAL(10,2),
    reading_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

--- 4. RLS
ALTER TABLE performance_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE wellness_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE energy_readings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Gli utenti possono gestire le proprie valutazioni" ON performance_evaluations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Gli utenti possono gestire i propri checkin wellness" ON wellness_checkins FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Gli utenti possono gestire i propri monitoraggi energia" ON energy_readings FOR ALL USING (auth.uid() = user_id);
