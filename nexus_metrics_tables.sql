-- 1. TABELLA NEXUS METRICS (Dati esterni: Ads, Meteo, ISTAT)
-- Esegui questo script nel SQL Editor di Supabase

CREATE TABLE IF NOT EXISTS marketing_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    source TEXT NOT NULL, -- 'google_ads', 'fb_ads', 'weather', 'istat'
    metric_name TEXT NOT NULL, -- 'spend', 'impressions', 'clicks', 'temp', 'cpi'
    metric_value NUMERIC NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb, -- Dettagli extra (es. Campaign ID o Condizione meteo)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Index for faster querying
CREATE INDEX IF NOT EXISTS idx_marketing_metrics_user_date ON marketing_metrics(user_id, date);

-- 2. RLS (Row Level Security)
ALTER TABLE marketing_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can see their own metrics" ON marketing_metrics;
CREATE POLICY "Users can see their own metrics" 
ON marketing_metrics FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own metrics" ON marketing_metrics;
CREATE POLICY "Users can insert their own metrics" 
ON marketing_metrics FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);
