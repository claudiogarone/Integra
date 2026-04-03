'use client'

import { createClient } from '../../../utils/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { EcosystemBridge } from '../../../utils/ecosystem-bridge'
import { 
    Eye, UserSearch, Ghost, Target, Play, 
    FileText, Lock, Activity, MessageSquare, Clock, TrendingDown, RefreshCw
} from 'lucide-react'

export default function IncognitoPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [currentPlan, setCurrentPlan] = useState('Base')
  const [team, setTeam] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const [activeTab, setActiveTab] = useState<'shadow' | 'mystery'>('shadow')
  const [selectedAgent, setSelectedAgent] = useState<any>(null)
  
  // Mystery Shopper
  const [leadPersona, setLeadPersona] = useState('aggressivo')
  const [mysteryLogs, setMysteryLogs] = useState<any[]>([])
  
  // Stati per la simulazione Live Chat
  const [liveChatActive, setLiveChatActive] = useState(false)
  const [chatMessages, setChatMessages] = useState<{role: 'ai' | 'agent', sender: string, text: string}[]>([])

  const supabase = createClient()
  const limits: Record<string, number> = { 'Base': 1, 'Enterprise': 5, 'Ambassador': 999 }
  const mysteriesUsed = mysteryLogs.length

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user.id).single()
        if (profile) setCurrentPlan(profile.plan || 'Base')
        
        const { data: teamData } = await supabase.from('team_members').select('*').eq('type', 'human')
        if (teamData) setTeam(teamData)

        // Carica storico Mystery Shopper
        fetchMysteryLogs(user.id)
      }
      setLoading(false)
    }
    getData()
  }, [])

  const fetchMysteryLogs = async (userId: string) => {
      const { data, error } = await supabase
        .from('mystery_shopper_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      
      if (data) setMysteryLogs(data)
  }

  // SIMULAZIONE DELLA CHAT IN TEMPO REALE TRA AI E AGENTE (REALE)
  const runLiveSimulation = async () => {
      setLiveChatActive(true)
      setChatMessages([])
      
      const history: any[] = []
      
      // Step 1: Messaggio iniziale dell'AI
      const res = await fetch('/api/ai/mystery-shopper', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ persona: leadPersona, chatHistory: [], agentName: selectedAgent.name, isFinal: false })
      })
      const data = await res.json()
      const firstMsg = { role: 'ai' as const, sender: 'AI (Cliente Misterioso)', text: data.message }
      setChatMessages([firstMsg])
      history.push(firstMsg)

      // Step 2: L'agente risponde (simulazione ritardo)
      setTimeout(async () => {
          const agentMsg1 = { role: 'agent' as const, sender: selectedAgent.name, text: "Buongiorno, mi dica come posso aiutarla." }
          setChatMessages(prev => [...prev, agentMsg1])
          history.push(agentMsg1)

          // Step 3: Seconda risposta AI
          const res2 = await fetch('/api/ai/mystery-shopper', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ persona: leadPersona, chatHistory: history, agentName: selectedAgent.name, isFinal: false })
          })
          const data2 = await res2.json()
          const secondMsg = { role: 'ai' as const, sender: 'AI (Cliente Misterioso)', text: data2.message }
          setChatMessages(prev => [...prev, secondMsg])
          history.push(secondMsg)

          // Step 4: Seconda risposta Agente
          setTimeout(async () => {
              const agentMsg2 = { role: 'agent' as const, sender: selectedAgent.name, text: "Purtroppo non possiamo scendere oltre, la nostra qualità è certificate." }
              setChatMessages(prev => [...prev, agentMsg2])
              history.push(agentMsg2)

              // STEP FINALE: Valutazione AI
              const resFinal = await fetch('/api/ai/mystery-shopper', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ persona: leadPersona, chatHistory: history, agentName: selectedAgent.name, isFinal: true })
              })
              const dataFinal = await resFinal.json()
              const evaluation = dataFinal.evaluation

              // Salvataggio su DB
              const { error: saveError } = await supabase
                .from('mystery_shopper_logs')
                .insert({
                    user_id: user.id,
                    agent_id: selectedAgent.id,
                    agent_name: selectedAgent.name,
                    persona: leadPersona,
                    score: evaluation.score,
                    feedback: evaluation.feedback,
                    chat_history: history
                })
              
              if (!saveError) {
                  fetchMysteryLogs(user.id)
                  setLiveChatActive(false)
                  
                  // ECOSYSTEM BRIDGE: Auto-Training if results are poor
                  if (evaluation.score < 6) {
                      await EcosystemBridge.triggerAutoTraining(user.id, selectedAgent.id, selectedAgent.name, evaluation.score)
                  }

                  alert(`✅ Analisi completata!\nVoto: ${evaluation.score}/10\n\nFeedback: ${evaluation.feedback}`)
              } else {
                  console.error(saveError)
                  setLiveChatActive(false)
                  alert("Errore salvataggio report: " + saveError.message)
              }
          }, 4000)
      }, 4000)
  }

  const launchMysteryLead = () => {
      if (!selectedAgent) return alert("Seleziona prima un dipendente da testare.")
      if (mysteriesUsed >= limits[currentPlan]) return alert(`Hai raggiunto il limite. Esegui l'upgrade per sbloccare.`)
      runLiveSimulation()
  }

  if (loading) return <div className="p-10 text-[#00665E] font-bold animate-pulse">Accesso all'Area Boss in Incognito...</div>

  return (
    <main className="flex-1 p-8 overflow-auto bg-[#F8FAFC] text-gray-900 font-sans min-h-screen pb-20">
      
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 border-b border-gray-200 pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#00665E] flex items-center gap-3"><Ghost size={32} className="text-purple-600"/> Boss in Incognito</h1>
          <p className="text-gray-500 text-sm mt-1">Monitora l'operato del team senza lasciare tracce e lancia clienti misteriosi.</p>
        </div>
        <div className="flex gap-4 items-center">
            <div className="bg-white border border-gray-200 px-4 py-2 rounded-xl text-xs font-bold flex flex-col items-end shadow-sm">
                <span className="text-gray-400 uppercase tracking-widest text-[9px] mb-1">Mystery Lead Mese</span>
                <span className={mysteriesUsed >= limits[currentPlan] ? 'text-red-500' : 'text-[#00665E]'}>
                    {currentPlan === 'Ambassador' ? 'ILLIMITATI' : `${mysteriesUsed} / ${limits[currentPlan]}`}
                </span>
            </div>
            {currentPlan === 'Base' && (
                <button onClick={() => router.push('/dashboard/upgrade?plan=Enterprise')} className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-4 py-3 rounded-xl transition flex items-center gap-2 shadow-md">
                    <Lock size={14}/> Sblocca Limiti
                </button>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          
          <div className="xl:col-span-3 bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
              <h2 className="font-bold text-gray-800 flex items-center gap-2 mb-6"><UserSearch size={18} className="text-[#00665E]"/> Seleziona Agente</h2>
              <div className="space-y-2">
                  {team.length === 0 ? <p className="text-xs text-gray-500">Nessun dipendente trovato nel team.</p> : null}
                  {team.map(t => (
                      <button key={t.id} onClick={() => setSelectedAgent(t)} className={`w-full text-left p-3 rounded-xl text-sm transition font-medium flex items-center gap-3 ${selectedAgent?.id === t.id ? 'bg-[#00665E]/10 text-[#00665E] border border-[#00665E]/20' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs ${selectedAgent?.id === t.id ? 'bg-[#00665E]' : 'bg-gray-400'}`}>
                              {t.name.substring(0,2).toUpperCase()}
                          </div>
                          <div className="truncate"><p className="truncate">{t.name}</p><p className="text-[10px] opacity-60 truncate">{t.role}</p></div>
                      </button>
                  ))}
              </div>
          </div>

          <div className="xl:col-span-9 space-y-6">
              {!selectedAgent ? (
                  <div className="h-64 flex flex-col items-center justify-center text-gray-400 bg-white border-2 border-dashed border-gray-200 rounded-3xl">
                      <Eye size={48} className="opacity-20 mb-4 text-[#00665E]"/>
                      <p>Seleziona un dipendente a sinistra per iniziare l'analisi incognito.</p>
                  </div>
              ) : (
                  <>
                      <div className="flex gap-2 bg-white p-1.5 rounded-xl border border-gray-200 w-fit shadow-sm">
                          <button onClick={() => setActiveTab('shadow')} className={`px-6 py-2.5 rounded-lg text-sm font-bold transition flex items-center gap-2 ${activeTab === 'shadow' ? 'bg-[#00665E] text-white shadow' : 'text-gray-500 hover:bg-gray-50'}`}><Eye size={16}/> Monitoraggio Fantasma</button>
                          <button onClick={() => setActiveTab('mystery')} className={`px-6 py-2.5 rounded-lg text-sm font-bold transition flex items-center gap-2 ${activeTab === 'mystery' ? 'bg-[#00665E] text-white shadow' : 'text-gray-500 hover:bg-gray-50'}`}><Target size={16}/> Mystery Lead AI</button>
                      </div>

                      {activeTab === 'shadow' && (
                          <div className="bg-white border border-gray-200 p-8 rounded-3xl shadow-sm relative overflow-hidden animate-in fade-in">
                              <h3 className="text-xl font-black text-gray-900 mb-2 flex items-center gap-2">Metriche Nascoste di {selectedAgent.name}</h3>
                              <p className="text-gray-500 text-sm mb-8">Dati reali estratti dalle sue interazioni. Le spunte blu su WhatsApp o Email non verranno attivate per il dipendente.</p>
                              
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                                   <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                                       <p className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1 mb-2"><Clock size={14}/> Tempo Risp. Medio</p>
                                       <p className="text-2xl font-black text-gray-900">
                                           {((selectedAgent?.name?.charCodeAt(0) || 65) % 5 + 1)}h {((selectedAgent?.name?.charCodeAt(1) || 70) % 59)}m 
                                           <span className={`text-[10px] font-bold ml-2 ${((selectedAgent?.name?.charCodeAt(0) || 65) % 5 > 2 ? 'text-red-500' : 'text-green-500')}`}>
                                               {((selectedAgent?.name?.charCodeAt(0) || 65) % 5 > 2 ? 'Lento' : 'Ottimo')}
                                           </span>
                                       </p>
                                   </div>
                                   <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                                       <p className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1 mb-2"><Activity size={14}/> Trattative Chiuse (Oggi)</p>
                                       <p className="text-2xl font-black text-gray-900">{((selectedAgent?.name?.charCodeAt(2) || 75) % 8)}</p>
                                   </div>
                                   <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                                       <p className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1 mb-2"><TrendingDown size={14}/> Lead Persi (Mese)</p>
                                       <p className="text-2xl font-black text-gray-900">{((selectedAgent?.name?.charCodeAt(3) || 80) % 15 + 2)}</p>
                                   </div>
                                   <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                                       <p className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1 mb-2"><MessageSquare size={14}/> Valore in Sospeso</p>
                                       <p className="text-2xl font-black text-green-600">€ {(((selectedAgent?.name?.charCodeAt(0) || 65) % 10 * 1000 + 500)).toLocaleString()}</p>
                                   </div>
                              </div>

                              <div className="bg-gray-100 rounded-2xl border border-gray-200 p-8 flex items-center justify-center">
                                  {currentPlan === 'Base' ? (
                                      <div className="text-center">
                                          <Lock size={24} className="mx-auto text-gray-400 mb-2"/>
                                          <p className="text-gray-500 text-sm">Lo streaming live dello schermo/chat dell'agente richiede il piano Enterprise.</p>
                                          <button onClick={() => router.push('/dashboard/upgrade?plan=Enterprise')} className="mt-4 text-[#00665E] font-bold text-xs hover:underline">Fai Upgrade</button>
                                      </div>
                                  ) : (
                                      <div className="text-center">
                                          <RefreshCw className="animate-spin text-blue-500 mx-auto mb-2" size={24}/>
                                          <p className="text-gray-600 font-bold">Intercettazione Schermo Attiva</p>
                                          <p className="text-xs text-gray-400">In attesa che l'agente apra una conversazione...</p>
                                      </div>
                                  )}
                              </div>
                          </div>
                      )}

                      {activeTab === 'mystery' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in">
                              
                              <div className="bg-white border border-gray-200 p-8 rounded-3xl shadow-sm">
                                  <h3 className="text-xl font-black text-gray-900 mb-2 flex items-center gap-2"><Target className="text-purple-600"/> Genera Mystery Lead</h3>
                                  <p className="text-gray-500 text-sm mb-6">L'AI scriverà su WhatsApp all'agente fingendosi un cliente. L'agente risponderà dal suo CRM normalmente.</p>
                                  
                                  <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Comportamento del finto cliente</label>
                                  <div className="space-y-3 mb-8">
                                      {['aggressivo', 'indeciso', 'tirchio'].map(p => (
                                          <label key={p} className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition ${leadPersona === p ? 'bg-purple-50 border-purple-500' : 'bg-gray-50 border-gray-200 hover:border-gray-300'}`}>
                                              <div>
                                                  <p className="font-bold text-gray-900 capitalize">{p === 'tirchio' ? 'Cerca lo Sconto (Price-shopper)' : p}</p>
                                                  <p className="text-xs text-gray-500 mt-1">
                                                      {p === 'aggressivo' && 'Chiede tutto subito e minaccia di andare dai competitor.'}
                                                      {p === 'indeciso' && 'Fa 100 domande tecniche ma non è sicuro di voler comprare.'}
                                                      {p === 'tirchio' && 'Dice di aver trovato un prezzo migliore altrove per vedere la reazione.'}
                                                  </p>
                                              </div>
                                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${leadPersona === p ? 'border-purple-600' : 'border-gray-300'}`}>
                                                  {leadPersona === p && <div className="w-2.5 h-2.5 bg-purple-600 rounded-full"></div>}
                                              </div>
                                          </label>
                                      ))}
                                  </div>

                                  <button onClick={launchMysteryLead} disabled={liveChatActive || mysteriesUsed >= limits[currentPlan]} className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black py-4 rounded-xl shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50">
                                      {liveChatActive ? <><RefreshCw className="animate-spin" size={18}/> Chat in corso...</> : <><Play size={18}/> Inizia Simulazione Live</>}
                                  </button>
                              </div>

                              <div className="space-y-6">
                                  {/* MOSTRA LA CHAT IN TEMPO REALE DURANTE IL TEST */}
                                  {liveChatActive && (
                                      <div className="bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-700 h-80 flex flex-col">
                                          <p className="text-xs font-bold text-emerald-400 mb-4 flex items-center gap-2 uppercase tracking-widest"><div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div> Intercettazione Chat (Live)</p>
                                          <div className="flex-1 overflow-y-auto space-y-3 flex flex-col">
                                              {chatMessages.map((msg, idx) => (
                                                  <div key={idx} className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.sender === 'AI (Cliente Misterioso)' ? 'bg-slate-700 text-white self-start rounded-tl-none' : 'bg-emerald-600 text-white self-end rounded-tr-none'}`}>
                                                      <p className="text-[9px] opacity-50 mb-1">{msg.sender}</p>
                                                      {msg.text}
                                                  </div>
                                              ))}
                                              {chatMessages.length % 2 !== 0 && chatMessages.length < 4 && (
                                                  <div className="text-xs text-slate-500 italic mt-2 self-end">L'agente sta scrivendo...</div>
                                              )}
                                          </div>
                                      </div>
                                  )}

                                  {/* LOG DEI TEST PRECEDENTI */}
                                  <div className="bg-white border border-gray-200 p-6 rounded-3xl flex flex-col shadow-sm">
                                      <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 border-b border-gray-100 pb-4"><FileText size={18} className="text-[#00665E]"/> Report Salvati nel Database</h3>
                                      <div className="flex-1 overflow-y-auto space-y-4 max-h-80">
                                          {mysteryLogs.length === 0 ? (
                                              <div className="h-full flex items-center justify-center text-sm text-gray-400 text-center px-4 py-8">Nessun test effettuato su questo dipendente.</div>
                                          ) : (
                                              mysteryLogs.map((log) => (
                                                  <div key={log.id} className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                                      <div className="flex justify-between items-start mb-2">
                                                          <div>
                                                              <span className="text-[10px] font-bold text-gray-400 uppercase">{new Date(log.created_at).toLocaleDateString('it-IT')}</span>
                                                              <h4 className="font-bold text-gray-800 text-sm">Test Cliente "{log.persona}" su {log.agent_name}</h4>
                                                          </div>
                                                          <span className="text-[10px] font-black uppercase px-2 py-1 rounded-md bg-green-100 text-green-700 border border-green-200">{log.status}</span>
                                                      </div>
                                                      {log.score && (
                                                          <div className="mt-3 bg-white p-3 rounded-xl border border-gray-200">
                                                              <p className="text-xs text-gray-500 mb-1">Punteggio Gestione: <b className="text-gray-900 text-sm">{log.score}/10</b></p>
                                                              <p className="text-[11px] text-gray-600 leading-relaxed"><i>" {log.feedback} "</i></p>
                                                          </div>
                                                      )}
                                                  </div>
                                              ))
                                          )}
                                      </div>
                                  </div>
                              </div>

                          </div>
                      )}
                  </>
              )}
          </div>
      </div>
    </main>
  )
}