'use client'

import { createClient } from '../../../utils/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
    HeartPulse, BatteryMedium, BatteryWarning, BatteryFull, 
    ShieldCheck, PlayCircle, Activity, BrainCircuit, 
    Smile, Frown, Youtube, Send, Lock, TrendingDown, 
    AlertTriangle, Loader2, Sparkles, Filter, CheckSquare, Search, Info,
    ClipboardCheck, Save, History, Target, BarChart3, X
} from 'lucide-react'
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts'

const DIMENSIONS = [
  { key: 'communication', label: 'Comunicazione Interna', icon: '💬' },
  { key: 'procedures', label: 'Rispetto Procedure / Modelli', icon: '📋' },
  { key: 'training', label: 'Formazione', icon: '🎓' },
  { key: 'goal_alignment', label: 'Allineamento Obiettivi', icon: '🎯' },
  { key: 'reward_system', label: 'Sistema Premiante / Motivante', icon: '🏆' },
  { key: 'brand_status', label: 'Status del Brand', icon: '⭐' },
  { key: 'career_opportunities', label: 'Opportunità di Carriera', icon: '📈' },
  { key: 'benefits', label: 'Benefit e Vantaggi', icon: '🎁' },
]

const getRiskLabel = (score: number) => {
  if (score <= 4) return { label: 'Rischio', color: 'text-red-600 bg-red-50 border-red-200', dot: '🔴' }
  if (score <= 7) return { label: 'Neutro', color: 'text-yellow-600 bg-yellow-50 border-yellow-200', dot: '🟡' }
  return { label: 'Opportunità', color: 'text-emerald-600 bg-emerald-50 border-emerald-200', dot: '🟢' }
}

