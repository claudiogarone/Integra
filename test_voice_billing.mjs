import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
config({ path: '.env.local' })

console.log("🚀 Inizio Test di Simulazione Webhook Call Center AI (Vapi.ai)...")

// Cerchiamo un utente di test nel database per addebitargli il costo della chiamata (Cerca "consulenza@conceptadv.it" come negli altri test)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("❌ ERRORE: Variabili d'ambiente Supabase non trovate. Esegui lo script con variabili caricate.")
    process.exit(1)
}

async function runTest() {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

    // 1. Cerca l'ID dell'utente bersaglio
    let { data: users, error: userError } = await supabase.auth.admin.listUsers()

    if (userError || !users?.users?.length) {
        console.error("❌ ERRORE: Nessun utente trovato nel database Auth locale.")
        process.exit(1)
    }

    const TARGET_USER_ID = users.users[0].id
    const TARGET_USER_EMAIL = users.users[0].email
    console.log(`\n1️⃣  Trovato utente bersaglio (Tenant IntegraOS): ${TARGET_USER_EMAIL} (${TARGET_USER_ID})`)
