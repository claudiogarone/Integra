-- ============================================================
-- PULIZIA (cancella tabelle parziali da run precedenti falliti)
-- ============================================================
DROP TABLE IF EXISTS compliance_audit_log CASCADE;
DROP TABLE IF EXISTS verbal_orders CASCADE;
DROP TABLE IF EXISTS contact_blacklist CASCADE;
DROP TABLE IF EXISTS rpo_verifications CASCADE;
DROP TABLE IF EXISTS privacy_consents CASCADE;

-- 1. CONSENSI GRANULARI PER CONTATTO
CREATE TABLE IF NOT EXISTS privacy_consents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id BIGINT REFERENCES contacts(id) ON DELETE CASCADE,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  -- Consensi granulari (art. 7 GDPR)
  consent_phone BOOLEAN DEFAULT false,        -- Contatto telefonico outbound
  consent_email BOOLEAN DEFAULT false,        -- Invio email commerciali
  consent_sms BOOLEAN DEFAULT false,          -- Invio SMS promozionali
  consent_profiling BOOLEAN DEFAULT false,    -- Profilazione e analisi comportamentale
  consent_third_party BOOLEAN DEFAULT false,  -- Cessione a terzi
  -- Prova di acquisizione (obbligo GDPR)
  source TEXT NOT NULL DEFAULT 'manual',      -- 'form', 'verbal_order', 'email', 'manual'
  source_detail TEXT,                         -- es: "Form Facebook del 12/03/2026 - IP 1.2.3.4"
  acquisition_ip TEXT,
  acquisition_url TEXT,
  -- Opt-out
  opted_out_at TIMESTAMPTZ,
  opt_out_reason TEXT,
  -- Metadati
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '2 years')
);

-- 2. VERIFICA RPO (Registro delle Opposizioni)
-- La verifica ha validità 15 giorni (normativa vigente)
CREATE TABLE IF NOT EXISTS rpo_verifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id BIGINT REFERENCES contacts(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  -- Esito verifica
  is_registered BOOLEAN,                      -- true = iscritto al RPO (NON contattare)
  verification_status TEXT DEFAULT 'pending', -- 'pending', 'clear', 'registered', 'failed'
  verified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,                     -- verified_at + 15 giorni
  -- Metadati
  verified_by TEXT DEFAULT 'manual',          -- 'api', 'manual'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. BLACKLIST CENTRALIZZATA
-- Numeri/email bloccati per tutti gli operatori dell'account
CREATE TABLE IF NOT EXISTS contact_blacklist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_value TEXT NOT NULL,                -- Numero telefono o email
  contact_type TEXT NOT NULL DEFAULT 'phone', -- 'phone', 'email'
  reason TEXT NOT NULL,                       -- Motivo del blocco
  reason_type TEXT DEFAULT 'opt_out',         -- 'opt_out', 'rpo', 'legal', 'complaint'
  blocked_at TIMESTAMPTZ DEFAULT now(),
  blocked_by TEXT,
  active BOOLEAN DEFAULT true,
  notes TEXT,
  UNIQUE(user_id, contact_value, contact_type)
);

-- 4. VERBAL ORDER / DIGITAL CONFIRMATION
-- Registrazione dell'accettazione contrattuale via telefono o digitale
CREATE TABLE IF NOT EXISTS verbal_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id BIGINT REFERENCES contacts(id) ON DELETE SET NULL,
  contact_name TEXT,
  contact_phone TEXT,
  -- Tipo di conferma
  confirmation_type TEXT NOT NULL DEFAULT 'verbal', -- 'verbal', 'digital', 'written'
  -- Dati chiamata (per Verbal Order)
  call_date TIMESTAMPTZ,
  call_duration_seconds INTEGER,
  cli_number TEXT,                            -- Numero chiamante (CLI - deve essere registrato ROC)
  roc_registered BOOLEAN DEFAULT false,       -- CLI registrato al ROC
  recording_url TEXT,                         -- URL della registrazione
  recording_consent BOOLEAN DEFAULT false,    -- Consenso alla registrazione dichiarato
  -- Script rispettato
  script_followed BOOLEAN DEFAULT false,
  operator_id TEXT,
  -- Esito
  status TEXT DEFAULT 'pending',              -- 'pending', 'valid', 'invalid', 'cancelled'
  contract_accepted BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. AUDIT LOG — per ispezioni Garante Privacy
-- Ogni azione rilevante viene loggata immutabilmente
CREATE TABLE IF NOT EXISTS compliance_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Evento
  event_type TEXT NOT NULL,                   -- 'consent_given', 'consent_revoked', 'rpo_check', 'blacklist_add', 'contact_attempt', 'verbal_order'
  event_description TEXT NOT NULL,
  -- Soggetto dell'evento
  contact_id BIGINT,
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  -- Dettagli tecnici
  operator_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  -- Timestamp immutabile
  created_at TIMESTAMPTZ DEFAULT now()
);

-- INDEXES per performance
CREATE INDEX IF NOT EXISTS idx_privacy_consents_user ON privacy_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_privacy_consents_contact ON privacy_consents(contact_id);
CREATE INDEX IF NOT EXISTS idx_rpo_verifications_phone ON rpo_verifications(phone_number);
CREATE INDEX IF NOT EXISTS idx_rpo_verifications_user ON rpo_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_blacklist_value ON contact_blacklist(contact_value, contact_type);
CREATE INDEX IF NOT EXISTS idx_blacklist_user ON contact_blacklist(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON compliance_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_event ON compliance_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_verbal_orders_user ON verbal_orders(user_id);

-- ROW LEVEL SECURITY
ALTER TABLE privacy_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE rpo_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_blacklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE verbal_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own consents" ON privacy_consents FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users see own rpo" ON rpo_verifications FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users see own blacklist" ON contact_blacklist FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users see own verbal orders" ON verbal_orders FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users see own audit log" ON compliance_audit_log FOR ALL USING (auth.uid() = user_id);
