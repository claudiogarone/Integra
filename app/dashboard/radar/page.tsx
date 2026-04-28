'use client'

import { createClient } from '../../../utils/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
    Radar, MapPin, CloudRain, Calendar, Megaphone, 
    TrendingUp, ShieldAlert, Crosshair, Zap, Building, Lock, Loader2, ArrowRight, Search, CheckCircle2, Globe, BarChart3,
    Users, CreditCard, Handshake
} from 'lucide-react'

export default function MarketRadarPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [currentPlan, setCurrentPlan] = useState('Base')
  const [loading, setLoading] = useState(true)
  
  // Limiti in base al piano
  const planLimits: any = {
      'Base': { comp: 5, radius: 50, update: 'Settimanale' },
      'Enterprise': { comp: 15, radius: 100, update: 'Quotidiano' },
      'Ambassador': { comp: 50, radius: 500, update: 'Tempo Reale' }
  }

  // Dati
  const [radius, setRadius] = useState(50)
  const [competitors, setCompetitors] = useState<any[]>([
      { id: 1, name: 'Concorrente Diretto Srl', url: 'www.concorrente.it', status: 'Monitorato', ads: true, sentiment: 'Negativo' }
  ])
  const [legalAccepted, setLegalAccepted] = useState(false)
  
  // Stati Ricerca Concorrente
  const [newCompetitorQuery, setNewCompetitorQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [foundCompetitor, setFoundCompetitor] = useState<any>(null)
  const [selectedCompetitorId, setSelectedCompetitorId] = useState<number | null>(null) // Per espandere la scheda

  // Stati Scansione Predittiva
  const [scanning, setScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [scanLogs, setScanLogs] = useState<string[]>([])
  const [hasScanned, setHasScanned] = useState(false)

  const supabase = createClient()

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

  // 1. FASE DI RICERCA CONCORRENTE
  const handleSearchCompetitor = (e: React.FormEvent) => {
      e.preventDefault()
      if (!legalAccepted) return alert("Devi accettare i termini legali per il monitoraggio.")
      if (competitors.length >= planLimits[currentPlan].comp) return alert(`Hai raggiunto il limite di concorrenti per il tuo piano.`)
      if (!newCompetitorQuery.trim()) return;

      setIsSearching(true)
      // Simulazione ricerca su Google/Web
      setTimeout(() => {
          const formattedName = newCompetitorQuery.charAt(0).toUpperCase() + newCompetitorQuery.slice(1)
          setFoundCompetitor({
              name: `${formattedName} S.p.A.`,
              url: `www.${newCompetitorQuery.toLowerCase().replace(/\s/g, '')}.it`,
              city: 'Nei dintorni',
          })
          setIsSearching(false)
      }, 1500)
  }

  // 2. CONFERMA AGGIUNTA CONCORRENTE
  const confirmAddCompetitor = () => {
      setCompetitors([...competitors, { 
          id: Date.now(), 
          name: foundCompetitor.name, 
          url: foundCompetitor.url,
          status: 'In acquisizione...',
          ads: Math.random() > 0.5,
          sentiment: 'Neutrale'
      }])
      setNewCompetitorQuery('')
      setFoundCompetitor(null)
  }

  // 3. MOTORE DI SCANSIONE IN TEMPO REALE (FIXATO)
  const runRadarScan = () => {
      if (!legalAccepted) return alert("Accetta i termini legali in basso a sinistra.")
      
      setScanning(true)
      setHasScanned(false)
      setScanProgress(0)
      setScanLogs(["Inizializzazione array dei sensori locali..."])

      const steps = [
          { p: 20, msg: "Connessione API Meteo Nazionale e flussi viabilità..." },
          { p: 45, msg: "Estrazione dati demografici dal raggio di " + planLimits[currentPlan].radius + "km..." },
          { p: 70, msg: "Scraping anonimizzato delle Meta Ads Library..." },
          { p: 90, msg: "Incrocio dati con OpenAI GPT-4 per le previsioni..." },
          { p: 100, msg: "Generazione Insight completata." }
      ]

      let currentStep = 0;
      const interval = setInterval(() => {
          // CONTROLLO DI SICUREZZA: Verifichiamo che lo step esista
          const step = steps[currentStep];
          if (step) {
              setScanProgress(step.p)
              setScanLogs(prev => [step.msg, ...prev])
              currentStep++;
          } else {
              // Quando gli step finiscono, chiudiamo l'intervallo in sicurezza
              clearInterval(interval)
              setTimeout(() => {
                  setScanning(false)
                  setHasScanned(true)
              }, 500)
          }
      }, 1200)
  }

  // 4. AZIONI DEI PULSANTI (Reindirizzamenti Reali)
  const handleInsightAction = (actionRoute: string, message: string) => {
      alert(`🤖 Motore AI attivato: ${message}\nReindirizzamento all'Hub di competenza in corso...`)
      router.push(actionRoute)
  }

  const aiInsights = [
      {
          type: 'weather', icon: <CloudRain className="text-blue-400"/>, title: 'Allerta Meteo: Forti Piogge',
          desc: `È previsto maltempo nel raggio monitorato venerdì. L'affluenza fisica in negozio calerà drasticamente.`,
          suggestion: 'Attiva subito una campagna per la consegna a domicilio gratuita o sconti e-commerce.',
          action: 'Genera Promo Delivery', route: '/dashboard/launchpad', msg: 'Apro il Launchpad per generare il volantino della Promo!', color: 'border-blue-200 bg-blue-50'
      },
      {
          type: 'demographics', icon: <Building className="text-orange-400"/>, title: 'Infrastrutture: Polo Scolastico',
          desc: 'Alta concentrazione di target "Famiglie" rilevata a 2km dalla tua sede.',
          suggestion: 'Modifica la vetrina principale proponendo pacchetti per studenti.',
          action: 'Crea Offerta Studenti', route: '/dashboard/launchpad', msg: 'Preparo il target Famiglie nel Launchpad.', color: 'border-orange-200 bg-orange-50',
          locked: currentPlan === 'Base'
      },
      {
          type: 'ads', icon: <Megaphone className="text-purple-500"/>, title: 'Competitor: Nuova Campagna',
          desc: 'Il tuo concorrente ha attivato 3 nuove inserzioni Facebook offrendo Sconto 20%.',
          suggestion: 'Lancia un\'offerta "Quality Premium" spiegando perché il tuo prodotto vale il prezzo pieno.',
          action: 'Genera AI Counter-Strike', route: '/dashboard/marketing', msg: 'Apro il modulo Marketing per generare la DEM di contrattacco!', color: 'border-purple-200 bg-purple-50',
          locked: currentPlan !== 'Ambassador'
      },
      {
          type: 'economy', icon: <TrendingUp className="text-emerald-500"/>, title: 'Trend Economico: Giorno di Paga',
          desc: 'Siamo a inizio mese. La propensione all\'acquisto d\'impulso è al massimo (+65%).',
          suggestion: 'Spingi i tuoi prodotti "High-Ticket" (costo elevato) al tuo database clienti VIP.',
          action: 'Invia DEM Prodotti Premium', route: '/dashboard/marketing', msg: 'Apro il modulo Marketing con template Premium pre-caricato.', color: 'border-emerald-200 bg-emerald-50'
      }
  ]

  if (loading) return <div className="p-10 text-[#00665E] font-bold animate-pulse">Avvio sistema Radar...</div>

  return (
    <main className="flex-1 p-8 overflow-auto bg-[#F8FAFC] text-gray-900 font-sans min-h-screen pb-20">
      
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 border-b border-gray-200 pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#00665E] flex items-center gap-3"><Radar size={32} className="text-blue-600"/> Market Radar & Predictor</h1>
          <p className="text-gray-500 text-sm mt-1">Sbaraglia la concorrenza locale analizzando dati pubblici, meteo e trend di ricerca in tempo reale.</p>
        </div>
        <div className="flex gap-4 items-center">
            <div className="bg-white border border-gray-200 px-4 py-2 rounded-xl text-xs font-bold flex flex-col items-end shadow-sm">
                <span className="text-gray-400 uppercase tracking-widest text-[9px] mb-1">Raggio d'Azione ({currentPlan})</span>
                <span className="text-blue-600 flex items-center gap-1"><MapPin size={12}/> {planLimits[currentPlan].radius} km</span>
            </div>
            {currentPlan !== 'Ambassador' && (
                <button onClick={() => router.push('/dashboard/upgrade?plan=Ambassador')} className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold px-4 py-3 rounded-xl transition flex items-center gap-2 shadow-md hover:shadow-lg hover:scale-105">
                    <Zap size={14}/> Potenzia Radar
                </button>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          
          {/* COLONNA SX: CONCORRENTI E SCANNER */}
          <div className="xl:col-span-5 space-y-6">
              
              <div className="bg-white border border-gray-200 p-6 rounded-3xl shadow-sm">
                  <h2 className="font-black text-gray-900 flex items-center gap-2 mb-4"><Crosshair size={18} className="text-red-500"/> Bersagli Monitorati</h2>
                  <p className="text-xs text-gray-500 mb-6">Aggiungi aziende da analizzare. {competitors.length}/{planLimits[currentPlan].comp} slot utilizzati.</p>
                  
                  {/* Form di Ricerca e Verifica */}
                  <div className="mb-6 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                      <form onSubmit={handleSearchCompetitor} className="flex gap-2">
                          <input type="text" value={newCompetitorQuery} onChange={e=>setNewCompetitorQuery(e.target.value)} placeholder="Nome concorrente..." className="flex-1 bg-white border border-gray-200 p-2.5 rounded-xl text-sm outline-none focus:border-blue-500"/>
                          <button type="submit" disabled={isSearching || foundCompetitor} className="bg-blue-600 text-white px-4 rounded-xl font-bold hover:bg-blue-700 transition disabled:opacity-50">
                              {isSearching ? <Loader2 size={18} className="animate-spin"/> : <Search size={18}/>}
                          </button>
                      </form>

                      {/* Box Conferma Trovato */}
                      {foundCompetitor && (
                          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl animate-in zoom-in-95">
                              <p className="text-[10px] font-bold text-blue-500 uppercase mb-2">Conferma Identità Aziendale</p>
                              <div className="flex items-start gap-3 mb-4">
                                  <div className="w-10 h-10 bg-white rounded-lg shadow flex items-center justify-center text-blue-600 font-bold border border-blue-100"><Globe size={20}/></div>
                                  <div>
                                      <p className="font-black text-gray-900 text-sm">{foundCompetitor.name}</p>
                                      <p className="text-xs text-blue-600 underline">{foundCompetitor.url}</p>
                                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1"><MapPin size={10}/> {foundCompetitor.city}</p>
                                  </div>
                              </div>
                              <div className="flex gap-2">
                                  <button onClick={confirmAddCompetitor} className="flex-1 bg-blue-600 text-white text-xs font-bold py-2 rounded-lg hover:bg-blue-700">Conferma e Traccia</button>
                                  <button onClick={() => setFoundCompetitor(null)} className="px-3 py-2 bg-gray-200 text-gray-600 text-xs font-bold rounded-lg hover:bg-gray-300">Annulla</button>
                              </div>
                          </div>
                      )}
                  </div>

                  {/* Lista Concorrenti Esistenti (Espandibile) */}
                  <div className="space-y-3">
                      {competitors.map(c => (
                          <div key={c.id} className="border border-gray-200 rounded-xl overflow-hidden transition-all">
                              <div onClick={() => setSelectedCompetitorId(selectedCompetitorId === c.id ? null : c.id)} className="bg-white p-3 flex justify-between items-center cursor-pointer hover:bg-gray-50">
                                  <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Monitoraggio Attivo"></div>
                                      <span className="text-sm font-bold text-gray-800">{c.name}</span>
                                  </div>
                                  <BarChart3 size={16} className="text-gray-400"/>
                              </div>
                              
                              {/* Dettaglio Spia a comparsa (dipende dal piano) */}
                              {selectedCompetitorId === c.id && (
                                  <div className="p-4 bg-gray-50 border-t border-gray-100 text-xs space-y-3">
                                      <div className="flex justify-between border-b border-gray-200 pb-2">
                                          <span className="text-gray-500">Ultima Scansione:</span>
                                          <span className="font-bold">Oggi</span>
                                      </div>
                                      <div className="flex justify-between border-b border-gray-200 pb-2">
                                          <span className="text-gray-500">Traffico Web Stimato:</span>
                                          <span className="font-bold text-orange-600">Medio/Basso</span>
                                      </div>
                                      {currentPlan === 'Ambassador' ? (
                                          <>
                                              <div className="flex justify-between border-b border-gray-200 pb-2">
                                                  <span className="text-gray-500">Facebook/Insta Ads:</span>
                                                  <span className={c.ads ? 'font-bold text-red-600' : 'font-bold text-gray-400'}>{c.ads ? '2 Attive' : 'Nessuna'}</span>
                                              </div>
                                              <div className="flex justify-between">
                                                  <span className="text-gray-500">Sentiment Recensioni:</span>
                                                  <span className="font-bold text-red-600">{c.sentiment}</span>
                                              </div>
                                          </>
                                      ) : (
                                          <div className="bg-gray-200 p-2 rounded text-center text-gray-500 italic mt-2 flex items-center justify-center gap-1">
                                              <Lock size={10}/> Ads e Sentiment richiedono Ambassador
                                          </div>
                                      )}
                                  </div>
                              )}
                          </div>
                      ))}
                  </div>
              </div>

              {/* DISCLAIMER LEGALE */}
              <div className="bg-amber-50 border border-amber-200 p-5 rounded-3xl">
                  <div className="flex items-start gap-3">
                      <ShieldAlert size={20} className="text-amber-500 mt-0.5 shrink-0"/>
                      <div>
                          <p className="text-xs text-amber-900 font-bold mb-2">Conformità Legale (GDPR & Antitrust)</p>
                          <p className="text-[10px] text-amber-800 leading-relaxed mb-4">
                              Dichiaro di utilizzare questa funzione solo per benchmarking. IntegraOS aggrega <b>esclusivamente dati pubblici</b> (Google, Meta API). Nessun dato sensibile viene violato.
                          </p>
                          <label className="flex items-center gap-2 cursor-pointer">
                              <input type="checkbox" className="w-4 h-4 accent-amber-600" checked={legalAccepted} onChange={e => setLegalAccepted(e.target.checked)}/>
                              <span className="text-xs font-bold text-amber-900">Accetto l'uso etico del Radar</span>
                          </label>
                      </div>
                  </div>
              </div>
          </div>

          {/* COLONNA DX: MONITOR DI SCANSIONE E INSIGHTS */}
          <div className="xl:col-span-7 flex flex-col gap-6">
              
              {/* SCHERMO RADAR PRINCIPALE */}
              <div className="bg-gradient-to-br from-[#00665E] to-[#004d46] border border-[#00665E]/40 p-8 rounded-3xl shadow-xl relative overflow-hidden flex flex-col justify-center min-h-[250px]">
                  {scanning ? (
                      <div className="relative z-10 w-full max-w-md mx-auto">
                          <div className="flex justify-between text-white/80 text-xs font-mono font-bold mb-2 uppercase tracking-widest">
                              <span>Scansione Satellitare</span>
                              <span>{scanProgress}%</span>
                          </div>
                          <div className="w-full h-3 bg-black/20 rounded-full overflow-hidden shadow-inner mb-4 border border-white/10">
                              <div className="h-full bg-white/70 transition-all duration-300 relative" style={{width: `${scanProgress}%`}}>
                                  <div className="absolute top-0 right-0 w-10 h-full bg-white/30 blur-sm"></div>
                              </div>
                          </div>
                          <div className="h-16 overflow-y-hidden flex flex-col justify-end">
                              {scanLogs.map((log, i) => (
                                  <p key={i} className={`text-xs font-mono truncate ${i === 0 ? 'text-white font-bold' : 'text-white/30'}`}>{'>'} {log}</p>
                              ))}
                          </div>
                      </div>
                  ) : hasScanned ? (
                      <div className="text-center relative z-10">
                          <CheckCircle2 size={48} className="text-white mx-auto mb-4"/>
                          <h2 className="text-2xl font-black text-white mb-2">Analisi Predittiva Completata</h2>
                          <p className="text-white/60 text-sm">L'AI ha identificato {aiInsights.filter(i=>!i.locked).length} pattern azionabili nel raggio di {planLimits[currentPlan].radius}km.</p>
                          <button onClick={() => setHasScanned(false)} className="mt-6 text-white/70 text-xs font-bold hover:text-white hover:underline">Resetta Radar</button>
                      </div>
                  ) : (
                      <div className="text-center relative z-10">
                          <Radar size={64} className="text-white/30 mx-auto mb-6"/>
                          <h2 className="text-xl font-black text-white mb-4">Sistemi Pronti</h2>
                          <button onClick={runRadarScan} disabled={!legalAccepted || competitors.length === 0} className="bg-white text-[#00665E] font-black py-4 px-8 rounded-xl shadow-lg transition disabled:opacity-50 flex items-center mx-auto gap-2 hover:scale-105">
                              Avvia Scansione Mercato <ArrowRight size={18}/>
                          </button>
                          {(!legalAccepted || competitors.length === 0) && <p className="text-[10px] text-white/50 mt-4">*Accetta le condizioni e inserisci almeno 1 concorrente.</p>}
                      </div>
                  )}

                  {/* Sfondo decorativo Radar */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-white/10 rounded-full opacity-20 pointer-events-none"></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-white/10 rounded-full opacity-20 pointer-events-none"></div>
              </div>

              {/* RISULTATI AI (Visibili solo dopo la scansione) */}
              {hasScanned && (
                  <div className="grid grid-cols-1 gap-4 animate-in slide-in-from-bottom-8">
                      <div className="flex items-center justify-between mb-2">
                          <h3 className="font-black text-gray-900 text-lg">Azioni Consigliate dall'IA</h3>
                      </div>

                      {aiInsights.map((insight, idx) => (
                          <div key={idx} className={`border-2 p-6 rounded-3xl relative overflow-hidden transition duration-300 ${insight.color}`}>
                              
                              {insight.locked && (
                                  <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center text-center p-6">
                                      <Lock size={32} className="text-gray-400 mb-2"/>
                                      <h4 className="font-bold text-gray-900">Sensore Bloccato</h4>
                                      <p className="text-xs text-gray-600 mt-1 max-w-sm">Questa analisi richiede il piano {insight.type === 'ads' ? 'Ambassador' : 'Enterprise'}.</p>
                                      <button onClick={() => router.push(`/dashboard/upgrade?plan=${insight.type === 'ads' ? 'Ambassador' : 'Enterprise'}`)} className="mt-4 bg-gray-900 text-white text-xs font-bold px-4 py-2 rounded-lg">Fai Upgrade</button>
                                  </div>
                              )}

                              <div className="flex items-start gap-4">
                                  <div className="bg-white p-3 rounded-2xl shadow-sm shrink-0">{insight.icon}</div>
                                  <div className="flex-1">
                                      <h3 className="text-lg font-black text-gray-900 mb-1">{insight.title}</h3>
                                      <p className="text-sm text-gray-700 leading-relaxed mb-4">{insight.desc}</p>
                                      
                                      <div className="bg-white/80 border border-white p-4 rounded-xl mb-4">
                                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 flex items-center gap-1"><Zap size={12}/> Strategia di Contrattacco</p>
                                          <p className="text-sm font-bold text-gray-900">{insight.suggestion}</p>
                                      </div>

                                      <button onClick={() => handleInsightAction(insight.route, insight.msg)} className={`font-bold px-5 py-2.5 rounded-xl transition flex items-center gap-2 text-xs shadow-sm ${insight.type === 'ads' ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-[#00665E] hover:bg-[#004d46] text-white'}`}>
                                          {insight.action} <ArrowRight size={14}/>
                                      </button>
                                  </div>
                              </div>
                          </div>
                      ))}
                  </div>
              )}

              {/* SEZIONE: CHI FAR PAGARE / CON CHI COLLABORARE */}
              {hasScanned && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-bottom-8 mt-2">
                      {/* CHI FAR PAGARE */}
                      <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-3xl p-6">
                          <div className="flex items-center gap-3 mb-4">
                              <div className="bg-amber-500 p-2.5 rounded-xl text-white"><CreditCard size={20}/></div>
                              <div>
                                  <h3 className="font-black text-gray-900 text-base">Chi Far Pagare di Più</h3>
                                  <p className="text-[10px] text-amber-700 font-bold uppercase">Segmentazione Profittabilità</p>
                              </div>
                          </div>
                          <div className="space-y-3">
                              {[
                                  { segment: 'Clienti Premium (LTV > 500€)', action: 'Prezzi +20%, servizi esclusivi', badge: 'Alta priorità', color: 'bg-red-100 text-red-700' },
                                  { segment: 'Nuovi Clienti Zona Ricca', action: 'Pacchetti all-inclusive, no sconti', badge: 'Media', color: 'bg-amber-100 text-amber-700' },
                                  { segment: 'B2B e Professionisti', action: 'Contratti annuali con margine 35%+', badge: 'Potenziale', color: 'bg-blue-100 text-blue-700' },
                              ].map((s,i) => (
                                  <div key={i} className="bg-white rounded-2xl p-4 border border-amber-100 shadow-sm">
                                      <div className="flex justify-between items-start mb-1">
                                          <p className="font-bold text-gray-900 text-sm">{s.segment}</p>
                                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${s.color}`}>{s.badge}</span>
                                      </div>
                                      <p className="text-xs text-gray-500">{s.action}</p>
                                  </div>
                              ))}
                          </div>
                          <button onClick={() => router.push('/dashboard/crm')} className="mt-4 w-full bg-amber-500 text-white font-bold py-2.5 rounded-xl hover:bg-amber-600 flex items-center justify-center gap-2 text-sm">
                              <Users size={14}/> Segmenta nel CRM
                          </button>
                      </div>

                      {/* CON CHI COLLABORARE */}
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-3xl p-6">
                          <div className="flex items-center gap-3 mb-4">
                              <div className="bg-blue-600 p-2.5 rounded-xl text-white"><Handshake size={20}/></div>
                              <div>
                                  <h3 className="font-black text-gray-900 text-base">Con Chi Collaborare</h3>
                                  <p className="text-[10px] text-blue-700 font-bold uppercase">Opportunità di Partnership Locali</p>
                              </div>
                          </div>
                          <div className="space-y-3">
                              {[
                                  { partner: 'Palestre & Wellness Center', synergy: 'Cross-promo clienti salute/benessere', match: '95%' },
                                  { partner: 'Ristoranti Premium Area', synergy: 'Accordi regalo/cashback per clienti VIP', match: '88%' },
                                  { partner: 'Studi Professionali (CAF/Notai)', synergy: 'Referral B2B con commissione', match: '74%' },
                              ].map((p,i) => (
                                  <div key={i} className="bg-white rounded-2xl p-4 border border-blue-100 shadow-sm">
                                      <div className="flex justify-between items-start mb-1">
                                          <p className="font-bold text-gray-900 text-sm">{p.partner}</p>
                                          <span className="text-xs font-black text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">{p.match}</span>
                                      </div>
                                      <p className="text-xs text-gray-500">{p.synergy}</p>
                                  </div>
                              ))}
                          </div>
                          <button onClick={() => router.push('/dashboard/affiliation')} className="mt-4 w-full bg-blue-600 text-white font-bold py-2.5 rounded-xl hover:bg-blue-700 flex items-center justify-center gap-2 text-sm">
                              <Handshake size={14}/> Vai ad Affiliation Network
                          </button>
                      </div>
                  </div>
              )}

          </div>
      </div>
    </main>
  )
}