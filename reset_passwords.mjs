// reset_passwords.mjs
// Imposta la password "12345678" su tutti e 4 gli account Ambassador VIP
// Esegui con: node reset_passwords.mjs

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://bvzezweqcdsgpceahtsb.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2emV6d2VxY2RzZ3BjZWFodHNiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzUxODY2NiwiZXhwIjoyMDgzMDk0NjY2fQ.4kZMKVVHNzyn26780VmRehgi9e8HGQP7uhBBeFEjmhk'

const EMAILS = [
  'claudiogarone@gmail.com',
  'pastaorosa@gmail.com',
  'apostolicopasquale83@gmail.com',
  'consulenza@conceptadv.it',
]

const NEW_PASSWORD = '12345678'

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function resetPasswords() {
  console.log('🔐 Avvio reset password per gli account Ambassador VIP...\n')

  // 1. Recupera tutti gli utenti da auth.users
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()

  if (listError) {
    console.error('❌ Errore nel recupero utenti:', listError.message)
    process.exit(1)
  }

  console.log(`📋 Totale utenti trovati in Supabase Auth: ${users.length}\n`)

  for (const email of EMAILS) {
    const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase())

    if (!user) {
      console.log(`⚠️  [${email}] — Utente NON TROVATO in Supabase Auth. Creazione in corso...`)
      
      // Crea l'utente se non esiste
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        password: NEW_PASSWORD,
        email_confirm: true, // Conferma email automatica
      })

      if (createError) {
        console.error(`   ❌ Errore creazione [${email}]:`, createError.message)
      } else {
        console.log(`   ✅ Creato e password impostata: ${email} → ${NEW_PASSWORD}`)
        
        // Aggiorna anche il profilo con piano Ambassador
        await supabase.from('profiles').upsert({
          id: newUser.user.id,
          plan: 'Ambassador',
        })
        console.log(`   🏆 Piano Ambassador assegnato.`)
      }

    } else {
      // Utente esiste: aggiorna la password
      const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
        password: NEW_PASSWORD,
        email_confirm: true,
      })

      if (updateError) {
        console.error(`   ❌ Errore aggiornamento [${email}]:`, updateError.message)
      } else {
        console.log(`✅ [${email}] → Password aggiornata: "${NEW_PASSWORD}"`)
      }
    }
  }

  console.log('\n🎉 Operazione completata!')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('Puoi ora accedere con:')
  EMAILS.forEach(e => console.log(`  📧 ${e}  🔑 ${NEW_PASSWORD}`))
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('⚠️  Ricorda di cambiare la password dopo il primo accesso!')
}

resetPasswords()
