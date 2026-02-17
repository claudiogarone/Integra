'use client'

import { createClient } from '../../../utils/supabase/client'
import { useEffect, useState, useRef } from 'react'
import Papa from 'papaparse'
import { 
  Megaphone, Mail, Users, TrendingUp, Calendar, Filter, Send, Plus, Loader2, Sparkles, AlertCircle 
} from 'lucide-react'

export default function MarketingPage() {
  const [user, setUser] = useState<any>(null)
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [contacts, setContacts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // STATI WIZARD
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [step, setStep] = useState(1) // 1: Scrittura, 2: Target
  
  // DATI CAMPAGNA
  const [subject, setSubject] = useState('')
  const [content, setContent] = useState('Ciao {{name}},\n\n...')
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [sending, setSending] = useState(false)

  // FILTRI SMART
  const [activeFilter, setActiveFilter] = useState<'all' | 'dormant' | 'vip' | 'new'>('all')

  const supabase = createClient()

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        fetchCampaigns()
        fetchContacts() // Carichiamo i contatti (clienti + fidelity)
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
      // Uniamo i dati dalla tabella contacts e loyalty_cards se necessario
      // Qui prendiamo contacts che dovrebbe essere la "single source of truth"
      const { data } = await supabase.from('contacts').select('*')
      if(data) setContacts(data)
  }

  // --- LOGICA FILTRI INTELLIGENTI ---
  const applySmartFilter = (type: 'all' | 'dormant' | 'vip' | 'new') => {
      setActiveFilter(type)
      let filteredIds: number[] = []
      const now = new Date()

      switch(type) {
          case 'all':
              filteredIds = contacts.map(c => c.id)
              break;
          case 'dormant':
              // Clienti che non acquistano da 30 giorni (usando last_order_date se presente, o created_at)
              filteredIds = contacts.filter(c => {
                  const lastDate = c.last_order_date ? new Date(c.last_order_date) : new Date(c.created_at)
                  const diffTime = Math.abs(now.getTime() - lastDate.getTime())
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                  return diffDays > 30
              }).map(c => c.id)
              break;
          case 'vip':
              // Ipotizziamo che nel contatto ci sia un campo 'value' alto o punti (se collegato)
              // Qui simuliamo: VIP se value > 500 o se ha tag VIP
              filteredIds = contacts.filter(c => c.value > 500).map(c => c.id)
              break;
          case 'new':
               // Creati negli ultimi 7 giorni
               filteredIds = contacts.filter(c => {
                  const createDate = new Date(c.created_at)
                  const diffTime = Math.abs(now.getTime() - createDate.getTime())
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                  return diffDays <= 7
              }).map(c => c.id)
              break;
      }
      setSelectedIds(filteredIds)
      
      if(type !== 'all' && filteredIds.length === 0) alert("Nessun contatto corrisponde a questo filtro.")
  }

  // --- INVIO EMAIL (Simulazione Avanzata -> Poi API Resend) ---
  const handleSend = async () => {
      if(selectedIds.length === 0) return alert("Seleziona almeno un destinatario.")
      if(selectedIds.length > 500) return alert("⚠️ Il piano Base supporta massimo 500 invii alla volta.")

      setSending(true)
      
      const targets = contacts.filter(c => selectedIds.includes(c.id))
      const emails = targets.map(c => c.email).filter(e => e && e.includes('@'))

      // 1. SALVA CAMPAGNA NEL DB
      const { data: campaign, error } = await supabase.from('campaigns').insert({
          user_id: user.id,
          title: subject,
          content: content,
          status: 'Inviata',
          sent_count: emails.length,
          recipients_details: targets.map(t => ({ email: t.email, name: t.name })), // Salva snapshot
          target_filters: { filter: activeFilter }
      }).select().single()

      if(error) {
          alert("Errore database: " + error.message)
          setSending(false)
          return
      }

      // 2. CHIAMATA API DI INVIO (Qui chiameremo la Route Handler Next.js)
      try {
          const res = await fetch('/api/send-marketing', {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({
                  campaignId: campaign.id,
                  subject,
                  content, // Il backend farà il replace di {{name}}
                  recipients: targets // Passiamo array oggetti {email, name}
              })
          })
          
          if(res.ok) {
              alert(`🚀 Campagna "${subject}" partita verso ${emails.length} contatti!`)
              setCampaigns([campaign, ...campaigns])
              setIsModalOpen(false)
              setSubject('')
              setContent('Ciao {{name}},\n\n...')
          } else {
              throw new Error("Errore API invio")
          }
      } catch (e) {
          alert("Errore invio email reale (Controlla API Key Resend). Campagna salvata come bozza.")
      }

      setSending(false)
  }

  if (loading) return <div className="p-10 text-[#00665E] animate-pulse">Caricamento Marketing Suite...</div>

  // Statistiche Generali
  const totalEmailsSent = campaigns.reduce((acc, c) => acc + (c.sent_count || 0), 0)
  const avgOpenRate = campaigns.length > 0 ? Math.round(campaigns.reduce((acc, c) => acc + ((c.open_count || 0) / (c.sent_count || 1) * 100), 0) / campaigns.length) : 0

  return (
    <main className="flex-1 p-8 overflow-auto bg-[#F8FAFC] min-h-screen pb-20 font-sans">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-[#00665E]">Marketing Hub</h1>
          <p className="text-gray-500 text-sm">Automazione e comunicazione clienti.</p>
        </div>
        <button onClick={() => { setIsModalOpen(true); setStep(1); setSelectedIds([]); setActiveFilter('all') }} className="bg-[#00665E] text-white px-5 py-3 rounded-xl font-bold hover:bg-[#004d46] shadow-lg flex items-center gap-2 transition transform hover:scale-105">
           <Plus size={20}/> Crea Campagna
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[80vh]">
          
          {/* SINISTRA: LISTA CAMPAGNE & REPORT */}
          <div className="lg:col-span-1 space-y-6 flex flex-col h-full overflow-hidden">
             
             {/* KPI BOXES */}
             <div className="grid grid-cols-2 gap-3 shrink-0">
                 <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                     <p className="text-xs font-bold text-gray-400 uppercase">Email Inviate</p>
                     <h3 className="text-2xl font-black text-gray-800">{totalEmailsSent}</h3>
                 </div>
                 <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                     <p className="text-xs font-bold text-gray-400 uppercase">Open Rate</p>
                     <h3 className="text-2xl font-black text-blue-600">{avgOpenRate}%</h3>
                 </div>
             </div>

             {/* LISTA SCROLLABILE */}
             <div className="bg-white rounded-3xl border border-gray-200 shadow-sm flex-1 overflow-y-auto p-2">
                 {campaigns.length === 0 && <div className="text-center py-10 text-gray-400 text-xs">Nessuna campagna inviata.</div>}
                 {campaigns.map(camp => (
                     <div key={camp.id} className="p-4 border-b border-gray-50 hover:bg-gray-50 transition cursor-pointer group">
                         <div className="flex justify-between items-start mb-1">
                             <h4 className="font-bold text-gray-900 line-clamp-1">{camp.title}</h4>
                             <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold">INVIATA</span>
                         </div>
                         <p className="text-xs text-gray-500 mb-3">{new Date(camp.created_at).toLocaleDateString()}</p>
                         
                         <div className="flex gap-4 text-xs">
                             <div className="flex items-center gap-1 text-gray-600">
                                 <Send size={12}/> <strong>{camp.sent_count}</strong>
                             </div>
                             <div className="flex items-center gap-1 text-blue-600">
                                 <TrendingUp size={12}/> <strong>{Math.round(((camp.open_count || 0) / (camp.sent_count || 1)) * 100)}%</strong> Open
                             </div>
                         </div>
                     </div>
                 ))}
             </div>
          </div>

          {/* DESTRA (O MODALE): CREAZIONE WIZARD */}
          {/* Usiamo un layout placeholder quando non c'è modale, la modale si apre sopra */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-200 shadow-sm flex flex-col items-center justify-center text-center p-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
                <div className="bg-white p-6 rounded-full shadow-xl mb-6">
                    <Megaphone size={40} className="text-[#00665E]" />
                </div>
                <h2 className="text-2xl font-black text-gray-900 mb-2">Pronto a lanciare una campagna?</h2>
                <p className="text-gray-500 max-w-md mx-auto mb-8">
                    Usa i filtri intelligenti per inviare promozioni mirate ai clienti dormienti o premiare i tuoi VIP.
                </p>
                <button onClick={() => { setIsModalOpen(true); setStep(1); }} className="bg-gray-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-black transition">
                    Inizia Wizard
                </button>
          </div>

      </div>

      {/* --- MODALE WIZARD (FULL SCREEN OVERLAY) --- */}
      {isModalOpen && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
             <div className="bg-white rounded-3xl w-full max-w-5xl h-[90vh] shadow-2xl flex overflow-hidden animate-in zoom-in-95">
                 
                 {/* SIDEBAR STEPS */}
                 <div className="w-1/3 bg-gray-50 p-8 border-r border-gray-100 flex flex-col justify-between hidden md:flex">
                     <div>
                         <h2 className="text-2xl font-black text-[#00665E] mb-2">Wizard</h2>
                         <p className="text-xs text-gray-400 uppercase font-bold tracking-widest mb-8">Nuova Campagna</p>
                         
                         <div className="space-y-4">
                             <div className={`p-4 rounded-xl flex items-center gap-4 transition ${step === 1 ? 'bg-white shadow-md border-l-4 border-[#00665E]' : 'opacity-50'}`}>
                                 <div className="bg-gray-100 p-2 rounded-lg"><Mail size={20}/></div>
                                 <div><h4 className="font-bold text-sm">Contenuto</h4><p className="text-xs text-gray-500">Oggetto e Testo</p></div>
                             </div>
                             <div className={`p-4 rounded-xl flex items-center gap-4 transition ${step === 2 ? 'bg-white shadow-md border-l-4 border-[#00665E]' : 'opacity-50'}`}>
                                 <div className="bg-gray-100 p-2 rounded-lg"><Users size={20}/></div>
                                 <div><h4 className="font-bold text-sm">Target</h4><p className="text-xs text-gray-500">Chi riceve la mail?</p></div>
                             </div>
                         </div>
                     </div>
                     
                     <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                         <div className="flex items-center gap-2 text-blue-800 font-bold text-xs mb-2">
                             <Sparkles size={14}/> Pro Tip
                         </div>
                         <p className="text-xs text-blue-600 leading-relaxed">
                             Usa <strong>{'{{name}}'}</strong> nel testo per inserire automaticamente il nome del cliente.
                         </p>
                     </div>
                 </div>

                 {/* MAIN CONTENT */}
                 <div className="flex-1 p-8 overflow-y-auto relative flex flex-col">
                     <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full"><AlertCircle className="rotate-45" size={24}/></button>

                     {step === 1 && (
                         <div className="animate-in slide-in-from-right">
                             <h3 className="text-2xl font-bold text-gray-900 mb-6">Scrivi il messaggio</h3>
                             
                             <div className="space-y-6">
                                 <div>
                                     <label className="text-xs font-bold text-gray-500 uppercase">Oggetto Email</label>
                                     <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Es. Tanti Auguri! 🎁" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#00665E] font-bold text-lg mt-2" />
                                 </div>
                                 <div>
                                     <label className="text-xs font-bold text-gray-500 uppercase">Corpo del messaggio</label>
                                     <textarea value={content} onChange={e => setContent(e.target.value)} className="w-full h-64 p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#00665E] mt-2 resize-none font-medium leading-relaxed" placeholder="Scrivi qui..."></textarea>
                                 </div>
                             </div>

                             <div className="mt-auto pt-8 flex justify-end">
                                 <button onClick={() => setStep(2)} disabled={!subject || !content} className="bg-[#00665E] text-white px-8 py-4 rounded-xl font-bold hover:bg-[#004d46] transition flex items-center gap-2 disabled:opacity-50">
                                     Continua <ArrowRight size={20}/>
                                 </button>
                             </div>
                         </div>
                     )}

                     {step === 2 && (
                         <div className="animate-in slide-in-from-right h-full flex flex-col">
                             <h3 className="text-2xl font-bold text-gray-900 mb-6">Definisci il Target</h3>
                             
                             {/* FILTRI SMART BUTTONS */}
                             <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                                 <FilterBtn label="Tutti" active={activeFilter === 'all'} onClick={() => applySmartFilter('all')} icon={<Users size={16}/>} />
                                 <FilterBtn label="Dormienti (>30gg)" active={activeFilter === 'dormant'} onClick={() => applySmartFilter('dormant')} icon={<Calendar size={16}/>} />
                                 <FilterBtn label="VIP (>500€)" active={activeFilter === 'vip'} onClick={() => applySmartFilter('vip')} icon={<Sparkles size={16}/>} />
                                 <FilterBtn label="Nuovi (7gg)" active={activeFilter === 'new'} onClick={() => applySmartFilter('new')} icon={<TrendingUp size={16}/>} />
                             </div>

                             {/* LISTA ANTEPRIMA */}
                             <div className="flex-1 border border-gray-200 rounded-xl overflow-hidden flex flex-col">
                                 <div className="bg-gray-50 p-3 border-b border-gray-200 text-xs font-bold text-gray-500 flex justify-between">
                                     <span>Destinatari Selezionati</span>
                                     <span>{selectedIds.length} Contatti</span>
                                 </div>
                                 <div className="flex-1 overflow-y-auto p-2 space-y-1">
                                     {selectedIds.length === 0 ? (
                                         <div className="h-full flex items-center justify-center text-gray-400 text-sm">Nessun contatto corrisponde ai filtri.</div>
                                     ) : (
                                         contacts.filter(c => selectedIds.includes(c.id)).map(c => (
                                             <div key={c.id} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-lg text-sm">
                                                 <span className="font-bold text-gray-700">{c.name}</span>
                                                 <span className="text-gray-400 text-xs">{c.email}</span>
                                             </div>
                                         ))
                                     )}
                                 </div>
                             </div>

                             <div className="mt-6 flex justify-between items-center">
                                 <button onClick={() => setStep(1)} className="text-gray-500 font-bold hover:text-gray-800">Indietro</button>
                                 <button onClick={handleSend} disabled={sending || selectedIds.length === 0} className="bg-[#00665E] text-white px-8 py-4 rounded-xl font-bold hover:bg-[#004d46] transition flex items-center gap-2 shadow-lg disabled:opacity-50">
                                     {sending ? <><Loader2 className="animate-spin"/> Invio in corso...</> : <><Send size={18}/> Invia Campagna</>}
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

// Icon Helper
import { ArrowRight } from 'lucide-react'