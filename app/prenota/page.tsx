'use client'

import { createClient } from '../../utils/supabase/client'
import { useState } from 'react'
import Link from 'next/link'

export default function PrenotaPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [date, setDate] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const supabase = createClient()

  // --- CONFIGURAZIONE EMAIL ADMIN ---
  const tuaEmailAdmin = 'claudiogarone@gmail.com' 

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // 1. Salva nel Database (Tabella Pubblica)
    const { error } = await supabase
      .from('bookings')
      .insert({
        client_name: name,
        client_email: email,
        date: date,
        notes: notes
      })

    if (error) {
      alert('Errore database: ' + error.message)
      setLoading(false)
      return
    }

    // --- INIZIO AUTOMAZIONE EMAIL ---
    try {
      // Calcoli per il Calendario
      const dataInizio = new Date(date)
      const dataFine = new Date(dataInizio.getTime() + 60 * 60 * 1000) // Aggiunge 1 ora
      
      // Formattazione data per Google Calendar (YYYYMMDDTHHMMSSZ)
      const formatGoogle = (d: Date) => d.toISOString().replace(/-|:|\.\d+/g, '')
      
      // Link Magico per Google Calendar
      const googleCalendarUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=Appuntamento+Pastaorosa&details=${encodeURIComponent(notes || 'Appuntamento confermato')}&dates=${formatGoogle(dataInizio)}/${formatGoogle(dataFine)}`

      // Data leggibile per il testo della mail
      const dataLeggibile = dataInizio.toLocaleDateString('it-IT', { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
      })

      // A. MAIL PER IL CLIENTE (Con Link Calendario)
      await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emails: [email],
          subject: '✅ Conferma Appuntamento - Pastaorosa',
          content: `
            <div style="font-family: sans-serif; color: #333;">
              <h1>Ciao ${name}!</h1>
              <p>La tua richiesta di appuntamento è stata confermata.</p>
              <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0;"><strong>📅 Quando:</strong> ${dataLeggibile}</p>
                <p style="margin: 10px 0 0 0;"><strong>📍 Dove:</strong> Sede Pastaorosa</p>
              </div>
              
              <a href="${googleCalendarUrl}" target="_blank" style="background-color: #EAB308; color: black; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                📅 Aggiungi a Google Calendar
              </a>

              <p style="margin-top: 30px;">Non vediamo l'ora di vederti!</p>
              <p><em>Staff Pastaorosa</em></p>
            </div>
          `
        })
      })

      // B. MAIL PER TE (Notifica Admin)
      await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emails: [tuaEmailAdmin], 
          subject: `🔔 Nuova Prenotazione: ${name}`,
          content: `
            <h2>Hai un nuovo appuntamento!</h2>
            <ul>
              <li><strong>Cliente:</strong> ${name}</li>
              <li><strong>Email:</strong> ${email}</li>
              <li><strong>Data:</strong> ${dataLeggibile}</li>
              <li><strong>Note:</strong> ${notes || 'Nessuna nota'}</li>
            </ul>
            <p><a href="https://integra-theta.vercel.app/dashboard/agenda">Vai all'Agenda</a></p>
          `
        })
      })

    } catch (err) {
      console.error("Errore invio email automatiche", err)
    }
    // --- FINE AUTOMAZIONE ---

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 text-center">
        <div className="bg-gray-900 p-10 rounded-2xl border border-yellow-500/50 shadow-2xl max-w-md w-full">
          <div className="text-6xl mb-6">🎉</div>
          <h1 className="text-3xl font-bold text-yellow-500 mb-4">Richiesta Inviata!</h1>
          <p className="text-gray-300 mb-8">
            Grazie {name}, abbiamo ricevuto la tua richiesta.<br/>
            Controlla la tua email per il link al calendario!
          </p>
          <Link href="/" className="text-sm text-gray-500 hover:text-white underline">
            Torna alla Home
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Intestazione */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-yellow-500 mb-2 tracking-tighter">INTEGRA</h1>
          <p className="text-gray-400">Prenota il tuo appuntamento online.</p>
        </div>

        {/* Form */}
        <div className="bg-gray-900 p-8 rounded-2xl border border-gray-800 shadow-2xl">
          <form onSubmit={handleBooking} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Il tuo Nome</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-white focus:border-yellow-500 outline-none transition" placeholder="Mario Rossi" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">La tua Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-white focus:border-yellow-500 outline-none transition" placeholder="mario@gmail.com" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Quando vorresti venire?</label>
              <input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-white focus:border-yellow-500 outline-none transition" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Note (Opzionale)</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-white focus:border-yellow-500 outline-none transition h-24 resize-none" placeholder="Scrivi qui se hai esigenze particolari..." />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-bold py-4 rounded-lg transition transform active:scale-95 disabled:opacity-50 disabled:scale-100 mt-4">
              {loading ? 'Invio in corso...' : 'Conferma Prenotazione'}
            </button>
          </form>
          <p className="text-center text-xs text-gray-600 mt-6">Powered by Integra Platform</p>
        </div>
      </div>
    </main>
  )
}