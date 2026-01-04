'use client'

import { createClient } from '../../../utils/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AgendaPage() {
  const [user, setUser] = useState<any>(null)
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Stati per nuovo evento
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDate, setNewDate] = useState('') // Data e Ora
  const [saving, setSaving] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)

      // Scarica appuntamenti ordinati per data (dal più vicino)
      const { data } = await supabase
        .from('appointments')
        .select('*')
        .order('date', { ascending: true }) // Ordine cronologico
      
      if (data) setEvents(data)
      setLoading(false)
    }
    getData()
  }, [router, supabase])

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const { data, error } = await supabase
      .from('appointments')
      .insert({
        title: newTitle,
        date: newDate, // Formato datetime locale
        user_id: user.id
      })
      .select()

    if (!error && data) {
      // Riordiniamo la lista locale includendo il nuovo evento
      const updatedEvents = [...events, data[0]].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      setEvents(updatedEvents)
      
      setIsModalOpen(false)
      setNewTitle('')
      setNewDate('')
      alert('Appuntamento fissato! 📅')
    } else {
      alert('Errore: ' + error?.message)
    }
    setSaving(false)
  }

  const handleDelete = async (id: number) => {
    if(!confirm('Eliminare questo appuntamento?')) return;
    const { error } = await supabase.from('appointments').delete().eq('id', id)
    if (!error) setEvents(events.filter(e => e.id !== id))
  }

  if (loading) return <div className="p-10 text-white bg-black h-screen">Caricamento Agenda...</div>

  // Formatta la data in modo leggibile (Es. 25 Ott, 14:30)
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }
    return new Date(dateString).toLocaleDateString('it-IT', options)
  }

  return (
    <div className="flex h-screen bg-black text-white font-sans overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className="w-64 border-r border-gray-800 bg-gray-950 flex flex-col hidden md:flex">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-yellow-500 tracking-wider">INTEGRA</h2>
        </div>
        <nav className="space-y-2 px-4 flex-1">
          <Link href="/dashboard" className="flex items-center gap-3 py-3 px-4 text-gray-400 hover:text-white hover:bg-gray-900 rounded-lg transition-all">
            <span>📊</span> Dashboard
          </Link>
          <Link href="/dashboard/crm" className="flex items-center gap-3 py-3 px-4 text-gray-400 hover:text-white hover:bg-gray-900 rounded-lg transition-all">
            <span>👥</span> CRM Contatti
          </Link>
          <Link href="/dashboard/agenda" className="flex items-center gap-3 py-3 px-4 bg-gray-900 rounded-lg text-yellow-500 font-medium shadow-lg shadow-yellow-900/10">
            <span>📅</span> Agenda
          </Link>
        </nav>
        <div className="p-4 border-t border-gray-800">
           <button onClick={async () => { await supabase.auth.signOut(); router.push('/login') }} className="w-full py-2 text-xs text-center border border-gray-700 rounded hover:bg-red-900/20 hover:text-red-400 transition">Disconnetti</button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-10 overflow-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Agenda Appuntamenti</h1>
          <button onClick={() => setIsModalOpen(true)} className="bg-yellow-600 text-black px-4 py-2 rounded font-bold hover:bg-yellow-500 shadow-lg shadow-yellow-600/20">
            + Nuovo Evento
          </button>
        </div>

        <div className="grid gap-4">
          {events.length === 0 ? (
            <div className="text-gray-500 text-center py-10">Nessun appuntamento in programma.</div>
          ) : (
            events.map((evt) => (
              <div key={evt.id} className="bg-gray-900 border border-gray-800 p-5 rounded-xl flex justify-between items-center hover:border-yellow-500/30 transition">
                <div className="flex items-center gap-6">
                  {/* Data Box */}
                  <div className="bg-gray-800 p-3 rounded-lg text-center min-w-[80px]">
                    <div className="text-xs text-gray-400 uppercase">
                      {new Date(evt.date).toLocaleDateString('it-IT', { month: 'short' })}
                    </div>
                    <div className="text-2xl font-bold text-yellow-500">
                      {new Date(evt.date).getDate()}
                    </div>
                    <div className="text-xs text-white font-mono bg-gray-700 rounded px-1 mt-1">
                      {new Date(evt.date).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  
                  {/* Info Evento */}
                  <div>
                    <h3 className="text-xl font-bold text-white">{evt.title}</h3>
                    <p className="text-sm text-gray-400">Pianificato da Admin</p>
                  </div>
                </div>

                <button onClick={() => handleDelete(evt.id)} className="text-gray-600 hover:text-red-500 transition">
                  🗑️
                </button>
              </div>
            ))
          )}
        </div>
      </main>

      {/* MODAL NUOVO EVENTO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 p-8 rounded-2xl w-full max-w-md shadow-2xl relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">✕</button>
            <h2 className="text-2xl font-bold text-white mb-6">Fissa Appuntamento</h2>
            
            <form className="space-y-4" onSubmit={handleSaveEvent}>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Cosa devi fare?</label>
                <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded p-3 text-white focus:border-yellow-500 outline-none" placeholder="Es. Call con Cliente" required />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Quando?</label>
                <input type="datetime-local" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded p-3 text-white focus:border-yellow-500 outline-none" required />
              </div>
              
              <button type="submit" disabled={saving} className="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-bold py-3 rounded mt-4 transition">
                {saving ? 'Salvataggio...' : 'Conferma Data'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}