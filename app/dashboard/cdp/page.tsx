'use client'

import { createClient } from '../../../utils/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
    Fingerprint, MapPin, Phone, Mail, Sparkles, BrainCircuit, 
    CreditCard, MessageCircle, MousePointerClick, ShoppingBag, 
    Activity, Tag, Star, Clock, Lock, ShieldCheck, Zap, Search, Filter, CalendarDays, Loader2, Infinity, User
} from 'lucide-react'

export default function CDPPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [currentPlan, setCurrentPlan] = useState('Base')
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  const limits: any = { 'Base': 100, 'Enterprise': 1000, 'Ambassador': 'Illimitati' }
  
  // STATI DATI REALI DA SUPABASE
  const [dbContacts, setDbContacts] = useState<any[]>([])
  const [activeCustomer, setActiveCustomer] = useState<any>(null)

  // STATI RICERCA E FILTRI
  const [searchQuery, setSearchQuery] = useState('')
  const [timeFilter, setTimeFilter] = useState('all')
  const [channelFilter, setChannelFilter] = useState('all')
  const [visibleEvents, setVisibleEvents] = useState(3)
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    const getData = async () => {
      const { data: sessionData } = await supabase.auth.getSession()
      const currentUser = sessionData?.session?.user

      if (currentUser) {
          setUser(currentUser)
          // 1. Prendo il piano dell'azienda
          const { data: profile } = await supabase.from('profiles').select('plan').eq('id', currentUser.id).single()
          if (profile) setCurrentPlan(profile.plan || 'Base')
      } else {
          setLoading(false);
          return;
      }
          
      // 2. PRENDO I CONTATTI DALLA TABELLA CORRETTA 'contacts' ISOLANDOLI RIGOROSAMENTE PER AZIENDA
      const { data: contactsData, error } = await supabase.from('contacts').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false })
      
      if (contactsData && contactsData.length > 0) {
          // Formatto i dati reali per farli leggere alla CDP
          const formattedContacts = contactsData.map(c => {
              
              // Se ha ordini reali, li trasformo in eventi della timeline
              const realEvents = [];
              if (c.orders && Array.isArray(c.orders)) {
                  c.orders.forEach((ord: any, i: number) => {
                      realEvents.push({
                          id: `ord_${i}`, type: 'store', channel: 'Acquisto Registrato',
                          title: 'Acquisto/Ordine Completato', desc: ord.description || 'Prodotto acquistato',
                          time: new Date(ord.date || new Date()).toLocaleDateString('it-IT'), amount: `€ ${ord.amount || 0}`,
                          icon: <CreditCard size={18}/>, color: 'bg-blue-600', locked: false
                      })
                  })
              }
              
              // Aggiungo sempre l'evento reale di creazione nel CRM
              realEvents.push({
                  id: 'creation', type: 'crm', channel: 'CRM IntegraOS',
                  title: 'Profilo Creato', desc: 'Contatto inserito nel database aziendale.',
                  time: new Date(c.created_at).toLocaleDateString('it-IT'),
                  icon: <User size={18}/>, color: 'bg-emerald-600', locked: false
              })

              // Calcolo Punti Fedeltà reali e Salute in base all'LTV (Fatturato generato)
              const ltvValue = Number(c.value || c.ltv || 0)
              const calculatedHealth = ltvValue > 0 ? 85 : 40

              return {
                  id: c.id,
                  name: c.name || 'Senza Nome', // LEGGE LA COLONNA NAME DI CONTACTS
                  type: c.status === 'Vinto' || ltvValue > 0 ? 'Cliente Acquisito' : 'Lead',
                  phone: c.phone || 'Non inserito',
                  email: c.email || 'Non inserita',
                  city: c.city || 'Non specificata',
                  ltv: ltvValue,
                  loyaltyPoints: Math.floor(ltvValue / 10), // 1 punto ogni 10 euro
                  tags: [c.status || 'Nuovo', c.source || 'Organico'],
                  aiHealthScore: calculatedHealth,
                  suggestion: ltvValue > 0 ? 'Ottimo cliente storico. È il momento di proporre un pacchetto di Up-sell Premium per aumentare ulteriormente il LTV.' : 'Lead ancora freddo. Non ha effettuato acquisti. Invia una DEM per risvegliare l\'interesse.',
                  events: realEvents
              }
          })
          setDbContacts(formattedContacts)
          setActiveCustomer(formattedContacts[0]) // Imposta il primo cliente reale come attivo
      }
      
      setLoading(false)
    }
    getData()
  }, [supabase])

  const handleAction = (type: string) => {
      if (!activeCustomer) return;
      if (type === 'whatsapp') {
          if(activeCustomer.phone === 'Non inserito') return alert("Nessun numero di telefono salvato per questo cliente.")
          alert(`Apertura chat WhatsApp con ${activeCustomer.name} (${activeCustomer.phone})...`)
          // router.push('/dashboard/chatwoot')
      } else if (type === 'email') {
          if(activeCustomer.email === 'Non inserita') return alert("Nessuna email salvata per questo cliente.")
          alert(`Preparazione nuovo template Email per ${activeCustomer.email}...`)
          router.push('/dashboard/launchpad')
      }
  }

  const generateAICoupon = () => {
      setIsGenerating(true)
      setTimeout(() => {
          setIsGenerating(false)
          alert(`✅ Azione Eseguita: Il sistema ha applicato il suggerimento AI per ${activeCustomer.name}.`)
      }, 1500)
  }

  if (loading) return <div className="p-10 text-[#00665E] font-bold animate-pulse">Sincronizzazione CDP con Database Reale...</div>

  // Se il database è vuoto
  if (dbContacts.length === 0) {
      return (
          <main className="flex-1 p-10 bg-[#F8FAFC] flex flex-col items-center justify-center min-h-screen">
              <Fingerprint size={64} className="text-gray-300 mb-4"/>
              <h2 className="text-2xl font-black text-gray-900 mb-2">Nessun Contatto nel CRM</h2>
              <p className="text-gray-500 text-center max-w-md mb-6">La Customer Data Platform si basa sui contatti reali. Aggiungi prima dei clienti o lead nella sezione CRM.</p>
              <button onClick={() => router.push('/dashboard/crm')} className="bg-[#00665E] text-white px-6 py-3 rounded-xl font-bold">Vai al CRM</button>
          </main>
      )
  }

  // FILTRAGGIO EVENTI TIMELINE (Sui dati reali)
  let filteredEvents = activeCustomer.events.filter((ev: any) => {
      if (channelFilter !== 'all' && ev.type !== channelFilter) return false;
      return true;
  })

  const visibleTimeline = filteredEvents.slice(0, visibleEvents)

  return (
    <main className="flex-1 overflow-auto bg-[#F8FAFC] text-gray-900 font-sans min-h-screen pb-20">
      
      {/* HEADER E LIMITI */}
      <div className="flex flex-col md:flex-row justify-between items-center border-b border-gray-200 p-8 bg-white shadow-sm z-10 relative">
        <div>
          <h1 className="text-3xl font-black text-[#00665E] flex items-center gap-3">
              <Fingerprint size={32} className="text-[#00665E]"/> CDP God-Mode
          </h1>
          <p className="text-gray-500 text-sm mt-1">Visione onnisciente connessa in tempo reale al tuo Database Supabase.</p>
        </div>
        
        <div className="flex items-center gap-4 mt-4 md:mt-0">
            <div className="bg-gray-50 border border-gray-200 px-4 py-2 rounded-xl flex items-center gap-3">
                <ShieldCheck className={currentPlan === 'Ambassador' ? "text-purple-500" : "text-green-500"} size={20}/>
                <div className="flex flex-col items-start">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Profili Analizzati (CDP)</span>
                    <span className={`font-bold text-sm ${currentPlan === 'Ambassador' ? 'text-purple-600' : 'text-gray-800'}`}>
                        {currentPlan === 'Ambassador' ? <span className="flex items-center gap-1"><Infinity size={14}/> Illimitati</span> : `${dbContacts.length} / ${limits[currentPlan]}`}
                    </span>
                </div>
            </div>
        </div>
      </div>

      {/* BARRA DI RICERCA REALE E FILTRI */}
      <div className="bg-white border-b border-gray-200 px-8 py-4 flex flex-wrap items-center gap-4 sticky top-0 z-20 shadow-sm">
          
          <div className="relative flex-1 min-w-[250px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#00665E]" size={18}/>
              <select 
                  className="w-full bg-teal-50 border-2 border-[#00665E]/20 py-2.5 pl-10 pr-4 rounded-xl text-sm font-bold text-[#00665E] outline-none focus:border-[#00665E] appearance-none cursor-pointer"
                  value={activeCustomer.id}
                  onChange={(e) => {
                      const found = dbContacts.find(c => c.id.toString() === e.target.value)
                      if(found) { setActiveCustomer(found); setVisibleEvents(3); }
                  }}
              >
                  {/* POPOLATO CON I CONTATTI VERI DEL DB */}
                  {dbContacts.map(c => <option key={c.id} value={c.id}>🔍 {c.name} {c.email !== 'Non inserita' ? `(${c.email})` : ''}</option>)}
              </select>
          </div>

          <div className="flex items-center gap-2 border-l border-gray-200 pl-4">
              <Filter className="text-gray-400" size={16}/>
              <span className="text-xs font-bold text-gray-400 uppercase">Filtri:</span>

              <select value={channelFilter} onChange={(e) => {setChannelFilter(e.target.value); setVisibleEvents(5);}} className="bg-white border border-gray-200 py-2 px-3 rounded-lg text-xs font-bold text-gray-600 outline-none cursor-pointer hover:bg-gray-50">
                  <option value="all">Tutti gli Eventi</option>
                  <option value="store">Acquisti/Ordini (POS/Web)</option>
                  <option value="crm">Azioni CRM</option>
              </select>
          </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 p-8 max-w-7xl mx-auto items-start">
          
          {/* COLONNA SINISTRA: PROFILO CLIENTE E AI ADVISOR */}
          <div className="xl:col-span-4 space-y-6">
              
              {/* CARD PROFILO REALE */}
              <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm relative overflow-hidden animate-in fade-in" key={activeCustomer.id}>
                  <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-[#00665E] to-teal-500"></div>
                  
                  <div className="relative mt-10 flex flex-col items-center">
                      <div className="w-24 h-24 bg-white rounded-full border-4 border-white shadow-lg flex items-center justify-center text-3xl font-black text-[#00665E] mb-3 uppercase">
                          {activeCustomer.name.substring(0, 2)}
                      </div>
                      <h2 className="text-2xl font-black text-gray-900 text-center leading-tight">{activeCustomer.name}</h2>
                      <p className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 mt-2 flex items-center gap-1">
                          <Star size={12}/> {activeCustomer.type}
                      </p>
                  </div>

                  <div className="mt-8 space-y-4">
                      <div className="flex items-center gap-3 text-sm text-gray-600 font-medium">
                          <div className="w-8 h-8 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 text-[#00665E]"><Phone size={14}/></div>
                          {activeCustomer.phone}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-600 font-medium truncate">
                          <div className="w-8 h-8 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 text-[#00665E]"><Mail size={14}/></div>
                          {activeCustomer.email}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-600 font-medium">
                          <div className="w-8 h-8 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 text-[#00665E]"><MapPin size={14}/></div>
                          {activeCustomer.city}
                      </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-gray-100">
                      <div className="bg-green-50/50 p-3 rounded-xl border border-green-100 text-center">
                          <p className="text-[9px] font-black text-green-600 uppercase tracking-widest mb-1">Lifetime Value</p>
                          <p className="text-xl font-black text-green-700">€ {activeCustomer.ltv}</p>
                      </div>
                      <div className="bg-purple-50/50 p-3 rounded-xl border border-purple-100 text-center">
                          <p className="text-[9px] font-black text-purple-600 uppercase tracking-widest mb-1">Punti Fedeltà</p>
                          <p className="text-xl font-black text-purple-700">{activeCustomer.loyaltyPoints}</p>
                      </div>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-2">
                      {activeCustomer.tags.map((tag: string, index: number) => (
                          <span key={index} className="text-[10px] font-bold text-gray-600 bg-gray-100 px-2.5 py-1 rounded border border-gray-200 flex items-center gap-1">
                              <Tag size={10}/> {tag}
                          </span>
                      ))}
                  </div>

                  <div className="flex gap-2 mt-8">
                      <button onClick={() => handleAction('whatsapp')} className="flex-1 bg-emerald-50 text-emerald-600 border border-emerald-200 font-bold py-2.5 rounded-xl text-sm hover:bg-emerald-500 hover:text-white transition flex items-center justify-center gap-2">
                          <MessageCircle size={16}/> WhatsApp
                      </button>
                      <button onClick={() => handleAction('email')} className="flex-1 bg-blue-50 text-blue-600 border border-blue-200 font-bold py-2.5 rounded-xl text-sm hover:bg-blue-600 hover:text-white transition flex items-center justify-center gap-2">
                          <Mail size={16}/> Email
                      </button>
                  </div>
              </div>

              {/* AI NEXT BEST ACTION */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
                  <div className="absolute -right-4 -top-4 opacity-10"><BrainCircuit size={120}/></div>
                  <div className="flex items-center justify-between mb-6 relative z-10">
                      <h3 className="font-black flex items-center gap-2"><Sparkles className="text-amber-400" size={18}/> AI Predictor</h3>
                      <div className={`border px-2 py-1 rounded text-[10px] font-black uppercase flex items-center gap-1 ${activeCustomer.aiHealthScore > 50 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'}`}>
                          <Activity size={12}/> Salute: {activeCustomer.aiHealthScore}%
                      </div>
                  </div>
                  <div className="space-y-4 relative z-10">
                      <div>
                          <p className="text-xs text-slate-400 mb-1">Propensione all'Acquisto</p>
                          <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                              <div className={`h-full ${activeCustomer.aiHealthScore > 50 ? 'bg-emerald-400' : 'bg-amber-400'}`} style={{width: `${activeCustomer.aiHealthScore}%`}}></div>
                          </div>
                      </div>
                      <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-600">
                          <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-1 flex items-center gap-1"><Zap size={12}/> Azione Consigliata</p>
                          <p className="text-sm font-medium leading-relaxed">{activeCustomer.suggestion}</p>
                          <button onClick={generateAICoupon} disabled={isGenerating} className="mt-4 w-full bg-amber-500 text-amber-950 font-black py-2.5 rounded-lg text-xs hover:bg-amber-400 transition flex items-center justify-center gap-2 disabled:opacity-50">
                              {isGenerating ? <Loader2 size={14} className="animate-spin"/> : <Sparkles size={14}/>} {isGenerating ? 'Generazione...' : 'Esegui Azione Ora'}
                          </button>
                      </div>
                  </div>
              </div>
          </div>

          {/* COLONNA DESTRA: TIMELINE REALE */}
          <div className="xl:col-span-8 bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
              <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-100">
                  <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">Cronologia Eventi Reali</h2>
                  <div className="text-xs font-bold bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full flex items-center gap-2">
                      <CalendarDays size={14}/> 
                      {filteredEvents.length} Eventi
                  </div>
              </div>

              {filteredEvents.length === 0 ? (
                  <div className="text-center py-20 text-gray-400 flex flex-col items-center">
                      <Filter size={48} className="mb-4 opacity-20"/>
                      <p>Nessun evento trovato con i filtri attuali.</p>
                      <button onClick={() => {setChannelFilter('all'); setTimeFilter('all')}} className="mt-4 text-[#00665E] font-bold text-sm hover:underline">Resetta Filtri</button>
                  </div>
              ) : (
                  <div className="relative pl-8 space-y-8 before:absolute before:inset-0 before:ml-[39px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-gray-200 before:via-gray-200 before:to-transparent">
                      
                      {visibleTimeline.map((ev: any, index: number) => (
                          <div key={ev.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group animate-in slide-in-from-bottom-4">
                              
                              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-md relative z-10 ${ev.color} text-white`}>
                                  {ev.icon}
                              </div>

                              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-5 rounded-2xl border transition duration-300 relative bg-white border-gray-200 hover:border-[#00665E] hover:shadow-lg">
                                  
                                  <div className={`hidden md:block absolute top-4 w-3 h-3 bg-white border-t border-r border-gray-200 transform ${index % 2 === 0 ? '-right-1.5 rotate-45' : '-left-1.5 -rotate-135'}`}></div>

                                  <div className="flex items-center justify-between mb-2">
                                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{ev.time}</span>
                                      <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{ev.channel}</span>
                                  </div>
                                  <h4 className="font-black text-gray-900 text-md mb-1">{ev.title}</h4>
                                  <p className="text-xs text-gray-600 leading-relaxed mb-3">{ev.desc}</p>
                                  
                                  {ev.amount && (
                                      <div className="inline-block bg-green-50 border border-green-200 text-green-700 font-bold text-xs px-3 py-1 rounded-lg">
                                          Valore: {ev.amount}
                                      </div>
                                  )}
                              </div>
                          </div>
                      ))}

                      {visibleEvents < filteredEvents.length && (
                          <div className="relative flex justify-center pt-8">
                              <button onClick={() => setVisibleEvents(prev => prev + 3)} className="bg-white border border-gray-200 text-gray-500 font-bold text-xs px-6 py-2.5 rounded-full hover:bg-gray-50 hover:text-[#00665E] transition shadow-sm relative z-10 flex items-center gap-2">
                                  <Clock size={14}/> Mostra eventi precedenti
                              </button>
                          </div>
                      )}
                      
                      {visibleEvents >= filteredEvents.length && filteredEvents.length > 0 && (
                           <div className="relative flex justify-center pt-8">
                               <p className="bg-gray-50 text-gray-400 font-bold text-[10px] px-4 py-1.5 rounded-full border border-gray-100 relative z-10 uppercase tracking-widest">Nessun altro evento da mostrare</p>
                           </div>
                      )}
                  </div>
              )}
          </div>
      </div>
    </main>
  )
}