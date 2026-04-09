import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

// Lista di tutte le tabelle che devono esistere
const REQUIRED_TABLES = [
    // Core
    { name: 'profiles', module: 'Core' },
    // CRM & Marketing
    { name: 'hot_leads', module: 'CRM' },
    { name: 'contacts', module: 'CRM' },
    { name: 'campaigns', module: 'Marketing' },
    { name: 'quotes', module: 'Preventivi' },
    { name: 'crm_objectives', module: 'CRM KPI' },
    // Finance
    { name: 'transactions', module: 'Finance' },
    { name: 'budgets', module: 'Finance' },
    // E-commerce AR
    { name: 'ecommerce_products', module: 'E-commerce AR' },
    { name: 'ecommerce_orders', module: 'E-commerce AR' },
    // Academy
    { name: 'academy_courses', module: 'Academy' },
    { name: 'academy_lessons', module: 'Academy' },
    { name: 'academy_live_events', module: 'Academy' },
    // Team & HR
    { name: 'team_members', module: 'Agenti' },
    { name: 'performance_evaluations', module: 'HR' },
    { name: 'wellness_checkins', module: 'Wellness' },
    { name: 'wellness_assessments', module: 'Wellness Assessment' },
    { name: 'energy_readings', module: 'Energy' },
    // Loyalty
    { name: 'loyalty_cards', module: 'Loyalty' },
    { name: 'loyalty_stores', module: 'Loyalty' },
    { name: 'loyalty_transactions', module: 'Loyalty' },
    // Automazioni
    { name: 'workflows', module: 'Automazioni' },
    // Ops & Safety
    { name: 'ops_assets', module: 'Ops & Safety' },
    { name: 'ops_tickets', module: 'Ops & Safety' },
    { name: 'ops_medical_checkups', module: 'Ops & Safety' },
    { name: 'ops_benefits', module: 'Ops & Safety' },
    // Reputation Manager
    { name: 'reputation_reviews', module: 'Reputation' },
    { name: 'reputation_platforms', module: 'Reputation' },
    { name: 'reputation_reply_templates', module: 'Reputation' },
    // Affiliates
    { name: 'affiliates', module: 'Affiliation' },
]

// Verifica rapidamente se le API key sono configurate
const checkEnvVars = () => {
    return {
        NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
        STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
        RESEND_API_KEY: !!process.env.RESEND_API_KEY,
        ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY,
        ELEVENLABS_API_KEY: !!process.env.ELEVENLABS_API_KEY,
        REPLICATE_API_TOKEN: !!process.env.REPLICATE_API_TOKEN,
        PINECONE_API_KEY: !!process.env.PINECONE_API_KEY,
    }
}

export async function GET() {
    const startTime = Date.now()
    
    try {
        const supabase = await createClient()
        const envVars = checkEnvVars()
        
        // Verifica connessione Supabase
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        // Verifica ogni tabella
        const tableResults: any[] = []
        for (const table of REQUIRED_TABLES) {
            try {
                const { count, error } = await supabase
                    .from(table.name)
                    .select('*', { count: 'exact', head: true })
                
                tableResults.push({
                    table: table.name,
                    module: table.module,
                    status: error ? '❌ ERRORE' : '✅ OK',
                    rows: error ? null : count,
                    error: error?.message || null
                })
            } catch (e: any) {
                tableResults.push({
                    table: table.name,
                    module: table.module,
                    status: '❌ NON TROVATA',
                    rows: null,
                    error: e.message
                })
            }
        }

        // Test Gemini AI
        let geminiStatus: any = { status: '⏭️ Chiave mancante', latency: null }
        if (process.env.GEMINI_API_KEY) {
            try {
                const t = Date.now()
                const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents: [{ parts: [{ text: 'ok' }] }] }),
                    signal: AbortSignal.timeout(8000)
                })
                const latency = Date.now() - t
                if (res.ok) {
                    geminiStatus = { status: '✅ Connesso', latency }
                } else {
                    const errBody = await res.json().catch(() => ({}))
                    const errMsg = errBody?.error?.message || errBody?.error?.status || `HTTP ${res.status}`
                    geminiStatus = { status: `❌ ${errMsg}`, latency, http_status: res.status }
                }

            } catch {
                geminiStatus = { status: '❌ Timeout/Errore', latency: null }
            }
        }

        // Statistiche finali
        const tablePassed = tableResults.filter(t => t.status.includes('✅')).length
        const tableFailed = tableResults.filter(t => !t.status.includes('✅')).length
        const envPassed = Object.values(envVars).filter(Boolean).length
        const envTotal = Object.keys(envVars).length

        return NextResponse.json({
            timestamp: new Date().toISOString(),
            latency_ms: Date.now() - startTime,
            overall_status: tableFailed === 0 ? '✅ TUTTO OK' : `⚠️ ${tableFailed} TABELLE MANCANTI`,
            
            auth: {
                status: !authError ? '✅ Supabase connesso' : '⚠️ Non autenticato (normale in health check)',
                user_id: user?.id || 'not_authenticated'
            },

            database: {
                summary: `${tablePassed}/${REQUIRED_TABLES.length} tabelle OK`,
                tables: tableResults
            },

            api_keys: {
                summary: `${envPassed}/${envTotal} chiavi configurate`,
                details: envVars
            },

            ai_services: {
                gemini: geminiStatus,
            },

            modules: {
                'Ops & Safety 360': tableResults.filter(t => t.module === 'Ops & Safety').every(t => t.status.includes('✅')) ? '✅ Pronto' : '❌ DB Mancante',
                'Reputation Manager': tableResults.filter(t => t.module === 'Reputation').every(t => t.status.includes('✅')) ? '✅ Pronto' : '❌ DB Mancante',
                'Predictive BI': '✅ Pronto (legge tabelle esistenti)',
                'E-commerce AR': tableResults.filter(t => t.module === 'E-commerce AR').every(t => t.status.includes('✅')) ? '✅ Pronto' : '❌ DB Mancante',
                'Academy': tableResults.filter(t => t.module === 'Academy').every(t => t.status.includes('✅')) ? '✅ Pronto' : '❌ DB Mancante',
                'Finance & CFO': tableResults.filter(t => t.module === 'Finance').every(t => t.status.includes('✅')) ? '✅ Pronto' : '❌ DB Mancante',
            }
        }, { status: 200 })

    } catch (error: any) {
        return NextResponse.json({
            timestamp: new Date().toISOString(),
            overall_status: '❌ ERRORE CRITICO',
            error: error.message
        }, { status: 500 })
    }
}
