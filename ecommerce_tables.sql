
--- 1. TABELLA PRODOTTI
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    sku TEXT,
    category TEXT,
    stock_quantity INTEGER DEFAULT 0,
    image_url TEXT,
    status TEXT DEFAULT 'active', -- active, draft, archived
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

--- 2. TABELLA ORDINI
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    customer_id UUID, -- Opzionale, se collegato a un contatto CRM
    status TEXT DEFAULT 'pending', -- pending, paid, shipped, cancelled
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    currency TEXT DEFAULT 'EUR',
    stripe_session_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

--- 3. DETTAGLI ORDINE (ITEM)
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

--- 4. RLS (Row Level Security)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Policy per Products
DROP POLICY IF EXISTS "Gli utenti possono gestire i propri prodotti" ON products;
CREATE POLICY "Gli utenti possono gestire i propri prodotti" ON products FOR ALL USING (auth.uid() = user_id);

-- Policy per Orders
DROP POLICY IF EXISTS "Gli utenti possono gestire i propri ordini" ON orders;
CREATE POLICY "Gli utenti possono gestire i propri ordini" ON orders FOR ALL USING (auth.uid() = user_id);

-- Policy per Order Items
DROP POLICY IF EXISTS "Gli utenti possono vedere i dettagli dei propri ordini" ON order_items;
CREATE POLICY "Gli utenti possono vedere i dettagli dei propri ordini" ON order_items FOR ALL USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
);
