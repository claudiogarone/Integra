'use client'

import { createClient } from '../../../utils/supabase/client'
import { useEffect, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'
import itLocale from '@fullcalendar/core/locales/it'

export default function AgendaPage() {
  const [user, setUser] = useState<any>(null)
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isEventModalOpen, setIsEventModalOpen] = useState(false)
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false)
  const [newEvent, setNewEvent] = useState({ title: '', start: '', end: '', type: 'private' })
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) { setUser(user); fetchEvents(user.id); }
      setLoading(false)
    }
    getData()
  }, [])

  const fetchEvents = async (userId: string) => {
    const { data: appts } = await supabase.from('appointments').select('*').eq('user_id', userId)
    const { data: bookings } = await supabase.from('bookings').select('*').eq('user_id', userId)

    const calendarEvents = [
        ...(appts || []).map(e => {
            let color = '#00665E' // Default
            let icon = ''
            if (e.type === 'live' || e.title.includes('🎥')) { color = '#DC2626'; icon = '🎥 '; }
            
            // Supporta sia 'start_time' (nuovo) che 'date' (vecchio)
            const start = e.start_time || e.date
            const end = e.end_time || e.end_date || new Date(new Date(start).getTime() + 60*60*1000).toISOString()

            return {
                id: e.id,
                title: `${icon}${e.title}`,
                start: start,
                end: end,
                backgroundColor: color,
                borderColor: color,
                extendedProps: { type: e.type || 'private', table: 'appointments', notes: e.notes } // Notes contiene il link della live
            }
        }),
        ...(bookings || []).map(b => ({
            id: b.id, title: `👤 ${b.client_name}`, start: b.date, backgroundColor: '#F59E0B', borderColor: '#F59E0B',
            extendedProps: { type: 'public', table: 'bookings', details: b.client_email }
        }))
    ]
    setEvents(calendarEvents)
  }

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    if(!newEvent.start) return;
    await supabase.from('appointments').insert({
        title: newEvent.title, start_time: newEvent.start, end_time: newEvent.end, type: 'private', user_id: user.id 
    })
    fetchEvents(user.id); setIsEventModalOpen(false); setSaving(false)
  }

  const handleEventClick = async (clickInfo: any) => {
      // APRI LINK DIRETTA
      if (clickInfo.event.extendedProps.type === 'live' && clickInfo.event.extendedProps.notes) {
          if(confirm(`Avviare la diretta "${clickInfo.event.title}"?`)) {
              window.open(clickInfo.event.extendedProps.notes, '_blank');
              return;
          }
      }
      // ELIMINA EVENTO
      if(confirm(`Eliminare "${clickInfo.event.title}"?`)) {
          await supabase.from(clickInfo.event.extendedProps.table).delete().eq('id', clickInfo.event.id)
          clickInfo.event.remove()
      }
  }

  const handleDateClick = (arg: any) => { setNewEvent({ ...newEvent, start: arg.dateStr + 'T09:00', end: arg.dateStr + 'T10:00' }); setIsEventModalOpen(true); }

  if (loading) return <div className="p-10 text-[#00665E] animate-pulse">Caricamento Agenda...</div>

  return (
    <main className="flex-1 p-8 overflow-auto bg-[#F8FAFC] text-gray-900 font-sans h-screen flex flex-col">
      <div className="flex justify-between items-center mb-6 shrink-0">
        <h1 className="text-3xl font-black text-[#00665E]">Agenda</h1>
        <div className="flex gap-3">
            <button onClick={() => setIsSyncModalOpen(true)} className="btn-sec">🔗 Sync</button>
            <button onClick={() => setIsEventModalOpen(true)} className="btn-pri">+ Nuovo</button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm flex-1 overflow-hidden font-medium text-xs relative z-0">
         <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,listWeek' }}
            locale={itLocale}
            events={events}
            dateClick={handleDateClick}
            eventClick={handleEventClick}
            editable={true}
            height="100%"
            eventClassNames="rounded shadow-sm border-0 px-2 py-0.5 cursor-pointer"
        />
      </div>

      {isEventModalOpen && (
        <div className="modal-overlay">
          <div className="bg-white p-8 rounded-3xl w-full max-w-md shadow-2xl relative">
            <h2 className="text-xl font-bold mb-4">Nuovo Evento</h2>
            <form onSubmit={handleSaveEvent} className="space-y-4">
              <input className="input" value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} placeholder="Titolo" required />
              <div className="grid grid-cols-2 gap-4">
                  <input type="datetime-local" className="input" value={newEvent.start} onChange={e => setNewEvent({...newEvent, start: e.target.value})} required />
                  <input type="datetime-local" className="input" value={newEvent.end} onChange={e => setNewEvent({...newEvent, end: e.target.value})} />
              </div>
              <button disabled={saving} className="btn-pri w-full">{saving ? '...' : 'Salva'}</button>
              <button type="button" onClick={() => setIsEventModalOpen(false)} className="btn-sec w-full mt-2">Annulla</button>
            </form>
          </div>
        </div>
      )}

      {/* STILI */}
      <style jsx global>{`
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 50; }
        .input { width: 100%; padding: 0.75rem; border: 1px solid #e2e8f0; border-radius: 0.75rem; outline: none; }
        .btn-pri { background: #00665E; color: white; padding: 0.75rem 1rem; border-radius: 0.75rem; font-weight: 700; transition: 0.2s; }
        .btn-sec { background: white; border: 1px solid #e2e8f0; padding: 0.75rem 1rem; border-radius: 0.75rem; font-weight: 700; }
        .fc { --fc-today-bg-color: #F0FDFA; --fc-button-active-bg-color: #00665E; --fc-button-active-border-color: #00665E; }
        .fc-toolbar-title { font-size: 1.25rem !important; font-weight: 800 !important; }
      `}</style>
    </main>
  )
}