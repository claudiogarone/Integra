-- SCRIPT DI AGGIORNAMENTO TABELLA PROFILES (Hub Aziendale & B2B)
-- Esegui questo script nel SQL Editor di Supabase

-- 1. CAMPI BASE AZIENDALI
ALTER TABLE IF EXISTS profiles 
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS company_email TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_number TEXT,
ADD COLUMN IF NOT EXISTS phone_secondary TEXT,
ADD COLUMN IF NOT EXISTS p_iva TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS cap TEXT,
ADD COLUMN IF NOT EXISTS province TEXT,
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS company_logo TEXT; -- Per compatibilità legacy

-- 2. CAMPI ABBONAMENTO E LIMITI
ALTER TABLE IF EXISTS profiles 
ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'Base', -- Base, Enterprise, Ambassador
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active'; -- active, trialing, past_due, canceled

-- 3. CAMPI AVANZATI (JSONB per flessibilità)
ALTER TABLE IF EXISTS profiles 
ADD COLUMN IF NOT EXISTS websites JSONB DEFAULT '{"main": "", "ecommerce": ""}'::jsonb,
ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{"facebook": "", "instagram": "", "linkedin": "", "tiktok": "", "x": "", "youtube": "", "telegram": ""}'::jsonb,
ADD COLUMN IF NOT EXISTS business_hours JSONB DEFAULT '{
      "lunedì": {"open": "09:00", "close": "18:00", "closed": false},
      "martedì": {"open": "09:00", "close": "18:00", "closed": false},
      "mercoledì": {"open": "09:00", "close": "18:00", "closed": false},
      "giovedì": {"open": "09:00", "close": "18:00", "closed": false},
      "venerdì": {"open": "09:00", "close": "18:00", "closed": false},
      "sabato": {"open": "09:00", "close": "13:00", "closed": false},
      "domenica": {"open": "", "close": "", "closed": true}
}'::jsonb,
ADD COLUMN IF NOT EXISTS ai_settings JSONB DEFAULT '{"allow_auto_booking": false}'::jsonb;

-- 4. CAMPI PER AFFILIAZIONE & MEETING
ALTER TABLE IF EXISTS profiles 
ADD COLUMN IF NOT EXISTS host_video_url TEXT,
ADD COLUMN IF NOT EXISTS host_meeting_url TEXT;

-- 5. AGGIORNAMENTO TIMESTAMP (Opzionale se non presenti)
ALTER TABLE IF EXISTS profiles 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
