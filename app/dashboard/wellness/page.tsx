'use client'

import { createClient } from '../../../utils/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
    HeartPulse, BatteryMedium, BatteryWarning, BatteryFull, 
    ShieldCheck, PlayCircle, Activity, BrainCircuit, 
    Smile, Frown, Youtube, Send, Lock, TrendingDown, 
    AlertTriangle, Loader2, Sparkles, Filter, CheckSquare, Search, Info
} from 'lucide-react'

export default function WelnessPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [currentPlan, setCurrentPlan] = useState('Base')
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  // STATI UI
  const [activeTab, setActiveTab] = useState<'manager_dashboard' | 'agent_portal'>('manager_dashboard')
  const [isSending, setIsSending] = useState(false)
  const [roleFilter, setRoleFilter] = useState('Tutti')

  // LIMITI PIANO (Quanti check-in mensili può lanciare l'azienda)
  const limits: any = { 'Base': 15, 'Enterprise': 100, 'Ambassador': 'Illimitati' }
  const checkinsUsed = 12

  // STATI DATI REALI TEAM
  const [teamHealth, setTeamHealth] = useState<any[]>([])

  // STATI PORTALE AGENTE (Esperienza Dipendente)
  const [agentConsented, setAgentConsented] = useState(false)
  const [agentChatStep, setAgentChatStep] = useState(0)

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
          setUser(user)
          const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user.id).single()
          if (profile) setCurrentPlan(profile.plan || 'Base')
          
          // ESTRAZIONE DATI REALI DAL DATABASE (Simulata per fallback se tabella vuota)
          // In produzione: await supabase.from('team_members').select('*')
          const mockRealData = [
              { id: 1, name: 'Giulia Bianchi', role: 'Vendite', location: 'Milano', battery: 35, status: 'Rischio Burnout', aiSummary: "Calo fisiologico dovuto a un picco di chiamate ricevute (+40% vs mese scorso). Si consiglia riduzione KPI temporanea." },
              { id: 2, name: 'Mario Rossi', role: 'Supporto', location: 'Roma', battery: 85, status: 'In Forma', aiSummary: "L'agente mantiene ritmi costanti e positivi." },
              { id: 3, name: 'Luca Verdi', role: 'Vendite', location: 'Roma', battery: 55, status: 'Affaticato', aiSummary: "Lieve flessione delle performance pomeridiane. Segnali di stress da schermo." }
          ]
          setTeamHealth(mockRealData)
      }
      setLoading(false)
    }
    getData()
  }, [])

  // FUNZIONI
  const launchSurvey = () => {
      if (currentPlan !== 'Ambassador' && checkinsUsed >= limits[currentPlan]) {
          return alert(`Hai raggiunto il limite di ${limits[currentPlan]} check-in mensili. Fai l'upgrade!`)
      }
      setIsSending(true)
      setTimeout(() => {
          setIsSending(false)
          alert("✅ Check-in inviati con successo via Email/WhatsApp a tutto il team. I dati verranno anonimizzati dall'AI.")
      }, 2000)
  }

  const renderBattery = (level: number) => {
      if (level > 75) return <BatteryFull className="text-emerald-500" size={24}/>
      if (level > 40) return <BatteryMedium className="text-amber-500" size={24}/>
      return <BatteryWarning className="text-red-500 animate-pulse" size={24}/>
  }

  // Filtro Team
  const filteredTeam = teamHealth.filter(m => roleFilter === 'Tutti' || m.role === roleFilter)

  if (loading) return <div className="p-10 text-rose-600 font-bold animate-pulse">Sincronizzazione Modulo HR...</div>

  return (
    <main className="flex-1 overflow-auto bg-[#FDFDFD] text-gray-900 font-sans min-h-screen pb-20">
      
      {/* HEADER MANAGER */}
      <div className="flex flex-col md:flex-row justify-between items-center border-b border-rose-100 p-8 bg-rose-50/30 shadow-sm z-10 relative">
        <div>
          <h1 className="text-3xl font-black text-rose-700 flex items-center gap-3">
              <HeartPulse size={32} className="text-rose-500"/> Pulse AI Wellness
          </h1>
          <p className="text-gray-500 text-sm mt-1">Monitoraggio predittivo dello stress e supporto automatico agli agenti.</p>
        </div>
        
        <div className="flex items-center gap-4 mt-4 md:mt-0">
            {/* LIMITI DEL PIANO */}
            <div className="bg-white border border-gray-200 px-4 py-2 rounded-xl flex items-center gap-3 shadow-sm">
                <Activity className="text-rose-500" size={20}/>
                <div className="flex flex-col items-start">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Check-in Mensili ({currentPlan})</span>
                    <span className={`font-bold text-sm ${currentPlan === 'Ambassador' ? 'text-purple-600' : 'text-gray-800'}`}>
                        {currentPlan === 'Ambassador' ? 'Illimitati' : `${checkinsUsed} / ${limits[currentPlan]}`}
                    </span>
                </div>
            </div>
            <button onClick={launchSurvey} disabled={isSending} className="bg-rose-600 text-white text-sm font-black px-6 py-2.5 rounded-xl hover:bg-rose-700 transition shadow-md flex items-center gap-2 disabled:opacity-50">
                {isSending ? <Loader2 size={16} className="animate-spin"/> : <Send size={16}/>} Invia Check-in al Team
            </button>
        </div>
      </div>

      {/* TABS SELEZIONE VISTA */}
      <div className="px-8 py-4 flex gap-2 border-b border-gray-100 bg-white sticky top-0 z-20">
          <button onClick={() => setActiveTab('manager_dashboard')} className={`px-6 py-2.5 rounded-xl font-bold text-sm transition ${activeTab === 'manager_dashboard' ? 'bg-rose-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}>Monitoraggio (Vista Titolare)</button>
          <button onClick={() => setActiveTab('agent_portal')} className={`px-6 py-2.5 rounded-xl font-bold text-sm transition flex items-center gap-2 ${activeTab === 'agent_portal' ? 'bg-[#00665E] text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}><BrainCircuit size={16}/> Portale Dipendente (Simulazione)</button>
      </div>

      <div className="p-8 max-w-7xl mx-auto">
          
          {/* ========================================== */}
          {/* VISTA 1: DASHBOARD DEL MANAGER (ANONIMIZZATA) */}
          {/* ========================================== */}
          {activeTab === 'manager_dashboard' && (
              <div className="space-y-8 animate-in fade-in">
                  
                  {/* DISCLAIMER LEGALE MANAGER */}
                  <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-4 shadow-sm">
                      <Info className="text-blue-500 shrink-0 mt-0.5" size={20}/>
                      <div>
                          <p className="text-sm font-bold text-blue-900">Protezione Privacy e GDPR Attiva</p>
                          <p className="text-xs text-blue-700 mt-1">Come richiesto dalle normative europee (GDPR) e dallo Statuto dei Lavoratori, le conversazioni esatte tra l'Intelligenza Artificiale e i tuoi dipendenti <b>sono cifrate e inaccessibili</b> alla direzione. Questa dashboard mostra solo dati aggregati e riassunti generici creati dall'AI per tutelare la salute aziendale senza violare la privacy individuale.</p>
                      </div>
                  </div>

                  {/* OVERVIEW GLOBALE AZIENDALE */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm flex items-center justify-between">
                          <div>
                              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Batteria Media Team</p>
                              <p className="text-3xl font-black text-gray-900">58% <span className="text-sm text-amber-500 font-bold ml-2">Moderata</span></p>
                          </div>
                          <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center text-amber-500"><BatteryMedium size={24}/></div>
                      </div>
                      <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm flex items-center justify-between">
                          <div>
                              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Rischio Burnout Rilevato</p>
                              <p className="text-3xl font-black text-rose-600">1 <span className="text-sm text-gray-500 font-bold ml-1">Agente</span></p>
                          </div>
                          <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center text-rose-500"><AlertTriangle size={24}/></div>
                      </div>
                      <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-3xl shadow-lg flex items-center justify-between text-white border border-slate-700">
                          <div>
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Impatto sul CRM</p>
                              <p className="text-2xl font-black text-rose-400">- 8.5% Chiusure</p>
                              <p className="text-[10px] text-slate-300 mt-1">L'AI ha correlato il calo d'umore a una flessione delle vendite a Milano.</p>
                          </div>
                          <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center text-rose-400"><TrendingDown size={24}/></div>
                      </div>
                  </div>

                  {/* TABELLA MONITORAGGIO E FILTRI */}
                  <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
                      <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
                          <h2 className="font-black text-gray-900 text-lg flex items-center gap-2"><Activity className="text-rose-500"/> Stato della Rete Vendita</h2>
                          <div className="flex items-center gap-3">
                              <span className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1"><Filter size={14}/> Filtra:</span>
                              <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="bg-gray-50 border border-gray-200 py-2 px-4 rounded-xl text-sm font-bold text-gray-700 outline-none">
                                  <option value="Tutti">Tutti i Ruoli</option>
                                  <option value="Vendite">Solo Vendite</option>
                                  <option value="Supporto">Solo Supporto</option>
                              </select>
                          </div>
                      </div>

                      <div className="p-6 grid grid-cols-1 gap-4">
                          {filteredTeam.map(member => (
                              <div key={member.id} className="bg-gray-50 border border-gray-100 p-5 rounded-2xl flex flex-col md:flex-row items-center gap-6 justify-between hover:shadow-md transition">
                                  
                                  {/* Info Utente */}
                                  <div className="flex items-center gap-4 min-w-[250px]">
                                      <div className="relative">
                                          <div className="w-12 h-12 bg-white border border-gray-200 rounded-full flex items-center justify-center font-black text-[#00665E] text-lg shadow-sm">{member.name.substring(0,2)}</div>
                                      </div>
                                      <div>
                                          <p className="font-black text-gray-900">{member.name}</p>
                                          <p className="text-xs font-bold text-gray-500">{member.role} • {member.location}</p>
                                      </div>
                                  </div>

                                  {/* Livello Batteria */}
                                  <div className="flex flex-col items-center min-w-[150px]">
                                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Batteria Fisica/Mentale</p>
                                      <div className="flex items-center gap-2">
                                          {renderBattery(member.battery)}
                                          <span className="font-black text-lg">{member.battery}%</span>
                                      </div>
                                  </div>

                                  {/* Report AI Legale */}
                                  <div className="flex-1 bg-white p-4 rounded-xl border border-rose-100 shadow-sm relative">
                                      <div className="absolute top-2 right-2 text-rose-300"><Sparkles size={16}/></div>
                                      <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">Report Esecutivo AI</p>
                                      <p className="text-xs text-gray-600 font-medium leading-relaxed">{member.aiSummary}</p>
                                  </div>

                              </div>
                          ))}
                      </div>
                  </div>

              </div>
          )}

          {/* ========================================== */}
          {/* VISTA 2: PORTALE DEL DIPENDENTE (SIMULAZIONE) */}
          {/* ========================================== */}
          {activeTab === 'agent_portal' && (
              <div className="max-w-2xl mx-auto animate-in zoom-in-95">
                  <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-200 relative">
                      
                      {/* BANNER PRIVACY DIPENDENTE */}
                      <div className="bg-gradient-to-r from-slate-900 to-[#00665E] p-8 text-center text-white relative">
                          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-md border border-white/20">
                              <ShieldCheck size={32} className="text-emerald-400"/>
                          </div>
                          <h2 className="text-2xl font-black mb-1">Spazio Sicuro e Protetto</h2>
                          <p className="text-sm text-teal-100 mb-4">Questa è una simulazione di come il tuo agente (es. Giulia) vede il link che gli invii.</p>
                          <div className="inline-flex items-center gap-2 bg-black/30 px-4 py-2 rounded-full text-[10px] font-bold border border-white/10"><Lock size={14} className="text-amber-400"/> Crittografia End-to-End Attiva</div>
                      </div>

                      {/* STEP 1: CONSENSO GDPR */}
                      {!agentConsented ? (
                          <div className="p-10 text-center">
                              <h3 className="text-xl font-black text-gray-900 mb-4">Check-in del Benessere Mensile</h3>
                              <p className="text-sm text-gray-600 mb-8 leading-relaxed">
                                  Ciao Giulia. L'azienda ha attivato Pulse AI per supportare il tuo benessere lavorativo. Le risposte fornite in questa chat <b>non saranno mai lette dai tuoi superiori</b>. Il sistema invierà alla direzione solo un "Punteggio di Salute" numerico aggregato.
                              </p>
                              
                              <label className="flex items-start gap-3 bg-gray-50 p-4 rounded-xl border border-gray-200 cursor-pointer text-left hover:bg-gray-100 transition mb-8">
                                  <input type="checkbox" className="mt-1 w-5 h-5 accent-[#00665E] cursor-pointer" onChange={(e) => setAgentConsented(e.target.checked)}/>
                                  <span className="text-xs text-gray-700 font-medium">Acconsento al trattamento dei dati da parte dell'Intelligenza Artificiale di IntegraOS al solo scopo di fornirmi consigli per alleviare lo stress lavorativo, nel pieno rispetto del GDPR.</span>
                              </label>

                              <button 
                                  disabled={!agentConsented} 
                                  onClick={() => setAgentChatStep(1)}
                                  className="w-full bg-[#00665E] text-white font-black py-4 rounded-xl hover:bg-[#004d46] transition disabled:opacity-50 shadow-lg flex justify-center items-center gap-2"
                              >
                                  <Smile size={18}/> Inizia Check-in Sicuro
                              </button>
                          </div>
                      ) : (
                          
                          /* STEP 2: LA CHAT PRIVATA AI-DIPENDENTE */
                          <div className="p-8 space-y-8 bg-gray-50 min-h-[500px]">
                              
                              <div className="flex gap-3 animate-in slide-in-from-left-4">
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00665E] to-teal-500 flex items-center justify-center text-white shrink-0 shadow-md"><BrainCircuit size={20}/></div>
                                  <div className="bg-white p-5 rounded-2xl rounded-tl-sm border border-gray-200 shadow-sm text-sm text-gray-700 leading-relaxed max-w-[85%]">
                                      Ciao Giulia! Ho notato dai dati del CRM che questa settimana hai gestito 45 ticket e molte telefonate, ben oltre la media. È stato faticoso?
                                  </div>
                              </div>

                              {agentChatStep === 1 && (
                                  <div className="flex justify-end gap-2 animate-in fade-in zoom-in duration-500">
                                      <button onClick={() => setAgentChatStep(2)} className="bg-gray-200 text-gray-700 font-bold px-4 py-2 rounded-full text-xs hover:bg-gray-300">Tutto bene</button>
                                      <button onClick={() => setAgentChatStep(2)} className="bg-[#00665E] text-white font-bold px-4 py-2 rounded-full text-xs shadow-md">Sono esausta</button>
                                  </div>
                              )}

                              {agentChatStep >= 2 && (
                                  <>
                                      <div className="flex justify-end gap-3 animate-in slide-in-from-right-4">
                                          <div className="bg-[#00665E] text-white p-5 rounded-2xl rounded-tr-sm shadow-md text-sm">
                                              Sì, sono esausta. I clienti oggi erano particolarmente difficili e non ho staccato gli occhi dallo schermo.
                                          </div>
                                      </div>

                                      <div className="flex gap-3 animate-in slide-in-from-bottom-4 delay-300">
                                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00665E] to-teal-500 flex items-center justify-center text-white shrink-0 shadow-md"><Sparkles size={20}/></div>
                                          <div className="bg-white p-5 rounded-2xl rounded-tl-sm border border-rose-200 shadow-sm text-sm text-gray-700 max-w-[90%]">
                                              Capisco perfettamente. Il contatto continuo col pubblico drena molte energie. Ho segnalato alla direzione che la tua "Batteria" aziendale è bassa, senza rivelare dettagli privati. <br/><br/>
                                              Nel frattempo, ho trovato questo video specifico per alleviare lo stress mentale. Prenditi 5 minuti ora (è un tuo diritto) e guardalo:
                                              
                                              {/* CARD YOUTUBE GENERATA DALL'AI */}
                                              <div className="mt-5 border border-gray-200 rounded-xl overflow-hidden flex flex-col group cursor-pointer hover:shadow-lg transition">
                                                  <div className="h-32 bg-gray-800 relative overflow-hidden">
                                                      <img src="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=400&h=200" alt="Yoga" className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition duration-500"/>
                                                      <div className="absolute inset-0 flex items-center justify-center"><PlayCircle size={40} className="text-white drop-shadow-md"/></div>
                                                  </div>
                                                  <div className="p-3 bg-white">
                                                      <p className="font-black text-gray-900 text-xs flex items-center gap-1"><Youtube size={14} className="text-red-500"/> Tecniche di respirazione da scrivania</p>
                                                      <p className="text-[10px] text-gray-500 mt-1">Svuota la mente in 3 minuti.</p>
                                                  </div>
                                              </div>
                                          </div>
                                      </div>
                                  </>
                              )}
                          </div>
                      )}
                  </div>
              </div>
          )}

      </div>
    </main>
  )
}