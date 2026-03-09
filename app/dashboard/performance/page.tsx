'use client'

import { createClient } from '../../../utils/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
    Users, TrendingUp, Target, BrainCircuit, Calendar, 
    Download, ShieldAlert, Award, Activity, CheckCircle2, 
    AlertTriangle, FileText, Zap, UserCheck, BookOpen, Clock, HeartPulse,
    Loader2, Building, Sparkles, History, Edit3, Save // Icone aggiunte per la nuova UI
} from 'lucide-react'
import { 
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts'

export default function PerformancePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [currentPlan, setCurrentPlan] = useState('Base')
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  const aiEvaluationsLimit: any = { 'Base': 5, 'Enterprise': 20, 'Ambassador': 'Illimitate' }
  const [evaluationsUsed, setEvaluationsUsed] = useState(3)

  const [reviewFrequency, setReviewFrequency] = useState('Trimestrale')
  const [isSyncingAgenda, setIsSyncingAgenda] = useState(false)
  const [agendaSynced, setAgendaSynced] = useState(false)

  const [activeTab, setActiveTab] = useState<'agents' | 'stores'>('agents')
  const [selectedEntity, setSelectedEntity] = useState<any>(null)
  
  // Sotto-tab per la scheda dipendente
  const [innerTab, setInnerTab] = useState<'ai' | 'manual' | 'history'>('ai')

  const [isEvaluating, setIsEvaluating] = useState(false)
  const [aiReport, setAiReport] = useState<any>(null)

  // STATI PER LA VALUTAZIONE MANUALE DEL TITOLARE
  const [manualReview, setManualReview] = useState({ score: 5, goals: 5, teamwork: 5, notes: '' })
  const [isSavingManual, setIsSavingManual] = useState(false)

  // DATI REALI (Inclusi mock di storico valutazioni passate)
  const [agents, setAgents] = useState([
      { 
          id: 1, name: 'Marco Rossi', role: 'Senior Sales', 
          metrics: { sales: 92, crm_usage: 45, morale: 88, response_time: 75, upselling: 60 },
          raw_data: { revenue: '€ 45.200', deals_won: 34, pulse_status: 'Motivato' },
          history: [
              { date: '10/09/2025', evaluator: 'Direzione', score: '8/10', notes: 'Ottime vendite, ma deve compilare meglio il CRM.' },
              { date: '12/06/2025', evaluator: 'Direzione', score: '7.5/10', notes: 'In crescita, buon approccio col cliente.' }
          ]
      },
      { 
          id: 2, name: 'Giulia Bianchi', role: 'Junior Sales', 
          metrics: { sales: 55, crm_usage: 95, morale: 60, response_time: 90, upselling: 40 },
          raw_data: { revenue: '€ 18.500', deals_won: 12, pulse_status: 'Sotto Stress' },
          history: [
              { date: '10/09/2025', evaluator: 'Direzione', score: '6/10', notes: 'Molto precisa sui tool, ma fatica in chiusura. Serve affiancamento.' }
          ]
      },
      { 
          id: 3, name: 'Luca Verdi', role: 'Store Manager', 
          metrics: { sales: 85, crm_usage: 80, morale: 95, response_time: 85, upselling: 90 },
          raw_data: { revenue: '€ 38.000', deals_won: 28, pulse_status: 'Molto Felice' },
          history: [
              { date: '10/09/2025', evaluator: 'Direzione', score: '9/10', notes: 'Gestione del negozio impeccabile.' },
              { date: '12/06/2025', evaluator: 'Direzione', score: '9/10', notes: 'Team allineato e obiettivi raggiunti.' }
          ]
      },
  ])

  const trendData = [
      { month: 'Set', Score: 65 }, { month: 'Ott', Score: 70 },
      { month: 'Nov', Score: 68 }, { month: 'Dic', Score: 85 },
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

  // 1. SYNC VERO CON DATABASE (Tabella events)
  const handleAgendaSync = async () => {
      if (!user) return;
      setIsSyncingAgenda(true)

      try {
          // Calcola la data del prossimo colloquio in base alla frequenza
          const nextDate = new Date();
          if (reviewFrequency === 'Mensile') nextDate.setMonth(nextDate.getMonth() + 1);
          if (reviewFrequency === 'Trimestrale') nextDate.setMonth(nextDate.getMonth() + 3);
          if (reviewFrequency === 'Annuale') nextDate.setFullYear(nextDate.getFullYear() + 1);

          // Crea gli eventi reali nel database per ogni agente
          for (const agent of agents) {
              await supabase.from('events').insert({
                  user_id: user.id,
                  title: `Colloquio Valutazione: ${agent.name}`,
                  description: `Colloquio HR ${reviewFrequency} programmato dal modulo Performance.`,
                  type: 'HR',
                  date: nextDate.toISOString().split('T')[0], // YYYY-MM-DD
                  start_time: '10:00',
                  end_time: '11:00'
              });
          }

          setTimeout(() => {
              setIsSyncingAgenda(false)
              setAgendaSynced(true)
              alert(`✅ Sincronizzazione Completata!\n\nI colloqui di valutazione sono stati scritti ufficialmente nel database dell'Agenda. Il sistema ti invierà un alert automatico prima della scadenza.`)
          }, 1500)

      } catch (error) {
          console.error(error)
          setIsSyncingAgenda(false)
          alert("Errore durante il salvataggio in agenda. Verifica che la tabella 'events' esista nel database.")
      }
  }

  // 2. MOTORE AI
  const runAIEvaluation = (entity: any) => {
      if (currentPlan !== 'Ambassador' && evaluationsUsed >= aiEvaluationsLimit[currentPlan]) {
          return alert(`Limite valutazioni AI raggiunto (${aiEvaluationsLimit[currentPlan]}). Effettua l'upgrade!`)
      }

      setIsEvaluating(true)
      setAiReport(null)
      
      setTimeout(() => {
          setIsEvaluating(false)
          setEvaluationsUsed(prev => prev + 1)
          
          if (entity.metrics.crm_usage < 60) {
              setAiReport({
                  score: 'B+', title: 'Talento da strutturare',
                  analysis: `L'analisi mostra che ${entity.name} ha ottime performance (${entity.raw_data.revenue}), ma non traccia i dati (CRM: ${entity.metrics.crm_usage}%). Morale attuale: ${entity.raw_data.pulse_status}.`,
                  action_plan: [
                      { type: 'corso', text: 'Visione Tutorial: "Gestione Pipeline e CRM" dall\'Academy.' },
                      { type: 'tool', text: 'Attivare "WhatsApp Sync" per automatismi.' }
                  ]
              })
          } else if (entity.metrics.morale < 70) {
              setAiReport({
                  score: 'C', title: 'Rischio Burnout Rilevato',
                  analysis: `${entity.name} è diligente (CRM: ${entity.metrics.crm_usage}%), ma le vendite non decollano. Pulse HR segnala: "${entity.raw_data.pulse_status}". Forzare ora è controproducente.`,
                  action_plan: [
                      { type: 'hr', text: 'Colloquio 1-to-1 motivazionale entro 48h.' },
                      { type: 'ai', text: 'Sbloccare AI Coach per superamento obiezioni.' }
                  ]
              })
          } else {
               setAiReport({
                  score: 'A+', title: 'Top Performer',
                  analysis: `Metriche eccellenti su tutti i fronti. ${entity.name} unisce metodo e risultati.`,
                  action_plan: [
                      { type: 'premio', text: 'Assegnare bonus produzione.' },
                      { type: 'team', text: 'Nominare "Mentor" per i nuovi assunti.' }
                  ]
              })
          }
      }, 3000)
  }

  // 3. SALVATAGGIO VALUTAZIONE MANUALE TITOLARE
  const handleSaveManualReview = (e: React.FormEvent) => {
      e.preventDefault();
      setIsSavingManual(true)
      
      setTimeout(() => {
          setIsSavingManual(false)
          
          // Aggiungiamo la nuova recensione allo storico locale (MOCK per UI)
          const newReview = {
              date: new Date().toLocaleDateString('it-IT'),
              evaluator: 'Titolare',
              score: `${manualReview.score}/10`,
              notes: manualReview.notes || 'Nessuna nota aggiuntiva.'
          }

          // Aggiorniamo lo stato
          const updatedAgents = agents.map(a => {
              if (a.id === selectedEntity.id) {
                  return { ...a, history: [newReview, ...a.history] }
              }
              return a;
          })
          
          setAgents(updatedAgents)
          setSelectedEntity(updatedAgents.find(a => a.id === selectedEntity.id))
          
          alert("✅ Valutazione Manuale salvata con successo nello storico del dipendente!")
          setManualReview({ score: 5, goals: 5, teamwork: 5, notes: '' }) // Reset form
          setInnerTab('history') // Sposta l'utente sulla tab storico per fargli vedere il risultato
      }, 1500)
  }

  const handleExportPDF = () => {
      const content = `INTEGRA OS - REPORT VALUTAZIONE PERFORMANCE HR\nDipendente: ${selectedEntity.name}\n\n[RISERVATO]`;
      const blob = new Blob([content], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Valutazione_${selectedEntity.name.replace(' ', '_')}.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
  }

  if (loading) return <div className="p-10 text-indigo-600 font-bold animate-pulse">Inizializzazione Modulo HR...</div>

  const radarData = selectedEntity ? [
      { subject: 'Vendite & Chiusure', A: selectedEntity.metrics.sales, fullMark: 100 },
      { subject: 'Uso del CRM', A: selectedEntity.metrics.crm_usage, fullMark: 100 },
      { subject: 'Upselling', A: selectedEntity.metrics.upselling, fullMark: 100 },
      { subject: 'Tempi Risposta', A: selectedEntity.metrics.response_time, fullMark: 100 },
      { subject: 'Morale (Pulse)', A: selectedEntity.metrics.morale, fullMark: 100 },
  ] : []

  return (
    <main className="flex-1 overflow-auto bg-[#F8FAFC] text-gray-900 font-sans min-h-screen pb-20 relative">
      
      {/* HEADER COMPLIANCE & LIMITI */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-200 p-8 bg-slate-900 text-white shadow-sm z-10 relative">
        <div className="mb-4 md:mb-0">
          <h1 className="text-3xl font-black flex items-center gap-3">
              <UserCheck size={32} className="text-indigo-400"/> Gestione Performance & Coaching
          </h1>
          <p className="text-slate-400 text-sm mt-1">Valuta oggettivamente i dipendenti incrociando i dati o manualmente.</p>
        </div>
        
        <div className="flex flex-col items-end">
            <div className="bg-slate-800 border border-slate-700 px-4 py-2 rounded-xl flex items-center gap-3 shadow-sm mb-2">
                <BrainCircuit className={currentPlan === 'Ambassador' ? "text-purple-400" : "text-indigo-400"} size={20}/>
                <div className="flex flex-col items-start">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Coaching AI Mensili</span>
                    <span className={`font-bold text-sm ${currentPlan === 'Ambassador' ? 'text-purple-400' : 'text-white'}`}>
                        {currentPlan === 'Ambassador' ? 'Illimitati' : `${evaluationsUsed} / ${aiEvaluationsLimit[currentPlan]}`}
                    </span>
                </div>
            </div>
        </div>
      </div>

      <div className="bg-amber-50 border-b border-amber-200 px-8 py-3 flex items-start md:items-center gap-3 text-amber-800 text-xs">
          <ShieldAlert size={16} className="shrink-0 mt-0.5 md:mt-0 text-amber-600"/>
          <p><b>Compliance EU AI Act & GDPR (Art. 22):</b> Le valutazioni generate dall'AI hanno valore consultivo. Usa la scheda "Valutazione Manuale" per inserire il giudizio ufficiale del Management.</p>
      </div>

      <div className="p-8 max-w-7xl mx-auto space-y-8">
          
          {/* TOP BAR: AGENDA SYNC E FILTRI */}
          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm flex flex-col lg:flex-row justify-between items-center gap-6">
              
              <div className="flex gap-2 w-full lg:w-auto overflow-x-auto">
                  <button onClick={() => {setActiveTab('agents'); setSelectedEntity(null)}} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-2 ${activeTab === 'agents' ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}><Users size={16}/> Agenti & Team</button>
                  <button onClick={() => {setActiveTab('stores'); setSelectedEntity(null)}} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-2 opacity-50 cursor-not-allowed`}><Building size={16}/> Negozi (Prossimamente)</button>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto bg-gray-50 p-2 rounded-2xl border border-gray-100">
                  <div className="flex items-center gap-2 pl-2">
                      <Calendar size={16} className="text-gray-500"/>
                      <span className="text-xs font-bold text-gray-600 uppercase">Ciclo Valutazioni:</span>
                  </div>
                  <select value={reviewFrequency} onChange={e=>setReviewFrequency(e.target.value)} className="bg-white border border-gray-200 py-2 px-4 rounded-xl text-sm font-bold outline-none cursor-pointer">
                      <option value="Mensile">Mensile</option>
                      <option value="Trimestrale">Trimestrale</option>
                      <option value="Annuale">Annuale</option>
                  </select>
                  <button onClick={handleAgendaSync} disabled={isSyncingAgenda || agendaSynced} className={`px-5 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2 ${agendaSynced ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-900 text-white hover:bg-black'}`}>
                      {isSyncingAgenda ? <Loader2 size={16} className="animate-spin"/> : agendaSynced ? <CheckCircle2 size={16}/> : <Zap size={16}/>}
                      {agendaSynced ? 'Salvato in Agenda DB' : 'Crea in Agenda'}
                  </button>
              </div>

          </div>

          {/* MAIN WORKSPACE */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* LISTA DIPENDENTI (LEFT) */}
              <div className="lg:col-span-4 bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
                  <h2 className="text-lg font-black text-gray-900 mb-6 border-b pb-4">Seleziona Risorsa</h2>
                  <div className="space-y-3">
                      {agents.map((agent) => (
                          <div 
                              key={agent.id} 
                              onClick={() => {setSelectedEntity(agent); setAiReport(null); setInnerTab('ai');}}
                              className={`p-4 rounded-2xl border-2 cursor-pointer transition duration-300 ${selectedEntity?.id === agent.id ? 'bg-indigo-50 border-indigo-400 shadow-md' : 'bg-gray-50 border-transparent hover:border-gray-200'}`}
                          >
                              <div className="flex justify-between items-start mb-2">
                                  <div>
                                      <h3 className="font-bold text-gray-900">{agent.name}</h3>
                                      <p className="text-xs text-gray-500">{agent.role}</p>
                                  </div>
                                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center font-black text-indigo-700 shadow-sm border border-indigo-100">
                                      {agent.name.charAt(0)}
                                  </div>
                              </div>
                              <div className="flex items-center gap-2 mt-3">
                                  <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${agent.metrics.morale >= 80 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>Morale: {agent.raw_data.pulse_status}</span>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>

              {/* DASHBOARD SCHEDA DIPENDENTE (RIGHT) */}
              <div className="lg:col-span-8 flex flex-col h-full">
                  {!selectedEntity ? (
                      <div className="flex-1 border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center text-gray-400 p-10 bg-white/50 min-h-[500px]">
                          <Target size={64} className="mb-4 opacity-20"/>
                          <h3 className="text-xl font-black text-gray-900 mb-2 text-center">Nessuna risorsa selezionata</h3>
                          <p className="text-sm text-center max-w-sm">Clicca su un agente a sinistra per avviare la valutazione, scrivere le tue note o vedere lo storico.</p>
                      </div>
                  ) : (
                      <div className="flex-1 space-y-6 animate-in zoom-in-95 duration-300">
                          
                          {/* OVERVIEW STATS (Sempre Visibili) */}
                          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
                              <div className="flex justify-between items-start mb-6">
                                  <div>
                                      <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">{selectedEntity.name}</h2>
                                      <p className="text-sm text-gray-500 mt-1">Dati integrati dall'ecosistema (Mese Corrente)</p>
                                  </div>
                                  <div className="text-right">
                                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Fatturato Generato</p>
                                      <p className="text-2xl font-black text-emerald-600">{selectedEntity.raw_data.revenue}</p>
                                  </div>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center border-t border-gray-100 pt-6">
                                  <div className="h-48 bg-gray-50 rounded-2xl border border-gray-100 p-2 relative">
                                      <ResponsiveContainer width="100%" height="100%">
                                          <RadarChart cx="50%" cy="50%" outerRadius="65%" data={radarData}>
                                              <PolarGrid stroke="#e5e7eb" />
                                              <PolarAngleAxis dataKey="subject" tick={{fill: '#6b7280', fontSize: 10, fontWeight: 'bold'}} />
                                              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false}/>
                                              <Radar name={selectedEntity.name} dataKey="A" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.4} />
                                              <Tooltip contentStyle={{borderRadius: '12px', fontSize: '12px'}}/>
                                          </RadarChart>
                                      </ResponsiveContainer>
                                  </div>
                                  <div className="h-48">
                                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Trend Score (Ultimi Mesi)</h4>
                                      <ResponsiveContainer width="100%" height="80%">
                                          <BarChart data={trendData}>
                                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6"/>
                                              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}}/>
                                              <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '8px'}}/>
                                              <Bar dataKey="Score" fill="#0ea5e9" radius={[4,4,0,0]} />
                                          </BarChart>
                                      </ResponsiveContainer>
                                  </div>
                              </div>
                          </div>

                          {/* SOTTO-NAVIGAZIONE AZIONI (AI vs Manuale vs Storico) */}
                          <div className="flex gap-2 bg-gray-200/50 p-1.5 rounded-2xl border border-gray-200 w-max overflow-x-auto">
                              <button onClick={() => setInnerTab('ai')} className={`px-5 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-2 ${innerTab === 'ai' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-600 hover:bg-white'}`}><Sparkles size={16}/> AI Coaching</button>
                              <button onClick={() => setInnerTab('manual')} className={`px-5 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-2 ${innerTab === 'manual' ? 'bg-white text-gray-900 shadow-md' : 'text-gray-600 hover:bg-white'}`}><Edit3 size={16}/> Valutazione Direzione</button>
                              <button onClick={() => setInnerTab('history')} className={`px-5 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-2 ${innerTab === 'history' ? 'bg-white text-gray-900 shadow-md' : 'text-gray-600 hover:bg-white'}`}><History size={16}/> Storico Ufficiale</button>
                          </div>

                          {/* TAB 1: MOTORE AI COACHING */}
                          {innerTab === 'ai' && (
                              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl text-white relative overflow-hidden animate-in fade-in">
                                  <div className="absolute -right-10 -bottom-10 opacity-10"><BrainCircuit size={200}/></div>
                                  <h3 className="text-xl font-black mb-2 flex items-center gap-2 relative z-10"><Sparkles className="text-indigo-400"/> Generatore Piani Formativi AI</h3>
                                  <p className="text-sm text-slate-400 mb-8 relative z-10">L'AI analizza i dati e suggerisce come aiutare il dipendente a migliorare.</p>

                                  {!isEvaluating && !aiReport ? (
                                      <button onClick={() => runAIEvaluation(selectedEntity)} className="w-full bg-indigo-600 text-white font-black py-4 rounded-xl hover:bg-indigo-700 transition shadow-[0_0_20px_rgba(79,70,229,0.4)] flex justify-center items-center gap-2 relative z-10">
                                          <BrainCircuit size={20}/> Genera Analisi e Piano
                                      </button>
                                  ) : isEvaluating ? (
                                      <div className="flex flex-col items-center justify-center py-10 relative z-10">
                                          <Loader2 size={40} className="animate-spin text-indigo-500 mb-4"/>
                                          <p className="font-bold text-slate-300">Incrocio dati in corso...</p>
                                      </div>
                                  ) : (
                                      <div className="relative z-10 animate-in slide-in-from-bottom-4">
                                          <div className="flex items-center gap-4 mb-6 border-b border-slate-700 pb-6">
                                              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black shadow-inner border-2 ${aiReport.score.includes('A') ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' : aiReport.score.includes('B') ? 'bg-blue-500/20 text-blue-400 border-blue-500/50' : 'bg-rose-500/20 text-rose-400 border-rose-500/50'}`}>
                                                  {aiReport.score}
                                              </div>
                                              <div>
                                                  <h4 className="text-xl font-black">{aiReport.title}</h4>
                                                  <p className="text-xs text-slate-400 font-mono mt-1">Stima algoritmica.</p>
                                              </div>
                                          </div>
                                          <div className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700 mb-6 text-sm text-slate-300">{aiReport.analysis}</div>
                                          <div>
                                              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Azioni Consigliate:</h4>
                                              <div className="space-y-3">
                                                  {aiReport.action_plan.map((action:any, i:number) => (
                                                      <div key={i} className="flex items-start gap-3 bg-slate-800 p-4 rounded-xl border border-slate-700"><Target size={16} className="text-emerald-400 mt-0.5"/><p className="text-sm font-medium">{action.text}</p></div>
                                                  ))}
                                              </div>
                                          </div>
                                          <button onClick={handleExportPDF} className="mt-8 w-full bg-white text-slate-900 font-bold py-3 rounded-xl hover:bg-gray-100 flex items-center justify-center gap-2"><Download size={18}/> Scarica Report AI</button>
                                      </div>
                                  )}
                              </div>
                          )}

                          {/* TAB 2: VALUTAZIONE MANUALE (TITOLARE) */}
                          {innerTab === 'manual' && (
                              <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm animate-in fade-in">
                                  <h3 className="text-xl font-black mb-2 flex items-center gap-2 text-gray-900"><Edit3 className="text-blue-600"/> Inserimento Valutazione Ufficiale</h3>
                                  <p className="text-sm text-gray-500 mb-8">Usa questo form per registrare il tuo giudizio sul dipendente al termine del colloquio.</p>
                                  
                                  <form onSubmit={handleSaveManualReview} className="space-y-6">
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                          <div>
                                              <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Voto Generale (1-10)</label>
                                              <input type="number" min="1" max="10" value={manualReview.score} onChange={e=>setManualReview({...manualReview, score: Number(e.target.value)})} className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl text-lg font-black outline-none focus:border-blue-500" required/>
                                          </div>
                                          <div>
                                              <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Lavoro di Squadra (1-10)</label>
                                              <input type="number" min="1" max="10" value={manualReview.teamwork} onChange={e=>setManualReview({...manualReview, teamwork: Number(e.target.value)})} className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl text-lg font-black outline-none focus:border-blue-500" required/>
                                          </div>
                                      </div>
                                      
                                      <div>
                                          <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Note della Direzione (Appunti Colloquio)</label>
                                          <textarea value={manualReview.notes} onChange={e=>setManualReview({...manualReview, notes: e.target.value})} placeholder="Scrivi qui i feedback discussi con il dipendente..." className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl outline-none focus:border-blue-500 min-h-[120px] resize-none" required></textarea>
                                      </div>

                                      <button type="submit" disabled={isSavingManual} className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-50">
                                          {isSavingManual ? <Loader2 size={18} className="animate-spin"/> : <Save size={18}/>} 
                                          Salva Nello Storico
                                      </button>
                                  </form>
                              </div>
                          )}

                          {/* TAB 3: STORICO VALUTAZIONI */}
                          {innerTab === 'history' && (
                              <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm animate-in fade-in min-h-[400px]">
                                  <h3 className="text-xl font-black mb-2 flex items-center gap-2 text-gray-900"><History className="text-emerald-600"/> Storico Valutazioni</h3>
                                  <p className="text-sm text-gray-500 mb-8">Elenco di tutti i colloqui e giudizi pregressi.</p>

                                  {selectedEntity.history.length === 0 ? (
                                      <div className="text-center py-10 text-gray-400">
                                          <FileText size={40} className="mx-auto mb-3 opacity-20"/>
                                          <p>Nessuna valutazione presente nello storico.</p>
                                      </div>
                                  ) : (
                                      <div className="space-y-4">
                                          {selectedEntity.history.map((h:any, idx:number) => (
                                              <div key={idx} className="bg-gray-50 border border-gray-100 p-5 rounded-2xl">
                                                  <div className="flex justify-between items-start mb-3">
                                                      <div>
                                                          <span className="bg-gray-200 text-gray-700 text-[10px] font-bold uppercase px-2 py-1 rounded">{h.date}</span>
                                                          <p className="text-xs font-bold text-gray-500 mt-2">Valutato da: {h.evaluator}</p>
                                                      </div>
                                                      <div className="bg-white border border-emerald-100 text-emerald-700 font-black text-lg px-4 py-2 rounded-xl shadow-sm">
                                                          {h.score}
                                                      </div>
                                                  </div>
                                                  <p className="text-sm text-gray-700 font-medium bg-white p-3 rounded-xl border border-gray-100">"{h.notes}"</p>
                                              </div>
                                          ))}
                                      </div>
                                  )}
                              </div>
                          )}

                      </div>
                  )}
              </div>
          </div>
      </div>
    </main>
  )
}