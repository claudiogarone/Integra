'use client'

import { createClient } from '../../../utils/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
    Leaf, Zap, Flame, Droplets, Factory, BarChart3, 
    BrainCircuit, Loader2, Download, AlertTriangle, 
    TrendingDown, Sparkles, CheckCircle2, ShieldCheck, Infinity, 
    Filter, FileText, BadgePercent, Settings, UploadCloud, X, Share2, Copy, Camera, MapPin
} from 'lucide-react'
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend
} from 'recharts'

export default function EnergyMonitorPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [currentPlan, setCurrentPlan] = useState('Base')
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  const aiAuditsLimit: any = { 'Base': 10, 'Enterprise': 100, 'Ambassador': 'Illimitati' }
  const [auditsUsed, setAuditsUsed] = useState(8)

  // --- CONFIGURAZIONE STRUTTURA AZIENDALE AVANZATA ---
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const [locations, setLocations] = useState([
      { id: 1, name: 'Sede Principale Milano', type: 'Ufficio', mq: 450 },
      { id: 2, name: 'Capannone Produzione A', type: 'Produzione', mq: 1200 },
      { id: 3, name: 'Magazzino Logistica Est', type: 'Magazzino', mq: 800 }
  ])
  // Form Nuova Sede
  const [newLocName, setNewLocName] = useState('')
  const [newLocType, setNewLocType] = useState('Ufficio')
  const [newLocMq, setNewLocMq] = useState('')

  // STATI UI E FILTRI AVANZATI
  const [activeTab, setActiveTab] = useState<'dashboard' | 'ai-audit' | 'reports'>('dashboard')
  const [filterArea, setFilterArea] = useState('Tutte le Sedi')
  const [filterType, setFilterType] = useState('Tutte le Tipologie')
  const [filterMonth, setFilterMonth] = useState('Ultimi 6 Mesi')

  // STATI FORM AI AUDIT 
  const [energyType, setEnergyType] = useState('Elettricità')
  const [consumption, setConsumption] = useState('')
  const [cost, setCost] = useState('')
  const [department, setDepartment] = useState('Sede Principale Milano')
  const [processDesc, setProcessDesc] = useState('')
  
  const [isUploadingBill, setIsUploadingBill] = useState(false) 
  const [uploadSource, setUploadSource] = useState<'camera' | 'file' | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [aiStrategy, setAiStrategy] = useState<any>(null)

  // STATO SOCIAL POST
  const [socialModalOpen, setSocialModalOpen] = useState(false)
  const [isGeneratingPost, setIsGeneratingPost] = useState(false)
  const [generatedPost, setGeneratedPost] = useState('')

  const energyData = [
      { name: 'Gen', Elettricita: 4000, Gas: 2400, Acqua: 2400 },
      { name: 'Feb', Elettricita: 3000, Gas: 1398, Acqua: 2210 },
      { name: 'Mar', Elettricita: 2000, Gas: 9800, Acqua: 2290 },
      { name: 'Apr', Elettricita: 2780, Gas: 3908, Acqua: 2000 },
      { name: 'Mag', Elettricita: 1890, Gas: 4800, Acqua: 2181 },
      { name: 'Giu', Elettricita: 2390, Gas: 3800, Acqua: 2500 },
  ]

  const co2Data = [
      { name: 'Q1', Emissioni: 120, Target: 150 },
      { name: 'Q2', Emissioni: 110, Target: 140 },
      { name: 'Q3', Emissioni: 90, Target: 130 },
      { name: 'Q4', Emissioni: 85, Target: 120 },
  ]

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
          setUser(user)
          const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user.id).single()
          if (profile) setCurrentPlan(profile.plan || 'Base')
      }
      setLoading(false)
    }
    getData()
  }, [])

  // GESTIONE CATASTO AZIENDALE
  const handleAddLocation = (e: React.FormEvent) => {
      e.preventDefault()
      if (newLocName.trim() && newLocMq) {
          setLocations([...locations, { 
              id: Date.now(), 
              name: newLocName, 
              type: newLocType, 
              mq: Number(newLocMq) 
          }])
          setNewLocName('')
          setNewLocMq('')
      }
  }

  const removeLocation = (idToRemove: number) => {
      setLocations(locations.filter(loc => loc.id !== idToRemove))
  }

  // DOWNLOAD REALISTICO REPORT
  const handleDownload = (fileName: string) => {
      const content = `=====================================================
INTEGRA OS - REPORT UFFICIALE SOSTENIBILITA' ESG
=====================================================
Azienda: La Tua Azienda SpA
Data Generazione: ${new Date().toLocaleString()}
Documento: ${fileName}

1. SINTESI ESECUTIVA
Nel periodo di riferimento, l'azienda ha registrato un calo complessivo 
delle emissioni del 4.2%, mantenendosi sotto il target fissato per la compliance CSRD.

2. CONSUMI ENERGETICI GLOBALI (Filtrati per Sede)
- Energia Elettrica: 16.060 kWh (Costo stimato: € 4.520)
- Gas Naturale: 22.306 m3 (Costo stimato: € 8.900)

3. NOTE DELL'INTELLIGENZA ARTIFICIALE
L'audit predittivo suggerisce un potenziale risparmio ulteriore del 18% 
agendo sui carichi notturni del Reparto Produzione.
`;
      const blob = new Blob([content], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName.replace('.pdf', '.txt');
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
  }

  // OCR BOLLETTA
  const handleOCRUpload = (e: any, source: 'camera' | 'file') => {
      if(!e.target.files[0]) return;
      setUploadSource(source)
      setIsUploadingBill(true)
      
      setTimeout(() => {
          setIsUploadingBill(false)
          setUploadSource(null)
          setConsumption('5240') 
          setCost('1450.20')     
          alert(`✅ Dati estratti con successo dall'AI.`)
      }, 2500)
  }

  // AUDIT AI
  const runAIAudit = (e: React.FormEvent) => {
      e.preventDefault()
      setIsAnalyzing(true)
      
      // Trovo i MQ della sede selezionata per rendere l'analisi realistica
      const selectedLoc = locations.find(l => l.name === department)
      const mqContext = selectedLoc ? selectedLoc.mq : 0
      const typeContext = selectedLoc ? selectedLoc.type : 'N/A'

      setTimeout(() => {
          setIsAnalyzing(false)
          setAuditsUsed(prev => prev + 1)
          
          setAiStrategy({
              status: 'Critico',
              savingsPotential: '€ 1.250 / mese',
              co2Reduction: '- 2.4 Tonnellate',
              analysis: `Analisi sede "${department}" (${typeContext} di ${mqContext} mq): Il costo di €${cost} per ${consumption} unità è superiore del 18% rispetto al benchmark di strutture simili. Processo analizzato: "${processDesc}".`,
              steps: [
                  "Spostare l'attivazione dei macchinari ad alto assorbimento nella fascia oraria F3 (23:00 - 07:00).",
                  "Installare valvole smart per ridurre la dispersione termica stimata al 5% nella zona logistica.",
                  "Attivare policy di stand-by automatico per tutte le postazioni ufficio dopo le 19:00."
              ]
          })
      }, 3000)
  }

  // GENERAZIONE E SALVATAGGIO REALE POST SOCIAL
  const handleGenerateSocialPost = () => {
      setIsGeneratingPost(true)
      setSocialModalOpen(true)
      
      setTimeout(() => {
          setGeneratedPost(`🌍 Orgogliosi di annunciare un nuovo traguardo verde per la nostra azienda!\n\nQuesto mese abbiamo ridotto le emissioni di ben 12 Tonnellate di CO2 nelle nostre sedi operative. 📉✨\n\n💡 Cosa significa? È l'equivalente di aver piantato oltre 500 nuovi alberi!\nContinuiamo a lavorare per offrirvi prodotti di altissima qualità nel rispetto dell'ambiente. 💚\n\n#Sostenibilità #GreenCompany #EcoFriendly #FuturoGreen`);
          setIsGeneratingPost(false)
      }, 2000)
  }

  // SALVATAGGIO IN LAUNCHPAD (LOCALSTORAGE)
  const saveToLaunchpad = () => {
      // Usiamo il localStorage del browser per passare i dati al modulo Launchpad!
      try {
          const existingDrafts = JSON.parse(localStorage.getItem('integra_launchpad_drafts') || '[]')
          existingDrafts.push({
              id: Date.now(),
              type: 'Social Post',
              content: generatedPost,
              date: new Date().toLocaleDateString('it-IT')
          })
          localStorage.setItem('integra_launchpad_drafts', JSON.stringify(existingDrafts))
          
          alert("✅ POST PUBBLICATO NELLE BOZZE!\n\nIl testo è stato salvato nel database locale. Quando aprirai la pagina del modulo Marketing Launchpad, il sistema lo caricherà in automatico pronto per essere inviato a Facebook/Instagram.")
          setSocialModalOpen(false)
      } catch(e) {
          alert("Errore nel salvataggio. Riprova.")
      }
  }

  if (loading) return <div className="p-10 text-emerald-600 font-bold animate-pulse">Avvio Motore Analisi Energetica...</div>

  return (
    <main className="flex-1 overflow-auto bg-[#F8FAFC] text-gray-900 font-sans min-h-screen pb-20 relative">
      
      {/* HEADER & CREDITS */}
      <div className="flex flex-col md:flex-row justify-between items-center border-b border-gray-200 p-8 bg-slate-900 text-white shadow-sm z-10 relative">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-3"><Leaf size={32} className="text-emerald-400"/> AI Energy & ESG</h1>
          <p className="text-slate-400 text-sm mt-1">Monitoraggio consumi, Mappatura Sedi e Impronta Carbonica.</p>
        </div>
        
        <div className="flex flex-col items-end mt-4 md:mt-0">
            <button onClick={() => setIsConfigOpen(true)} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 transition px-5 py-2.5 rounded-xl mb-2 text-xs font-black text-white shadow-lg">
                <MapPin size={14}/> Configura Mappa Aziendale
            </button>
            <div className="bg-slate-800 border border-slate-700 px-4 py-1.5 rounded-xl flex items-center gap-3">
                <BrainCircuit className="text-emerald-400" size={16}/>
                <div className="flex flex-col items-end">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Audit Mensili ({currentPlan})</span>
                    <span className="font-bold text-xs text-white">{auditsUsed} / {aiAuditsLimit[currentPlan]}</span>
                </div>
            </div>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="px-8 py-4 flex flex-wrap gap-2 border-b border-gray-200 bg-white sticky top-0 z-20 shadow-sm">
          <button onClick={() => setActiveTab('dashboard')} className={`px-5 py-2.5 rounded-xl font-bold text-sm transition flex items-center gap-2 ${activeTab === 'dashboard' ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}><BarChart3 size={16}/> Monitoraggio</button>
          <button onClick={() => setActiveTab('ai-audit')} className={`px-5 py-2.5 rounded-xl font-bold text-sm transition flex items-center gap-2 ${activeTab === 'ai-audit' ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}><Zap size={16}/> Inserimento & Scansione</button>
          <button onClick={() => setActiveTab('reports')} className={`px-5 py-2.5 rounded-xl font-bold text-sm transition flex items-center gap-2 ${activeTab === 'reports' ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}><FileText size={16}/> Report & Marketing</button>
      </div>

      <div className="p-8 max-w-7xl mx-auto">
          
          {/* TAB 1: DASHBOARD E FILTRI AVANZATI */}
          {activeTab === 'dashboard' && (
              <div className="space-y-8 animate-in fade-in">
                  
                  {/* BARRA FILTRI AVANZATA */}
                  <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col lg:flex-row gap-4 justify-between items-center">
                      <div className="flex items-center gap-2 text-gray-800 text-sm font-black shrink-0">
                          <Filter size={16} className="text-emerald-500"/> Filtri di Visualizzazione:
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full lg:w-auto">
                          <select value={filterType} onChange={e=>setFilterType(e.target.value)} className="bg-gray-50 border border-gray-200 py-2.5 px-4 rounded-xl text-sm font-bold outline-none cursor-pointer">
                              <option value="Tutte le Tipologie">Tutti i Tipi di Immobile</option>
                              <option value="Ufficio">Solo Uffici</option>
                              <option value="Produzione">Solo Produzione / Fabbriche</option>
                              <option value="Magazzino">Solo Logistica / Magazzini</option>
                              <option value="Negozio">Solo Retail / Negozi</option>
                          </select>
                          <select value={filterArea} onChange={e=>setFilterArea(e.target.value)} className="bg-gray-50 border border-gray-200 py-2.5 px-4 rounded-xl text-sm font-bold outline-none cursor-pointer">
                              <option value="Tutte le Sedi">Tutte le Sedi Specifiche</option>
                              {locations.map((loc) => <option key={loc.id} value={loc.name}>{loc.name} ({loc.mq} mq)</option>)}
                          </select>
                          <select value={filterMonth} onChange={e=>setFilterMonth(e.target.value)} className="bg-gray-50 border border-gray-200 py-2.5 px-4 rounded-xl text-sm font-bold outline-none cursor-pointer">
                              <option value="Ultimi 6 Mesi">Ultimi 6 Mesi</option>
                              <option value="Anno Corrente">Anno in corso</option>
                          </select>
                      </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm flex justify-between items-center">
                          <div>
                              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Costo Energetico</p>
                              <p className="text-3xl font-black text-gray-900">€ 14.280</p>
                          </div>
                          <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center"><Zap size={24}/></div>
                      </div>
                      <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm flex justify-between items-center">
                          <div>
                              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Impronta CO2</p>
                              <p className="text-3xl font-black text-gray-900">85 Ton</p>
                          </div>
                          <div className="w-12 h-12 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center"><Factory size={24}/></div>
                      </div>
                      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 rounded-3xl shadow-lg flex justify-between items-center text-white">
                          <div>
                              <p className="text-xs font-bold text-emerald-100 uppercase tracking-widest mb-1">Eco-Score Area</p>
                              <p className="text-4xl font-black">A-</p>
                          </div>
                          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center"><Leaf size={24}/></div>
                      </div>
                  </div>

                  {/* GRAFICI RIMASTI INVARIATI */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm"><h3 className="font-black mb-6">Consumi (kWh / m3)</h3><div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={energyData}><XAxis dataKey="name" axisLine={false} tickLine={false}/><YAxis axisLine={false} tickLine={false}/><CartesianGrid strokeDasharray="3 3" vertical={false}/><Tooltip/><Legend/><Bar dataKey="Elettricita" stackId="a" fill="#eab308" /><Bar dataKey="Gas" stackId="a" fill="#3b82f6" /><Bar dataKey="Acqua" stackId="a" fill="#06b6d4" /></BarChart></ResponsiveContainer></div></div>
                      <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm"><h3 className="font-black mb-6">Emissioni CO2</h3><div className="h-64"><ResponsiveContainer width="100%" height="100%"><AreaChart data={co2Data}><XAxis dataKey="name" axisLine={false} tickLine={false}/><YAxis axisLine={false} tickLine={false}/><CartesianGrid strokeDasharray="3 3" vertical={false}/><Tooltip/><Legend/><Area type="monotone" dataKey="Emissioni" stroke="#10b981" fill="#10b981" fillOpacity={0.2} /><Area type="step" dataKey="Target" stroke="#ef4444" fill="none" strokeDasharray="5 5" /></AreaChart></ResponsiveContainer></div></div>
                  </div>
              </div>
          )}

          {/* TAB 2: INSERIMENTO DATI */}
          {activeTab === 'ai-audit' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in items-start">
                  
                  <div className="lg:col-span-7 bg-white border border-gray-200 rounded-3xl p-8 shadow-sm relative overflow-hidden">
                      <h2 className="text-xl font-black text-gray-900 mb-2 flex items-center gap-2"><Zap className="text-emerald-500"/> Registra Consumi Mensili</h2>
                      <p className="text-sm text-gray-500 mb-6">Usa l'OCR per leggere le bollette in automatico o compila i campi.</p>

                      <div className="mb-6">
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Acquisizione Dati Intelligente (AI OCR)</label>
                          {isUploadingBill ? (
                              <div className="border-2 border-emerald-400 bg-emerald-50 rounded-2xl p-8 flex flex-col items-center text-emerald-600"><Loader2 size={40} className="animate-spin mb-3"/><span className="text-sm font-bold">Analisi bolletta in corso...</span></div>
                          ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <label className="border-2 border-dashed border-emerald-200 rounded-2xl p-6 flex flex-col items-center justify-center transition cursor-pointer bg-white hover:border-emerald-500 hover:bg-emerald-50 group">
                                      <input type="file" accept="image/*" capture="environment" onChange={(e) => handleOCRUpload(e, 'camera')} className="hidden"/>
                                      <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-3 group-hover:bg-emerald-500 group-hover:text-white transition"><Camera size={24}/></div>
                                      <span className="text-sm font-bold text-gray-800">Fotocamera (Mobile)</span>
                                  </label>
                                  <label className="border-2 border-dashed border-gray-300 rounded-2xl p-6 flex flex-col items-center justify-center transition cursor-pointer bg-white hover:border-gray-500 hover:bg-gray-50 group">
                                      <input type="file" accept=".pdf,.xml,image/*" onChange={(e) => handleOCRUpload(e, 'file')} className="hidden"/>
                                      <div className="w-12 h-12 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center mb-3 group-hover:bg-gray-600 group-hover:text-white transition"><UploadCloud size={24}/></div>
                                      <span className="text-sm font-bold text-gray-800">Carica File (PC)</span>
                                  </label>
                              </div>
                          )}
                      </div>

                      <hr className="my-6 border-gray-100"/>

                      <form onSubmit={runAIAudit} className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Associa alla Sede</label>
                                  <select value={department} onChange={e=>setDepartment(e.target.value)} className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl outline-none focus:border-emerald-500 text-sm font-bold">
                                      {locations.map(loc => <option key={loc.id} value={loc.name}>{loc.name} ({loc.type})</option>)}
                                  </select>
                              </div>
                              <div>
                                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Fornitura</label>
                                  <select value={energyType} onChange={e=>setEnergyType(e.target.value)} className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl outline-none focus:border-emerald-500 text-sm font-bold"><option value="Elettricità">⚡ Elettricità</option><option value="Gas">🔥 Gas</option></select>
                              </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                              <div><label className="text-[10px] font-bold text-gray-500 uppercase">Consumo</label><input required type="number" value={consumption} onChange={e=>setConsumption(e.target.value)} className="w-full border p-3 rounded-xl outline-none bg-gray-50"/></div>
                              <div><label className="text-[10px] font-bold text-gray-500 uppercase">Costo Totale (€)</label><input required type="number" value={cost} onChange={e=>setCost(e.target.value)} className="w-full border p-3 rounded-xl outline-none bg-gray-50"/></div>
                          </div>

                          <div>
                              <label className="text-[10px] font-bold text-emerald-600 uppercase flex items-center gap-1 mb-1"><BrainCircuit size={12}/> Descrivi il Processo per l'AI</label>
                              <textarea required rows={3} value={processDesc} onChange={e=>setProcessDesc(e.target.value)} placeholder="Es: Macchinari accesi 24/7..." className="w-full bg-emerald-50/30 border border-emerald-100 p-4 rounded-xl outline-none resize-none text-sm"></textarea>
                          </div>

                          <button type="submit" disabled={isAnalyzing} className="w-full bg-slate-900 text-white font-black py-4 rounded-xl flex justify-center items-center gap-2">
                              {isAnalyzing ? <Loader2 className="animate-spin"/> : <Sparkles className="text-emerald-400"/>} Richiedi Strategia di Risparmio
                          </button>
                      </form>
                  </div>

                  <div className="lg:col-span-5 flex flex-col h-full">
                      {!isAnalyzing && !aiStrategy ? (
                          <div className="flex-1 border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center text-gray-400 p-10 bg-white/50"><BrainCircuit size={64} className="mb-4 opacity-20"/><h3 className="font-black text-xl text-gray-900">In attesa di Dati</h3></div>
                      ) : isAnalyzing ? (
                          <div className="flex-1 bg-white border border-gray-200 rounded-3xl flex flex-col items-center justify-center shadow-xl"><Loader2 size={40} className="text-emerald-500 animate-spin mb-4"/><h3 className="font-black text-xl">Simulazione in corso...</h3></div>
                      ) : (
                          <div className="flex-1 bg-slate-900 rounded-3xl shadow-xl flex flex-col overflow-hidden text-white border border-slate-700">
                              <div className="p-6 border-b border-slate-700 flex justify-between"><h2 className="font-black flex items-center gap-2"><Sparkles className="text-emerald-400"/> Audit Completato</h2></div>
                              <div className="p-6 overflow-y-auto space-y-6">
                                  <div className="grid grid-cols-2 gap-4">
                                      <div className="bg-slate-800 p-4 rounded-2xl"><p className="text-[10px] text-slate-400 uppercase">Risparmio</p><p className="text-xl font-black text-emerald-400">{aiStrategy.savingsPotential}</p></div>
                                      <div className="bg-slate-800 p-4 rounded-2xl"><p className="text-[10px] text-slate-400 uppercase">Taglio CO2</p><p className="text-xl font-black text-emerald-400">{aiStrategy.co2Reduction}</p></div>
                                  </div>
                                  <div className="bg-blue-500/10 p-4 rounded-2xl text-sm leading-relaxed">{aiStrategy.analysis}</div>
                                  <ul className="space-y-3">{aiStrategy.steps.map((step:any, i:any) => <li key={i} className="flex gap-3 bg-slate-800 p-3 rounded-xl text-sm"><div className="text-emerald-400 font-bold">{i+1}</div>{step}</li>)}</ul>
                              </div>
                          </div>
                      )}
                  </div>
              </div>
          )}

          {/* TAB 3: REPORT ESG E GREEN MARKETING */}
          {activeTab === 'reports' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in">
                  
                  <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm flex flex-col">
                      <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6"><FileText size={32}/></div>
                      <h2 className="text-2xl font-black text-gray-900 mb-2">Report ESG Ufficiale</h2>
                      <p className="text-sm text-gray-500 mb-8">Scarica il file completo a norma CSRD per la contabilità.</p>
                      
                      <div className="space-y-3 flex-1 mb-8">
                          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 shadow-sm">
                              <span className="font-bold text-sm text-gray-800">Report Consolidato Q1</span>
                              <button onClick={() => handleDownload('Report_Sostenibilita_Q1.pdf')} className="text-blue-600 font-bold flex items-center gap-1 text-xs"><Download size={14}/> Scarica File</button>
                          </div>
                      </div>

                      <button onClick={() => handleDownload('Report_Annuale_Completo.pdf')} className="w-full bg-slate-900 text-white font-black py-4 rounded-xl">Genera Documento Completo</button>
                  </div>

                  <div className="bg-gradient-to-br from-[#00665E] to-teal-700 rounded-3xl p-8 text-white shadow-xl flex flex-col relative overflow-hidden">
                      <div className="relative z-10 flex-1">
                          <h2 className="text-2xl font-black mb-2">Green Marketing ROI</h2>
                          <p className="text-teal-100 text-sm mb-6">Usa i tuoi dati ecologici per creare contenuti per i social e attirare nuovi clienti.</p>
                          <div className="bg-black/20 p-5 rounded-2xl mb-6 backdrop-blur-md">
                              <p className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest mb-2">Traguardo Raggiunto</p>
                              <p className="text-lg font-medium">"Abbiamo ridotto le emissioni di 12 Ton (pari a 500 alberi)."</p>
                          </div>
                      </div>
                      <button onClick={handleGenerateSocialPost} className="w-full bg-emerald-500 text-slate-900 font-black py-4 rounded-xl hover:bg-emerald-400 relative z-10 flex justify-center gap-2"><BrainCircuit size={18}/> Genera Post Social AI</button>
                  </div>

              </div>
          )}
      </div>

      {/* MODALE: CATASTO / STRUTTURA AZIENDALE */}
      {isConfigOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in zoom-in-95">
                  <div className="bg-slate-900 p-6 flex justify-between items-center text-white">
                      <h2 className="text-xl font-black flex items-center gap-2"><MapPin size={20} className="text-emerald-400"/> Struttura e Sedi Aziendali</h2>
                      <button onClick={() => setIsConfigOpen(false)} className="text-gray-400 hover:text-white transition"><X size={24}/></button>
                  </div>
                  <div className="p-8 bg-gray-50 flex flex-col gap-6">
                      
                      <div className="bg-blue-50 border border-blue-200 text-blue-800 text-xs p-4 rounded-xl">
                          Mappa qui i tuoi capannoni o uffici. I metri quadri e la tipologia aiuteranno l'AI a calcolare un benchmark energetico molto più preciso.
                      </div>

                      <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                          {locations.map((loc) => (
                              <div key={loc.id} className="bg-white border border-gray-200 p-4 rounded-xl flex justify-between items-center shadow-sm">
                                  <div>
                                      <p className="font-black text-gray-900">{loc.name}</p>
                                      <div className="flex gap-2 mt-1">
                                          <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded">{loc.type}</span>
                                          <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-0.5 rounded">{loc.mq} mq</span>
                                      </div>
                                  </div>
                                  <button onClick={() => removeLocation(loc.id)} className="w-8 h-8 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition"><X size={14}/></button>
                              </div>
                          ))}
                      </div>

                      <form onSubmit={handleAddLocation} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                          <div className="md:col-span-2">
                              <label className="text-[10px] font-bold text-gray-500 uppercase">Nome Immobile</label>
                              <input type="text" required value={newLocName} onChange={e=>setNewLocName(e.target.value)} placeholder="Es. Negozio Roma" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none"/>
                          </div>
                          <div>
                              <label className="text-[10px] font-bold text-gray-500 uppercase">Tipologia</label>
                              <select value={newLocType} onChange={e=>setNewLocType(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none">
                                  <option value="Ufficio">Ufficio</option>
                                  <option value="Produzione">Produzione</option>
                                  <option value="Magazzino">Magazzino</option>
                                  <option value="Negozio">Negozio/Retail</option>
                              </select>
                          </div>
                          <div>
                              <label className="text-[10px] font-bold text-gray-500 uppercase">Metratura</label>
                              <div className="flex gap-2">
                                  <input type="number" required value={newLocMq} onChange={e=>setNewLocMq(e.target.value)} placeholder="Mq" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none"/>
                                  <button type="submit" className="bg-emerald-600 text-white rounded-xl px-4 font-bold hover:bg-emerald-700">+</button>
                              </div>
                          </div>
                      </form>

                  </div>
              </div>
          </div>
      )}

      {/* MODALE: RISULTATO POST SOCIAL */}
      {socialModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in-95">
                  <div className="bg-gradient-to-r from-[#00665E] to-teal-600 p-6 flex justify-between items-center text-white">
                      <h2 className="text-xl font-black flex items-center gap-2"><Share2 size={20}/> Bozza Social Creata</h2>
                      <button onClick={() => setSocialModalOpen(false)} className="text-teal-100 hover:text-white transition"><X size={24}/></button>
                  </div>
                  <div className="p-8">
                      {isGeneratingPost ? (
                          <div className="flex flex-col items-center justify-center py-10 text-teal-600">
                              <Loader2 size={40} className="animate-spin mb-4"/>
                              <p className="font-bold">Scrittura Copywriting in corso...</p>
                          </div>
                      ) : (
                          <>
                              <div className="bg-gray-50 border border-gray-200 p-5 rounded-2xl text-sm text-gray-800 whitespace-pre-line leading-relaxed shadow-inner">
                                  {generatedPost}
                              </div>
                              <div className="flex gap-3 mt-6">
                                  <button onClick={() => {navigator.clipboard.writeText(generatedPost); alert("Testo copiato nella clipboard!")}} className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-200 transition flex justify-center items-center gap-2">
                                      <Copy size={16}/> Copia 
                                  </button>
                                  <button onClick={saveToLaunchpad} className="flex-2 bg-emerald-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-emerald-700 transition flex justify-center items-center gap-2 shadow-md">
                                      Invia a Launchpad <Share2 size={16}/>
                                  </button>
                              </div>
                          </>
                      )}
                  </div>
              </div>
          </div>
      )}

    </main>
  )
}