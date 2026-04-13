import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Carica variabili d'ambiente
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY // Ignora RLS temporaneamente per il setup test

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("❌ Manca SUPABASE_URL o SERVICE_ROLE_KEY nel file .env.local")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

async function runTest() {
  console.log("🚀 Inizio Test di Simulazione Webhook Inbound Telegram...\n")

  // 1. TROVA O CREA UN UTENTE PER IL TEST
  let { data: users, error: userError } = await supabase.auth.admin.listUsers()
  if (userError || !users?.users?.length) {
      console.log("❌ Nessun utente Auth trovato nel DB. Impossibile testare.")
      process.exit(1)
  }
  const testUser = users.users[0]
  console.log("1️⃣  Trovato utente di test nel database:", testUser.email)

  // 1.5 Assicurati che esista il profilo per scaricare il billing
  await supabase.from('profiles').upsert({
      id: testUser.id,
      company_name: 'Test Native Inbox Corp',
      usage_chat: 0,
      usage_inbox: 0,
      plan: 'Base'
  })

  // 2. CREA / RECUPERA UN CANALE TELEGRAM
  console.log("2️⃣  Creazione Canale Telegram 'Mock'...")
  let channelId = ''
  
  const { data: existingChannel } = await supabase.from('inbox_channels')
      .select('id').eq('provider', 'telegram').eq('user_id', testUser.id).single()

  if (existingChannel) {
      channelId = existingChannel.id
  } else {
      const { data: newChannel, error: chnErr } = await supabase.from('inbox_channels').insert({
          user_id: testUser.id,
          provider: 'telegram',
          provider_id: 'bot_test_123',
          name: 'Telegram (Test Bot)',
          access_token: 'fake_test_token',
          bot_enabled: true
      }).select().single()
      
      if (chnErr) {
          console.error("Errore creazione canale:", chnErr.message)
          process.exit(1)
      }
      channelId = newChannel.id
  }
  
  console.log(`   ✅ Canale preparato con ID: ${channelId}`)

  // 3. ESEGUI IL SIMULATORE WEBHOOK (HTTP POST A LOCALHOST)
  console.log("\n3️⃣  Sparando Webhook Payload (Simulazione Telegram invia un messaggio) al server LOCALE...")
  
  const fakeTelegramPayload = {
      update_id: 999111,
      message: {
          message_id: Math.floor(Math.random() * 1000000), // ID Univoco
          from: {
              id: 987654321,
              is_bot: false,
              first_name: "Bruce",
              last_name: "Wayne",
              username: "batman",
              language_code: "it"
          },
          chat: {
              id: 987654321,
              first_name: "Bruce",
              last_name: "Wayne",
              username: "batman",
              type: "private"
          },
          date: Math.floor(Date.now() / 1000),
          text: "Ciao IntegroOS! Vorrei maggiori informazioni sul piano Ambassador."
      }
  }

  try {
      const response = await fetch(`http://localhost:3000/api/webhooks/inbox/telegram?channel_id=${channelId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(fakeTelegramPayload)
      })

      const responseData = await response.json()
      
      if (response.ok) {
          console.log("   ✅ Webhook ricevuta ed elaborata con successo Code: 200.")
      } else {
          console.error("   ❌ Il Webhook ha restituito un errore HTTP:")
          console.error(responseData)
      }
  } catch (err) {
      console.error("   ❌ Errore critico nel contattare localhost:3000", err.message)
      console.log("   👉 Assicurati che il comando 'npm run dev' stia funzionando in un altro terminale!")
      process.exit(1)
  }

  // 4. VERIFICA DATABASE (Il messaggio è stato salvato?)
  console.log("\n4️⃣  Verificando la ricezione nel Database Centrale (inbox_messages)...")
  
  // Attendi mezzo secondo per dar tempo a supabase di indicizzare
  await new Promise(r => setTimeout(r, 500))

  const { data: myMessages } = await supabase.from('inbox_messages')
      .select('*, inbox_contacts(name)')
      .eq('channel_id', channelId)
      .order('created_at', { ascending: false })
      .limit(3)

  if (myMessages && myMessages.length > 0) {
      console.log(`   ✅ SUCCESSO! Trovati i messaggi salvati nel database Supabase.`)
      console.log("   👉 Ecco l'ultimo messaggio catturato nell'Inbox:")
      console.log(`      👤 Mittente: ${myMessages[0].inbox_contacts?.name}`)
      console.log(`      💬 Testo:    ${myMessages[0].content}`)
      console.log(`      📌 Tipo:     ${myMessages[0].direction}`)
  } else {
      console.log("   ❌ NESSUN MESSAGGIO trovato nel database. Qualcosa non è andato a buon fine.")
  }

  console.log("\n🎉 TEST COMPLETATO.")
}

runTest()
