'use client'

import { createClient } from '../../../utils/supabase/client'
import { useEffect, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'
import itLocale from '@fullcalendar/core/locales/it' // Lingua Italiana

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

  // Stato Sincronizzazione Google/Esterni
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
  }, [supabase])

  const fetchEvents = async (userId: string) => {
    // 1. Prendi Appuntamenti Privati
    const { data: privateEvents } = await supabase.from('appointments').select('*')
    
    // 2. Prendi Prenotazioni Pubbliche (Web)
    const { data: publicBookings } = await supabase.from('bookings').select('*')

    // Formattazione per FullCalendar
    const calendarEvents = [
        ...(privateEvents || []).map(e => ({
            id: e.id,
            title: e.title,
            start: e.date, // Assumiamo che nel DB sia timestamp
            end: e.end_date || new Date(new Date(e.date).getTime() + 60*60*1000).toISOString(), // Default 1 ora se manca fine
            backgroundColor: '#00665E', // Teal Integra
            borderColor: '#00665E',
            extendedProps: { type: 'private', table: 'appointments' }
        })),
        ...(publicBookings || []).map(b => ({
            id: b.id,
            title: `👤 ${b.client_name}`,
            start: b.date,
            backgroundColor: '#F59E0B', // Arancione per distinguere booking esterni
            borderColor: '#F59E0B',
            extendedProps: { type: 'public', table: 'bookings', details: b.client_email }
        }))
    ]
    setEvents(calendarEvents)
  }

  const handleDateClick = (arg: any) => {
    // Quando clicchi su un giorno vuoto, pre-compila la data
    setNewEvent({ ...newEvent, start: arg.dateStr + 'T09:00', end: arg.dateStr + 'T10:00' })
    setIsEventModalOpen(true)
  }

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    
    // Validazione base
    if(!newEvent.start) { alert("Inserisci una data"); setSaving(false); return; }

    const { data, error } = await supabase.from('appointments').insert({
        title: newEvent.title,
        date: newEvent.start,
        // end_date: newEvent.end, // Se hai aggiunto la colonna end_date al DB, scommenta
        user_id: user.id 
    }).select()

    if (!error && data) {
        const created = data[0]
        setEvents([...events, {
            id: created.id,
            title: created.title,
            start: created.date,
            backgroundColor: '#00665E',
            borderColor: '#00665E',
            extendedProps: { type: 'private' }
        }])
        setIsEventModalOpen(false)
        setNewEvent({ title: '', start: '', end: '', type: 'private' })
    } else { 
        alert('Errore: ' + error?.message) 
    }
    setSaving(false)
  }

  const handleEventClick = async (clickInfo: any) => {
      if(!confirm(`Eliminare l'evento "${clickInfo.event.title}"?`)) return;
      
      const table = clickInfo.event.extendedProps.table || 'appointments'
      const id = clickInfo.event.id

      const { error } = await supabase.from(table).delete().eq('id', id)
      if(!error) {
          clickInfo.event.remove()
      } else {
          alert("Impossibile eliminare: " + error.message)
      }
  }

  // Simulazione connessione Google (In produzione useresti le API di Google reali o parsing iCal server-side)
  const handleConnectCalendar = (e: React.FormEvent) => {
      e.preventDefault()
      if(!icalUrl) return;
      setExternalCalendars([...externalCalendars, { name: 'Google Calendar (Importato)', url: icalUrl }])
      setIcalUrl('')
      setIsSyncModalOpen(false)
      alert("Calendario collegato! (In questa demo visualizziamo l'avvenuto collegamento, per vedere gli eventi reali serve un parser iCal lato server).")
  }

  if (loading) return <div className="p-10 text-[#00665E] animate-pulse">Caricamento Agenda...</div>

  return (
    <main className="flex-1 p-8 overflow-auto bg-[#F8FAFC] text-gray-900 font-sans h-screen flex flex-col">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-black text-[#00665E] tracking-tight">Agenda Intelligente</h1>
          <p className="text-gray-500 text-sm mt-1">Organizza appuntamenti e sincronizza i tuoi calendari.</p>
        </div>
        <div className="flex gap-3">
            <button onClick={() => setIsSyncModalOpen(true)} className="bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-xl font-bold hover:bg-gray-50 transition shadow-sm flex items-center gap-2">
               🔗 Collega Google / Esterni
            </button>
            <button onClick={() => setIsEventModalOpen(true)} className="bg-[#00665E] text-white px-5 py-2 rounded-xl font-bold hover:bg-[#004d46] shadow-lg shadow-[#00665E]/20 transition">
               + Nuovo Evento
            </button>
        </div>
      </div>

      {/* CALENDARIO FULLCALENDAR */}
      <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm flex-1 overflow-hidden font-medium text-sm">
         <div className="h-full calendar-wrapper">
            <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
                initialView="dayGridMonth"
                headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
                }}
                locale={itLocale}
                events={events}
                dateClick={handleDateClick}
                eventClick={handleEventClick}
                editable={true} // Permette drag & drop (visuale)
                selectable={true}
                height="100%"
                eventClassNames="rounded-md shadow-sm border-0 px-2 py-0.5"
                dayMaxEvents={true}
            />
         </div>
      </div>

      {/* --- MODALE NUOVO EVENTO --- */}
      {isEventModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-3xl w-full max-w-md shadow-2xl relative">
            <button onClick={() => setIsEventModalOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-900">✕</button>
            <h2 className="text-2xl font-black text-[#00665E] mb-6">Nuovo Appuntamento</h2>
            <form className="space-y-4" onSubmit={handleSaveEvent}>
              <div><label className="text-xs font-bold text-gray-500 uppercase">Titolo Evento</label><input type="text" value={newEvent.title} onChange={(e) => setNewEvent({...newEvent, title: e.target.value})} className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl mt-1 outline-none focus:border-[#00665E]" placeholder="Es. Riunione Marketing" required /></div>
              
              <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-xs font-bold text-gray-500 uppercase">Inizio</label><input type="datetime-local" value={newEvent.start} onChange={(e) => setNewEvent({...newEvent, start: e.target.value})} className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl mt-1 outline-none" required /></div>
                  <div><label className="text-xs font-bold text-gray-500 uppercase">Fine (Opzionale)</label><input type="datetime-local" value={newEvent.end} onChange={(e) => setNewEvent({...newEvent, end: e.target.value})} className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl mt-1 outline-none" /></div>
              </div>

              <div className="bg-blue-50 p-3 rounded-xl flex items-start gap-3">
                 <span className="text-xl">💡</span>
                 <p className="text-xs text-blue-800 leading-relaxed">L'evento sarà visibile solo a te. Per le prenotazioni pubbliche, usa la pagina "Prenotazioni".</p>
              </div>

              <button type="submit" disabled={saving} className="w-full bg-[#00665E] hover:bg-[#004d46] text-white font-bold py-3 rounded-xl mt-2 transition shadow-lg shadow-[#00665E]/20">{saving ? 'Salvataggio...' : 'Salva in Agenda'}</button>
            </form>
          </div>
        </div>
      )}

      {/* --- MODALE SINCRONIZZAZIONE GOOGLE --- */}
      {isSyncModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-3xl w-full max-w-lg shadow-2xl relative">
            <button onClick={() => setIsSyncModalOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-900">✕</button>
            <h2 className="text-2xl font-black text-[#00665E] mb-2">Collega Calendari</h2>
            <p className="text-gray-500 text-sm mb-6">Visualizza i tuoi impegni Google, Outlook o Apple direttamente qui.</p>
            
            <div className="space-y-6">
                {/* Lista calendari connessi */}
                {externalCalendars.length > 0 && (
                    <div className="mb-4 space-y-2">
                        {externalCalendars.map((cal, idx) => (
                            <div key={idx} className="flex justify-between items-center bg-green-50 text-green-700 px-4 py-3 rounded-xl border border-green-200">
                                <span className="font-bold text-sm flex items-center gap-2">✅ {cal.name}</span>
                                <button className="text-xs text-red-400 font-bold hover:underline">Scollega</button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Opzione 1: Google Calendar Diretto (Placeholder per API OAuth) */}
                <div className="border border-gray-200 rounded-2xl p-4 hover:border-blue-500 transition cursor-pointer group">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center text-xl shadow-sm">G</div>
                        <div>
                            <h3 className="font-bold text-gray-900 group-hover:text-blue-600">Google Calendar</h3>
                            <p className="text-xs text-gray-500">Connessione diretta sicura (OAuth)</p>
                        </div>
                        <button className="ml-auto bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold">Connetti</button>
                    </div>
                </div>

                {/* Opzione 2: iCal Link (Universale) */}
                <form onSubmit={handleConnectCalendar} className="border border-gray-200 rounded-2xl p-4">
                     <div className="flex items-center gap-4 mb-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-xl">🔗</div>
                        <div>
                            <h3 className="font-bold text-gray-900">Link iCal Pubblico</h3>
                            <p className="text-xs text-gray-500">Outlook, Apple, o link segreto Google</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <input type="url" value={icalUrl} onChange={e => setIcalUrl(e.target.value)} placeholder="https://calendar.google.com/..." className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-[#00665E]" />
                        <button type="submit" className="bg-gray-900 text-white px-4 rounded-lg text-xs font-bold hover:bg-black">Aggiungi</button>
                    </div>
                </form>

                <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 text-xs text-yellow-800">
                    <strong>Nota Enterprise:</strong> La sincronizzazione bidirezionale (modificare eventi Google da qui) richiede il piano Ambassador. Il piano Base consente la sola lettura.
                </div>
            </div>
          </div>
        </div>
      )}

      {/* OVERRIDE CSS PER FULLCALENDAR (Stile Integra) */}
      <style jsx global>{`
        .fc {
            --fc-border-color: #E5E7EB;
            --fc-button-bg-color: white;
            --fc-button-border-color: #E5E7EB;
            --fc-button-text-color: #374151;
            --fc-button-hover-bg-color: #F9FAFB;
            --fc-button-hover-border-color: #D1D5DB;
            --fc-button-active-bg-color: #00665E;
            --fc-button-active-border-color: #00665E;
            --fc-button-active-text-color: white;
            --fc-today-bg-color: #F0FDFA;
            --fc-event-border-color: transparent;
        }
        .fc .fc-toolbar-title { font-size: 1.25rem; font-weight: 800; color: #111827; }
        .fc .fc-col-header-cell-cushion { padding-top: 10px; padding-bottom: 10px; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.05em; color: #6B7280; }
        .fc-daygrid-event { font-size: 0.75rem; font-weight: 600; border-radius: 6px; }
        .fc-timegrid-event { border-radius: 6px; }
      `}</style>

    </main>
  )
}