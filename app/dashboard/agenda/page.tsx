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
  
  // Modali
  const [isEventModalOpen, setIsEventModalOpen] = useState(false)
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false)
  
  // Form Evento Interno
  const [newEvent, setNewEvent] = useState({ title: '', start: '', end: '', type: 'private' })
  const [saving, setSaving] = useState(false)

  // Sincronizzazione
  const [externalCalendars, setExternalCalendars] = useState<any[]>([])
  const [icalUrl, setIcalUrl] = useState('')

  const supabase = createClient()

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        fetchEvents(user.id)
      }
      setLoading(false)
    }
    getData()
  }, [])

  const fetchEvents = async (userId: string) => {
    // 1. Prendi Appuntamenti (Include Appuntamenti standard + LIVE Academy)
    const { data: privateEvents } = await supabase
        .from('appointments')
        .select('*')
        .eq('user_id', userId) // Filtra per utente
    
    // 2. Prendi Prenotazioni Pubbliche (Booking)
    const { data: publicBookings } = await supabase.from('bookings').select('*').eq('user_id', userId)

    // Formattazione per FullCalendar
    const calendarEvents = [
        ...(privateEvents || []).map(e => {
            // LOGICA COLORI INTELLIGENTE
            let color = '#00665E' // Default: Teal (Appuntamento privato)
            let icon = ''
            
            if (e.type === 'live' || e.title.includes('🎥')) {
                color = '#DC2626' // Rosso (Diretta Academy)
                icon = '🎥 '
            } else if (e.type === 'meeting') {
                color = '#2563EB' // Blu (Meeting)
            }

            return {
                id: e.id,
                title: `${icon}${e.title}`,
                start: e.start_time || e.date, // Supporta entrambi i nomi colonna
                end: e.end_time || e.end_date || new Date(new Date(e.start_time || e.date).getTime() + 60*60*1000).toISOString(),
                backgroundColor: color,
                borderColor: color,
                extendedProps: { type: e.type || 'private', table: 'appointments', notes: e.notes }
            }
        }),
        ...(publicBookings || []).map(b => ({
            id: b.id,
            title: `👤 ${b.client_name}`,
            start: b.date,
            backgroundColor: '#F59E0B', // Arancione (Booking Esterno)
            borderColor: '#F59E0B',
            extendedProps: { type: 'public', table: 'bookings', details: b.client_email }
        }))
    ]
    setEvents(calendarEvents)
  }

  const handleDateClick = (arg: any) => {
    setNewEvent({ ...newEvent, start: arg.dateStr + 'T09:00', end: arg.dateStr + 'T10:00' })
    setIsEventModalOpen(true)
  }

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    if(!newEvent.start) { alert("Inserisci data"); setSaving(false); return; }

    const { error } = await supabase.from('appointments').insert({
        title: newEvent.title,
        start_time: newEvent.start, // Usiamo start_time per uniformità col DB nuovo
        end_time: newEvent.end,
        type: 'private',
        user_id: user.id 
    })

    if (!error) {
        fetchEvents(user.id); setIsEventModalOpen(false); setNewEvent({ title: '', start: '', end: '', type: 'private' })
    } else { alert('Errore: ' + error.message) }
    setSaving(false)
  }

  const handleEventClick = async (clickInfo: any) => {
      // Se è una live, apri il link invece di cancellare subito
      if (clickInfo.event.extendedProps.type === 'live' && clickInfo.event.extendedProps.notes) {
          if(confirm(`Vuoi avviare la diretta "${clickInfo.event.title}"?`)) {
              window.open(clickInfo.event.extendedProps.notes, '_blank');
              return;
          }
      }

      if(!confirm(`Eliminare l'evento "${clickInfo.event.title}"?`)) return;
      
      const table = clickInfo.event.extendedProps.table || 'appointments'
      const { error } = await supabase.from(table).delete().eq('id', clickInfo.event.id)
      
      if(!error) clickInfo.event.remove()
      else alert("Errore eliminazione: " + error.message)
  }

  if (loading) return <div className="p-10 text-[#00665E] animate-pulse">Caricamento Agenda...</div>

  return (
    <main className="flex-1 p-8 overflow-auto bg-[#F8FAFC] text-gray-900 font-sans h-screen flex flex-col">
      
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-black text-[#00665E] tracking-tight">Agenda</h1>
          <p className="text-gray-500 text-sm mt-1">
             <span className="inline-block w-3 h-3 bg-red-600 rounded-full mr-1"></span>Academy Live
             <span className="inline-block w-3 h-3 bg-[#00665E] rounded-full mx-2"></span>Privati
             <span className="inline-block w-3 h-3 bg-orange-500 rounded-full mx-2"></span>Prenotazioni
          </p>
        </div>
        <div className="flex gap-3">
            <button onClick={() => setIsSyncModalOpen(true)} className="bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-xl font-bold hover:bg-gray-50 transition shadow-sm">🔗 Sync Calendari</button>
            <button onClick={() => setIsEventModalOpen(true)} className="bg-[#00665E] text-white px-5 py-2 rounded-xl font-bold hover:bg-[#004d46] shadow-lg">+ Nuovo Evento</button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm flex-1 overflow-hidden font-medium text-sm relative z-0">
         <div className="h-full calendar-wrapper">
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
                eventClassNames="rounded-md shadow-sm border-0 px-2 py-0.5 text-xs font-bold cursor-pointer transition hover:scale-105"
            />
         </div>
      </div>

      {/* MODALE NUOVO */}
      {isEventModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-3xl w-full max-w-md shadow-2xl relative">
            <button onClick={() => setIsEventModalOpen(false)} className="absolute top-6 right-6 text-gray-400">✕</button>
            <h2 className="text-2xl font-black text-[#00665E] mb-6">Nuovo Appuntamento</h2>
            <form onSubmit={handleSaveEvent} className="space-y-4">
              <div><label className="text-xs font-bold text-gray-500 uppercase">Titolo</label><input className="w-full bg-gray-50 border p-3 rounded-xl mt-1" value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} required /></div>
              <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-xs font-bold text-gray-500 uppercase">Inizio</label><input type="datetime-local" className="w-full bg-gray-50 border p-3 rounded-xl mt-1" value={newEvent.start} onChange={e => setNewEvent({...newEvent, start: e.target.value})} required /></div>
                  <div><label className="text-xs font-bold text-gray-500 uppercase">Fine</label><input type="datetime-local" className="w-full bg-gray-50 border p-3 rounded-xl mt-1" value={newEvent.end} onChange={e => setNewEvent({...newEvent, end: e.target.value})} /></div>
              </div>
              <button disabled={saving} className="w-full bg-[#00665E] text-white font-bold py-3 rounded-xl mt-2">{saving ? '...' : 'Salva'}</button>
            </form>
          </div>
        </div>
      )}

      {/* MODALE SYNC (Visiva) */}
      {isSyncModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-3xl w-full max-w-lg shadow-2xl relative">
            <button onClick={() => setIsSyncModalOpen(false)} className="absolute top-6 right-6 text-gray-400">✕</button>
            <h2 className="text-2xl font-black text-[#00665E] mb-4">Sincronizzazione</h2>
            <div className="space-y-3">
                <div className="p-4 border rounded-xl flex justify-between items-center hover:border-blue-500 cursor-pointer">
                    <div className="flex items-center gap-3"><div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">G</div> Google Calendar</div>
                    <button className="text-xs bg-blue-600 text-white px-3 py-1 rounded-lg">Connetti</button>
                </div>
                <div className="p-4 border rounded-xl flex justify-between items-center hover:border-blue-500 cursor-pointer">
                    <div className="flex items-center gap-3"><div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">O</div> Outlook</div>
                    <button className="text-xs bg-blue-600 text-white px-3 py-1 rounded-lg">Connetti</button>
                </div>
            </div>
          </div>
        </div>
      )}

      {/* CSS FULLCALENDAR */}
      <style jsx global>{`
        .fc { --fc-border-color: #E5E7EB; --fc-button-bg-color: white; --fc-button-border-color: #E5E7EB; --fc-button-text-color: #374151; --fc-button-active-bg-color: #00665E; --fc-button-active-border-color: #00665E; --fc-today-bg-color: #F0FDFA; }
        .fc .fc-toolbar-title { font-size: 1.25rem; font-weight: 800; color: #111827; }
        .fc-daygrid-event { border-radius: 6px; }
      `}</style>
    </main>
  )
}