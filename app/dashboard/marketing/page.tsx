'use client'

import { createClient } from '../../../utils/supabase/client'
import { useEffect, useState, useRef } from 'react'
import { 
  Megaphone, Mail, Users, TrendingUp, Calendar, Send, Plus, Loader2, Sparkles, AlertCircle, CheckSquare, Square, X, Eye 
} from 'lucide-react'

export default function MarketingPage() {
  const [user, setUser] = useState<any>(null)
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [contacts, setContacts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // STATI WIZARD (Nuova Campagna)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [step, setStep] = useState(1) 
  
  // STATI DETTAGLIO (Visualizza Campagna)
  const [viewCampaign, setViewCampaign] = useState<any>(null)

  // DATI CAMPAGNA
  const [subject, setSubject] = useState('')
  const [content, setContent] = useState('Ciao {{name}},\n\n...')
  
  // SELEZIONE E FILTRI
  const [selectedIds, setSelectedIds] = useState<number[]>([]) 
  const [filteredContacts, setFilteredContacts] = useState<any[]>([]) 
  const [activeFilter, setActiveFilter] = useState<'all' | 'dormant' | 'vip' | 'new'>('all')
  
  const [sending, setSending] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        fetchCampaigns()
        fetchContacts() 
      }
      setLoading(false)
    }
    getData()
  }, [])

  const fetchCampaigns = async () => {
      const { data } = await supabase.from('campaigns').select('*').order('created_at', { ascending: false })
      if(data) setCampaigns(data)
  }

  const fetchContacts = async () => {
      const { data } = await supabase.from('contacts').select('*')
      if(data) {
          setContacts(data)
          setFilteredContacts(data) 
      }
  }

  // --- FILTRI ---
  const applySmartFilter = (type: 'all' | 'dormant' | 'vip' | 'new') => {
      setActiveFilter(type)
      const now = new Date()
      let result: any[] = []

      switch(type) {
          case 'all': result = contacts; break;
          case 'dormant': 
              result = contacts.filter(c => {
                  const lastDate = c.last_order_date ? new Date(c.last_order_date) : new Date(c.created_at)
                  const diffDays = Math.ceil(Math.abs(now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
                  return diffDays > 30
              }); break;
          case 'vip': result = contacts.filter(c => (c.value || c.ltv || 0) > 500); break;
          case 'new': 
               result = contacts.filter(c => {
                  const createDate = new Date(c.created_at)
                  const diffDays = Math.ceil(Math.abs(now.getTime() - createDate.getTime()) / (1000 * 60 * 60 * 24))
                  return diffDays <= 7
              }); break;
      }
      setFilteredContacts(result)
      setSelectedIds(result.map(c => c.id))
      if(type !== 'all' && result.length === 0) alert("Nessun contatto corrisponde a questo filtro.")
  }

  // --- CHECKBOX ---
  const toggleContact = (id: number) => {
      selectedIds.includes(id) ? setSelectedIds(selectedIds.filter(i => i !== id)) : setSelectedIds([...selectedIds, id])
  }

  const toggleSelectVisible = () => {
      const visibleIds = filteredContacts.map(c => c.id)
      const allSelected = visibleIds.every(id => selectedIds.includes(id))
      if (allSelected) setSelectedIds(selectedIds.filter(id => !visibleIds.includes(id)))
      else setSelectedIds(Array.from(new Set([...selectedIds, ...visibleIds])))
  }

  // --- INVIO REALE ---
  const handleSend = async () => {
      if(selectedIds.length === 0) return alert("Seleziona almeno un destinatario.")
      setSending(true)
      
      const targets = contacts.filter(c => selectedIds.includes(c.id))
      const validTargets = targets.filter(t => t.email && t.email.includes('@')) 

      if(validTargets.length === 0) { setSending(false); return alert("Nessuna email valida trovata.") }

      const { data: campaign, error } = await supabase.from('campaigns').insert({
          user_id: user.id, title: subject, content: content, status: 'Inviata',
          sent_count: validTargets.length, recipients_details: targets.map(t => ({email: t.email, name: t.name})),
          target_filters: { filter: activeFilter }
      }).select().single()

      if(error) { setSending(false); return alert("Errore DB: " + error.message) }

      try {
          const res = await fetch('/api/send-marketing', {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({ subject, content, recipients: validTargets })
          })
          
          if(res.ok) {
              // MESSAGGIO PULITO E PROFESSIONALE
              alert(`✅ Campagna inviata con successo a ${validTargets.length} contatti!`)
              setCampaigns([campaign, ...campaigns])
              setIsModalOpen(false)
              setSubject(''); setContent('Ciao {{name}},\n\n...');
          } else {
              throw new Error("Errore API invio")
          }
      } catch (e: any) {
          alert("Errore tecnico invio: " + e.message)
      }
      setSending(false)
  }

  if (loading) return <div className="p-10 text-[#00665E] animate-pulse">Caricamento Marketing...</div>

  const totalSent = campaigns.reduce((acc, c) => acc + (c.sent_count || 0), 0)

  return (
    <main className="flex-1 p-8 overflow-auto bg-[#F8FAFC] min-h-screen pb-20 font-sans">
      
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-[#00665E]">Marketing Hub</h1>
          <p className="text-gray-500 text-sm">Automazione e comunicazione.</p>
        </div>
        <button onClick={() => { setIsModalOpen(true); setStep(1); setSelectedIds([]); setActiveFilter('all'); setFilteredContacts(contacts) }} className="bg-[#00665E] text-white px-5 py-3 rounded-xl font-bold hover:bg-[#004d46] shadow-lg flex items-center gap-2 transition transform hover:scale-105">
           <Plus size={20}/> Crea Campagna
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[80vh]">
          
          {/* SINISTRA: LISTA CLICCABILE */}
          <div className="lg:col-span-1 space-y-6 flex flex-col h-full overflow-hidden">
             <div className="grid grid-cols-2 gap-3 shrink-0">
                 <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm"><p className="text-xs font-bold text-gray-400 uppercase">Email Inviate</p><h3 className="text-2xl font-black text-gray-800">{totalSent}</h3></div>
                 <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm"><p className="text-xs font-bold text-gray-400 uppercase">Open Rate</p><h3 className="text-2xl font-black text-blue-600">--%</h3></div>
             </div>
             <div className="bg-white rounded-3xl border border-gray-200 shadow-sm flex-1 overflow-y-auto p-2">
                 {campaigns.map(camp => (
                     <div key={camp.id} onClick={() => setViewCampaign(camp)} className="p-4 border-b border-gray-50 hover:bg-blue-50 transition cursor-pointer group rounded-xl">
                         <div className="flex justify-between items-start mb-1">
                             <h4 className="font-bold text-gray-900 line-clamp-1 group-hover:text-[#00665E]">{camp.title}</h4>
                             <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold">Vedi</span>
                         </div>
                         <p className="text-xs text-gray-500 mb-3">{new Date(camp.created_at).toLocaleDateString()}</p>
                         <div className="flex gap-4 text-xs">
                             <div className="flex items-center gap-1 text-gray-600"><Send size={12}/> <strong>{camp.sent_count}</strong></div>
                         </div>
                     </div>
                 ))}
             </div>
          </div>

          {/* DESTRA: DASHBOARD (STATICA) */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-200 shadow-sm flex flex-col items-center justify-center text-center p-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
                <div className="bg-white p-6 rounded-full shadow-xl mb-6"><Megaphone size={40} className="text-[#00665E]" /></div>
                <h2 className="text-2xl font-black text-gray-900 mb-2">Pronto a lanciare una campagna?</h2>
                <button onClick={() => { setIsModalOpen(true); setStep(1); }} className="bg-gray-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-black transition">Inizia Wizard</button>
          </div>
      </div>

      {/* --- MODALE DETTAGLIO CAMPAGNA (VISUALIZZA) --- */}
      {viewCampaign && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
              <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[80vh]">
                  <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                      <div>
                          <h3 className="text-xl font-black text-gray-900">{viewCampaign.title}</h3>
                          <p className="text-xs text-gray-500">Inviata il {new Date(viewCampaign.created_at).toLocaleString()}</p>
                      </div>
                      <button onClick={() => setViewCampaign(null)} className="text-gray-400 hover:text-gray-900"><X size={24}/></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-8">
                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6">
                          <p className="text-xs font-bold text-gray-400 uppercase mb-2">Contenuto Email</p>
                          <p className="text-sm text-gray-800 whitespace-pre-wrap font-medium">{viewCampaign.content}</p>
                      </div>
                      
                      <h4 className="font-bold text-sm text-gray-900 mb-3 flex items-center gap-2"><Users size={16}/> Destinatari ({viewCampaign.sent_count})</h4>
                      <div className="flex flex-wrap gap-2">
                          {viewCampaign.recipients_details && viewCampaign.recipients_details.map((r: any, i: number) => (
                              <span key={i} className="text-xs bg-white border border-gray-200 px-2 py-1 rounded text-gray-600">
                                  {r.email}
                              </span>
                          ))}
                          {(!viewCampaign.recipients_details || viewCampaign.recipients_details.length === 0) && <p className="text-xs text-gray-400">Dettagli destinatari non disponibili.</p>}
                      </div>
                  </div>
                  <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
                      <button onClick={() => setViewCampaign(null)} className="px-6 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold shadow-sm">Chiudi</button>
                  </div>
              </div>
          </div>
      )}

      {/* --- MODALE WIZARD (CREA) --- */}
      {isModalOpen && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
             <div className="bg-white rounded-3xl w-full max-w-5xl h-[90vh] shadow-2xl flex overflow-hidden animate-in zoom-in-95">
                 {/* SIDEBAR WIZARD */}
                 <div className="w-1/3 bg-gray-50 p-8 border-r border-gray-100 flex flex-col justify-between hidden md:flex">
                     <div>
                         <h2 className="text-2xl font-black text-[#00665E] mb-8">Wizard</h2>
                         <div className="space-y-4">
                             <div className={`p-4 rounded-xl flex items-center gap-4 transition ${step === 1 ? 'bg-white shadow border-l-4 border-[#00665E]' : 'opacity-50'}`}><Mail size={20}/><h4 className="font-bold text-sm">Contenuto</h4></div>
                             <div className={`p-4 rounded-xl flex items-center gap-4 transition ${step === 2 ? 'bg-white shadow border-l-4 border-[#00665E]' : 'opacity-50'}`}><Users size={20}/><h4 className="font-bold text-sm">Target</h4></div>
                         </div>
                     </div>
                 </div>

                 {/* MAIN WIZARD */}
                 <div className="flex-1 p-8 overflow-y-auto relative flex flex-col">
                     <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-gray-400">✕</button>

                     {step === 1 && (
                         <div className="animate-in slide-in-from-right">
                             <h3 className="text-2xl font-bold text-gray-900 mb-6">Scrivi Messaggio</h3>
                             <input type="text" placeholder="Oggetto Email" value={subject} onChange={e => setSubject(e.target.value)} className="w-full p-4 bg-gray-50 border rounded-xl mb-4 font-bold" />
                             <textarea value={content} onChange={e => setContent(e.target.value)} className="w-full h-64 p-4 bg-gray-50 border rounded-xl resize-none" placeholder="Scrivi qui..."></textarea>
                             <div className="mt-8 flex justify-end"><button onClick={() => setStep(2)} disabled={!subject || !content} className="bg-[#00665E] text-white px-8 py-4 rounded-xl font-bold">Continua →</button></div>
                         </div>
                     )}

                     {step === 2 && (
                         <div className="animate-in slide-in-from-right h-full flex flex-col">
                             <h3 className="text-2xl font-bold text-gray-900 mb-6">Seleziona Destinatari</h3>
                             
                             <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                                 <FilterBtn label="Tutti" active={activeFilter === 'all'} onClick={() => applySmartFilter('all')} icon={<Users size={16}/>} />
                                 <FilterBtn label="Dormienti" active={activeFilter === 'dormant'} onClick={() => applySmartFilter('dormant')} icon={<Calendar size={16}/>} />
                                 <FilterBtn label="VIP" active={activeFilter === 'vip'} onClick={() => applySmartFilter('vip')} icon={<Sparkles size={16}/>} />
                                 <FilterBtn label="Nuovi" active={activeFilter === 'new'} onClick={() => applySmartFilter('new')} icon={<TrendingUp size={16}/>} />
                             </div>

                             <div className="flex-1 border border-gray-200 rounded-xl overflow-hidden flex flex-col">
                                 <div className="bg-gray-50 p-3 border-b border-gray-200 text-xs font-bold text-gray-500 flex justify-between items-center">
                                     <button onClick={toggleSelectVisible} className="flex items-center gap-2 hover:text-gray-800 transition"><CheckSquare size={16}/> Toggle Visibili</button>
                                     <span>{selectedIds.length} Selezionati</span>
                                 </div>
                                 <div className="flex-1 overflow-y-auto p-2 space-y-1">
                                     {filteredContacts.map(c => (
                                         <div key={c.id} onClick={() => toggleContact(c.id)} className={`flex justify-between items-center p-3 rounded-lg text-sm cursor-pointer transition select-none ${selectedIds.includes(c.id) ? 'bg-[#00665E]/10 border border-[#00665E]/20' : 'hover:bg-gray-50 border border-transparent'}`}>
                                             <div className="flex items-center gap-3">
                                                 {selectedIds.includes(c.id) ? <CheckSquare size={20} fill="#00665E" className="text-white"/> : <Square size={20} className="text-gray-300"/>}
                                                 <div><span className="font-bold text-gray-700 block">{c.name}</span><span className="text-gray-400 text-xs">{c.email}</span></div>
                                             </div>
                                         </div>
                                     ))}
                                 </div>
                             </div>

                             <div className="mt-6 flex justify-between items-center">
                                 <button onClick={() => setStep(1)} className="text-gray-500 font-bold">Indietro</button>
                                 <button onClick={handleSend} disabled={sending || selectedIds.length === 0} className="bg-[#00665E] text-white px-8 py-4 rounded-xl font-bold hover:bg-[#004d46] transition flex items-center gap-2 shadow-lg disabled:opacity-50">
                                     {sending ? <Loader2 className="animate-spin"/> : <Send size={18}/>} Invia Ora
                                 </button>
                             </div>
                         </div>
                     )}
                 </div>
             </div>
          </div>
      )}
    </main>
  )
}

function FilterBtn({label, active, onClick, icon}: any) {
    return (
        <button onClick={onClick} className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-2 transition ${active ? 'bg-[#00665E] text-white border-[#00665E]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#00665E]'}`}>
            {icon} {label}
        </button>
    )
}