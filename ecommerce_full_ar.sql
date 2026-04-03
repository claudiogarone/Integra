
-- ABILITA ESTENSIONE UUID SE MANCANTE
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABELLA PRODOTTI E-COMMERCE (Con Supporto AR)
CREATE TABLE IF NOT EXISTS ecommerce_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    sku TEXT,
    category TEXT,
    stock_quantity INTEGER DEFAULT 0,
    image_url TEXT,
    
    -- CAMPI REALTÀ AUMENTATA (AR)
    ar_model_url TEXT,            -- URL del file .glb (Android/Web) o .usdz (iOS)
    ar_enabled BOOLEAN DEFAULT false, -- Attivazione servizio AR per questo prodotto
    ar_view_count INTEGER DEFAULT 0,  -- Metriche di visualizzazione AR
    
    status TEXT DEFAULT 'active', -- active, draft, archived
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. TABELLA ORDINI E-COMMERCE
CREATE TABLE IF NOT EXISTS ecommerce_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    customer_id UUID, -- Opzionale, se collegato a un lead nel CRM
    status TEXT DEFAULT 'pending', -- pending, paid, shipped, cancelled
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    currency TEXT DEFAULT 'EUR',
    stripe_session_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. DETTAGLI ORDINE (ITEM)
CREATE TABLE IF NOT EXISTS ecommerce_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    order_id UUID REFERENCES ecommerce_orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES ecommerce_products(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. RLS (Row Level Security)
ALTER TABLE ecommerce_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecommerce_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecommerce_order_items ENABLE ROW LEVEL SECURITY;

-- Policy per ecommerce_products
DROP POLICY IF EXISTS "Users can manage their ecommerce products" ON ecommerce_products;
CREATE POLICY "Users can manage their ecommerce products" ON ecommerce_products 
FOR ALL USING (auth.uid() = user_id);

-- Policy per ecommerce_orders
DROP POLICY IF EXISTS "Users can manage their ecommerce orders" ON ecommerce_orders;
CREATE POLICY "Users can manage their ecommerce orders" ON ecommerce_orders 
FOR ALL USING (auth.uid() = user_id);

-- Policy per ecommerce_order_items
DROP POLICY IF EXISTS "Users can manage their ecommerce order items" ON ecommerce_order_items;
CREATE POLICY "Users can manage their ecommerce order items" ON ecommerce_order_items 
FOR ALL USING (user_id = auth.uid());

-- Trigger per updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_ecommerce_products_modtime ON ecommerce_products;
CREATE TRIGGER update_ecommerce_products_modtime BEFORE UPDATE ON ecommerce_products FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_ecommerce_orders_modtime ON ecommerce_orders;
CREATE TRIGGER update_ecommerce_orders_modtime BEFORE UPDATE ON ecommerce_orders FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
