-- TABELLA AI AVATARS (Digital Persona Studio)
-- Esegui questo script nel SQL Editor di Supabase

CREATE TABLE IF NOT EXISTS ai_avatars (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    avatar_img_url TEXT, -- Immagine generata o caricata
    gender TEXT CHECK (gender IN ('male', 'female', 'neutral')) DEFAULT 'neutral',
    
    -- CONFIGURAZIONE VOCALE (ElevenLabs o simili)
    voice_id TEXT, 
    voice_settings JSONB DEFAULT '{"stability": 0.5, "similarity_boost": 0.75, "style": 0.0, "use_speaker_boost": true}'::jsonb,
    
    -- IDENTITÀ E COMPORTAMENTO
    personality_prompt TEXT, -- Istruzioni su come deve parlare e agire
    style_config JSONB DEFAULT '{"clothes": "Professional", "vibe": "Empathetic", "background": "Office"}'::jsonb,
    
    -- STATO E INTEGRAZIONE
    is_active BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- RLS (Row Level Security)
ALTER TABLE ai_avatars ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can see their own avatars" ON ai_avatars;
CREATE POLICY "Users can see their own avatars" 
ON ai_avatars FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own avatars" ON ai_avatars;
CREATE POLICY "Users can manage their own avatars" 
ON ai_avatars FOR ALL 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
