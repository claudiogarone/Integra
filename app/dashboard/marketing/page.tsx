'use client'

import { createClient } from '../../../utils/supabase/client'
import { useEffect, useState } from 'react'
import { 
  Megaphone, Mail, Users, TrendingUp, Calendar, Send, Plus, Loader2, 
  Sparkles, CheckSquare, Square, X, Clock, ShoppingBag, ArrowRight, 
  ShieldAlert, Eye, MousePointerClick, Activity, RotateCcw
} from 'lucide-react'
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer 
} from 'recharts'

export default function MarketingPage() {
  const [user, setUser] = useState<any>(null)
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [contacts, setContacts] = useState<any[]>([])
  const [ecommerceProducts, setEcommerceProducts] = useState<any[]>([]) 
  const [loading, setLoading] = useState(true)
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [step, setStep] = useState(1) 
  const [viewCampaign, setViewCampaign] = useState<any>(null)

  const [subject, setSubject] = useState('')
  const [content, setContent] = useState('Ciao {{name}},\n\nAbbiamo delle novità fantastiche pensate apposta per te...')
  const [scheduleDate, setScheduleDate] = useState('') 
  
  const [selectedCatalogProducts, setSelectedCatalogProducts] = useState<any[]>([]) 
  const [customProduct, setCustomProduct] = useState({ name: '', price: '', url: '' }) 
  const [legalConsent, setLegalConsent] = useState(false) 
  
  // NOVITÀ: Stato per memorizzare le info dell'azienda
  const [companyInfo, setCompanyInfo] = useState({ name: 'Azienda', logo: '' })
  
  const [selectedIds, setSelectedIds] = useState<string[]>([]) 
  const [filteredContacts, setFilteredContacts] = useState<any[]>([]) 
  const [activeFilter, setActiveFilter] = useState<'all' | 'dormant' | 'vip' | 'new' | 'engaged' | 'retarget'>('all')
  const [retargetCampaignId, setRetargetCampaignId] = useState<string>('')
  
  const [sending, setSending] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      // FIX: Abbiamo sostituito 'dev-user-id' con un UUID valido pieno di zeri. 
      // Così il database lo accetta senza andare in errore di sintassi.
      const currentUser = user || { id: '00000000-0000-0000-0000-000000000000', email: 'admin@integraos.it' }
      setUser(currentUser)
      
      // NOVITÀ: Recupero info azienda (logo e nome) dal profilo
      const { data: profile } = await supabase.from('profiles').select('company_name, logo_url').eq('id', currentUser.id).single()
      if (profile) {
          setCompanyInfo({
              name: profile.company_name || 'La Tua Azienda',
              logo: profile.logo_url || ''
          })
      }

      await Promise.all([
          fetchCampaigns(),
          fetchContacts(),
          fetchProducts()
      ])
      
      setLoading(false)
    }
    
    getData();
    // Imposta un timer per ricaricare le statistiche ogni 15 secondi
    const interval = setInterval(() => fetchCampaigns(), 15000);
    return () => clearInterval(interval);
  }, [])

  const fetchCampaigns = async () => {
      const { data } = await supabase.from('campaigns').select('*').order('created_at', { ascending: false })
      if(data) setCampaigns(data)
  }

  const fetchContacts = async () => {
      const { data } = await supabase.from('contacts').select('*')
      if(data) { setContacts(data); setFilteredContacts(data); }
  }

  const fetchProducts = async () => {
      const { data } = await supabase.from('products').select('*').neq('is_deleted', true).order('created_at', { ascending: false })
      if(data) setEcommerceProducts(data)
  }

  const applySmartFilter = (type: 'all' | 'dormant' | 'vip' | 'new' | 'engaged') => {
      setActiveFilter(type)
      setRetargetCampaignId('') 
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
          case 'vip': result = contacts.filter(c => (Number(c.value) || Number(c.ltv) || 0) > 500); break;
          case 'new': 
               result = contacts.filter(c => {
                  const createDate = new Date(c.created_at)
                  const diffDays = Math.ceil(Math.abs(now.getTime() - createDate.getTime()) / (1000 * 60 * 60 * 24))
                  return diffDays <= 14
              }); break;
          case 'engaged':
               result = contacts.filter(c => c.email && c.email.includes('@') && (Number(c.value) || Number(c.ltv) || 0) > 0); break;
      }
      setFilteredContacts(result)
      setSelectedIds(result.map(c => c.id))
      if(type !== 'all' && result.length === 0) alert("Nessun contatto corrisponde a questo filtro al momento.")
  }

  const handleRetargeting = (campaignId: string) => {
      setRetargetCampaignId(campaignId);
      setActiveFilter('retarget');
      
      if (!campaignId) { applySmartFilter('all'); return; }

      const camp = campaigns.find(c => c.id === campaignId);
      if (camp && camp.recipients_details) {
          const sentEmails = camp.recipients_details.map((r: any) => r.email);
          const result = contacts.filter(c => sentEmails.includes(c.email));
          setFilteredContacts(result);
          setSelectedIds(result.map(c => c.id));
          if(result.length === 0) alert("Nessun contatto utile trovato.");
      }
  }

  const toggleContact = (id: string) => {
      selectedIds.includes(id) ? setSelectedIds(selectedIds.filter(i => i !== id)) : setSelectedIds([...selectedIds, id])
  }

  const toggleSelectVisible = () => {
      const visibleIds = filteredContacts.map(c => c.id)
      const allSelected = visibleIds.every(id => selectedIds.includes(id))
      if (allSelected) setSelectedIds(selectedIds.filter(id => !visibleIds.includes(id)))
      else setSelectedIds(Array.from(new Set([...selectedIds, ...visibleIds])))
  }

  const toggleCatalogProduct = (product: any) => {
      const exists = selectedCatalogProducts.find(p => p.id === product.id)
      if (exists) setSelectedCatalogProducts(selectedCatalogProducts.filter(p => p.id !== product.id))
      else setSelectedCatalogProducts([...selectedCatalogProducts, product])
  }

  const handleSelectAllProducts = () => {
      if (selectedCatalogProducts.length === ecommerceProducts.length) setSelectedCatalogProducts([]) 
      else setSelectedCatalogProducts([...ecommerceProducts]) 
  }

  const handleSend = async () => {
      if(!legalConsent) return alert("Devi accettare le responsabilità legali prima di inviare.")
      if(selectedIds.length === 0) return alert("Seleziona almeno un destinatario dalla lista.")
      
      setSending(true)
      
      const targets = contacts.filter(c => selectedIds.includes(c.id))
      const validTargets = targets.filter(t => t.email && t.email.includes('@') && t.email !== 'Non inserita') 

      if(validTargets.length === 0) { 
          setSending(false); 
          return alert("Nessuna email valida trovata nei contatti selezionati.") 
      }

      // Questo è il testo che si salva nel Database (Come storico)
      let finalContent = content;
      if (selectedCatalogProducts.length > 0 || customProduct.name) {
          finalContent += `\n\n🛍️ --- IN VETRINA PER TE --- 🛍️\n`;
          selectedCatalogProducts.forEach(p => {
              finalContent += `\n📌 ${p.name} - Solo €${p.price}\nScopri di più sul nostro store!`;
          });
          if (customProduct.name) {
              finalContent += `\n\n📌 OFFERTA SPECIALE: ${customProduct.name} - €${customProduct.price}\nLink: ${customProduct.url}`;
          }
      }

      const metaInfo = {
          scheduled_for: scheduleDate || 'Subito',
          products_attached: selectedCatalogProducts.map(p => p.id),
          custom_offer: customProduct.name ? customProduct : null,
          retarget_from: retargetCampaignId || null
      }

      // 1. SALVA CAMPAGNA NEL DB (Per generare l'ID)
      const { data: campaign, error } = await supabase.from('campaigns').insert({
          user_id: user.id, 
          title: subject, 
          content: finalContent, 
          status: scheduleDate ? 'Programmata' : 'Inviata',
          sent_count: validTargets.length, 
          opened_count: 0,
          clicked_count: 0,
          recipients_details: validTargets.map(t => ({ email: t.email, name: t.name })),
          target_filters: { filter: activeFilter, meta: metaInfo }
      }).select().single()

      if(error) { setSending(false); return alert("Errore DB: " + error.message); }

      // 2. INVIA ALL'API PASSANDO I PRODOTTI E LE INFO AZIENDA
      try {
          const res = await fetch('/api/send-marketing', {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({ 
                  subject, 
                  content: content, // Qui passiamo il testo "Puro" iniziale
                  recipients: validTargets,
                  campaign_id: campaign.id,
                  catalog_products: selectedCatalogProducts, 
                  custom_product: customProduct.name ? customProduct : null,
                  company_name: companyInfo.name,      // Passiamo il nome azienda all'API
                  company_logo: companyInfo.logo       // Passiamo il logo azienda all'API
              })
          })
          
          if(res.ok) {
              const resData = await res.json();
              if (scheduleDate) alert(`📅 Campagna programmata per il ${new Date(scheduleDate).toLocaleString()}`);
              else if (resData.failed > 0) alert(`⚠️ ${resData.sent} inviate, ma ${resData.failed} bloccate (email non verificate in Sandbox).`);
              else alert(`✅ Campagna inviata con successo! Le statistiche di apertura si aggiorneranno in tempo reale.`);
              
              setCampaigns([campaign, ...campaigns])
              setIsModalOpen(false)
              setSubject(''); setContent('Ciao {{name}},\n\n...'); setScheduleDate(''); 
              setSelectedCatalogProducts([]); setCustomProduct({name: '', price: '', url: ''}); 
              setLegalConsent(false); setRetargetCampaignId('');
          } else {
              throw new Error("Errore API server email");
          }
      } catch (e: any) {
          alert("Errore tecnico invio: " + e.message)
      }
      setSending(false)
  }

  if (loading) return <div className="p-10 text-[#00665E] animate-pulse font-bold">Inizializzazione Marketing e Dati...</div>

  // --- DATI REALI PER IL GRAFICO E I KPI ---
  const chartData = campaigns.slice(0, 7).reverse().map(c => {
      const date = new Date(c.created_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
      return {
          name: date,
          inviate: c.sent_count || 0,
          aperte: c.opened_count || 0,
          cliccate: c.clicked_count || 0,
          title: c.title
      }
  })

  const totalSent = campaigns.reduce((acc, c) => acc + (c.sent_count || 0), 0);
  const totalOpened = campaigns.reduce((acc, c) => acc + (c.opened_count || 0), 0);
  const averageOpenRate = totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) + "%" : "0%";

  return (
    <main className="flex-1 p-8 overflow-auto bg-[#F8FAFC] min-h-screen pb-20 font-sans">
      
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-3xl font-black text-[#00665E] flex items-center gap-3">
              <Megaphone size={28}/> Marketing Hub & Analisi
          </h1>
          <p className="text-gray-500 text-sm mt-1 font-medium">Invio campagne, integrazione e-commerce e tracciamento in tempo reale.</p>
        </div>
        <button onClick={() => { setIsModalOpen(true); setStep(1); setSelectedIds([]); setActiveFilter('all'); setFilteredContacts(contacts); setScheduleDate(''); setSelectedCatalogProducts([]); setCustomProduct({name:'', price:'', url:''}); setLegalConsent(false); setRetargetCampaignId(''); }} className="bg-[#00665E] text-white px-6 py-3.5 rounded-xl font-bold hover:bg-[#004d46] shadow-[0_10px_20px_rgba(0,102,94,0.2)] flex items-center gap-2 transition transform hover:scale-[1.02]">
           <Plus size={20}/> Crea Nuova Campagna
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* SINISTRA: LISTA CAMPAGNE (DATI REALI) */}
          <div className="lg:col-span-4 space-y-6 flex flex-col max-h-[75vh] overflow-hidden">
             <div className="bg-white rounded-3xl border border-gray-200 shadow-sm flex-1 overflow-y-auto p-5 custom-scrollbar">
                 <h3 className="text-sm font-black text-gray-800 mb-4 flex items-center gap-2 pb-2 border-b border-gray-50"><Send size={16}/> Cronologia & Statistiche</h3>
                 {campaigns.length === 0 && <p className="text-center py-10 text-gray-400 text-sm italic">Nessuna campagna creata.</p>}
                 {campaigns.map((camp) => {
                     // Calcoli REALI basati sul database
                     const opens = camp.opened_count || 0;
                     const clicks = camp.clicked_count || 0;
                     const openRate = camp.sent_count > 0 ? Math.floor((opens / camp.sent_count) * 100) : 0;
                     const clickRate = opens > 0 ? Math.floor((clicks / opens) * 100) : 0;

                     return (
                     <div key={camp.id} onClick={() => setViewCampaign(camp)} className="p-4 mb-3 border border-gray-100 hover:border-blue-300 bg-gray-50/50 hover:bg-blue-50/50 transition cursor-pointer group rounded-2xl">
                         <div className="flex justify-between items-start mb-2">
                             <h4 className="font-bold text-gray-900 line-clamp-1 group-hover:text-blue-700">{camp.title}</h4>
                         </div>
                         <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 mb-3">
                             <span>{new Date(camp.created_at).toLocaleDateString('it-IT')}</span>
                             <span className={`uppercase tracking-widest px-2 py-0.5 rounded border ${camp.status === 'Programmata' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-green-50 text-green-600 border-green-100'}`}>{camp.status}</span>
                         </div>
                         
                         {camp.status !== 'Programmata' && (
                             <div className="grid grid-cols-3 gap-2 mt-2 pt-3 border-t border-gray-100/50">
                                 <div className="text-center bg-white rounded-lg p-1.5 shadow-sm border border-gray-100" title="Totale Destinatari">
                                     <div className="flex items-center justify-center gap-1 text-gray-500 mb-0.5"><Users size={10}/></div>
                                     <p className="font-black text-gray-800">{camp.sent_count}</p>
                                 </div>
                                 <div className="text-center bg-emerald-50 rounded-lg p-1.5 border border-emerald-100" title="Tasso di Apertura Reale">
                                     <div className="flex items-center justify-center gap-1 text-emerald-600 mb-0.5"><Eye size={10}/></div>
                                     <p className="font-black text-emerald-700">{openRate}%</p>
                                 </div>
                                 <div className="text-center bg-blue-50 rounded-lg p-1.5 border border-blue-100" title="Tasso di Click Reale">
                                     <div className="flex items-center justify-center gap-1 text-blue-600 mb-0.5"><MousePointerClick size={10}/></div>
                                     <p className="font-black text-blue-700">{clickRate}%</p>
                                 </div>
                             </div>
                         )}
                     </div>
                 )})}
             </div>
          </div>

          {/* DESTRA: DASHBOARD ANALITICA E GRAFICO */}
          <div className="lg:col-span-8 flex flex-col gap-6">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm flex items-center gap-4">
                      <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl"><Send size={24}/></div>
                      <div>
                          <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Totale Inviate</p>
                          <h3 className="text-3xl font-black text-gray-900">{totalSent.toLocaleString()}</h3>
                      </div>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm flex items-center gap-4">
                      <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl"><Eye size={24}/></div>
                      <div>
                          <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Tasso Apertura Reale</p>
                          <h3 className="text-3xl font-black text-emerald-600">{averageOpenRate}</h3>
                      </div>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm flex items-center gap-4">
                      <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl"><Activity size={24}/></div>
                      <div>
                          <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Clienti Attivi nel CRM</p>
                          <h3 className="text-3xl font-black text-amber-600">{contacts.filter(c => (Number(c.value)||0) > 0).length}</h3>
                      </div>
                  </div>
              </div>

              {/* Grafico Performance */}
              <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm flex-1 flex flex-col min-h-[400px]">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="font-black text-gray-800 flex items-center gap-2"><TrendingUp className="text-[#00665E]"/> Metriche Letture Reali</h3>
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full flex items-center gap-1">
                          <Activity size={12}/> Live Tracking
                      </span>
                  </div>
                  
                  {chartData.length > 0 ? (
                      <div className="w-full flex-1">
                          <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                  <defs>
                                      <linearGradient id="colorAperte" x1="0" y1="0" x2="0" y2="1">
                                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                                          <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                                      </linearGradient>
                                      <linearGradient id="colorCliccate" x1="0" y1="0" x2="0" y2="1">
                                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                                      </linearGradient>
                                  </defs>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748B', fontWeight: 600}} dy={10} />
                                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748B', fontWeight: 600}} />
                                  <RechartsTooltip 
                                      contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontWeight: 'bold'}}
                                      labelStyle={{color: '#94A3B8', fontSize: '10px', textTransform: 'uppercase'}}
                                  />
                                  <Area type="monotone" name="Email Aperte (Reali)" dataKey="aperte" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorAperte)" />
                                  <Area type="monotone" name="Click ai Link" dataKey="cliccate" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorCliccate)" />
                              </AreaChart>
                          </ResponsiveContainer>
                      </div>
                  ) : (
                      <div className="flex-1 flex flex-col items-center justify-center opacity-40">
                          <Activity size={48} className="mb-4 text-gray-400"/>
                          <p className="font-bold text-gray-500">Nessun dato sufficiente per il grafico.</p>
                      </div>
                  )}
              </div>
          </div>
      </div>

      {/* --- MODALE DETTAGLIO CAMPAGNA E WIZARD (Rimasti identici per non farti perdere nulla) --- */}
      {viewCampaign && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
              <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95">
                  <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                      <div>
                          <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">{viewCampaign.title}</h3>
                          <p className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1 mt-1"><Clock size={12}/> Inviata il {new Date(viewCampaign.created_at).toLocaleString('it-IT')}</p>
                      </div>
                      <button onClick={() => setViewCampaign(null)} className="text-gray-400 hover:text-gray-900 bg-gray-200 rounded-full p-2"><X size={16}/></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
                      <div className="bg-white p-6 rounded-2xl border border-gray-200 mb-8 shadow-sm">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 border-b border-gray-100 pb-2">Contenuto Inviato</p>
                          <p className="text-sm text-gray-800 whitespace-pre-wrap font-medium leading-relaxed">{viewCampaign.content}</p>
                      </div>
                      
                      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                          <h4 className="font-black text-sm text-gray-900 mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
                              <Users size={16} className="text-[#00665E]"/> Destinatari ({viewCampaign.sent_count})
                          </h4>
                          <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                              {viewCampaign.recipients_details && viewCampaign.recipients_details.map((r: any, i: number) => (
                                  <span key={i} className="text-[10px] font-bold bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg text-gray-600 shadow-sm flex items-center gap-1">
                                      <Mail size={10}/> {r.email}
                                  </span>
                              ))}
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* MODALE WIZARD CREAZIONE */}
      {isModalOpen && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
             <div className="bg-white rounded-3xl w-full max-w-6xl h-[95vh] shadow-2xl flex overflow-hidden animate-in zoom-in-95">
                 
                 <div className="w-1/4 bg-gray-50 p-8 border-r border-gray-100 flex-col justify-between hidden md:flex shrink-0">
                     <div>
                         <h2 className="text-2xl font-black text-[#00665E] mb-8">Composer</h2>
                         <div className="space-y-4">
                             <div className={`p-4 rounded-xl flex items-center gap-4 transition ${step === 1 ? 'bg-white shadow-sm border-l-4 border-[#00665E] text-gray-900' : 'opacity-40 text-gray-500'}`}><Mail size={20}/><h4 className="font-bold text-sm">1. Messaggio</h4></div>
                             <div className={`p-4 rounded-xl flex items-center gap-4 transition ${step === 2 ? 'bg-white shadow-sm border-l-4 border-[#00665E] text-gray-900' : 'opacity-40 text-gray-500'}`}><Users size={20}/><h4 className="font-bold text-sm">2. Target Audience</h4></div>
                             <div className={`p-4 rounded-xl flex items-center gap-4 transition ${step === 3 ? 'bg-white shadow-sm border-l-4 border-[#00665E] text-gray-900' : 'opacity-40 text-gray-500'}`}><ShoppingBag size={20}/><h4 className="font-bold text-sm">3. E-commerce & Invio</h4></div>
                         </div>
                     </div>
                 </div>

                 <div className="flex-1 p-8 overflow-y-auto custom-scrollbar relative flex flex-col">
                     <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-rose-500 bg-gray-100 p-2 rounded-full z-10 transition"><X size={16}/></button>

                     {step === 1 && (
                         <div className="animate-in slide-in-from-right flex-1 flex flex-col pt-4">
                             <h3 className="text-2xl font-black text-gray-900 mb-2">Componi la tua Email</h3>
                             <p className="text-gray-500 text-sm mb-6 font-medium">Usa <code className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-bold border border-blue-100">{"{{name}}"}</code> per personalizzare la mail.</p>
                             <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1 block ml-1">Oggetto</label>
                             <input type="text" placeholder="Es: Abbiamo una sorpresa per te..." value={subject} onChange={e => setSubject(e.target.value)} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl mb-6 font-bold text-lg outline-none focus:border-[#00665E] focus:bg-white transition" />
                             <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1 block ml-1">Messaggio Principale</label>
                             <textarea value={content} onChange={e => setContent(e.target.value)} className="w-full flex-1 p-4 bg-gray-50 border border-gray-200 rounded-xl resize-none outline-none focus:border-[#00665E] focus:bg-white font-medium text-gray-800 leading-relaxed transition"></textarea>
                             <div className="mt-8 flex justify-end">
                                 <button onClick={() => setStep(2)} disabled={!subject || !content} className="bg-[#00665E] text-white px-8 py-4 rounded-xl font-black hover:bg-[#004d46] transition disabled:opacity-50 shadow-[0_10px_20px_rgba(0,102,94,0.2)] flex items-center gap-2">Seleziona Destinatari <ArrowRight size={18}/></button>
                             </div>
                         </div>
                     )}

                     {step === 2 && (
                         <div className="animate-in slide-in-from-right h-full flex flex-col pt-4">
                             <h3 className="text-2xl font-black text-gray-900 mb-2">A chi vogliamo scrivere?</h3>
                             <p className="text-gray-500 text-sm mb-6 font-medium">Scegli i destinatari filtrando il tuo database CRM.</p>
                             
                             <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                                 <FilterBtn label="Tutti" active={activeFilter === 'all'} onClick={() => applySmartFilter('all')} icon={<Users size={16}/>} />
                                 <FilterBtn label="Nuovi" active={activeFilter === 'new'} onClick={() => applySmartFilter('new')} icon={<TrendingUp size={16}/>} />
                                 <FilterBtn label="VIP (>500€)" active={activeFilter === 'vip'} onClick={() => applySmartFilter('vip')} icon={<Sparkles size={16}/>} />
                                 <FilterBtn label="Dormienti" active={activeFilter === 'dormant'} onClick={() => applySmartFilter('dormant')} icon={<Calendar size={16}/>} />
                                 <FilterBtn label="Attivi (Engaged)" active={activeFilter === 'engaged'} onClick={() => applySmartFilter('engaged')} icon={<Activity size={16}/>} />
                             </div>

                             <div className="mb-6 bg-purple-50 border border-purple-100 p-4 rounded-xl">
                                 <label className="text-[10px] font-black uppercase text-purple-800 flex items-center gap-1 mb-2"><RotateCcw size={12}/> Retargeting Avanzato</label>
                                 <select value={retargetCampaignId} onChange={(e) => handleRetargeting(e.target.value)} className="w-full p-3 rounded-lg border border-purple-200 text-sm font-bold text-purple-900 outline-none cursor-pointer">
                                     <option value="">-- Seleziona una campagna precedente a cui fare retargeting --</option>
                                     {campaigns.map(camp => (
                                         <option key={camp.id} value={camp.id}>Invia a chi era in target con: "{camp.title}" ({new Date(camp.created_at).toLocaleDateString()})</option>
                                     ))}
                                 </select>
                             </div>

                             <div className="flex-1 border border-gray-200 rounded-2xl overflow-hidden flex flex-col bg-white shadow-sm min-h-[250px]">
                                 <div className="bg-gray-50 p-4 border-b border-gray-200 text-xs font-bold text-gray-500 flex justify-between items-center">
                                     <button onClick={toggleSelectVisible} className="flex items-center gap-2 hover:text-[#00665E] transition bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm"><CheckSquare size={16}/> Inverti Selezione</button>
                                     <span className="bg-[#00665E] text-white px-3 py-1.5 rounded-lg shadow-sm font-black">{selectedIds.length} Contatti Scelti</span>
                                 </div>
                                 <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar bg-slate-50/30">
                                     {filteredContacts.map(c => {
                                         const hasEmail = c.email && c.email.includes('@') && c.email !== 'Non inserita';
                                         return (
                                             <div key={c.id} onClick={() => hasEmail && toggleContact(c.id)} className={`flex justify-between items-center p-3 rounded-xl text-sm transition select-none border ${!hasEmail ? 'opacity-40 cursor-not-allowed bg-gray-100' : selectedIds.includes(c.id) ? 'bg-[#00665E]/5 border-[#00665E]/30 cursor-pointer' : 'bg-white hover:border-[#00665E]/30 border-gray-200 cursor-pointer shadow-sm'}`}>
                                                 <div className="flex items-center gap-4">
                                                     {selectedIds.includes(c.id) ? <CheckSquare size={20} fill="#00665E" className="text-white"/> : <Square size={20} className="text-gray-300"/>}
                                                     <div><span className="font-black text-gray-800 block">{c.name}</span><span className="text-gray-500 text-xs font-medium">{hasEmail ? c.email : 'Nessuna email salvata'}</span></div>
                                                 </div>
                                                 <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-1 rounded border border-gray-200 uppercase">{c.status || 'Lead'}</span>
                                             </div>
                                         )
                                     })}
                                 </div>
                             </div>
                             <div className="mt-8 flex justify-between items-center shrink-0">
                                 <button onClick={() => setStep(1)} className="text-gray-600 font-bold bg-gray-100 px-8 py-4 rounded-xl hover:bg-gray-200 transition">← Indietro</button>
                                 <button onClick={() => setStep(3)} disabled={selectedIds.length === 0} className="bg-[#00665E] text-white px-8 py-4 rounded-xl font-black hover:bg-[#004d46] transition disabled:opacity-50 shadow-[0_10px_20px_rgba(0,102,94,0.2)] flex items-center gap-2">Configura Offerte <ArrowRight size={18}/></button>
                             </div>
                         </div>
                     )}

                     {step === 3 && (
                         <div className="animate-in slide-in-from-right h-full flex flex-col pt-4">
                             <h3 className="text-2xl font-black text-gray-900 mb-6">Offerte & Invio</h3>
                             
                             <div className="space-y-6 flex-1 overflow-y-auto custom-scrollbar pr-2">
                                 <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
                                     <div className="flex justify-between items-end mb-4">
                                         <div>
                                            <h4 className="font-black text-blue-900 flex items-center gap-2 mb-1"><ShoppingBag size={18}/> Scegli Prodotti dal Catalogo</h4>
                                            <p className="text-xs text-blue-700 font-medium">Seleziona i prodotti dal tuo E-commerce da spingere in questa campagna.</p>
                                         </div>
                                         <div className="flex items-center gap-3">
                                             <button onClick={handleSelectAllProducts} className="text-[10px] font-bold bg-white text-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition shadow-sm">
                                                 {selectedCatalogProducts.length === ecommerceProducts.length && ecommerceProducts.length > 0 ? 'Deseleziona Tutti' : 'Seleziona Tutti'}
                                             </button>
                                             <span className="text-xs font-bold bg-blue-600 text-white px-3 py-1.5 rounded-lg shadow-sm">{selectedCatalogProducts.length} Selezionati</span>
                                         </div>
                                     </div>
                                     
                                     {ecommerceProducts.length === 0 ? (
                                         <div className="text-center p-6 bg-white rounded-xl border border-blue-100 text-blue-400 text-sm font-bold">Il tuo catalogo E-commerce è vuoto.</div>
                                     ) : (
                                         <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar snap-x">
                                             {ecommerceProducts.map(prod => {
                                                 const isSelected = selectedCatalogProducts.some(p => p.id === prod.id);
                                                 return (
                                                     <div key={prod.id} onClick={() => toggleCatalogProduct(prod)} className={`min-w-[180px] w-48 bg-white border-2 rounded-xl p-3 cursor-pointer transition snap-start relative overflow-hidden group ${isSelected ? 'border-blue-500 shadow-md' : 'border-transparent shadow-sm hover:border-blue-200'}`}>
                                                         {isSelected && <div className="absolute top-2 right-2 bg-blue-500 text-white p-1 rounded-md z-10"><CheckSquare size={14}/></div>}
                                                         <div className="h-24 bg-gray-100 rounded-lg mb-3 overflow-hidden relative">
                                                             <img src={prod.image_url} alt={prod.name} className={`w-full h-full object-cover transition ${isSelected ? 'scale-105' : 'group-hover:scale-105'}`}/>
                                                             {isSelected && <div className="absolute inset-0 bg-blue-500/20"></div>}
                                                         </div>
                                                         <p className="font-bold text-gray-900 text-xs line-clamp-1">{prod.name}</p>
                                                         <p className="font-black text-blue-600 text-sm mt-1">€ {prod.price}</p>
                                                     </div>
                                                 )
                                             })}
                                         </div>
                                     )}

                                     <div className="mt-4 pt-4 border-t border-blue-200/50">
                                         <p className="text-[10px] font-black uppercase text-blue-800 mb-2 block ml-1">...Oppure aggiungi un'Offerta Esterna manuale</p>
                                         <div className="flex gap-3">
                                             <input type="text" placeholder="Nome Prodotto" className="flex-1 p-3 bg-white rounded-xl border border-blue-100 outline-none font-bold text-xs" value={customProduct.name} onChange={e => setCustomProduct({...customProduct, name: e.target.value})} />
                                             <input type="text" placeholder="Prezzo" className="w-24 p-3 bg-white rounded-xl border border-blue-100 outline-none font-black text-blue-700 text-xs text-center" value={customProduct.price} onChange={e => setCustomProduct({...customProduct, price: e.target.value})} />
                                             <input type="text" placeholder="Link Negozio" className="flex-1 p-3 bg-white rounded-xl border border-blue-100 outline-none font-medium text-xs" value={customProduct.url} onChange={e => setCustomProduct({...customProduct, url: e.target.value})} />
                                         </div>
                                     </div>
                                 </div>

                                 <div className="bg-purple-50/50 p-6 rounded-2xl border border-purple-100">
                                     <h4 className="font-black text-purple-900 flex items-center gap-2 mb-2"><Clock size={18}/> Programma Data (Opzionale)</h4>
                                     <input type="datetime-local" className="w-full p-3.5 bg-white rounded-xl border border-purple-200 outline-none font-bold text-gray-800" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} />
                                 </div>

                                 <div className="p-5 bg-red-50 border border-red-200 rounded-2xl shadow-sm">
                                     <h4 className="text-xs font-black text-red-700 flex items-center gap-1.5 mb-3"><ShieldAlert size={16}/> Dichiarazione di Responsabilità</h4>
                                     <p className="text-[10px] text-red-600/90 leading-relaxed mb-4 font-medium text-justify">
                                         L'invio massivo di email è soggetto alle norme sulla privacy (GDPR). Dichiari di avere il consenso esplicito dei destinatari. È severamente vietato l'invio di materiale illegale, esplicito o spam.
                                     </p>
                                     <label className="flex items-start gap-3 cursor-pointer bg-white p-3 rounded-xl border border-red-100 shadow-sm hover:bg-red-50/30 transition">
                                         <input type="checkbox" required checked={legalConsent} onChange={e => setLegalConsent(e.target.checked)} className="mt-0.5 w-4 h-4 accent-red-600 cursor-pointer shrink-0" />
                                         <span className="text-[10px] font-bold text-red-800 leading-snug">Accetto i termini e mi assumo la piena responsabilità dei contenuti inviati.</span>
                                     </label>
                                 </div>
                             </div>

                             <div className="mt-6 pt-6 border-t border-gray-100 flex justify-between items-center shrink-0">
                                 <button onClick={() => setStep(2)} className="text-gray-600 font-bold bg-gray-100 px-8 py-4 rounded-xl hover:bg-gray-200 transition">← Indietro</button>
                                 <button onClick={handleSend} disabled={sending || !legalConsent} className="bg-gradient-to-r from-[#00665E] to-teal-500 text-white px-10 py-4 rounded-xl font-black transition flex items-center gap-3 shadow-[0_10px_30px_rgba(0,102,94,0.3)] hover:scale-[1.02] disabled:opacity-50">
                                     {sending ? <Loader2 className="animate-spin"/> : <Send size={20}/>} {scheduleDate ? 'PROGRAMMA INVIO' : 'SPEDISCI ORA'}
                                 </button>
                             </div>
                         </div>
                     )}
                 </div>
             </div>
          </div>
      )}
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: #94a3b8; }
      `}}/>
    </main>
  )
}

function FilterBtn({label, active, onClick, icon}: any) {
    return (
        <button onClick={onClick} className={`p-3 rounded-xl border text-[11px] font-black flex flex-col items-center justify-center gap-2 transition-all ${active ? 'bg-[#00665E] text-white border-[#00665E] shadow-md transform -translate-y-1' : 'bg-white text-gray-600 border-gray-200 hover:border-[#00665E] hover:text-[#00665E]'}`}>
            {icon} {label}
        </button>
    )
}