-- ============================================================
-- 🚑 INTEGRAOS - MIGRAZIONE DATI: UUID FAKE → UTENTE REALE
-- 
-- PROBLEMA: Dati salvati con UUID fake '00000000-...' invece
--           dell'UUID reale dell'utente autenticato.
--
-- ISTRUZIONI:
-- 1. Verifica prima il tuo UUID reale con la query STEP 0
-- 2. Sostituisci REAL_USER_ID con il tuo UUID reale
-- 3. Esegui le sezioni nell'ordine indicato
-- ============================================================

-- ============================================================
-- STEP 0: TROVA IL TUO UUID REALE (esegui per primo)
-- ============================================================
SELECT 
    u.id AS "Il Tuo UUID Reale",
    u.email AS "Email",
    u.created_at AS "Registrato il"
FROM auth.users u
WHERE u.email IS NOT NULL
ORDER BY u.created_at DESC;

-- ============================================================
-- STEP 1: ANTEPRIMA - Cosa verrà migrato
-- (Esegui per vedere i dati prima di modificarli)
-- ============================================================
SELECT 'profiles' AS tabella, COUNT(*) AS righe_da_migrare FROM profiles WHERE id = '00000000-0000-0000-0000-000000000000'
UNION ALL SELECT 'campaigns', COUNT(*) FROM campaigns WHERE user_id = '00000000-0000-0000-0000-000000000000'
UNION ALL SELECT 'transactions', COUNT(*) FROM transactions WHERE user_id = '00000000-0000-0000-0000-000000000000'
UNION ALL SELECT 'ops_assets', COUNT(*) FROM ops_assets WHERE user_id = '00000000-0000-0000-0000-000000000000'
UNION ALL SELECT 'ops_tickets', COUNT(*) FROM ops_tickets WHERE user_id = '00000000-0000-0000-0000-000000000000'
UNION ALL SELECT 'ops_medical_checkups', COUNT(*) FROM ops_medical_checkups WHERE user_id = '00000000-0000-0000-0000-000000000000'
UNION ALL SELECT 'ops_benefits', COUNT(*) FROM ops_benefits WHERE user_id = '00000000-0000-0000-0000-000000000000'
UNION ALL SELECT 'reputation_reviews', COUNT(*) FROM reputation_reviews WHERE user_id = '00000000-0000-0000-0000-000000000000'
UNION ALL SELECT 'ecommerce_products', COUNT(*) FROM ecommerce_products WHERE user_id = '00000000-0000-0000-0000-000000000000'
UNION ALL SELECT 'academy_courses', COUNT(*) FROM academy_courses WHERE user_id = '00000000-0000-0000-0000-000000000000'
UNION ALL SELECT 'team_members', COUNT(*) FROM team_members WHERE user_id = '00000000-0000-0000-0000-000000000000'
UNION ALL SELECT 'hot_leads (no user_id)', 0;

-- ============================================================
-- STEP 2: ESEGUI LA MIGRAZIONE
-- ⚠️ SOSTITUISCI 'INSERISCI-QUI-IL-TUO-UUID' con il tuo UUID
--    reale trovato nel STEP 0 (es: 69b13034-427d-4c2c-...)
-- ============================================================

DO $$
DECLARE
    fake_id UUID := '00000000-0000-0000-0000-000000000000';
    real_id UUID := '69b13034-427d-4c2c-a868-84caafb4a309'; -- ID Utente Reale Inserito Automaticamente
BEGIN

    -- 1. Aggiorna il profilo reale con i dati di Concept Consulting
    UPDATE profiles
    SET 
        company_name = COALESCE((SELECT company_name FROM profiles WHERE id = fake_id), company_name),
        plan = COALESCE((SELECT plan FROM profiles WHERE id = fake_id), plan),
        updated_at = NOW()
    WHERE id = real_id;

    -- 2. Migra Campagne
    UPDATE campaigns SET user_id = real_id WHERE user_id = fake_id;
    
    -- 3. Migra Transazioni
    UPDATE transactions SET user_id = real_id WHERE user_id = fake_id;
    
    -- 4. Migra Quote/Preventivi
    UPDATE quotes SET user_id = real_id WHERE user_id = fake_id;
    
    -- 5. Migra Ops & Safety
    UPDATE ops_assets SET user_id = real_id WHERE user_id = fake_id;
    UPDATE ops_tickets SET user_id = real_id WHERE user_id = fake_id;
    UPDATE ops_medical_checkups SET user_id = real_id WHERE user_id = fake_id;
    UPDATE ops_benefits SET user_id = real_id WHERE user_id = fake_id;

    -- 6. Migra Reputation Manager
    UPDATE reputation_reviews SET user_id = real_id WHERE user_id = fake_id;
    UPDATE reputation_platforms SET user_id = real_id WHERE user_id = fake_id;
    UPDATE reputation_reply_templates SET user_id = real_id WHERE user_id = fake_id;

    -- 7. Migra E-commerce
    UPDATE ecommerce_products SET user_id = real_id WHERE user_id = fake_id;
    UPDATE ecommerce_orders SET user_id = real_id WHERE user_id = fake_id;

    -- 8. Migra Academy
    UPDATE academy_courses SET user_id = real_id WHERE user_id = fake_id;
    UPDATE academy_lessons SET user_id = real_id WHERE user_id = fake_id;
    UPDATE academy_live_events SET user_id = real_id WHERE user_id = fake_id;

    -- 9. Migra Team & HR
    UPDATE team_members SET user_id = real_id WHERE user_id = fake_id;
    UPDATE performance_evaluations SET user_id = real_id WHERE user_id = fake_id;
    UPDATE wellness_checkins SET user_id = real_id WHERE user_id = fake_id;
    UPDATE energy_readings SET user_id = real_id WHERE user_id = fake_id;

    -- 10. Migra Finance
    UPDATE budgets SET user_id = real_id WHERE user_id = fake_id;
    UPDATE kpi_financials SET user_id = real_id WHERE user_id = fake_id;

    -- 11. Migra Automazioni
    UPDATE workflows SET user_id = real_id WHERE user_id = fake_id;

    -- 12. Elimina il profilo fake
    DELETE FROM profiles WHERE id = fake_id;

    RAISE NOTICE '✅ Migrazione completata con successo! Tutti i dati sono stati spostati su %', real_id;

END $$;

-- ============================================================
-- STEP 3: VERIFICA POST-MIGRAZIONE
-- (Esegui dopo il STEP 2 per confermare)
-- ============================================================
SELECT 
    p.id,
    p.company_name AS "Azienda",
    p.updated_at AS "Ultimo Aggiornamento",
    (SELECT COUNT(*) FROM campaigns c WHERE c.user_id = p.id) AS "Campagne",
    (SELECT COUNT(*) FROM ops_assets a WHERE a.user_id = p.id) AS "Asset Ops",
    (SELECT COUNT(*) FROM reputation_reviews r WHERE r.user_id = p.id) AS "Recensioni",
    (SELECT COUNT(*) FROM team_members tm WHERE tm.user_id = p.id) AS "Team"
FROM profiles p
WHERE p.company_name IS NOT NULL
ORDER BY p.updated_at DESC;

-- ============================================================
-- STEP 4: VERIFICA CHE IL PROFILO FAKE SIA SPARITO
-- ============================================================
SELECT COUNT(*) AS "Profili fake rimasti (deve essere 0)"
FROM profiles
WHERE id = '00000000-0000-0000-0000-000000000000';