export default function WellnessPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [currentPlan, setCurrentPlan] = useState('Base')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  // TABS
  const [activeTab, setActiveTab] = useState<'manager_dashboard' | 'agent_portal' | 'assessment'>('manager_dashboard')
  const [isSending, setIsSending] = useState(false)
  const [roleFilter, setRoleFilter] = useState('Tutti')

  // Limiti
  const limits: any = { 'Base': 15, 'Enterprise': 100, 'Ambassador': 'Illimitati' }
  const checkinsUsed = 12

  // Team Health
  const [teamHealth, setTeamHealth] = useState<any[]>([])
  
  // Portale Agente
  const [agentConsented, setAgentConsented] = useState(false)
  const [agentChatStep, setAgentChatStep] = useState(0)

  // SCHEDA BENESSERE AZIENDALE
  const [assessments, setAssessments] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [aiAnalysis, setAiAnalysis] = useState<any>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [form, setForm] = useState({
    period: new Date().toLocaleDateString('it-IT', { month: 'long', year: 'numeric' }),
    communication: 5, procedures: 5, training: 5, goal_alignment: 5,
    reward_system: 5, brand_status: 5, career_opportunities: 5, benefits: 5, notes: ''
  })

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
          setUser(user)
          const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user.id).single()
          if (profile) setCurrentPlan(profile.plan || 'Base')
          
          const mockRealData = [
              { id: 1, name: 'Giulia Bianchi', role: 'Vendite', location: 'Milano', battery: 35, status: 'Rischio Burnout', aiSummary: "Calo fisiologico dovuto a un picco di chiamate ricevute (+40% vs mese scorso). Si consiglia riduzione KPI temporanea." },
              { id: 2, name: 'Mario Rossi', role: 'Supporto', location: 'Roma', battery: 85, status: 'In Forma', aiSummary: "L'agente mantiene ritmi costanti e positivi." },
              { id: 3, name: 'Luca Verdi', role: 'Vendite', location: 'Roma', battery: 55, status: 'Affaticato', aiSummary: "Lieve flessione delle performance pomeridiane. Segnali di stress da schermo." }
          ]
          setTeamHealth(mockRealData)

          // Carica assessments reali
          await fetchAssessments()
      }
      setLoading(false)
    }
    getData()
  }, [])

  const fetchAssessments = async () => {
    try {
      const res = await fetch('/api/wellness/assessment')
      const data = await res.json()
      setAssessments(data.assessments || [])
    } catch (e) { console.error(e) }
  }

  const handleSaveAssessment = async () => {
    setSaving(true)
    try {
      await fetch('/api/wellness/assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      await fetchAssessments()
      alert('✅ Scheda Benessere Aziendale salvata con successo!')
    } catch (e) { console.error(e) }
    setSaving(false)
  }

  const runAiWellnessAnalysis = async () => {
    setAiLoading(true)
    try {
      const res = await fetch('/api/wellness/assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, action: 'analyze' })
      })
      const data = await res.json()
      setAiAnalysis(data.analysis)
    } catch (e) { console.error(e) }
    setAiLoading(false)
  }

  const launchSurvey = () => {
      if (currentPlan !== 'Ambassador' && checkinsUsed >= limits[currentPlan]) {
          return alert(`Hai raggiunto il limite di ${limits[currentPlan]} check-in mensili. Fai l'upgrade!`)
      }
      setIsSending(true)
      setTimeout(() => {
          setIsSending(false)
          alert("✅ Check-in inviati con successo via Email/WhatsApp a tutto il team.")
      }, 2000)
  }

  const renderBattery = (level: number) => {
      if (level > 75) return <BatteryFull className="text-emerald-500" size={24}/>
      if (level > 40) return <BatteryMedium className="text-amber-500" size={24}/>
      return <BatteryWarning className="text-red-500 animate-pulse" size={24}/>
  }

  const filteredTeam = teamHealth.filter(m => roleFilter === 'Tutti' || m.role === roleFilter)

  // Radar data per la scheda
  const radarData = DIMENSIONS.map(d => ({
    subject: d.label.split(' ')[0],
    fullLabel: d.label,
    A: (form as any)[d.key],
    fullMark: 10
  }))

  // Media totale
  const avgScore = DIMENSIONS.reduce((acc, d) => acc + ((form as any)[d.key] || 5), 0) / DIMENSIONS.length

  if (loading) return <div className="p-10 text-rose-600 font-bold animate-pulse">Sincronizzazione Modulo HR...</div>

  return (
    <main className="flex-1 overflow-auto bg-[#FDFDFD] text-gray-900 font-sans min-h-screen pb-20">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center border-b border-rose-100 p-8 bg-rose-50/30 shadow-sm z-10 relative">
        <div>
          <h1 className="text-3xl font-black text-rose-700 flex items-center gap-3">
              <HeartPulse size={32} className="text-rose-500"/> Pulse AI Wellness
          </h1>
          <p className="text-gray-500 text-sm mt-1">Monitoraggio predittivo, benessere e scheda organizzativa.</p>
        </div>
        
        <div className="flex items-center gap-4 mt-4 md:mt-0">
            <div className="bg-white border border-gray-200 px-4 py-2 rounded-xl flex items-center gap-3 shadow-sm">
                <Activity className="text-rose-500" size={20}/>
                <div className="flex flex-col items-start">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Check-in ({currentPlan})</span>
                    <span className={`font-bold text-sm ${currentPlan === 'Ambassador' ? 'text-purple-600' : 'text-gray-800'}`}>
                        {currentPlan === 'Ambassador' ? 'Illimitati' : `${checkinsUsed} / ${limits[currentPlan]}`}
                    </span>
                </div>
            </div>
            <button onClick={launchSurvey} disabled={isSending} className="bg-rose-600 text-white text-sm font-black px-6 py-2.5 rounded-xl hover:bg-rose-700 transition shadow-md flex items-center gap-2 disabled:opacity-50">
                {isSending ? <Loader2 size={16} className="animate-spin"/> : <Send size={16}/>} Invia Check-in
            </button>
        </div>
      </div>

      {/* TABS */}
      <div className="px-8 py-4 flex gap-2 border-b border-gray-100 bg-white sticky top-0 z-20 overflow-x-auto">
          <button onClick={() => setActiveTab('manager_dashboard')} className={`px-6 py-2.5 rounded-xl font-bold text-sm transition whitespace-nowrap ${activeTab === 'manager_dashboard' ? 'bg-rose-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}>Monitoraggio Team</button>
          <button onClick={() => setActiveTab('assessment')} className={`px-6 py-2.5 rounded-xl font-bold text-sm transition flex items-center gap-2 whitespace-nowrap ${activeTab === 'assessment' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}><ClipboardCheck size={16}/> Scheda Benessere Aziendale</button>
          <button onClick={() => setActiveTab('agent_portal')} className={`px-6 py-2.5 rounded-xl font-bold text-sm transition flex items-center gap-2 whitespace-nowrap ${activeTab === 'agent_portal' ? 'bg-[#00665E] text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}><BrainCircuit size={16}/> Portale Dipendente</button>
      </div>

      <div className="p-8 max-w-7xl mx-auto">
          
          {/* ========================================== */}
          {/* VISTA 1: DASHBOARD DEL MANAGER */}
          {/* ========================================== */}
          {activeTab === 'manager_dashboard' && (
              <div className="space-y-8 animate-in fade-in">
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-4 shadow-sm">
                      <Info className="text-blue-500 shrink-0 mt-0.5" size={20}/>
                      <div>
                          <p className="text-sm font-bold text-blue-900">Protezione Privacy e GDPR Attiva</p>
                          <p className="text-xs text-blue-700 mt-1">Le conversazioni tra AI e dipendenti sono cifrate e inaccessibili. Questa dashboard mostra solo dati aggregati.</p>
                      </div>
                  </div>

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
                              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Rischio Burnout</p>
                              <p className="text-3xl font-black text-rose-600">1 <span className="text-sm text-gray-500 font-bold ml-1">Agente</span></p>
                          </div>
                          <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center text-rose-500"><AlertTriangle size={24}/></div>
                      </div>
                      <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-3xl shadow-lg flex items-center justify-between text-white border border-slate-700">
                          <div>
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Impatto sul CRM</p>
                              <p className="text-2xl font-black text-rose-400">- 8.5% Chiusure</p>
                              <p className="text-[10px] text-slate-300 mt-1">AI ha correlato il calo d'umore a una flessione delle vendite.</p>
                          </div>
                          <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center text-rose-400"><TrendingDown size={24}/></div>
                      </div>
                  </div>

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
                                  <div className="flex items-center gap-4 min-w-[250px]">
                                      <div className="w-12 h-12 bg-white border border-gray-200 rounded-full flex items-center justify-center font-black text-[#00665E] text-lg shadow-sm">{member.name.substring(0,2)}</div>
                                      <div>
                                          <p className="font-black text-gray-900">{member.name}</p>
                                          <p className="text-xs font-bold text-gray-500">{member.role} • {member.location}</p>
                                      </div>
                                  </div>
                                  <div className="flex flex-col items-center min-w-[150px]">
                                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Batteria</p>
                                      <div className="flex items-center gap-2">
                                          {renderBattery(member.battery)}
                                          <span className="font-black text-lg">{member.battery}%</span>
                                      </div>
                                  </div>
                                  <div className="flex-1 bg-white p-4 rounded-xl border border-rose-100 shadow-sm relative">
                                      <div className="absolute top-2 right-2 text-rose-300"><Sparkles size={16}/></div>
                                      <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">Report AI</p>
                                      <p className="text-xs text-gray-600 font-medium leading-relaxed">{member.aiSummary}</p>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          )}

          {/* ========================================== */}
          {/* VISTA 2: SCHEDA BENESSERE AZIENDALE (8 DIM) */}
          {/* ========================================== */}
          {activeTab === 'assessment' && (
              <div className="space-y-8 animate-in fade-in">
                  
                  <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 flex items-start gap-4 shadow-sm">
                      <ClipboardCheck className="text-indigo-500 shrink-0 mt-0.5" size={20}/>
                      <div>
                          <p className="text-sm font-bold text-indigo-900">Scheda Benessere Aziendale</p>
                          <p className="text-xs text-indigo-700 mt-1">Valuta 8 dimensioni organizzative con punteggio 1-10. Il sistema calcola automaticamente Rischio / Opportunità e l'AI genera suggerimenti operativi.</p>
                      </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      
                      {/* FORM PUNTEGGI */}
                      <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-200 shadow-sm p-8">
                          <div className="flex justify-between items-center mb-6">
                              <h2 className="text-xl font-black text-gray-900 flex items-center gap-2"><Target className="text-indigo-600"/> Valutazione Periodo</h2>
                              <input 
                                value={form.period} 
                                onChange={e => setForm({...form, period: e.target.value})}
                                placeholder="es. Aprile 2026"
                                className="text-sm font-bold text-gray-600 bg-gray-50 border border-gray-200 px-4 py-2 rounded-xl outline-none focus:border-indigo-500 w-48"
                              />
                          </div>

                          <div className="space-y-4">
                              {DIMENSIONS.map(dim => {
                                const val = (form as any)[dim.key]
                                const risk = getRiskLabel(val)
                                return (
                                  <div key={dim.key} className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100 hover:border-gray-200 transition">
                                    <span className="text-xl">{dim.icon}</span>
                                    <div className="flex-1">
                                      <p className="text-sm font-bold text-gray-800">{dim.label}</p>
                                      <div className="flex items-center gap-3 mt-2">
                                        <input 
                                          type="range" min="1" max="10" 
                                          value={val}
                                          onChange={e => setForm({...form, [dim.key]: Number(e.target.value)})}
                                          className="flex-1 h-2 accent-indigo-600 cursor-pointer"
                                        />
                                        <span className="text-lg font-black text-gray-900 w-8 text-right">{val}</span>
                                      </div>
                                    </div>
                                    <span className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-lg border flex items-center gap-1 whitespace-nowrap ${risk.color}`}>
                                      {risk.dot} {risk.label}
                                    </span>
                                  </div>
                                )
                              })}
                          </div>

                          <div className="mt-6">
                            <label className="text-xs font-bold uppercase text-gray-400 tracking-widest block mb-2">Note e Osservazioni</label>
                            <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Aggiungi commenti sulla valutazione..." className="w-full p-4 rounded-xl border border-gray-200 bg-gray-50 outline-none focus:border-indigo-500 min-h-[80px] resize-none text-sm"/>
                          </div>

                          <div className="flex gap-3 mt-6">
                            <button onClick={handleSaveAssessment} disabled={saving} className="flex-1 bg-indigo-600 text-white py-3.5 rounded-xl font-black shadow-lg hover:bg-indigo-700 transition flex items-center justify-center gap-2 disabled:opacity-50">
                              {saving ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>} Salva Valutazione
                            </button>
                            <button onClick={runAiWellnessAnalysis} disabled={aiLoading} className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3.5 rounded-xl font-black shadow-lg hover:scale-[1.02] transition flex items-center justify-center gap-2 disabled:opacity-50">
                              {aiLoading ? <Loader2 size={16} className="animate-spin"/> : <Sparkles size={16}/>} Analisi AI
                            </button>
                          </div>
                      </div>

                      {/* RADAR + SUMMARY */}
                      <div className="space-y-6">
                          {/* RADAR CHART */}
                          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6">
                            <h3 className="text-sm font-black text-gray-800 mb-4 flex items-center gap-2"><BarChart3 size={16} className="text-indigo-600"/> Mappa Benessere</h3>
                            <div className="h-64">
                              <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="65%" data={radarData}>
                                  <PolarGrid stroke="#e5e7eb"/>
                                  <PolarAngleAxis dataKey="subject" tick={{fill: '#6b7280', fontSize: 9, fontWeight: 'bold'}}/>
                                  <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false}/>
                                  <Radar name="Punteggio" dataKey="A" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.3}/>
                                </RadarChart>
                              </ResponsiveContainer>
                            </div>
                            <div className="text-center mt-2">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Media Totale</p>
                              <p className={`text-3xl font-black ${avgScore >= 7 ? 'text-emerald-600' : avgScore >= 5 ? 'text-yellow-600' : 'text-red-600'}`}>{avgScore.toFixed(1)}<span className="text-sm text-gray-400">/10</span></p>
                            </div>
                          </div>

                          {/* LEGENDA */}
                          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Legenda Scoring</h4>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2"><span>🔴</span><span className="text-xs font-bold text-gray-600">1-4: Area di Rischio — Intervento prioritario</span></div>
                              <div className="flex items-center gap-2"><span>🟡</span><span className="text-xs font-bold text-gray-600">5-7: Neutro — Monitoraggio consigliato</span></div>
                              <div className="flex items-center gap-2"><span>🟢</span><span className="text-xs font-bold text-gray-600">8-10: Opportunità — Punto di forza</span></div>
                            </div>
                          </div>
                      </div>
                  </div>

                  {/* AI ANALYSIS PANEL */}
                  {aiAnalysis && (
                    <div className="bg-slate-900 text-white rounded-3xl p-8 shadow-xl relative overflow-hidden animate-in slide-in-from-bottom">
                      <button onClick={() => setAiAnalysis(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X size={20}/></button>
                      <h3 className="text-xl font-black mb-4 flex items-center gap-2"><Sparkles className="text-purple-400"/> Report AI Benessere Aziendale</h3>
                      
                      <div className={`inline-block px-4 py-2 rounded-xl font-black text-lg mb-4 ${
                        aiAnalysis.overall_rating === 'Eccellente' ? 'bg-emerald-500/20 text-emerald-400' :
                        aiAnalysis.overall_rating === 'Buono' ? 'bg-blue-500/20 text-blue-400' :
                        aiAnalysis.overall_rating === 'Sufficiente' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        Rating: {aiAnalysis.overall_rating}
                      </div>

                      {aiAnalysis.risk_analysis && (
                        <div className="bg-red-900/30 border-l-4 border-red-500 p-4 rounded-xl mb-4">
                          <h4 className="font-bold text-sm mb-1">🔴 Analisi Rischi</h4>
                          <p className="text-xs text-slate-300">{aiAnalysis.risk_analysis}</p>
                        </div>
                      )}

                      {aiAnalysis.opportunity_analysis && (
                        <div className="bg-emerald-900/30 border-l-4 border-emerald-500 p-4 rounded-xl mb-4">
                          <h4 className="font-bold text-sm mb-1">🟢 Opportunità di Crescita</h4>
                          <p className="text-xs text-slate-300">{aiAnalysis.opportunity_analysis}</p>
                        </div>
                      )}

                      {aiAnalysis.priority_actions && (
                        <div className="mt-4">
                          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Azioni Prioritarie</h4>
                          <div className="space-y-2">
                            {aiAnalysis.priority_actions.map((action: string, i: number) => (
                              <div key={i} className="bg-slate-800 p-3 rounded-xl border border-slate-700 flex items-start gap-2">
                                <Target size={14} className="text-indigo-400 mt-0.5 shrink-0"/>
                                <p className="text-sm">{action}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {aiAnalysis.recommendation && (
                        <div className="mt-6 bg-indigo-500/20 p-4 rounded-xl border border-indigo-500/30">
                          <p className="text-sm font-bold text-indigo-300">💡 {aiAnalysis.recommendation}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* STORICO VALUTAZIONI */}
                  {assessments.length > 0 && (
                    <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-8">
                      <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2"><History className="text-indigo-600"/> Storico Valutazioni</h3>
                      <div className="space-y-4">
                        {assessments.map((a: any) => {
                          const dims = DIMENSIONS.map(d => ({ label: d.label, score: a[d.key], risk: getRiskLabel(a[d.key]) }))
                          const avg = dims.reduce((acc, d) => acc + d.score, 0) / dims.length
                          return (
                            <div key={a.id} className="bg-gray-50 border border-gray-100 p-5 rounded-2xl">
                              <div className="flex justify-between items-center mb-3">
                                <div>
                                  <span className="bg-gray-200 text-gray-700 text-[10px] font-bold uppercase px-2 py-1 rounded">{a.period}</span>
                                  <span className="text-[10px] text-gray-400 ml-3">{new Date(a.created_at).toLocaleDateString('it-IT')}</span>
                                </div>
                                <span className={`text-lg font-black ${avg >= 7 ? 'text-emerald-600' : avg >= 5 ? 'text-yellow-600' : 'text-red-600'}`}>{avg.toFixed(1)}/10</span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {dims.map((d, i) => (
                                  <span key={i} className={`text-[10px] font-bold px-2 py-1 rounded border ${d.risk.color}`}>
                                    {d.risk.dot} {d.label.split(' ')[0]}: {d.score}
                                  </span>
                                ))}
                              </div>
                              {a.notes && <p className="text-xs text-gray-600 mt-3 italic">"{a.notes}"</p>}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
              </div>
          )}

          {/* ========================================== */}
          {/* VISTA 3: PORTALE DEL DIPENDENTE */}
          {/* ========================================== */}
          {activeTab === 'agent_portal' && (
              <div className="max-w-2xl mx-auto animate-in zoom-in-95">
                  <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-200 relative">
                      <div className="bg-gradient-to-r from-slate-900 to-[#00665E] p-8 text-center text-white relative">
                          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-md border border-white/20">
                              <ShieldCheck size={32} className="text-emerald-400"/>
                          </div>
                          <h2 className="text-2xl font-black mb-1">Spazio Sicuro e Protetto</h2>
                          <p className="text-sm text-teal-100 mb-4">Simulazione del check-in visto dal dipendente.</p>
                          <div className="inline-flex items-center gap-2 bg-black/30 px-4 py-2 rounded-full text-[10px] font-bold border border-white/10"><Lock size={14} className="text-amber-400"/> Crittografia End-to-End</div>
                      </div>

                      {!agentConsented ? (
                          <div className="p-10 text-center">
                              <h3 className="text-xl font-black text-gray-900 mb-4">Check-in del Benessere Mensile</h3>
                              <p className="text-sm text-gray-600 mb-8 leading-relaxed">
                                  Le risposte fornite in questa chat <b>non saranno mai lette dai tuoi superiori</b>. Il sistema invierà alla direzione solo un punteggio aggregato.
                              </p>
                              <label className="flex items-start gap-3 bg-gray-50 p-4 rounded-xl border border-gray-200 cursor-pointer text-left hover:bg-gray-100 transition mb-8">
                                  <input type="checkbox" className="mt-1 w-5 h-5 accent-[#00665E] cursor-pointer" onChange={(e) => setAgentConsented(e.target.checked)}/>
                                  <span className="text-xs text-gray-700 font-medium">Acconsento al trattamento dei dati nel rispetto del GDPR.</span>
                              </label>
                              <button disabled={!agentConsented} onClick={() => setAgentChatStep(1)} className="w-full bg-[#00665E] text-white font-black py-4 rounded-xl hover:bg-[#004d46] transition disabled:opacity-50 shadow-lg flex justify-center items-center gap-2">
                                  <Smile size={18}/> Inizia Check-in
                              </button>
                          </div>
                      ) : (
                          <div className="p-8 space-y-8 bg-gray-50 min-h-[500px]">
                              <div className="flex gap-3 animate-in slide-in-from-left-4">
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00665E] to-teal-500 flex items-center justify-center text-white shrink-0 shadow-md"><BrainCircuit size={20}/></div>
                                  <div className="bg-white p-5 rounded-2xl rounded-tl-sm border border-gray-200 shadow-sm text-sm text-gray-700 max-w-[85%] leading-relaxed">
                                      Ciao! Ho notato dai dati che questa settimana hai gestito 45 ticket. È stato faticoso?
                                  </div>
                              </div>

                              {agentChatStep === 1 && (
                                  <div className="flex justify-end gap-2 animate-in fade-in zoom-in">
                                      <button onClick={() => setAgentChatStep(2)} className="bg-gray-200 text-gray-700 font-bold px-4 py-2 rounded-full text-xs hover:bg-gray-300">Tutto bene</button>
                                      <button onClick={() => setAgentChatStep(2)} className="bg-[#00665E] text-white font-bold px-4 py-2 rounded-full text-xs shadow-md">Sono esausta</button>
                                  </div>
                              )}

                              {agentChatStep >= 2 && (
                                  <>
                                      <div className="flex justify-end"><div className="bg-[#00665E] text-white p-5 rounded-2xl rounded-tr-sm shadow-md text-sm">Sì, sono esausta.</div></div>
                                      <div className="flex gap-3 animate-in slide-in-from-bottom-4 delay-300">
                                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00665E] to-teal-500 flex items-center justify-center text-white shrink-0 shadow-md"><Sparkles size={20}/></div>
                                          <div className="bg-white p-5 rounded-2xl rounded-tl-sm border border-rose-200 shadow-sm text-sm text-gray-700 max-w-[90%]">
                                              Capisco. Ho segnalato alla direzione che la tua batteria è bassa, senza rivelare dettagli. Prenditi 5 minuti e guarda questo video:
                                              <div className="mt-5 border border-gray-200 rounded-xl overflow-hidden cursor-pointer hover:shadow-lg transition">
                                                  <div className="h-32 bg-gray-800 relative">
                                                      <img src="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=400&h=200" alt="Yoga" className="w-full h-full object-cover opacity-60"/>
                                                      <div className="absolute inset-0 flex items-center justify-center"><PlayCircle size={40} className="text-white drop-shadow-md"/></div>
                                                  </div>
                                                  <div className="p-3 bg-white">
                                                      <p className="font-black text-gray-900 text-xs flex items-center gap-1"><Youtube size={14} className="text-red-500"/> Tecniche di respirazione da scrivania</p>
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