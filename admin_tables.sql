-- ============================================================
-- INTEGRAOS ADMIN — Tabelle per consensi privacy e tracking
-- ============================================================

-- CONSENSI PRIVACY / GDPR
CREATE TABLE IF NOT EXISTS privacy_consents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    full_name TEXT,
    accepted_privacy BOOLEAN DEFAULT TRUE,
    accepted_marketing BOOLEAN DEFAULT FALSE,
    consent_version TEXT DEFAULT '1.0',
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_privacy_consents_email ON privacy_consents(email);
CREATE INDEX IF NOT EXISTS idx_privacy_consents_created ON privacy_consents(created_at DESC);

-- No RLS — gestita solo da admin con service role key
ALTER TABLE privacy_consents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_only_consents" ON privacy_consents;
CREATE POLICY "admin_only_consents" ON privacy_consents FOR ALL USING (auth.role() = 'service_role');

-- TRACKING VISUALIZZAZIONI PIATTAFORMA
CREATE TABLE IF NOT EXISTS page_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    page TEXT NOT NULL,              -- 'integraos_platform' | 'formazione_esterna' | specifico path
    section TEXT,                    -- sezione specifica (es. 'crm', 'academy', 'formazione/corso-1')
    user_id UUID,                    -- NULL se non loggato
    user_email TEXT,
    session_id TEXT,
    referrer TEXT,
    country TEXT DEFAULT 'IT',
    viewed_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_page_views_page ON page_views(page);
CREATE INDEX IF NOT EXISTS idx_page_views_viewed ON page_views(viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_section ON page_views(section);

ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_insert_page_views" ON page_views;
CREATE POLICY "public_insert_page_views" ON page_views FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "admin_select_page_views" ON page_views;
CREATE POLICY "admin_select_page_views" ON page_views FOR SELECT USING (auth.role() = 'service_role');

-- MESSAGGI ADMIN (Log contatti inviati agli utenti)
CREATE TABLE IF NOT EXISTS admin_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    to_email TEXT NOT NULL,
    to_name TEXT,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    status TEXT DEFAULT 'sent',   -- 'sent' | 'failed'
    sent_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE admin_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_only_messages" ON admin_messages;
CREATE POLICY "admin_only_messages" ON admin_messages FOR ALL USING (auth.role() = 'service_role');
