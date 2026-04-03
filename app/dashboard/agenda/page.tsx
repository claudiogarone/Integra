'use client'

import { createClient } from '../../../utils/supabase/client'
import { useEffect, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'
import itLocale from '@fullcalendar/core/locales/it'
import { Calendar as CalIcon, Link as LinkIcon, Check, X, Bot, Clock, Copy, CheckCircle, Trash2, Download, RefreshCw, ShieldAlert, Loader2, HelpCircle, Share2, CalendarDays, Plus } from 'lucide-react'

export default function AgendaPage() {
  const [user, setUser] = useState<any>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  
  const [events, setEvents] = useState<any[]>([])
  const [syncs, setSyncs] = useState<any[]>([]) 
  const [loading, setLoading] = useState(true)
  const [isSyncingBackground, setIsSyncingBackground] = useState(false)
  const [publicBaseUrl, setPublicBaseUrl] = useState('')
  
  // Modali
  const [isEventModalOpen, setIsEventModalOpen] = useState(false)
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false)
  const [syncTab, setSyncTab] = useState<'export' | 'import' | 'social'>('export')
  
  const [selectedEventInfo, setSelectedEventInfo] = useState<any>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [copiedSync, setCopiedSync] = useState(false)

  // Inbound Sync
  const [importUrl, setImportUrl] = useState('')
  const [importConsent, setImportConsent] = useState(false)
  const [importing, setImporting] = useState(false)

  // Dati Form
  const [newEvent, setNewEvent] = useState({ id: '', title: '', start: '', end: '', type: 'Call', notes: '' })
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (typeof window !== 'undefined') setPublicBaseUrl(window.location.origin)
    
    const getData = async () => {
      // 1. Estrazione utente reale autenticato
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;
      const token = sessionData?.session?.access_token || null;
      
      if (user && token) {
        setUser(user);
        setAccessToken(token);
        
        // 2. Carichiamo gli eventi legati unicamente all'utente autenticato
        await fetchEvents(token);
        
        // 3. Controlliamo calendari e sincronizziamo in background
        const activeSyncs = await fetchSyncs(user.id, token);
        if (activeSyncs && activeSyncs.length > 0) {
            triggerBackgroundSync(activeSyncs, user.id, token);
        }
      } else {
        console.warn("Sessione assente. Eventi non caricati.");
      }
      setLoading(false);
    }
    getData()
  }, [])

  const fetchEvents = async (token: string) => {
    try {
      const res = await fetch('/api/calendar/events', { 
        cache: 'no-store',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Errore API");
      const data = await res.json();

      const calendarEvents = data.map((e: any) => {
        let color = '#00665E'; 
        let icon = '';
        
        if (e.type === 'live' || e.title.includes('🎥')) { color = '#DC2626'; icon = '🎥 '; }
        if (e.status === 'ai_pending') { color = '#F59E0B'; icon = '🤖 '; }
        if (e.title.includes('📥')) { color = '#7C3AED'; }

        const startStr = `${e.event_date}T${e.start_time}`;
        const endStr = `${e.event_date}T${e.end_time}`;

        return {
            id: e.id,
            title: `${icon}${e.title}`,
            start: startStr,
            end: endStr,
            backgroundColor: color,
            borderColor: color,
            extendedProps: { 
                type: e.type, 
                description: e.description, 
                status: e.status,
                raw_date: e.event_date
            }
        }
      });

      setEvents(calendarEvents);
    } catch (error) {
      console.error("Errore recupero eventi:", error);
    }
  }

  const fetchSyncs = async (userId: string, token: string) => {
      const { data } = await supabase.from('calendar_syncs').select('*').eq('user_id', userId).order('created_at', { ascending: false });
      if (data) {
          setSyncs(data);
          return data;
      }
      return [];
  }

  const triggerBackgroundSync = async (activeSyncs: any[], userId: string, token: string) => {
      setIsSyncingBackground(true);
      let hasUpdates = false;
      
      for (const sync of activeSyncs) {
          try {
              const res = await fetch('/api/calendar/import', {
                  method: 'POST',
                  headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                  },
                  body: JSON.stringify({ url: sync.url })
              });
              const result = await res.json();
              if (result.importedCount > 0) hasUpdates = true;
          } catch (err) {
              console.error("Errore sync in background per:", sync.url);
          }
      }
      
      if (hasUpdates) {
          await fetchEvents(token);
      }
      setIsSyncingBackground(false);
  }

  const handleManualSync = async (sync: any) => {
      if(!accessToken) return;
      setImporting(true);
      try {
          const res = await fetch('/api/calendar/import', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
              },
              body: JSON.stringify({ url: sync.url })
          });
          const result = await res.json();
          if(!res.ok) throw new Error(result.error);
          alert(`✅ Sincronizzazione completata! Trovati ${result.importedCount} nuovi eventi.`);
          await fetchEvents(accessToken);
          await fetchSyncs(user.id, accessToken);
      } catch(err: any) {
          alert("❌ Errore: " + err.message);
      } finally {
          setImporting(false);
      }
  }

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault(); 
    if(!accessToken) return;
    setSaving(true);
    
    const startParts = newEvent.start.split('T');
    const event_date = startParts[0];
    const start_time = startParts[1] || "09:00:00";
    
    let end_time = "10:00:00";
    if (newEvent.end) end_time = newEvent.end.split('T')[1] || "10:00:00";

    const payload = {
        id: newEvent.id || undefined, title: newEvent.title, description: newEvent.notes,
        event_date: event_date, start_time: start_time, end_time: end_time, type: newEvent.type, status: 'Scheduled'
    };

    try {
        const res = await fetch('/api/calendar/events', { 
            method: 'POST', 
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            }, 
            body: JSON.stringify(payload) 
        });
        if (!res.ok) throw new Error("Errore salvataggio");
        await fetchEvents(accessToken);
        setIsEventModalOpen(false);
    } catch (error: any) { alert("❌ Errore: " + error.message); } finally { setSaving(false); }
  }

  const handleEventClick = (clickInfo: any) => { setSelectedEventInfo(clickInfo.event); setIsDetailsModalOpen(true); }

  const handleDateClick = (arg: any) => { 
      const date = new Date(arg.date);
      const year = date.getFullYear(); const month = String(date.getMonth() + 1).padStart(2, '0'); const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0'); const minutes = String(date.getMinutes()).padStart(2, '0');
      const startTime = `${year}-${month}-${day}T${hours}:${minutes}`;
      const endHours = String((date.getHours() + 1) % 24).padStart(2, '0');
      const endTime = `${year}-${month}-${day}T${endHours}:${minutes}`;
      setNewEvent({ id: '', title: '', start: startTime, end: endTime, type: 'Call', notes: '' }); 
      setIsEventModalOpen(true); 
  }

  const handleConfirmAi = async () => {
      if(!selectedEventInfo || !accessToken) return;
      const payload = { id: selectedEventInfo.id, title: selectedEventInfo.title.replace('🤖 ', '✅ '), status: 'Confirmed' };
      await fetch('/api/calendar/events', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` }, body: JSON.stringify(payload) });
      setIsDetailsModalOpen(false); fetchEvents(accessToken); alert("Appuntamento confermato!");
  }

  const handleDeleteEvent = async () => {
      if(!selectedEventInfo || !accessToken) return;
      if(confirm(`Eliminare definitivamente "${selectedEventInfo.title}"?`)) {
          const res = await fetch(`/api/calendar/events?id=${selectedEventInfo.id}`, { 
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${accessToken}` }
          });
          if (res.ok) { setIsDetailsModalOpen(false); fetchEvents(accessToken); }
      }
  }

  const handleDeleteSync = async (id: number) => {
      if(!confirm("Vuoi rimuovere questo collegamento? Gli eventi già importati rimarranno in agenda, ma non verranno più aggiornati.")) return;
      await supabase.from('calendar_syncs').delete().eq('id', id);
      setSyncs(syncs.filter(s => s.id !== id));
  }

  const copySyncLink = () => {
      const link = `${publicBaseUrl}/api/ical?userId=${user?.id}`
      navigator.clipboard.writeText(link)
      setCopiedSync(true)
      setTimeout(() => setCopiedSync(false), 2000)
  }

  const handleImportCalendar = async () => {
      if (!importUrl) return alert("Inserisci un link iCal valido.");
      if (!accessToken) return alert("Sessione non valida");
      setImporting(true);
      try {
          const res = await fetch('/api/calendar/import', { 
              method: 'POST', 
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
              }, 
              body: JSON.stringify({ url: importUrl }) 
          });
          const result = await res.json();
          if(!res.ok) throw new Error(result.error || "Impossibile importare il calendario.");
          
          let msg = `✅ Importazione completata con successo!\n\n`;
          msg += `➕ Aggiunti: ${result.importedCount} nuovi eventi.\n`;
          if (result.skippedCount > 0) msg += `⏩ Ignorati: ${result.skippedCount} (erano già in agenda o creati da IntegraOS).`;
          
          alert(msg);
          setImportUrl(''); setImportConsent(false);
          await fetchEvents(accessToken);
          await fetchSyncs(user.id, accessToken);
      } catch (err: any) { alert("❌ Errore: " + err.message); } finally { setImporting(false); }
  }

  if (loading) return <div className="p-10 text-[#00665E] animate-pulse font-bold flex items-center gap-2 h-screen w-screen justify-center bg-white">Avvio Agenda Criptata...</div>

  return (
    <main className="flex-1 p-8 overflow-auto bg-[#F8FAFC] text-gray-900 font-sans h-screen flex flex-col pb-20">
      
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 shrink-0 gap-4">
        <div>
            <h1 className="text-3xl font-black text-[#00665E] flex items-center gap-3"><CalIcon/> Smart Agenda</h1>
            <p className="text-gray-500 text-sm mt-1">Gestisci appuntamenti, dirette e collega calendari esterni (Google, Social).</p>
        </div>
        <div className="flex gap-3">
            <button onClick={() => setIsSyncModalOpen(true)} className="bg-white border border-gray-200 text-gray-600 px-4 py-2.5 rounded-xl font-bold hover:bg-gray-50 transition shadow-sm flex items-center gap-2">
                <RefreshCw size={16}/> Connect & Sync
                {syncs.length > 0 && <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-[10px] ml-1">{syncs.length}</span>}
            </button>
            <button onClick={() => {setNewEvent({ id: '', title: '', start: '', end: '', type: 'Call', notes: '' }); setIsEventModalOpen(true)}} className="bg-[#00665E] text-white px-5 py-2.5 rounded-xl font-bold hover:bg-[#004d46] shadow-lg transition flex items-center gap-2">
                <Plus size={18}/> Nuovo Evento
            </button>
        </div>
      </div>

      {events.some(e => e.extendedProps.status === 'ai_pending') && (
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl mb-6 flex items-center justify-between shadow-sm animate-in slide-in-from-top shrink-0">
              <div className="flex items-center gap-3">
                  <div className="bg-amber-500 text-white p-2 rounded-lg animate-bounce"><Bot size={20}/></div>
                  <div>
                      <h3 className="font-black text-amber-900">Nuove richieste dall'AI</h3>
                      <p className="text-sm text-amber-700">Hai degli appuntamenti fissati dall'assistente virtuale in attesa di conferme.</p>
                  </div>
              </div>
          </div>
      )}

      {/* LEGENDA COLORI E STATO SYNC */}
      <div className="flex flex-wrap items-center gap-6 mb-4 bg-white px-5 py-3.5 rounded-2xl border border-gray-100 shadow-sm text-xs font-bold text-gray-600 shrink-0">
          <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#00665E]"></div> Appuntamenti Interni</span>
          <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#7C3AED]"></div> Calendari Esterni (Google/Apple)</span>
          <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#DC2626]"></div> Dirette & Academy</span>
          <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#F59E0B]"></div> Richieste AI (Da Confermare)</span>
          
          {isSyncingBackground && (
              <span className="ml-auto flex items-center gap-2 text-purple-600 bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-100 animate-pulse">
                  <Loader2 size={14} className="animate-spin"/> Aggiornamento Google Calendar in corso...
              </span>
          )}
      </div>

      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xl flex-1 overflow-hidden font-medium text-xs relative z-0">
         <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
            initialView="timeGridWeek"
            headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek' }}
            buttonText={{ month: 'Mese', week: 'Settimana', day: 'Giorno', list: 'Lista' }}
            locale={itLocale}
            events={events}
            dateClick={handleDateClick}
            eventClick={handleEventClick}
            editable={true}
            selectable={true}
            selectMirror={true}
            dayMaxEvents={true}
            height="100%"
            slotMinTime="00:00:00"
            slotMaxTime="24:00:00"
            eventClassNames="rounded shadow-sm border-0 px-2 py-1 cursor-pointer font-bold transition hover:scale-[1.02]"
        />
      </div>

      {isEventModalOpen && (
        <div className="modal-overlay">
          <div className="bg-white p-8 rounded-3xl w-full max-w-md shadow-2xl relative animate-in zoom-in-95">
            <button onClick={() => setIsEventModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-900"><X size={20}/></button>
            <h2 className="text-xl font-black mb-6 flex items-center gap-2"><CalIcon className="text-[#00665E]"/> Aggiungi in Agenda</h2>
            
            <form onSubmit={handleSaveEvent} className="space-y-5">
              <div><label className="text-xs font-bold text-gray-500 uppercase">Titolo Evento</label><input className="input mt-1 font-bold" value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} placeholder="Es: Call con cliente Mario" required /></div>
              
              <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-xs font-bold text-gray-500 uppercase">Inizio</label><input type="datetime-local" className="input mt-1" value={newEvent.start} onChange={e => setNewEvent({...newEvent, start: e.target.value})} required /></div>
                  <div><label className="text-xs font-bold text-gray-500 uppercase">Fine</label><input type="datetime-local" className="input mt-1" value={newEvent.end} onChange={e => setNewEvent({...newEvent, end: e.target.value})} /></div>
              </div>

              <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Tipologia</label>
                  <select className="input mt-1" value={newEvent.type} onChange={e => setNewEvent({...newEvent, type: e.target.value})}>
                      <option value="Call">Telefonata / Zoom</option>
                      <option value="Meeting">Incontro Fisico</option>
                      <option value="live">Diretta Academy 🎥</option>
                      <option value="Other">Altro / Social</option>
                  </select>
              </div>

              <div><label className="text-xs font-bold text-gray-500 uppercase">Link / Note</label><textarea className="input mt-1 h-20 resize-none" value={newEvent.notes} onChange={e => setNewEvent({...newEvent, notes: e.target.value})} placeholder="Dettagli aggiuntivi..." /></div>
              
              <button disabled={saving} className="bg-[#00665E] text-white py-3 rounded-xl font-black w-full shadow-lg hover:bg-[#004d46] transition">{saving ? 'Salvataggio...' : 'Salva Evento'}</button>
            </form>
          </div>
        </div>
      )}

      {isDetailsModalOpen && selectedEventInfo && (
          <div className="modal-overlay">
              <div className="bg-white p-8 rounded-3xl w-full max-w-md shadow-2xl relative animate-in zoom-in-95">
                  <button onClick={() => setIsDetailsModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-900"><X size={20}/></button>
                  
                  <div className="mb-6 border-b border-gray-100 pb-6">
                      <h2 className="text-2xl font-black text-gray-900 mb-2 leading-tight">{selectedEventInfo.title}</h2>
                      <div className="flex items-center gap-2 text-sm font-bold text-gray-500"><Clock size={16}/> {new Date(selectedEventInfo.start).toLocaleString('it-IT', {weekday:'short', day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'})}</div>
                  </div>

                  {selectedEventInfo.extendedProps.description && (
                      <div className="mb-6 bg-gray-50 p-4 rounded-xl">
                          <p className="text-xs font-bold text-gray-400 uppercase mb-1">Dettagli</p>
                          <p className="text-sm font-medium text-gray-800 whitespace-pre-wrap break-words">{selectedEventInfo.extendedProps.description}</p>
                      </div>
                  )}

                  <div className="space-y-3">
                      {selectedEventInfo.extendedProps.status === 'ai_pending' && (
                          <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl mb-4">
                              <p className="text-xs font-bold text-amber-800 mb-3">L'Agente AI ha proposto questo orario. Confermi?</p>
                              <button onClick={handleConfirmAi} className="w-full bg-amber-500 hover:bg-amber-600 text-white font-black py-3 rounded-xl flex items-center justify-center gap-2"><Check size={18}/> Conferma Appuntamento</button>
                          </div>
                      )}

                      {selectedEventInfo.extendedProps.type === 'live' && (
                          <button onClick={() => window.open(selectedEventInfo.extendedProps.description, '_blank')} className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-3 rounded-xl shadow-lg flex items-center justify-center gap-2">🎥 Avvia Diretta Live</button>
                      )}

                      <button onClick={handleDeleteEvent} className="w-full bg-white border-2 border-red-500 text-red-500 hover:bg-red-50 font-bold py-3 rounded-xl transition flex items-center justify-center gap-2"><Trash2 size={18}/> Elimina Evento</button>
                  </div>
              </div>
          </div>
      )}

      {isSyncModalOpen && (
          <div className="modal-overlay">
             <div className="bg-white p-0 rounded-3xl max-w-2xl w-full relative shadow-2xl animate-in zoom-in-95 flex flex-col overflow-hidden max-h-[90vh]">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
                    <div>
                        <h3 className="font-black text-2xl text-[#00665E] flex items-center gap-2"><RefreshCw size={24}/> Sync & Importazione</h3>
                        <p className="text-xs text-gray-500 mt-1 font-medium">Collega IntegraOS ai tuoi calendari o ai social.</p>
                    </div>
                    <button onClick={() => setIsSyncModalOpen(false)} className="text-gray-400 hover:text-gray-900 bg-gray-200 p-2 rounded-full"><X size={20}/></button>
                </div>
                
                <div className="flex bg-white border-b border-gray-200 text-sm font-bold shrink-0">
                    <button onClick={() => setSyncTab('export')} className={`flex-1 py-4 transition flex items-center justify-center gap-2 ${syncTab === 'export' ? 'text-[#00665E] border-b-2 border-[#00665E] bg-[#00665E]/5' : 'text-gray-500 hover:bg-gray-50'}`}>📤 Esporta in Google</button>
                    <button onClick={() => setSyncTab('import')} className={`flex-1 py-4 transition flex items-center justify-center gap-2 ${syncTab === 'import' ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50' : 'text-gray-500 hover:bg-gray-50'}`}>📥 Connessioni Attive</button>
                    <button onClick={() => setSyncTab('social')} className={`flex-1 py-4 transition flex items-center justify-center gap-2 ${syncTab === 'social' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-500 hover:bg-gray-50'}`}>🌐 Eventi Social</button>
                </div>
                
                <div className="p-8 overflow-y-auto custom-scrollbar flex-1 bg-white">
                    {syncTab === 'export' && (
                        <div className="space-y-6 animate-in fade-in">
                            <div className="bg-gray-50 border border-gray-200 p-6 rounded-2xl">
                                <h4 className="font-black text-gray-900 mb-2">Opzione A: Download Istantaneo (Consigliato)</h4>
                                <p className="text-xs text-gray-600 mb-4 leading-relaxed">Scarica il file .ics e fai doppio click per aprirlo su Google Calendar, Apple o Outlook.</p>
                                <a href={`/api/ical?userId=${user?.id}`} className="bg-[#00665E] text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md hover:bg-[#004d46] transition w-full md:w-auto inline-flex">
                                    <Download size={18}/> Scarica Calendario (.ics)
                                </a>
                            </div>

                            <div className="border border-gray-200 p-6 rounded-2xl">
                                <h4 className="font-black text-gray-900 mb-2">Opzione B: Sincronizzazione Tramite Link</h4>
                                <p className="text-xs text-gray-600 mb-3 leading-relaxed">Copia il link e aggiungilo alla voce "Aggiungi da URL".</p>
                                <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl border border-gray-200 mb-4">
                                    <input readOnly value={`${publicBaseUrl}/api/ical?userId=${user?.id}`} className="w-full bg-transparent border-none text-xs font-mono text-gray-600 focus:outline-none px-2" />
                                    <button onClick={copySyncLink} className="bg-gray-800 text-white p-2.5 rounded-lg hover:bg-black transition flex-shrink-0 font-bold text-xs shadow-md">
                                        {copiedSync ? 'Copiato!' : 'Copia Link'}
                                    </button>
                                </div>
                                <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl flex gap-3 text-orange-800 text-xs font-medium leading-relaxed">
                                    <ShieldAlert size={20} className="shrink-0 mt-0.5 text-orange-500"/>
                                    <span><b>Avviso:</b> Google può impiegare fino a 12-24 ore per l'aggiornamento automatico.</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {syncTab === 'import' && (
                        <div className="space-y-8 animate-in fade-in">
                            <div>
                                <h4 className="font-bold text-gray-800 text-sm mb-3 flex items-center gap-2"><LinkIcon size={16} className="text-[#00665E]"/> Calendari Esterni Collegati</h4>
                                {syncs.length === 0 ? (
                                    <p className="text-xs text-gray-500 italic bg-gray-50 p-4 rounded-xl border border-gray-100">Nessun calendario collegato.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {syncs.map(sync => (
                                            <div key={sync.id} className="flex flex-col md:flex-row md:items-center justify-between bg-white border border-gray-200 p-4 rounded-xl shadow-sm hover:border-[#00665E] transition group gap-4">
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-2.5 rounded-xl flex items-center justify-center ${sync.provider === 'Google Calendar' ? 'bg-red-100 text-red-600' : sync.provider === 'Apple Calendar' ? 'bg-gray-100 text-gray-800' : 'bg-blue-100 text-blue-600'}`}>
                                                        <CalendarDays size={20}/>
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-sm text-gray-900">{sync.provider}</p>
                                                        <p className="text-[10px] text-gray-500 font-medium mt-0.5">Ultimo sync: {new Date(sync.last_sync).toLocaleString('it-IT')}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => handleManualSync(sync)} disabled={importing} className="text-purple-600 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 disabled:opacity-50">
                                                        {importing ? <Loader2 size={12} className="animate-spin"/> : <RefreshCw size={12}/>} Sincronizza Ora
                                                    </button>
                                                    <button onClick={() => handleDeleteSync(sync.id)} className="text-gray-400 hover:text-red-500 bg-gray-50 hover:bg-red-50 p-1.5 rounded-lg transition" title="Disconnetti"><Trash2 size={16}/></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="bg-purple-50 border border-purple-200 p-6 rounded-2xl">
                                <h4 className="font-black text-purple-900 mb-2">Aggiungi un Nuovo Calendario</h4>
                                <input type="url" placeholder="URL iCal / Indirizzo segreto Google..." className="w-full bg-white border border-purple-200 p-3.5 rounded-xl outline-none focus:border-purple-600 text-sm font-mono mb-4 transition shadow-inner" value={importUrl} onChange={e => setImportUrl(e.target.value)} />
                                <label className="flex items-center gap-3 mb-6 cursor-pointer bg-white p-3 rounded-xl border border-purple-100 shadow-sm">
                                    <input type="checkbox" className="w-5 h-5 accent-purple-600" checked={importConsent} onChange={e => setImportConsent(e.target.checked)}/>
                                    <span className="text-xs font-bold text-gray-700">Acconsento all'importazione dei dati nel DB aziendale sicuro.</span>
                                </label>
                                <button onClick={handleImportCalendar} disabled={!importUrl || !importConsent || importing} className="w-full bg-purple-600 text-white font-black py-4 rounded-xl shadow-lg hover:bg-purple-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
                                    {importing ? <Loader2 size={18} className="animate-spin"/> : <LinkIcon size={18}/>} Collega Calendario
                                </button>
                            </div>
                        </div>
                    )}

                    {syncTab === 'social' && (
                        <div className="space-y-6 animate-in fade-in text-center py-6">
                            <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6"><Share2 size={40}/></div>
                            <h3 className="text-2xl font-black text-gray-900 mb-4">Eventi Social & Webinar</h3>
                            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 text-left text-sm text-gray-700 space-y-4 shadow-sm max-w-lg mx-auto">
                                <p>Crea l'evento su Facebook o LinkedIn, esporta il file ".ics" (o copia l'url), e incollalo nella voce "Importa".</p>
                            </div>
                        </div>
                    )}
                </div>
             </div>
          </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 50; backdrop-filter: blur(4px); padding: 1rem; }
        .input { width: 100%; padding: 0.875rem; border: 1px solid #e2e8f0; border-radius: 0.75rem; outline: none; transition: all 0.2s; font-size: 0.875rem; background-color: #f8fafc; }
        .input:focus { border-color: #00665E; background-color: white; box-shadow: 0 0 0 3px rgba(0, 102, 94, 0.1); }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .fc { --fc-today-bg-color: #F0FDFA; --fc-button-active-bg-color: #00665E; --fc-button-active-border-color: #00665E; }
        .fc .fc-button-primary:not(:disabled).fc-button-active, .fc .fc-button-primary:not(:disabled):active { color: #ffffff !important; font-weight: 900 !important; }
        .fc-toolbar-title { font-size: 1.5rem !important; font-weight: 900 !important; color: #1e293b; text-transform: capitalize; }
      `}} />
    </main>
  )
}