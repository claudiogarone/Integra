import { createClient } from '@/utils/supabase/server' // Assicurati che questo percorso sia corretto per il tuo progetto
import { NextResponse } from 'next/server'

// Questa funzione gestisce le richieste di tipo POST (Invio dati)
export async function POST(request: Request) {
  // 1. Inizializziamo il client Supabase
  const supabase = createClient()

  try {
    // 2. Leggiamo i dati inviati dal sito (il "pacchetto")
    const body = await request.json()
    const { contact_id, event_name, metadata } = body

    // 3. Validazione semplice: Se manca il contatto o l'evento, blocchiamo tutto.
    if (!contact_id || !event_name) {
      return NextResponse.json(
        { error: 'Dati mancanti: contact_id e event_name sono obbligatori' },
        { status: 400 }
      )
    }

    // 4. Inseriamo i dati nella tabella 'events' che abbiamo creato prima
    const { error } = await supabase
      .from('events')
      .insert({
        contact_id: contact_id,
        event_name: event_name,
        metadata: metadata || {} // Se non ci sono dettagli extra, usiamo un oggetto vuoto
      })

    if (error) {
      console.error('Errore Supabase:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 5. Successo! Confermiamo al sito che abbiamo registrato tutto.
    return NextResponse.json({ success: true }, { status: 200 })

  } catch (err) {
    // Gestione errori generici (es. JSON malformato)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}