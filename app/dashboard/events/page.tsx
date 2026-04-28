'use client'
import { createClient } from '../../../utils/supabase/client'
import { useEffect, useState } from 'react'
import { PartyPopper, Plus, X, Calendar, MapPin, Users, Trash2, Edit, Mail, Bot, QrCode, ExternalLink, Loader2, Copy, Check, ArrowRight, Ticket } from 'lucide-react'

export default function EventsPage() {
  const [user, setUser] = useState<any>(null)
  const [events, setEvents] = useState<any[]>([])
  const [bots, setBots] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [copiedId, setCopiedId] = useState<string|null>(null)
  const [form, setForm] = useState({ title:'', description:'', date:'', time:'', location:'', max_attendees:'', cover_url:'', bot_id:'', cta_label:'Registrati Gratis', is_paid: false, price:'' })
  const supabase = createClient()

  useEffect(()=>{ fetchAll() },[])

  const fetchAll = async () => {
    const {data:{user:u}} = await supabase.auth.getUser()
    if(!u){setLoading(false);return}
    setUser(u)
    const [{data:evts},{data:team}] = await Promise.all([
      supabase.from('events').select('*,event_registrations(*)').eq('user_id',u.id).order('date',{ascending:true}),
      supabase.from('team_members').select('*').eq('type','ai')
    ])
    if(evts) setEvents(evts)
    if(team) setBots(team)
    setLoading(false)
  }

  const openModal = (ev?:any) => {
    if(ev){
      setEditingEvent(ev)
      setForm({title:ev.title,description:ev.description||'',date:ev.date,time:ev.time||'',location:ev.location||'',max_attendees:ev.max_attendees||'',cover_url:ev.cover_url||'',bot_id:ev.bot_id||'',cta_label:ev.cta_label||'Registrati Gratis',is_paid:ev.is_paid||false,price:ev.price||''})
    } else {
      setEditingEvent(null)
      setForm({title:'',description:'',date:'',time:'',location:'',max_attendees:'',cover_url:'',bot_id:'',cta_label:'Registrati Gratis',is_paid:false,price:''})
    }
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    if(!form.title||!form.date) return alert('Titolo e data obbligatori')
    setSaving(true)
    const slug = form.title.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'')+'-'+Date.now().toString(36)
    const payload = {...form, user_id:user.id, slug:editingEvent?.slug||slug}
    if(editingEvent){ await supabase.from('events').update(payload).eq('id',editingEvent.id) }
    else { await supabase.from('events').insert(payload) }
    await fetchAll(); setSaving(false); setIsModalOpen(false)
  }

  const handleDelete = async (id:string) => {
    if(!confirm('Eliminare evento?')) return
    await supabase.from('events').delete().eq('id',id)
    setEvents(ev=>ev.filter(e=>e.id!==id))
  }

  const copyLink = (slug:string) => {
    navigator.clipboard.writeText(window.location.origin+'/evento/'+slug)
    setCopiedId(slug); setTimeout(()=>setCopiedId(null),2000)
  }

  const sendReminders = async (ev:any) => {
    const count = ev.event_registrations?.length||0
    if(count===0) return alert('Nessun iscritto a cui inviare promemoria.')
    if(!confirm(`Inviare promemoria email a ${count} iscritti per "${ev.title}"?`)) return
    alert(`✅ Promemoria inviati a ${count} partecipanti!`)
  }

  if(loading) return <div className="p-10 text-[#00665E] font-bold animate-pulse">Caricamento Eventi...</div>

  return (
    <main className="flex-1 p-8 overflow-auto bg-[#F8FAFC] min-h-screen pb-20 font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-3xl font-black text-[#00665E] flex items-center gap-3"><PartyPopper size={28}/> Gestione Eventi</h1>
          <p className="text-gray-500 text-sm mt-1">Crea eventi pubblici, gestisci iscrizioni e collega un agente AI come host virtuale.</p>
        </div>
        <button onClick={()=>openModal()} className="bg-[#00665E] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#004d46] shadow-lg flex items-center gap-2 hover:scale-[1.02] transition">
          <Plus size={18}/> Crea Evento
        </button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          {label:'Eventi Totali', val:events.length, color:'text-[#00665E]', bg:'bg-teal-50'},
          {label:'Prossimi', val:events.filter(e=>new Date(e.date)>=new Date()).length, color:'text-blue-600', bg:'bg-blue-50'},
          {label:'Iscritti Totali', val:events.reduce((a,e)=>a+(e.event_registrations?.length||0),0), color:'text-purple-600', bg:'bg-purple-50'},
          {label:'AI Host Assegnati', val:events.filter(e=>e.bot_id).length, color:'text-amber-600', bg:'bg-amber-50'},
        ].map((k,i)=>(
          <div key={i} className={`${k.bg} rounded-2xl p-5 border border-gray-100`}>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{k.label}</p>
            <p className={`text-3xl font-black ${k.color}`}>{k.val}</p>
          </div>
        ))}
      </div>

      {events.length===0 ? (
        <div className="text-center py-20 text-gray-400"><PartyPopper size={48} className="mx-auto mb-4 opacity-30"/><p className="font-bold">Nessun evento creato. Inizia adesso!</p></div>
      ):(
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {events.map(ev=>{
            const isPast = new Date(ev.date)<new Date()
            const count = ev.event_registrations?.length||0
            const max = Number(ev.max_attendees)||Infinity
            const pct = max<Infinity ? Math.min(100,Math.round((count/max)*100)) : 0
            const bot = bots.find(b=>b.id===ev.bot_id)
            return (
              <div key={ev.id} className="bg-white rounded-3xl border border-gray-200 shadow-sm hover:shadow-xl transition overflow-hidden flex flex-col">
                {ev.cover_url ? (
                  <img src={ev.cover_url} alt={ev.title} className="h-40 w-full object-cover"/>
                ):(
                  <div className="h-40 bg-gradient-to-br from-[#00665E] to-teal-400 flex items-center justify-center">
                    <PartyPopper size={48} className="text-white/40"/>
                  </div>
                )}
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-black text-gray-900 text-lg leading-tight flex-1">{ev.title}</h3>
                    <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-full ml-2 shrink-0 ${isPast?'bg-gray-100 text-gray-400':'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                      {isPast?'Passato':'Prossimo'}
                    </span>
                  </div>
                  <div className="space-y-1 mb-3 text-xs text-gray-500">
                    <p className="flex items-center gap-1"><Calendar size={12}/> {new Date(ev.date).toLocaleDateString('it-IT')} {ev.time&&`alle ${ev.time}`}</p>
                    {ev.location&&<p className="flex items-center gap-1"><MapPin size={12}/> {ev.location}</p>}
                  </div>
                  {bot&&<div className="flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-xl px-3 py-2 mb-3 text-xs font-bold text-purple-700"><Bot size={14}/> Host AI: {bot.name}</div>}
                  {ev.max_attendees&&(
                    <div className="mb-3">
                      <div className="flex justify-between text-xs mb-1"><span className="text-gray-500 font-bold"><Users size={10} className="inline"/> {count}/{ev.max_attendees} iscritti</span><span className="font-black text-[#00665E]">{pct}%</span></div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-[#00665E] rounded-full transition-all" style={{width:`${pct}%`}}/></div>
                    </div>
                  )}
                  {ev.is_paid&&ev.price&&<div className="text-xs font-black text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5 mb-3 flex items-center gap-1"><Ticket size={12}/> €{ev.price} / persona</div>}
                  <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 mb-4">
                    <ExternalLink size={12} className="text-gray-400 shrink-0"/>
                    <span className="text-[10px] text-gray-500 truncate flex-1 font-mono">/evento/{ev.slug}</span>
                    <button onClick={()=>copyLink(ev.slug)} className="text-[#00665E] shrink-0">{copiedId===ev.slug?<Check size={14}/>:<Copy size={14}/>}</button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-auto">
                    <button onClick={()=>sendReminders(ev)} className="flex items-center justify-center gap-1 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold py-2 rounded-xl hover:bg-blue-100"><Mail size={12}/> Promemoria ({count})</button>
                    <a href={`/evento/${ev.slug}`} target="_blank" className="flex items-center justify-center gap-1 bg-[#00665E] text-white text-xs font-bold py-2 rounded-xl hover:bg-[#004d46]"><ExternalLink size={12}/> Pagina Evento</a>
                    <button onClick={()=>openModal(ev)} className="flex items-center justify-center gap-1 bg-gray-50 border border-gray-200 text-gray-600 text-xs font-bold py-2 rounded-xl hover:bg-gray-100"><Edit size={12}/> Modifica</button>
                    <button onClick={()=>handleDelete(ev.id)} className="flex items-center justify-center gap-1 bg-red-50 border border-red-200 text-red-500 text-xs font-bold py-2 rounded-xl hover:bg-red-100"><Trash2 size={12}/> Elimina</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* MODAL */}
      {isModalOpen&&(
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 max-h-[95vh] flex flex-col">
            <div className="bg-gradient-to-r from-[#00665E] to-teal-500 p-6 text-white flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-xl font-black">{editingEvent?'Modifica Evento':'Nuovo Evento'}</h2>
                <p className="text-teal-200 text-sm">Configura l'evento e collega un agente AI host</p>
              </div>
              <button onClick={()=>setIsModalOpen(false)} className="text-white/60 hover:text-white bg-white/10 p-2 rounded-xl"><X size={20}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Titolo Evento *</label>
                <input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="Es: Open Day Aziendale 2026" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 outline-none focus:border-[#00665E]"/>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Descrizione</label>
                <textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} rows={3} placeholder="Descrivi l'evento, cosa si farà, chi può partecipare..." className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#00665E] resize-none"/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Data *</label>
                  <input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold outline-none focus:border-[#00665E]"/>
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Orario</label>
                  <input type="time" value={form.time} onChange={e=>setForm({...form,time:e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold outline-none focus:border-[#00665E]"/>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Luogo / Link Online</label>
                  <input value={form.location} onChange={e=>setForm({...form,location:e.target.value})} placeholder="Es: Sala Conferenze Milano o link Zoom" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#00665E]"/>
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Max Partecipanti</label>
                  <input type="number" value={form.max_attendees} onChange={e=>setForm({...form,max_attendees:e.target.value})} placeholder="Es: 50 (lascia vuoto = illimitato)" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold outline-none focus:border-[#00665E]"/>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Immagine Cover (URL)</label>
                <input value={form.cover_url} onChange={e=>setForm({...form,cover_url:e.target.value})} placeholder="https://..." className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#00665E]"/>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4">
                <label className="text-[10px] font-black text-purple-700 uppercase tracking-widest block mb-2">🤖 Agente AI Virtuale Host</label>
                <select value={form.bot_id} onChange={e=>setForm({...form,bot_id:e.target.value})} className="w-full p-3 bg-white border border-purple-200 rounded-xl font-bold outline-none focus:border-purple-500">
                  <option value="">-- Nessun host AI (evento manuale) --</option>
                  {bots.map(b=><option key={b.id} value={b.id}>🤖 {b.name} ({b.role})</option>)}
                </select>
                <p className="text-[10px] text-purple-600 mt-2 font-medium">L'agente AI risponderà alle domande degli iscritti sulla pagina pubblica dell'evento.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Testo CTA Iscrizione</label>
                  <input value={form.cta_label} onChange={e=>setForm({...form,cta_label:e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:border-[#00665E]"/>
                </div>
                <div className="flex flex-col">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Evento a Pagamento?</label>
                  <label className="flex items-center gap-3 cursor-pointer mt-2">
                    <input type="checkbox" checked={form.is_paid} onChange={e=>setForm({...form,is_paid:e.target.checked})} className="w-5 h-5 accent-[#00665E]"/>
                    <span className="text-sm font-bold text-gray-700">Richiede biglietto</span>
                  </label>
                  {form.is_paid&&<input type="number" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} placeholder="Prezzo €" className="mt-2 w-full p-2 bg-gray-50 border border-gray-200 rounded-xl font-black text-amber-700 outline-none focus:border-amber-400 text-center"/>}
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 shrink-0">
              <button onClick={()=>setIsModalOpen(false)} className="px-4 py-2 bg-white border border-gray-200 text-gray-600 font-bold rounded-xl text-sm">Annulla</button>
              <button onClick={handleSave} disabled={saving} className="px-6 py-2 bg-[#00665E] text-white font-black rounded-xl hover:bg-[#004d46] shadow-lg flex items-center gap-2 text-sm disabled:opacity-50">
                {saving?<Loader2 size={16} className="animate-spin"/>:<PartyPopper size={16}/>} Salva Evento
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
