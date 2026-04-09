-- ============================================================
-- INTEGRA REPUTATION MANAGER - Schema Database
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. RECENSIONI (Aggregate da Google, Trustpilot, Facebook, etc.)
CREATE TABLE IF NOT EXISTS reputation_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    platform TEXT NOT NULL DEFAULT 'Google', -- Google, Trustpilot, Facebook, TripAdvisor, Manuale
    external_review_id TEXT, -- ID della recensione sulla piattaforma (per evitare duplicati)
    
    reviewer_name TEXT NOT NULL DEFAULT 'Utente Anonimo',
    reviewer_avatar TEXT,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    
    review_text TEXT,
    review_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    
    -- Risposta aziendale
    reply_text TEXT,
    reply_date TIMESTAMP WITH TIME ZONE,
    reply_status TEXT DEFAULT 'Da Rispondere', -- Da Rispondere, Bozza AI, Pubblicato, Non Risposto
    
    -- Sentiment AI
    sentiment TEXT DEFAULT 'Neutro', -- Positivo, Neutro, Negativo, Misto
    ai_summary TEXT, -- Riassunto automatico dei punti chiave della recensione
    keywords TEXT[], -- Parole chiave estratte dall'AI
    
    is_flagged BOOLEAN DEFAULT false, -- Segnalata come sospetta/inappropriata
    is_hidden BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. PROFILI DELLE PIATTAFORME MONITORATE
CREATE TABLE IF NOT EXISTS reputation_platforms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    platform TEXT NOT NULL, -- Google, Trustpilot, Facebook, ecc.
    profile_url TEXT,
    api_key TEXT, -- Chiave API per la sincronizzazione automatica (cifrata)
    place_id TEXT, -- Per Google My Business
    
    is_connected BOOLEAN DEFAULT false,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    
    -- Statistiche snapshot
    total_reviews INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. TEMPLATE RISPOSTE AI
CREATE TABLE IF NOT EXISTS reputation_reply_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    name TEXT NOT NULL, -- Es: "Risposta Positiva Standard"
    tone TEXT DEFAULT 'Professionale', -- Professionale, Caloroso, Formale, Ironico
    context TEXT DEFAULT 'Positivo', -- Positivo, Negativo, Neutro, Problema Tecnico
    template_text TEXT NOT NULL,
    
    usage_count INTEGER DEFAULT 0,
    is_default BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- RLS
ALTER TABLE reputation_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE reputation_platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE reputation_reply_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reputation_reviews_policy" ON reputation_reviews;
CREATE POLICY "reputation_reviews_policy" ON reputation_reviews FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "reputation_platforms_policy" ON reputation_platforms;
CREATE POLICY "reputation_platforms_policy" ON reputation_platforms FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "reputation_templates_policy" ON reputation_reply_templates;
CREATE POLICY "reputation_templates_policy" ON reputation_reply_templates FOR ALL USING (auth.uid() = user_id);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_reputation_reviews_user_id ON reputation_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reputation_reviews_platform ON reputation_reviews(platform);
CREATE INDEX IF NOT EXISTS idx_reputation_reviews_rating ON reputation_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reputation_reviews_status ON reputation_reviews(reply_status);
