'use client'

import { createClient } from '../../../utils/supabase/client'
import { useEffect, useState } from 'react'

export default function AgendaPage() {
  const [user, setUser] = useState<any>(null)
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDate, setNewDate] = useState('')
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        const { data: privateEvents } = await supabase.from('appointments').select('*')
        const { data: publicBookings } = await supabase.from('bookings').select('*')
        
        const formattedPrivate = (privateEvents || []).map(e => ({ id: e.id, title: e.title, date: e.date, type: 'private', table: 'appointments' }))
        const formattedPublic = (publicBookings || []).map(b => ({ id: b.id, title: `Prenotazione: ${b.client_name}`, date: b.date, type: 'public', table: 'bookings', details: b.client_email }))
        
        const allEvents = [...formattedPrivate, ...formattedPublic].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        setEvents(allEvents)
      }
      setLoading(false)
    }
    getData()
  }, [supabase])

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    const { data, error } = await supabase.from('appointments').insert({ title: newTitle, date: newDate, user_id: user.id }).select()
    if (!error && data) window.location.reload()
    else { alert('Errore: ' + error?.message); setSaving(false) }
  }

  const handleDelete = async (id: number, table: string) => {
    if(!confirm('Eliminare?')) return;
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (!error) setEvents(events.filter(e => !(e.id === id && e.table === table)))
  }

  if (loading) return <div className="p-10">Caricamento Agenda...</div>

  return (
    <main className="flex-1 p-10 overflow-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Agenda Unificata</h1>
        <button onClick={() => setIsModalOpen(true)} className="bg-yellow-600 text-black px-4 py-2 rounded font-bold hover:bg-yellow-500 shadow-lg shadow-yellow-600/20">+ Nuovo Evento</button>
      </div>

      <div className="grid gap-4">
        {events.length === 0 ? <div className="text-gray-500 text-center py-10">Nessun impegno.</div> : events.map((evt, index) => (
          <div key={`${evt.table}-${evt.id}-${index}`} className={`border border-gray-800 p-5 rounded-xl flex justify-between items-center ${evt.type === 'public' ? 'bg-blue-900/10 border-blue-900/50' : 'bg-gray-900'}`}>
            <div className="flex items-center gap-6">
              <div className={`p-3 rounded-lg text-center min-w-[80px] ${evt.type === 'public' ? 'bg-blue-900/20' : 'bg-gray-800'}`}>
                <div className="text-xs text-gray-400 uppercase">{new Date(evt.date).toLocaleDateString('it-IT', { month: 'short' })}</div>
                <div className={`text-2xl font-bold ${evt.type === 'public' ? 'text-blue-400' : 'text-yellow-500'}`}>{new Date(evt.date).getDate()}</div>
                <div className="text-xs text-white font-mono bg-black/30 rounded px-1 mt-1">{new Date(evt.date).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{evt.title}</h3>
                <div className="flex gap-2 text-sm mt-1">{evt.type === 'public' ? <span className="text-blue-400 font-medium">🌍 Dal sito web • {evt.details}</span> : <span className="text-gray-500">🔒 Privato</span>}</div>
              </div>
            </div>
            <button onClick={() => handleDelete(evt.id, evt.table)} className="text-gray-600 hover:text-red-500 transition p-2">🗑️</button>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 p-8 rounded-2xl w-full max-w-md shadow-2xl relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">✕</button>
            <h2 className="text-2xl font-bold text-white mb-6">Impegno Privato</h2>
            <form className="space-y-4" onSubmit={handleSaveEvent}>
              <div><label className="block text-sm text-gray-400 mb-1">Titolo</label><input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded p-3 text-white" required /></div>
              <div><label className="block text-sm text-gray-400 mb-1">Data</label><input type="datetime-local" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded p-3 text-white" required /></div>
              <button type="submit" disabled={saving} className="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-bold py-3 rounded mt-4">{saving ? 'Salvataggio...' : 'Salva'}</button>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}