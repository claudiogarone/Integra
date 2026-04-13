
-- =========================================================================
-- INTEGRAOS: NATIVE OMNICHANNEL INBOX TABLES
-- =========================================================================
-- Contiene le tabelle per la gestione indipendente di chat e bot AI
-- =========================================================================

-- 1. Tabella dei Canali di Comunicazione (Dove le aziende configurano i loro bot)
CREATE TABLE IF NOT EXISTS inbox_channels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- "telegram", "whatsapp", "livechat", "facebook", "email"
    provider TEXT NOT NULL, 
    
    -- Identificativo del canale (es: numero di telefono, bot username)
    provider_id TEXT NOT NULL, 
    
    -- Token di accesso o chiavi segrete
    access_token TEXT, 
    
    -- Informazioni visive visibili al cliente finale
    name TEXT NOT NULL,
    avatar_url TEXT,
    
    -- CONFIGURAZIONE INTELLIGENZA ARTIFICIALE
    bot_enabled BOOLEAN DEFAULT false,
    bot_prompt TEXT DEFAULT 'Sei un assistente commerciale cortese e disponibile. Rispondi in modo conciso.',
    bot_personality TEXT DEFAULT 'Professionale', -- es: Amichevole, Professionale, Aggressivo (Sales)
    
    -- META DATI (Webhook url esterni, o reference al prodotto Meta)
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    
    -- Non possono esserci due canali uguali per lo stesso provider nello stesso account
    UNIQUE(user_id, provider, provider_id)
);

-- 2. Tabella dei Contatti INBOX (Simile al CRM, ma specifica per le chat)
CREATE TABLE IF NOT EXISTS inbox_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    channel_id UUID REFERENCES inbox_channels(id) ON DELETE CASCADE,
    
    -- Dati estratti dai provider (es: l'ID utente Telegram o il numero WA)
    external_id TEXT NOT NULL,
    name TEXT,
    avatar_url TEXT,
    phone TEXT,
    email TEXT,
    
    -- Riferimento al database CRM principale di IntegraOS (se presente)
    crm_contact_id UUID, 
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    last_interaction TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    
    UNIQUE(channel_id, external_id)
);

-- 3. Tabella dei Messaggi (La live chat effettiva)
CREATE TABLE IF NOT EXISTS inbox_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    channel_id UUID REFERENCES inbox_channels(id) ON DELETE CASCADE,
    inbox_contact_id UUID REFERENCES inbox_contacts(id) ON DELETE CASCADE,
    
    -- 'inbound' (ricevuto dal cliente), 'outbound' (inviato dall'azienda/bot)
    direction TEXT NOT NULL, 
    
    -- 'text', 'image', 'document', 'audio'
    message_type TEXT DEFAULT 'text',
    
    -- Il corpo del messaggio
    content TEXT,
    
    -- Link ad eventuali allegati salvati in Storage
    attachment_url TEXT,
    
    -- 'sent', 'delivered', 'read', 'failed'
    status TEXT DEFAULT 'sent', 
    
    -- Flag che indica se questo specifico messaggio è stato generato dall'AI di IntegraOS
    is_ai_generated BOOLEAN DEFAULT false,
    
    -- ID tracciamento esterno (es: Message ID di WhatsApp o Telegram per prevenire duplicati)
    external_message_id TEXT UNIQUE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);


-- =========================================================================
-- SICUREZZA ASSOLUTA (ROW LEVEL SECURITY - RLS)
-- =========================================================================

-- Abilitiamo la protezione nativa su tutte le tabelle
ALTER TABLE inbox_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE inbox_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE inbox_messages ENABLE ROW LEVEL SECURITY;

-- REGOLE CANALI: Un'azienda (user) può leggere/modificare/creare solo i propri canali
DROP POLICY IF EXISTS "I tenant gestiscono i propri canali" ON inbox_channels;
CREATE POLICY "I tenant gestiscono i propri canali" 
ON inbox_channels FOR ALL 
USING (auth.uid() = user_id);

-- REGOLE CONTATTI: Un'azienda può leggere solo i contatti che le hanno scritto
DROP POLICY IF EXISTS "I tenant vedono i propri contatti chat" ON inbox_contacts;
CREATE POLICY "I tenant vedono i propri contatti chat" 
ON inbox_contacts FOR ALL 
USING (auth.uid() = user_id);

-- REGOLE MESSAGGI: Un'azienda può leggere, inserire messaggi solo nel proprio tenant
DROP POLICY IF EXISTS "I tenant leggono e inviano i propri messaggi" ON inbox_messages;
CREATE POLICY "I tenant leggono e inviano i propri messaggi" 
ON inbox_messages FOR ALL 
USING (auth.uid() = user_id);


-- =========================================================================
-- OTTIMIZZAZIONE E PERFORMANCE (INDEX)
-- =========================================================================
-- Indici per scorrere velocemente le chat e supportare la dashboard in tempo reale
CREATE INDEX IF NOT EXISTS idx_inbox_messages_contact ON inbox_messages(inbox_contact_id);
CREATE INDEX IF NOT EXISTS idx_inbox_messages_createdat ON inbox_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inbox_contacts_lastinteract ON inbox_contacts(last_interaction DESC);

