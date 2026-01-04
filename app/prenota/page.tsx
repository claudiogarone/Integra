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

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Salva nella tabella pubblica 'bookings'
    const { error } = await supabase
      .from('bookings')
      .insert({
        client_name: name,
        client_email: email,
        date: date,
        notes: notes
      })

    if (error) {
      alert('Errore: ' + error.message)
    } else {
      setSuccess(true) // Mostra messaggio di ringraziamento
    }
    setLoading(false)
  }

  if (success) {
    return (
      <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 text-center">
        <div className="bg-gray-900 p-10 rounded-2xl border border-yellow-500/50 shadow-2xl max-w-md w-full">
          <div className="text-6xl mb-6">🎉</div>
          <h1 className="text-3xl font-bold text-yellow-500 mb-4">Richiesta Inviata!</h1>
          <p className="text-gray-300 mb-8">
            Grazie {name}, abbiamo ricevuto la tua richiesta per il <strong>{new Date(date).toLocaleDateString('it-IT')}</strong> alle <strong>{new Date(date).toLocaleTimeString('it-IT', {hour: '2-digit', minute:'2-digit'})}</strong>.
            <br/><br/>
            Ti contatteremo presto via email per confermare.
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
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-white focus:border-yellow-500 outline-none transition"
                placeholder="Mario Rossi"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">La tua Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-white focus:border-yellow-500 outline-none transition"
                placeholder="mario@gmail.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Quando vorresti venire?</label>
              <input 
                type="datetime-local" 
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-white focus:border-yellow-500 outline-none transition" // Nota: su mobile apre il calendario nativo
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Note (Opzionale)</label>
              <textarea 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-white focus:border-yellow-500 outline-none transition h-24 resize-none"
                placeholder="Scrivi qui se hai esigenze particolari..."
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-bold py-4 rounded-lg transition transform active:scale-95 disabled:opacity-50 disabled:scale-100 mt-4"
            >
              {loading ? 'Invio in corso...' : 'Conferma Prenotazione'}
            </button>

          </form>
          
          <p className="text-center text-xs text-gray-600 mt-6">
            Powered by Integra Platform
          </p>
        </div>
      </div>
    </main>
  )
}