import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

console.log("🚀 Inizio Test di Simulazione Webhook E-commerce (Shopify/WooCommerce)...")

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("❌ ERRORE: Variabili d'ambiente Supabase non trovate in .env.local.")
    process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function runTest() {
    // 1. Cerca il Tenant bersaglio (L'Azienda che incassa i soldi)
    let { data: users, error: userError } = await supabase.auth.admin.listUsers()
    
    if (userError || !users?.users?.length) {
        console.error("❌ ERRORE: Nessun tenant aziendale trovato nel database Auth.")
        process.exit(1)
    }

    const TARGET_USER_ID = users.users[0].id
    const TARGET_USER_EMAIL = users.users[0].email
    console.log(`\n1️⃣  Negozio Online Identificato (Tenant): ${TARGET_USER_EMAIL}`)

    // 2. Prepariamo il carrello della spesa finto inviato da un E-commerce esterno
    console.log("2️⃣  Un utente ('Mario Rossi') sta acquistando dal sito web (Carrello 120€)...")

    const fakeShopifyPayload = {
        id: "W00-" + Math.floor(Math.random() * 90000), // ID transazione finto univoco
        total: "120.00",
        billing: {
            first_name: "Mario",
            last_name: "Rossi Test",
            email: "mariorossi.test@example.com",
            phone: "+393339999999"
        },
        line_items: [
            { name: "Occhiali da Sole polarized", price: 80.00, quantity: 1 },
            { name: "Custodia Premium", price: 40.00, quantity: 1 }
        ]
    }

    try {
        // Invio reale alla rotta di IntegraOS (simuliamo l'interazione server-to-server)
        console.log(`3️⃣  Sparando il Payload al Webhook E-commerce [POST /api/webhooks/ecommerce?userId=${TARGET_USER_ID}]...`)
        const ping = await fetch(`http://localhost:3000/api/webhooks/ecommerce?userId=${TARGET_USER_ID}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(fakeShopifyPayload)
        })

        const result = await ping.json()

        if (ping.ok) {
            console.log("   ✅ Webhook elaborato dal CRM! Result:", result.message)

            // 3. Verifichiamo il CRM per vedere se ha catturato il Lead Mario Rossi e i soldi!
            console.log("\n4️⃣  Controllando il database CRM aziendale (Tabella 'contacts')...")
            
            // Diamo tempo a supabase di rifiatare
            await new Promise(r => setTimeout(r, 600)) 

            const { data: crmData } = await supabase
                .from('contacts')
                .select('name, status, ltv, total_orders, orders')
                .eq('email', 'mariorossi.test@example.com')
                .eq('user_id', TARGET_USER_ID)
                .single()

            if (crmData) {
                console.log("   🎯 BINGO! Lead catturato con successo e incasson registrato.")
                console.log(`      👤 Cliente: ${crmData.name}`)
                console.log(`      🏷️  Stato: ${crmData.status} (Dovrebbe essere 'Chiuso')`)
                console.log(`      💰 LTV: €${crmData.ltv} generate in totale`)
                console.log(`      🛒 N. Ordini: ${crmData.total_orders}`)
                console.log(`      📦 Ultimi Acquisti: ${crmData.orders[0]?.items}`)
            } else {
                console.log("   ❌ Errore, il contatto non è comparso nel database.")
            }
            
            console.log("\n🎉 TEST E-COMMERCE COMPLETATO.")
        } else {
            console.log("   ❌ Errore Webhook:", ping.status, result)
        }

    } catch (e) {
        console.error("❌ Il server localhost:3000 non risponde. Sicuro di avere 'npm run dev' aperto?", e.message)
    }
}

runTest()
