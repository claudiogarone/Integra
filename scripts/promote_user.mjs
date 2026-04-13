import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("❌ ERRORE: Chiavi Supabase non trovate nel file .env.local.")
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const EMAILS_TO_PROMOTE = [
    'claudiogarone@gmail.com',
    'pastaorosa@gmail.com',
    'apostolicopasquale83@gmail.com',
    'consulenza@conceptadv.it'
]

async function promoteUsers() {
    console.log("🚀 Avvio procedura di Sblocco Account Ambassador VIP...\n")

    for (const email of EMAILS_TO_PROMOTE) {
        console.log(`🔍 Ricerca utente: ${email}...`)

        // 1. Trova l'ID utente in Auth
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
        
        if (listError) {
            console.error(`   ❌ Errore durante la ricerca utenti: ${listError.message}`)
            continue
        }

        const targetUser = users.find(u => u.email === email)

        if (!targetUser) {
            console.log(`   🔸 L'utente ${email} non sembra ancora essersi registrato su IntegraOS. Lo aggiungiamo ai pre-approvati...`)
            // Possiamo comunque creare una riga in profiles se volessimo, 
            // ma l'id deve essere quello fedele di Auth. 
            // Quindi per ora segnaliamo che deve registrarsi prima.
            continue
        }

        // 2. Aggiorna o Inserisce il piano Ambassador nel Profilo
        const { error: upsertError } = await supabase
            .from('profiles')
            .upsert({
                id: targetUser.id,
                plan: 'Ambassador',
                company_name: 'Amministratore IntegraOS',
                usage_voice: 0,
                usage_chat: 0,
                usage_inbox: 0,
                voice_budget_limit: 1000 // Bonus budget test
            })

        if (upsertError) {
            console.error(`   ❌ Errore durante l'aggiornamento del piano per ${email}: ${upsertError.message}`)
        } else {
            console.log(`   ✅ SUCCESSO! L'account ${email} è ora un AMBASSADOR VIP senza limiti.`)
        }
    }

    console.log("\n🎉 Procedura completata. Se qualche account non è stato trovato, assicurati che l'utente abbia fatto almeno un primo accesso alla piattaforma (creato l'account).")
}

promoteUsers()
