-- ============================================================
-- 🔍 INTEGRAOS - SCRIPT DI VERIFICA DATABASE COMPLETO
-- Incolla questo script nel SQL Editor di Supabase
-- Esegui ogni sezione separatamente per chiarezza
-- ============================================================

-- ============================================================
-- STEP 1: ELENCO COMPLETO DI TUTTE LE TABELLE PUBBLICHE
-- ============================================================
SELECT 
    table_name AS "Tabella",
    CASE 
        WHEN table_name LIKE 'ops_%' THEN '🛡️ Ops & Safety'
        WHEN table_name LIKE 'reputation_%' THEN '⭐ Reputation Manager'
        WHEN table_name LIKE 'academy_%' THEN '🎓 Academy'
        WHEN table_name LIKE 'ecommerce_%' THEN '🛒 E-commerce AR'
        WHEN table_name IN ('transactions','budgets','kpi_financials') THEN '💰 Finance'
        WHEN table_name IN ('performance_evaluations','wellness_checkins','energy_readings') THEN '👥 HR & Energy'
        WHEN table_name IN ('team_members') THEN '🤝 Agenti & Teams'
        WHEN table_name IN ('hot_leads','campaigns','quotes','campaign_recipients') THEN '📊 CRM & Marketing'
        WHEN table_name LIKE 'ai_avatar%' OR table_name LIKE 'avatar%' THEN '🤖 AI Avatar Studio'
        WHEN table_name IN ('workflows','workflow_logs','workflow_entries','automations') THEN '⚡ Automazioni'
        WHEN table_name IN ('profiles','loyalty_cards','loyalty_transactions') THEN '🏢 Core'
        ELSE '📦 Altro'
    END AS "Modulo",
    pg_size_pretty(pg_total_relation_size(quote_ident(table_name))) AS "Dimensione"
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY "Modulo", table_name;

-- ============================================================
-- STEP 2: CONTEGGIO RIGHE PER OGNI TABELLA PRINCIPALE
-- (Esegui questo dopo il STEP 1)
-- ============================================================
SELECT
  'profiles' AS tabella, COUNT(*) AS righe FROM profiles
UNION ALL SELECT 'ops_assets', COUNT(*) FROM ops_assets
UNION ALL SELECT 'ops_tickets', COUNT(*) FROM ops_tickets
UNION ALL SELECT 'ops_medical_checkups', COUNT(*) FROM ops_medical_checkups
UNION ALL SELECT 'ops_benefits', COUNT(*) FROM ops_benefits
UNION ALL SELECT 'reputation_reviews', COUNT(*) FROM reputation_reviews
UNION ALL SELECT 'reputation_platforms', COUNT(*) FROM reputation_platforms
UNION ALL SELECT 'reputation_reply_templates', COUNT(*) FROM reputation_reply_templates
UNION ALL SELECT 'academy_courses', COUNT(*) FROM academy_courses
UNION ALL SELECT 'academy_lessons', COUNT(*) FROM academy_lessons
UNION ALL SELECT 'academy_live_events', COUNT(*) FROM academy_live_events
UNION ALL SELECT 'ecommerce_products', COUNT(*) FROM ecommerce_products
UNION ALL SELECT 'ecommerce_orders', COUNT(*) FROM ecommerce_orders
UNION ALL SELECT 'transactions', COUNT(*) FROM transactions
UNION ALL SELECT 'budgets', COUNT(*) FROM budgets
UNION ALL SELECT 'team_members', COUNT(*) FROM team_members
UNION ALL SELECT 'hot_leads', COUNT(*) FROM hot_leads
UNION ALL SELECT 'performance_evaluations', COUNT(*) FROM performance_evaluations
UNION ALL SELECT 'wellness_checkins', COUNT(*) FROM wellness_checkins
UNION ALL SELECT 'energy_readings', COUNT(*) FROM energy_readings
UNION ALL SELECT 'workflows', COUNT(*) FROM workflows
ORDER BY righe DESC;

