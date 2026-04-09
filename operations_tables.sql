-- ============================================================
-- INTEGRA OPS & SAFETY 360 - Schema Database Completo
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ASSET INVENTORY (ICT, DPI, Parco Auto, Attrezzatura)
CREATE TABLE IF NOT EXISTS ops_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- FK a team_members in futuro
    assigned_name TEXT, -- Nome del collaboratore (denormalizzato per semplicità)
    
    -- Classificazione
    category TEXT NOT NULL DEFAULT 'ICT', -- ICT, DPI, Auto, Attrezzatura, Licenza Software
    subcategory TEXT, -- Laptop, Smartphone, Casco, Giacca, Auto Aziendale, ecc.
    name TEXT NOT NULL,
    brand TEXT,
    model TEXT,
    serial_number TEXT,
    
    -- Stato e condizione
    status TEXT DEFAULT 'Attivo', -- Attivo, In Manutenzione, Fuori Servizio, Restituito
    condition TEXT DEFAULT 'Ottimo', -- Ottimo, Buono, Usurato, Da Sostituire
    
    -- Date critiche
    purchase_date DATE,
    warranty_expiry DATE,
    next_renewal_date DATE, -- Per DPI, licenze, assicurazioni
    
    -- Costi
    purchase_price DECIMAL(10,2),
    monthly_cost DECIMAL(10,2), -- Per servizi/abbonamenti
    
    -- Extra per Auto
    license_plate TEXT,
    insurance_expiry DATE,
    road_tax_expiry DATE,
    last_service_date DATE,
    
    -- Extra per DPI
    dpi_size TEXT, -- Taglia per vestiario/scarpe
    dpi_standard TEXT, -- Es: EN ISO 20345 (scarpe di sicurezza)
    
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. TICKET DI ASSISTENZA INTERNA
CREATE TABLE IF NOT EXISTS ops_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    asset_id UUID REFERENCES ops_assets(id) ON DELETE SET NULL,
    
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT DEFAULT 'Media', -- Bassa, Media, Alta, Critica
    status TEXT DEFAULT 'Aperto', -- Aperto, In Lavorazione, Risolto, Chiuso
    
    reported_by TEXT, -- Nome del collaboratore
    assigned_to_tech TEXT, -- Tecnico assegnato
    
    opened_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    resolved_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. VISITE MEDICHE E IDONEITÀ
CREATE TABLE IF NOT EXISTS ops_medical_checkups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    employee_name TEXT NOT NULL,
    employee_role TEXT,
    
    checkup_type TEXT NOT NULL DEFAULT 'Visita Periodica', -- Visita Preventiva, Periodica, al Rientro, Straordinaria
    checkup_date DATE NOT NULL,
    next_checkup_date DATE NOT NULL, -- Data obbligatoria
    fitness_status TEXT DEFAULT 'Idoneo', -- Idoneo, Idoneo con Prescrizioni, Non Idoneo
    
    doctor_name TEXT,
    health_facility TEXT,
    certificate_url TEXT, -- URL del PDF certificato caricato
    
    notes TEXT,
    reminder_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. CONVENZIONI E BENEFIT COLLABORATORI
CREATE TABLE IF NOT EXISTS ops_benefits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    name TEXT NOT NULL, -- Es: "Palestra FitCenter"
    category TEXT DEFAULT 'Sanitario', -- Sanitario, Commerciale, Assicurativo, Formativo, Altro
    partner_name TEXT,
    description TEXT,
    discount_percentage INTEGER, -- % di sconto
    discount_notes TEXT, -- Dettagli sconto (es: "20% su tutte le visite specialistiche")
    
    contact_name TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    website_url TEXT,
    
    valid_from DATE,
    valid_until DATE,
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- RLS
ALTER TABLE ops_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ops_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ops_medical_checkups ENABLE ROW LEVEL SECURITY;
ALTER TABLE ops_benefits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ops_assets_policy" ON ops_assets;
CREATE POLICY "ops_assets_policy" ON ops_assets FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "ops_tickets_policy" ON ops_tickets;
CREATE POLICY "ops_tickets_policy" ON ops_tickets FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "ops_medical_policy" ON ops_medical_checkups;
CREATE POLICY "ops_medical_policy" ON ops_medical_checkups FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "ops_benefits_policy" ON ops_benefits;
CREATE POLICY "ops_benefits_policy" ON ops_benefits FOR ALL USING (auth.uid() = user_id);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_ops_assets_modtime ON ops_assets;
CREATE TRIGGER update_ops_assets_modtime BEFORE UPDATE ON ops_assets FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
