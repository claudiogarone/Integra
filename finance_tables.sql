
--- 1. TABELLA TRANSAZIONI (Entrate/Uscite)
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    type TEXT NOT NULL, -- 'income' (entrata) o 'expense' (uscita)
    category TEXT NOT NULL, -- 'vendite', 'marketing', 'personale', 'software', ecc.
    amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    currency TEXT DEFAULT 'EUR',
    description TEXT,
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    status TEXT DEFAULT 'completed', -- 'pending', 'completed', 'failed'
    metadata JSONB, -- Dati aggiuntivi (es: ID ordine, ID Stripe)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

--- 2. TABELLA BUDGET (Obiettivi Finanziari)
CREATE TABLE IF NOT EXISTS budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    category TEXT NOT NULL,
    target_amount DECIMAL(10,2) NOT NULL,
    period TEXT NOT NULL, -- 'monthly', 'quarterly', 'yearly'
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

--- 3. TABELLA KPI FINANZIARI (Aggregati per Dashboard CFO)
CREATE TABLE IF NOT EXISTS kpi_financials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    month_year DATE NOT NULL, -- Primo giorno del mese
    revenue DECIMAL(10,2) DEFAULT 0.00,
    expenses DECIMAL(10,2) DEFAULT 0.00,
    gross_margin DECIMAL(10,2) DEFAULT 0.00,
    net_profit DECIMAL(10,2) DEFAULT 0.00,
    burn_rate DECIMAL(10,2) DEFAULT 0.00,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

--- 4. RLS (Row Level Security)
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_financials ENABLE ROW LEVEL SECURITY;

-- Policy per Transactions
DROP POLICY IF EXISTS "Gli utenti possono gestire le proprie transazioni" ON transactions;
CREATE POLICY "Gli utenti possono gestire le proprie transazioni" ON transactions FOR ALL USING (auth.uid() = user_id);

-- Policy per Budgets
DROP POLICY IF EXISTS "Gli utenti possono gestire i propri budget" ON budgets;
CREATE POLICY "Gli utenti possono gestire i propri budget" ON budgets FOR ALL USING (auth.uid() = user_id);

-- Policy per KPI
DROP POLICY IF EXISTS "Gli utenti possono vedere i propri KPI" ON kpi_financials;
CREATE POLICY "Gli utenti possono vedere i propri KPI" ON kpi_financials FOR ALL USING (auth.uid() = user_id);