-- ============================================================
-- STEP 3: VERIFICA POLICY RLS - SICUREZZA DATI
-- Controlla che ogni tabella abbia la protezione attivata
-- ============================================================
SELECT 
    tablename AS "Tabella",
    rowsecurity AS "RLS Attivo",
    CASE WHEN rowsecurity THEN '✅ Sicuro' ELSE '⚠️ ATTENZIONE - RLS Disattivo!' END AS "Stato"
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================================
-- STEP 4: VERIFICA POLICIES ESISTENTI
-- ============================================================
SELECT 
    tablename AS "Tabella",
    policyname AS "Policy",
    cmd AS "Operazione",
    roles AS "Ruoli"
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================
-- STEP 5: TEST INTEGRITÀ REFERENZIALE
-- Verifica che le FK siano correttamente impostate
-- ============================================================
SELECT
    tc.table_name AS "Tabella",
    kcu.column_name AS "Colonna",
    ccu.table_name AS "Tabella Riferita",
    ccu.column_name AS "Colonna Riferita"
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- ============================================================
-- STEP 6: VERIFICA PROFILE UTENTE CORRENTE
-- (Controlla che l'utente loggato abbia un profilo configurato)
-- ============================================================
SELECT 
    p.id,
    p.company_name AS "Azienda",
    p.updated_at AS "Ultimo Aggiornamento",
    (SELECT COUNT(*) FROM transactions t WHERE t.user_id = p.id) AS "Transazioni",
    (SELECT COUNT(*) FROM campaigns c WHERE c.user_id = p.id) AS "Campagne",
    (SELECT COUNT(*) FROM ops_assets a WHERE a.user_id = p.id) AS "Asset Ops",
    (SELECT COUNT(*) FROM reputation_reviews r WHERE r.user_id = p.id) AS "Recensioni"
FROM profiles p
ORDER BY p.updated_at DESC;

-- ============================================================
-- STEP 7: SEED DATI DEMO (opzionale)
-- Decommentare per inserire dati di test nell'account corrente
-- ============================================================
/*
-- Inserisci un asset ICT demo
INSERT INTO ops_assets (user_id, category, name, brand, model, assigned_name, serial_number, status, next_renewal_date)
VALUES (auth.uid(), 'ICT', 'MacBook Pro 14"', 'Apple', 'MBP14 M3', 'Mario Rossi', 'C02X123456', 'Attivo', CURRENT_DATE + INTERVAL '365 days');

-- Inserisci una visita medica demo
INSERT INTO ops_medical_checkups (user_id, employee_name, employee_role, checkup_type, checkup_date, next_checkup_date, fitness_status, doctor_name)
VALUES (auth.uid(), 'Mario Rossi', 'Agente Commerciale', 'Visita Periodica', CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE + INTERVAL '335 days', 'Idoneo', 'Dr. Bianchi');

-- Inserisci una convenzione demo
INSERT INTO ops_benefits (user_id, name, category, partner_name, description, discount_percentage, is_active)
VALUES (auth.uid(), 'Palestra FitCenter', 'Sanitario', 'FitCenter Srl', '20% di sconto su abbonamento annuale per tutti i collaboratori', 20, true);

-- Inserisci una recensione demo
INSERT INTO reputation_reviews (user_id, platform, reviewer_name, rating, review_text, sentiment, reply_status, review_date)
VALUES (auth.uid(), 'Google', 'Luca Ferrari', 5, 'Servizio eccellente, team professionale e sempre disponibile. Consigliatissimo!', 'Positivo', 'Da Rispondere', NOW());

-- Inserisci una transazione demo
INSERT INTO transactions (user_id, type, category, amount, description)
VALUES (auth.uid(), 'income', 'vendite', 2500.00, 'Vendita pacchetto IntegraOS Enterprise');
*/
