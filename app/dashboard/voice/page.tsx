'use client'

import { createClient } from '../../../utils/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
    PhoneCall, Mic, Settings, FileText, PhoneForwarded, 
    Infinity, PlayCircle, PauseCircle, Calendar, Clock, Volume2, Power, 
    Lock, Headphones, Zap, Loader2, BrainCircuit, Sparkles, User, Save, DollarSign
} from 'lucide-react'

export default function VoiceAgentPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [currentPlan, setCurrentPlan] = useState('Base')
  const [loading, setLoading] = useState(true)
  const [minutesUsed, setMinutesUsed] = useState(0)
  const [totalCost, setTotalCost] = useState(0)

  const supabase = createClient()

  // --- LIMITI PIANO (Minuti Mensili Consentiti) ---
  const limits: any = { 'Base': 30, 'Enterprise': 200, 'Ambassador': 1000 }

  // STATI UI
  const [agentActive, setAgentActive] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'settings'>('overview')
  const [isSaving, setIsSaving] = useState(false)
  
  // STATI AZIONI INTERATTIVE
  const [playingLogId, setPlayingLogId] = useState<number | null>(null)
  const [isOptimizing, setIsOptimizing] = useState(false)

  // STATI IMPOSTAZIONI AGENTE
  const [agentName, setAgentName] = useState('Sara (Assistente Virtuale)')
  const [voiceType, setVoiceType] = useState('female_it')
  const [humanForwardNumber, setHumanForwardNumber] = useState('+39 ')
  const [workHoursStart, setWorkHoursStart] = useState('09:00')
  const [workHoursEnd, setWorkHoursEnd] = useState('18:00')
  
  const [systemPrompt, setSystemPrompt] = useState('Sei l\'assistente della mia azienda. Rispondi alle chiamate per dare informazioni e prendere appuntamenti.')

  // MOCK LOG CHIAMATE
  const [callLogs, setCallLogs] = useState([
      { id: 1, date: 'Oggi, 10:30', caller: '+39 340 1122334', duration: '2m 15s', intent: 'Prenotazione', status: 'Risolto', transcript: 'Cliente: Salve, vorrei fissare una call per domani.\nAI: Certamente! Ho controllato l\'agenda, domani alle 15:00 è disponibile. Confermo?\nCliente: Perfetto, grazie.', action: 'App. aggiunto a calendario.' },
      { id: 2, date: 'Ieri, 18:45', caller: '+39 333 9988776', duration: '0m 45s', intent: 'Orari Chiusura', status: 'Risolto', transcript: 'Cliente: A che ora chiudete stasera?\nAI: Buonasera! Chiudiamo alle 18:00. Può inviare un\'email e le risponderemo domattina.', action: 'Nessuna.' },
      { id: 3, date: 'Ieri, 14:20', caller: '+39 328 4455667', duration: '4m 10s', intent: 'Emergenza', status: 'Inoltrato a Umano', transcript: 'Cliente: Ho un problema urgente.\nAI: La metto subito in contatto con un operatore umano specializzato. Attenda in linea.', action: 'Inoltrata a +39 333 1234567.' },
  ])

  useEffect(() => {
    const getData = async () => {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
          setUser(user)
          
          // 1. Carica Profilo e Utilizzo Reale
          const { data: profile } = await supabase.from('profiles').select('plan, usage_voice').eq('id', user.id).single()
          if (profile) {
              setCurrentPlan(profile.plan || 'Base')
              setMinutesUsed(profile.usage_voice || 0)
          }

          // 2. Carica Costi Extra (se presenti)
          const { data: metrics } = await supabase
            .from('usage_metrics')
            .select('cost_user')
            .eq('user_id', user.id)
            .eq('resource_type', 'voice_min')
            .eq('is_free', false)

          if (metrics) {
              const extra = metrics.reduce((acc: number, m: any) => acc + (m.cost_user || 0), 0)
              setTotalCost(extra)
          }
      }
      setLoading(false)
    }
    getData()
  }, [])

  const toggleAgent = async () => {
      if (!agentActive) {
          // Verifica se ha ancora credito o minuti
          const planLimit = limits[currentPlan] || 0
          if (minutesUsed >= planLimit && totalCost <= 0) {
              return alert(`⚠️ Hai esaurito i ${planLimit} minuti gratuiti del piano ${currentPlan}. Le prossime chiamate saranno tariffate a consumo (+40% markup). Configura un metodo di pagamento in Upgrade.`)
          }
      }
      setAgentActive(!agentActive)
  }

  const saveSettings = () => {
      setIsSaving(true)
      setTimeout(() => {
          setIsSaving(false)
          alert("✅ Impostazioni Centralino AI salvate con successo.")
      }, 1500)
  }

  const handlePlayAudio = (id: number) => {
      if (playingLogId === id) {
          setPlayingLogId(null) // Mette in pausa
          return
      }
      setPlayingLogId(id)
      // Simula la fine dell'audio dopo 5 secondi
      setTimeout(() => {
          setPlayingLogId(current => current === id ? null : current)
      }, 5000)
  }

  const handleOptimizePrompt = () => {
      if (!systemPrompt.trim()) return alert("Scrivi almeno una bozza prima di ottimizzare!")
      setIsOptimizing(true)
      setTimeout(() => {
          setSystemPrompt(`Sei l'assistente vocale ufficiale di IntegraOS. 
Tono di voce: Professionale, accogliente ed empatico.

Obiettivi principali:
1. Fornire orari e informazioni di base in modo rapido e chiaro.
2. Fissare appuntamenti qualificati raccogliendo Nome, Cognome e Motivo della chiamata.
3. Smistare le emergenze o i clienti arrabbiati al supporto umano.

Regola d'oro: Sii conciso. Usa frasi brevi, adatte a una conversazione telefonica. Non usare mai elenchi puntati o formattazioni markdown, parla come un essere umano.`)
          setIsOptimizing(false)
      }, 2000)
  }

  if (loading) return <div className="p-10 text-[#00665E] font-bold animate-pulse">Inizializzazione Reti Neurali Vocali...</div>

  return (
    <main className="flex-1 overflow-auto bg-[#F8FAFC] text-gray-900 font-sans min-h-screen pb-20">
      
      {/* HEADER E LIMITI */}
      <div className="flex flex-col md:flex-row justify-between items-center border-b border-gray-200 p-8 bg-white shadow-sm z-10 relative">
        <div>
          <h1 className="text-3xl font-black text-[#00665E] flex items-center gap-3">
              <PhoneCall size={32} className="text-[#00665E]"/> AI Voice Agent
          </h1>
          <p className="text-gray-500 text-sm mt-1">Centralino intelligente che risponde, fissa appuntamenti e smista le chiamate 24/7.</p>
        </div>
        
            <div className="flex items-center gap-4 mt-4 md:mt-0">
                {/* INDICATORE LIMITI UTILIZZO */}
                <div className="bg-gray-50 border border-gray-200 px-4 py-2 rounded-xl flex items-center gap-3">
                    <Volume2 className={currentPlan === 'Ambassador' ? "text-purple-500" : "text-[#00665E]"} size={20}/>
                    <div className="flex flex-col items-start text-[11px]">
                        <span className="font-bold text-gray-400 uppercase tracking-widest">Minuti Inclusi ({currentPlan})</span>
                        <span className={`font-bold ${currentPlan === 'Ambassador' ? 'text-purple-600 border-purple-200' : (minutesUsed >= limits[currentPlan] ? 'text-amber-500' : 'text-gray-800')}`}>
                            {currentPlan === 'Ambassador' ? <span className="flex items-center gap-1"><Infinity size={14}/> Illimitati</span> : `${minutesUsed} / ${limits[currentPlan]} min`}
                        </span>
                    </div>
                </div>

                {/* COSTI EXTRA MATURATI (+40% Markup) */}
                {totalCost > 0 && (
                    <div className="bg-amber-50 border border-amber-200 px-4 py-2 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-right-4">
                        <DollarSign className="text-amber-600" size={18}/>
                        <div className="flex flex-col items-start">
                            <span className="text-[9px] font-bold text-amber-600 uppercase tracking-widest leading-none">Costi Extra (Pay-as-you-go)</span>
                            <span className="font-black text-sm text-gray-900 leading-tight">€ {totalCost.toFixed(2)}</span>
                        </div>
                    </div>
                )}

                {currentPlan !== 'Ambassador' && (
                    <button onClick={() => router.push('/dashboard/upgrade?plan=Ambassador')} className="bg-gray-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-black transition shadow-md">
                        {totalCost > 0 ? 'Gestisci Saldo' : 'Ricarica Minuti'}
                    </button>
                )}
            </div>
      </div>

      {/* CONTROLLO PRINCIPALE E TABS */}
      <div className="bg-white border-b border-gray-200 px-8 py-4 flex flex-wrap items-center justify-between sticky top-0 z-20 shadow-sm">
          <div className="flex gap-2">
              <button onClick={() => setActiveTab('overview')} className={`px-5 py-2 rounded-lg font-bold text-sm transition ${activeTab === 'overview' ? 'bg-[#00665E] text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}>Monitoraggio Live</button>
              <button onClick={() => setActiveTab('settings')} className={`px-5 py-2 rounded-lg font-bold text-sm transition ${activeTab === 'settings' ? 'bg-[#00665E] text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}>Configurazione Centralino</button>
          </div>
          
          <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Stato Linea Telefonica:</span>
              <button 
                  onClick={toggleAgent} 
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-black text-sm shadow-md transition-all duration-300 ${agentActive ? 'bg-red-500 hover:bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'bg-emerald-500 hover:bg-emerald-600 text-white'}`}
              >
                  <Power size={16}/> {agentActive ? 'Spegni Agente' : 'Accendi Agente AI'}
              </button>
          </div>
      </div>

      <div className="p-8 max-w-7xl mx-auto">
          
          {/* TAB 1: MONITORAGGIO */}
          {activeTab === 'overview' && (
              <div className="space-y-8 animate-in fade-in">
                  
                  {/* DASHBOARD STATUS */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-1 bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 border border-slate-700 shadow-xl relative overflow-hidden flex flex-col items-center justify-center text-center">
                          {agentActive ? (
                              <>
                                  <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4 relative">
                                      <div className="absolute inset-0 border-4 border-emerald-500 rounded-full animate-ping opacity-20"></div>
                                      <Mic size={40} className="text-emerald-400"/>
                                  </div>
                                  <h2 className="text-2xl font-black text-white mb-1">In Ascolto</h2>
                                  <p className="text-emerald-400 font-medium text-sm">Numero: +39 02 1234567</p>
                              </>
                          ) : (
                              <>
                                  <div className="w-24 h-24 bg-slate-700 rounded-full flex items-center justify-center mb-4 text-slate-500"><Mic size={40}/></div>
                                  <h2 className="text-2xl font-black text-white mb-1">Agente Offline</h2>
                                  <p className="text-slate-400 font-medium text-sm">Nessuna deviazione attiva.</p>
                              </>
                          )}
                      </div>

                      <div className="lg:col-span-2 grid grid-cols-2 gap-4">
                          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm flex flex-col justify-center">
                              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2"><PhoneForwarded size={16}/> Chiamate Oggi</p>
                              <p className="text-4xl font-black text-[#00665E]">12</p>
                          </div>
                          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm flex flex-col justify-center">
                              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2"><Clock size={16}/> Tempo Risparmiato</p>
                              <p className="text-4xl font-black text-blue-600">3h 45m</p>
                          </div>
                      </div>
                  </div>

                  {/* REGISTRO CHIAMATE (TRANSCRIPTS E AUDIO) */}
                  <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
                      <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                          <h3 className="font-black text-gray-900 flex items-center gap-2"><FileText className="text-[#00665E]"/> Trascrizioni e Audio Chiamate</h3>
                      </div>
                      
                      <div className="divide-y divide-gray-100">
                          {callLogs.map((log) => (
                              <div key={log.id} className="p-6 hover:bg-gray-50 transition">
                                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
                                      <div className="flex items-center gap-4">
                                          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0"><Headphones size={20}/></div>
                                          <div>
                                              <p className="font-bold text-gray-900">{log.caller}</p>
                                              <p className="text-xs text-gray-500">{log.date} • Durata: {log.duration}</p>
                                          </div>
                                      </div>
                                      <div className="flex items-center gap-3">
                                          <span className="text-[10px] font-bold uppercase tracking-widest bg-gray-100 text-gray-600 px-2 py-1 rounded">{log.intent}</span>
                                          <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded border ${log.status === 'Risolto' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>{log.status}</span>
                                      </div>
                                  </div>
                                  <div className={`rounded-xl p-4 relative transition-colors ${playingLogId === log.id ? 'bg-blue-50 border border-blue-100' : 'bg-gray-100 border border-transparent'}`}>
                                      
                                      {/* BOTTONE PLAY/PAUSE INTERATTIVO */}
                                      <button 
                                          onClick={() => handlePlayAudio(log.id)} 
                                          className={`absolute top-4 right-4 transition ${playingLogId === log.id ? 'text-blue-600' : 'text-gray-400 hover:text-[#00665E]'}`}
                                          title={playingLogId === log.id ? "Pausa registrazione" : "Ascolta registrazione"}
                                      >
                                          {playingLogId === log.id ? <PauseCircle size={24} className="animate-pulse"/> : <PlayCircle size={24}/>}
                                      </button>

                                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                          {playingLogId === log.id && <span className="flex gap-0.5"><span className="w-1 h-3 bg-blue-500 animate-pulse delay-75"></span><span className="w-1 h-2 bg-blue-500 animate-pulse delay-100"></span><span className="w-1 h-4 bg-blue-500 animate-pulse delay-150"></span></span>}
                                          Trascrizione AI (Speech-to-Text)
                                      </p>
                                      <div className="text-sm text-gray-700 whitespace-pre-line leading-relaxed italic">"{log.transcript}"</div>
                                  </div>
                                  <div className="mt-3 flex items-center gap-2 text-xs font-bold text-[#00665E]">
                                      <Zap size={14}/> Azione: <span className="text-gray-600">{log.action}</span>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          )}

          {/* TAB 2: CONFIGURAZIONE */}
          {activeTab === 'settings' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in">
                  
                  <div className="lg:col-span-1 space-y-6">
                      
                      <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
                          <h3 className="font-black text-gray-900 mb-6 flex items-center gap-2"><Settings size={18} className="text-[#00665E]"/> Parametri Generali</h3>
                          
                          <div className="space-y-5">
                              <div>
                                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">Nome Assistente</label>
                                  <input type="text" value={agentName} onChange={e => setAgentName(e.target.value)} className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl outline-none focus:border-[#00665E] text-sm font-bold text-gray-800"/>
                              </div>
                              
                              <div>
                                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">Genere e Timbro Vocale</label>
                                  <select value={voiceType} onChange={e => setVoiceType(e.target.value)} className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl outline-none focus:border-[#00665E] text-sm font-bold text-gray-800 cursor-pointer">
                                      <option value="female_it">Voce Femminile (Cortese e Calma)</option>
                                      <option value="male_it">Voce Maschile (Professionale e Seria)</option>
                                      <option value="female_en" disabled={currentPlan === 'Base'}>English Female {currentPlan === 'Base' ? '🔒' : ''}</option>
                                  </select>
                                  {currentPlan === 'Base' && <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1"><Lock size={10}/> Lingue straniere richiedono Enterprise.</p>}
                              </div>
                          </div>
                      </div>

                      <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
                          <h3 className="font-black text-gray-900 mb-6 flex items-center gap-2"><PhoneForwarded size={18} className="text-amber-500"/> Regole Operatore Umano</h3>
                          
                          <div className="space-y-5">
                              <div>
                                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">Orari di Lavoro (Supporto Umano)</label>
                                  <div className="flex gap-2 items-center">
                                      <input type="time" value={workHoursStart} onChange={e => setWorkHoursStart(e.target.value)} className="w-1/2 bg-gray-50 border border-gray-200 p-2.5 rounded-xl outline-none text-sm font-bold text-gray-800 text-center"/>
                                      <span className="text-gray-400 font-bold">-</span>
                                      <input type="time" value={workHoursEnd} onChange={e => setWorkHoursEnd(e.target.value)} className="w-1/2 bg-gray-50 border border-gray-200 p-2.5 rounded-xl outline-none text-sm font-bold text-gray-800 text-center"/>
                                  </div>
                                  <p className="text-[10px] text-gray-500 mt-2 leading-relaxed">Fuori da questi orari, l'AI gestirà la conversazione senza tentare di passare la chiamata ai tuoi dipendenti.</p>
                              </div>

                              <div>
                                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">Numero per l'inoltro</label>
                                  <div className="relative">
                                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                                      <input type="text" value={humanForwardNumber} onChange={e => setHumanForwardNumber(e.target.value)} placeholder="+39 333..." className="w-full bg-gray-50 border border-gray-200 p-3 pl-10 rounded-xl outline-none focus:border-[#00665E] text-sm font-bold text-gray-800"/>
                                  </div>
                              </div>
                          </div>
                      </div>

                      <button 
                          onClick={saveSettings} 
                          disabled={isSaving} 
                          className="w-full bg-[#00665E] text-white font-black py-4 rounded-xl hover:bg-[#004d46] shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                          {isSaving ? <Loader2 size={18} className="animate-spin"/> : <Save size={18}/>}
                          <span>{isSaving ? 'Salvataggio...' : 'Salva Configurazione'}</span>
                      </button>

                  </div>

                  <div className="lg:col-span-2">
                      <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm h-full flex flex-col">
                          <div className="flex items-center justify-between mb-6">
                              <div>
                                  <h3 className="font-black text-gray-900 text-xl flex items-center gap-2"><BrainCircuit className="text-purple-600"/> Contesto Aziendale (Prompt)</h3>
                                  <p className="text-xs text-gray-500 mt-1">Spiega all'AI come deve gestire la conversazione, come se parlassi a un tuo dipendente.</p>
                              </div>
                              
                              {/* PULSANTE OTTIMIZZA TESTO FUNZIONANTE */}
                              <button 
                                  onClick={handleOptimizePrompt}
                                  disabled={isOptimizing}
                                  className="text-[#00665E] text-xs font-bold flex items-center gap-1 bg-teal-50 px-4 py-2 rounded-lg border border-teal-100 hover:bg-teal-100 transition shadow-sm disabled:opacity-50"
                              >
                                  {isOptimizing ? <Loader2 size={14} className="animate-spin"/> : <Sparkles size={14}/>}
                                  {isOptimizing ? 'Ottimizzazione...' : 'Ottimizza Testo AI'}
                              </button>
                          </div>

                          <textarea 
                              value={systemPrompt}
                              onChange={e => setSystemPrompt(e.target.value)}
                              className="flex-1 w-full bg-slate-50 border border-slate-200 p-5 rounded-2xl outline-none focus:border-purple-500 font-mono text-sm leading-relaxed resize-none text-slate-700 shadow-inner min-h-[300px]"
                              placeholder="Esempio: Sei l'assistente della Pizzeria Da Marco. Il tuo obiettivo è prendere ordini per l'asporto e dire che per il domicilio ci vogliono 40 minuti..."
                          />

                          <div className="mt-6 grid grid-cols-2 gap-4">
                              <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl">
                                  <p className="text-xs font-bold text-blue-800 uppercase tracking-widest mb-1 flex items-center gap-1"><Calendar size={14}/> Potere Esecutivo</p>
                                  <p className="text-xs text-blue-600 font-medium">L'agente ha il permesso di creare eventi nel calendario aziendale.</p>
                              </div>
                              <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl">
                                  <p className="text-xs font-bold text-emerald-800 uppercase tracking-widest mb-1 flex items-center gap-1"><Zap size={14}/> Connessione Dati</p>
                                  <p className="text-xs text-emerald-600 font-medium">L'agente legge i nomi dei clienti se il loro numero è salvato nel CRM.</p>
                              </div>
                          </div>
                      </div>
                  </div>

              </div>
          )}

      </div>
    </main>
  )
}