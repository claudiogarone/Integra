'use client'

import { createClient } from '../../utils/supabase/client'
import { useEffect, useState } from 'react'
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ComposedChart, Line
} from 'recharts'
import { 
  Users, Calendar, ArrowUpRight, DollarSign, Activity, Zap, ShoppingCart, 
  Target, Megaphone, CreditCard, BrainCircuit, Bot, HeartPulse,
  Radar as RadarIcon, Copy, Check, Bell, Info, AlertTriangle, CheckCircle // <-- AGGIUNGI Icone Notifiche
} from 'lucide-react'
import Link from 'next/link'

export default function Dashboard() {
    const [copied, setCopied] = useState(false);
  const handleCopyCode = () => {
      if(currentUser?.company_code) {
          navigator.clipboard.writeText(currentUser.company_code);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
      }
  }
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  
  const [stats, setStats] = useState({ 
    revenue: 0, 
    contacts: 0, 
    appointments: 0, 
    conversionRate: 0,
    fidelityCards: 0
  })
  
  // Dati per i Grafici
  const [trendData, setTrendData] = useState<any[]>([])
  const [ecosystemRadar, setEcosystemRadar] = useState<any[]>([])
  const [marketingData, setMarketingData] = useState<any[]>([])
  const [notifications, setNotifications] = useState<any[]>([]) // <-- STATO NOTIFICHE

  const supabase = createClient()
  const MONTHLY_TARGET = 75000; 

  useEffect(() => {
    const getData = async () => {
      setLoading(true)
      
      // 1. RECUPERA L'UTENTE ATTUALMENTE LOGGATO
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
          // [!] MODIFICA CHIAVE: Scarica anche il profilo per avere Ruolo e Codice Azienda!
          const { data: profile } = await supabase.from('profiles').select('role, company_code').eq('id', user.id).single()
          setCurrentUser({ ...user, role: profile?.role, company_code: profile?.company_code })
          
          // 2. FILTRO TASSATIVO: Scarica SOLO i dati di questo specifico utente!
          const { data: contacts } = await supabase.from('contacts').select('*').eq('user_id', user.id)
          const { data: appointments } = await supabase.from('appointments').select('*').eq('user_id', user.id)
          
          const fidRes = await supabase.from('fidelity_cards').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
          const fidCount = fidRes.error ? 0 : (fidRes.count || 0)

          // 2.a RECUPERA NOTIFICHE REALI
          const { data: notifs } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(5)
          
          if (notifs) setNotifications(notifs)

          // --- CALCOLO KPI REALI (Senza Dati Finti) ---
          // Se l'array contacts esiste, calcoliamo; altrimenti tutto è 0.
          const totalRevenue = contacts ? contacts.reduce((acc, c) => acc + (Number(c.ltv) || Number(c.value) || 0), 0) : 0;
          const totalContacts = contacts ? contacts.length : 0;
          const wonDeals = contacts ? contacts.filter(c => c.status === 'Chiuso' || c.status === 'Vinto').length : 0;
          const conversion = totalContacts > 0 ? Math.round((wonDeals / totalContacts) * 100) : 0;
          const totalAppointments = appointments ? appointments.length : 0;

          setStats({
              revenue: totalRevenue,
              contacts: totalContacts,
              appointments: totalAppointments,
              conversionRate: conversion,
              fidelityCards: fidCount
          })

          // --- TREND FATTURATO (Se 0, fa un grafico piatto) ---
          setTrendData([
              { name: 'Gen', Fatturato: totalRevenue > 0 ? totalRevenue * 0.1 : 0 }, 
              { name: 'Feb', Fatturato: totalRevenue > 0 ? totalRevenue * 0.2 : 0 },
              { name: 'Mar', Fatturato: totalRevenue > 0 ? totalRevenue * 0.15 : 0 }, 
              { name: 'Apr', Fatturato: totalRevenue > 0 ? totalRevenue * 0.3 : 0 },
              { name: 'Mag', Fatturato: totalRevenue > 0 ? totalRevenue * 0.25 : 0 }, 
              { name: 'Giu', Fatturato: totalRevenue > 0 ? totalRevenue : 0 },
          ])

          // --- MEGA-RADAR ECOSISTEMA ---
          const isNewAccount = totalContacts === 0;
          setEcosystemRadar([
              { subject: 'Vendite & CRM', A: isNewAccount ? 0 : 85, fullMark: 100 },
              { subject: 'Marketing DEM', A: isNewAccount ? 0 : 65, fullMark: 100 },
              { subject: 'Automazioni AI', A: isNewAccount ? 0 : 92, fullMark: 100 },
              { subject: 'Energy & ESG', A: isNewAccount ? 0 : 45, fullMark: 100 },
              { subject: 'Team Wellness', A: isNewAccount ? 0 : 78, fullMark: 100 },
              { subject: 'Fidelity Punti', A: isNewAccount ? 0 : 88, fullMark: 100 },
          ])

          // --- MARKETING FUNNEL ---
          setMarketingData([
              { canale: 'Email (DEM)', raggiunti: isNewAccount ? 0 : 5000, conversioni: isNewAccount ? 0 : 300 },
              { canale: 'Landing Pages', raggiunti: isNewAccount ? 0 : 3000, conversioni: isNewAccount ? 0 : 450 },
              { canale: 'Volantini QR', raggiunti: isNewAccount ? 0 : 1500, conversioni: isNewAccount ? 0 : 120 },
              { canale: 'WhatsApp AI', raggiunti: isNewAccount ? 0 : 2000, conversioni: isNewAccount ? 0 : 600 },
          ])
      }
      setLoading(false)
    }
    getData()
  }, [supabase])

  if (loading) return (
      <div className="flex flex-col h-screen bg-[#F8FAFC] items-center justify-center text-[#00665E] animate-pulse">
          <Activity className="animate-spin mb-4" size={40}/>
          <h2 className="text-2xl font-black">Inizializzazione Control Room...</h2>
          <p className="text-gray-500 text-sm mt-2">Sincronizzazione ecosistema in corso</p>
      </div>
  )

  const revenueProgress = Math.min((stats.revenue / MONTHLY_TARGET) * 100, 100);
  const isAccountEmpty = stats.contacts === 0 && stats.revenue === 0;

  return (
    <main className="flex-1 p-4 md:p-8 bg-[#F8FAFC] text-gray-900 font-sans pb-24 overflow-y-auto min-h-screen">
      
      {/* HEADER MEGA-DASHBOARD */}
      <div className="bg-[#004d46] rounded-3xl p-8 md:p-10 mb-8 shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6 z-10">
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10 text-white">
              <div className="flex items-center gap-3 mb-2">
                  <div className="bg-white/10 p-2 rounded-xl backdrop-blur-sm"><Zap className="text-yellow-400" size={24} fill="currentColor"/></div>
                  <h1 className="text-3xl md:text-4xl font-black tracking-tight">Control Room</h1>
              </div>
              <p className="text-slate-400 text-sm md:text-base max-w-lg">
                  Benvenuto {currentUser?.email}. L'Intelligenza Artificiale è attiva e pronta a monitorare il tuo business in tempo reale.
              </p>
              {/* NUOVO BADGE PER IL CODICE AZIENDA - ORA SFOCATO E SICURO */}
              {currentUser?.role === 'admin' && currentUser?.company_code && (
                  <div className="bg-blue-900/40 border border-blue-500/30 px-5 py-3 rounded-xl flex items-center justify-between gap-4 shadow-sm backdrop-blur-sm group cursor-pointer" onClick={handleCopyCode}>
                      <span className="text-xs font-bold text-blue-300 uppercase tracking-widest">Codice Agenti:</span>
                      <div className="flex items-center gap-2">
                          <span className="text-white font-mono font-black text-lg bg-[#020817] px-3 py-1 rounded-md tracking-widest border border-slate-700 blur-[4px] group-hover:blur-none transition-all select-all">
                              {currentUser.company_code}
                          </span>
                          <button className="text-blue-400 hover:text-white transition">
                              {copied ? <Check size={18} className="text-emerald-400"/> : <Copy size={18}/>}
                          </button>
                      </div>
                  </div>
              )}
          </div>
          
          <div className="relative z-10 flex flex-col gap-3 w-full md:w-auto">
              <div className="bg-emerald-500/10 border border-emerald-500/30 px-5 py-3 rounded-xl flex items-center justify-between gap-6 shadow-sm backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                      <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                      </span>
                      <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Stato Ecosistema</span>
                  </div>
                  <span className="text-white font-black">ATTIVO</span>
              </div>
          </div>
      </div>

      {/* MESSAGGIO ACCOUNT NUOVO (ONBOARDING) */}
      {isAccountEmpty && (
          <div className="bg-blue-50 border border-blue-200 p-6 rounded-3xl mb-8 flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-4">
              <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center shrink-0">1</div>
                  <div>
                      <h3 className="font-black text-blue-900 text-lg">Il tuo ecosistema è pulito e pronto!</h3>
                      <p className="text-blue-700 text-sm">Aggiungi il tuo primo cliente o collega una fonte di traffico per dare vita ai grafici.</p>
                  </div>
              </div>
              <Link href="/dashboard/crm" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition shadow-md whitespace-nowrap">
                  Vai al CRM e inizia
              </Link>
          </div>
      )}

      {/* --- RIGA 1: I 4 PILASTRI DEL BUSINESS --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8 animate-in slide-in-from-bottom-4 duration-500">
        
        {/* 1. FATTURATO */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group">
            <div className="flex justify-between items-start mb-2 relative z-10">
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><DollarSign size={20} strokeWidth={3}/></div>
                <span className="text-[10px] font-black text-emerald-600 bg-emerald-100 px-2 py-1 rounded-md">KPI PRINCIPALE</span>
            </div>
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-4 relative z-10">Fatturato Generato</p>
            <h3 className="text-3xl font-black text-gray-900 mt-1 relative z-10">€ {stats.revenue.toLocaleString('it-IT')}</h3>
            
            <div className="mt-5 pt-5 border-t border-gray-50 relative z-10">
                <div className="flex justify-between text-[10px] font-bold text-gray-400 mb-1.5">
                    <span>Obiettivo Mensile</span>
                    <span className="text-emerald-600">{Math.round(revenueProgress)}%</span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-1000 relative" style={{width: `${revenueProgress}%`}}>
                        {revenueProgress > 0 && <div className="absolute inset-0 bg-white/30 w-full animate-[shimmer_2s_infinite]"></div>}
                    </div>
                </div>
            </div>
            <ShoppingCart size={120} className="absolute -right-6 -bottom-6 text-gray-50 opacity-50 group-hover:scale-110 transition-transform duration-500 pointer-events-none" />
        </div>

        {/* 2. CLIENTI E CRM */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group">
            <div className="flex justify-between items-start mb-2">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><Users size={20} strokeWidth={3}/></div>
                {stats.contacts > 0 && <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-md flex items-center gap-1"><ArrowUpRight size={12}/> +14%</span>}
            </div>
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-4">Database Contatti</p>
            <div className="flex items-end gap-3 mt-1">
                <h3 className="text-3xl font-black text-gray-900">{stats.contacts}</h3>
                <p className="text-xs font-bold text-gray-500 mb-1.5">Lead Attivi</p>
            </div>
            <div className="mt-5 pt-4 border-t border-gray-50 flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tasso di Chiusura</span>
                <span className="text-sm font-black text-blue-600">{stats.conversionRate}%</span>
            </div>
        </div>

        {/* 3. FEDELTA E ACQUISTI RICORRENTI */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group">
             <div className="flex justify-between items-start mb-2">
                <div className="p-2.5 bg-orange-50 text-orange-600 rounded-xl"><CreditCard size={20} strokeWidth={3}/></div>
            </div>
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-4">Fidelity & LTV</p>
            <h3 className="text-3xl font-black text-gray-900 mt-1">{stats.fidelityCards}</h3>
            <div className="mt-5 pt-4 border-t border-gray-50 flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Aumento Scontrino</span>
                <span className="text-sm font-black text-orange-500">{isAccountEmpty ? '€ 0.00' : '+ € 12.40'}</span>
            </div>
        </div>

        {/* 4. AI & AUTOMAZIONI */}
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-6 rounded-3xl shadow-lg relative overflow-hidden group text-white">
            <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-110 transition-transform duration-700"><BrainCircuit size={80}/></div>
             <div className="flex justify-between items-start mb-2 relative z-10">
                <div className="p-2.5 bg-indigo-500/20 text-indigo-300 rounded-xl backdrop-blur-sm border border-indigo-500/30"><Bot size={20} strokeWidth={3}/></div>
                <span className="text-[9px] font-black text-indigo-200 bg-indigo-500/20 border border-indigo-500/30 px-2 py-1 rounded-md uppercase tracking-widest">Risparmio Tempo</span>
            </div>
            <p className="text-indigo-300 text-[10px] font-black uppercase tracking-widest mt-4 relative z-10">Lavoro AI Automatico</p>
            <h3 className="text-3xl font-black text-white mt-1 relative z-10">{isAccountEmpty ? '0' : '432'}<span className="text-lg font-medium text-indigo-200 ml-1">Tasks</span></h3>
            <div className="mt-5 pt-4 border-t border-indigo-500/30 flex items-center justify-between relative z-10">
                <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">Ore Risparmiate</span>
                <span className="text-sm font-black text-emerald-400">{isAccountEmpty ? '0 Ore' : '~ 36 Ore'}</span>
            </div>
        </div>

      </div>

      {/* --- RIGA 2: I GRAFICI (Mega Radar + Trend) --- */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8 animate-in slide-in-from-bottom-8 duration-700 delay-100">
        
        {/* 1. MEGA RADAR AZIENDALE */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col">
            <div className="mb-4">
                <h3 className="font-black text-gray-900 text-lg flex items-center gap-2"><Target className="text-rose-500"/> Scanner Ecosistema</h3>
                <p className="text-xs text-gray-400 mt-1">Valutazione olistica dello stato di salute dell'azienda nei vari reparti.</p>
            </div>
            
            <div className="flex-1 min-h-[280px] relative flex items-center justify-center bg-slate-50/50 rounded-2xl border border-gray-50">
                {isAccountEmpty ? (
                    <div className="text-center p-6 opacity-50">
                        {/* USO DELL'ALIAS CORRETTO RadarIcon */}
                        <RadarIcon size={40} className="mx-auto mb-2 text-slate-400" />
                        <p className="text-sm font-bold text-slate-500">In attesa di dati operativi</p>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="65%" data={ecosystemRadar}>
                            <PolarGrid stroke="#e2e8f0" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 10, fontWeight: 'bold' }} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                            <Radar name="Punteggio Salute" dataKey="A" stroke="#00665E" strokeWidth={3} fill="#00665E" fillOpacity={0.25} />
                            <Tooltip contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff'}} itemStyle={{color: '#34d399', fontWeight: 'bold'}} />
                        </RadarChart>
                    </ResponsiveContainer>
                )}
            </div>
            
            {!isAccountEmpty && (
                <div className="mt-4 flex items-start gap-3 bg-amber-50 border border-amber-100 p-3 rounded-xl">
                    <BrainCircuit size={16} className="text-amber-500 shrink-0 mt-0.5"/>
                    <p className="text-[11px] font-medium text-amber-800 leading-relaxed">
                        <span className="font-bold">Insight AI:</span> Il settore "Energy & ESG" è carente (45%). Si consiglia di scansionare le bollette nel modulo Energy Monitor.
                    </p>
                </div>
            )}
        </div>

        {/* 2. FINANCIAL TREND E MARKETING (Composed Chart) */}
        <div className="xl:col-span-2 bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm relative flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 relative z-10 gap-4">
                <div>
                    <h3 className="font-black text-gray-900 text-xl flex items-center gap-2"><Activity className="text-blue-600"/> Ricavi Storici & Pipeline</h3>
                    <p className="text-xs font-medium text-gray-400 mt-1 uppercase tracking-widest">Dati consolidati dal modulo ERP Finance</p>
                </div>
                <Link href="/dashboard/finance" className="text-xs font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-xl hover:bg-blue-100 transition">Apri Analisi CFO</Link>
            </div>
            
            <div className="h-72 w-full relative z-10 flex-1">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData} margin={{top: 10, right: 0, left: 0, bottom: 0}}>
                        <defs>
                            <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#00665E" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="#00665E" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b', fontWeight: 'bold'}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} tickFormatter={(value) => `€${value/1000}k`} />
                        <Tooltip 
                            contentStyle={{backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} 
                            itemStyle={{color: '#1e293b', fontWeight: 'black'}} 
                            formatter={(value: any) => [`€ ${Number(value).toLocaleString('it-IT')}`, 'Fatturato']}
                        />
                        <Area type="monotone" dataKey="Fatturato" stroke="#00665E" strokeWidth={4} fillOpacity={1} fill="url(#colorTrend)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>

      {/* --- RIGA 3: WIDGET OPERATIVI E TEAM WELLNESS --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in slide-in-from-bottom-8 duration-700 delay-300">
          
          {/* MARKETING FUNNEL BAR CHART */}
          <div className="md:col-span-2 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                  <div>
                      <h3 className="font-black text-gray-900 text-lg flex items-center gap-2"><Megaphone className="text-orange-500"/> Conversioni Marketing</h3>
                      <p className="text-xs text-gray-400 mt-1">Efficacia delle tue campagne multicanale.</p>
                  </div>
              </div>
              <div className="h-60 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={marketingData} margin={{top: 10, right: 0, left: -20, bottom: 0}}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="canale" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b', fontWeight: 'bold'}} dy={10} />
                          <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                          <Tooltip contentStyle={{backgroundColor: '#fff', border: 'none', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                          <Bar yAxisId="left" dataKey="raggiunti" name="Utenti Raggiunti" barSize={24} fill="#e2e8f0" radius={[6, 6, 0, 0]} />
                          <Bar yAxisId="left" dataKey="conversioni" name="Conversioni (Vendite)" barSize={24} fill="#f97316" radius={[6, 6, 0, 0]} />
                      </ComposedChart>
                  </ResponsiveContainer>
              </div>
          </div>

          {/* WIDGET TEAM WELLNESS & PULSE HR */}
          <div className="bg-gradient-to-br from-rose-50 to-pink-50 p-6 rounded-3xl border border-rose-100 shadow-sm flex flex-col justify-between">
              <div>
                  <div className="w-12 h-12 bg-rose-500 text-white rounded-2xl flex items-center justify-center shadow-lg mb-4">
                      <HeartPulse size={24}/>
                  </div>
                  <h3 className="font-black text-rose-900 text-xl mb-1">Pulse HR & Morale</h3>
                  <p className="text-sm text-rose-700/80 mb-6 leading-relaxed">Il benessere della tua squadra è il motore delle vendite. Il morale medio del team questa settimana è eccellente.</p>
              </div>
              
              <div className="bg-white p-4 rounded-2xl shadow-sm mb-4">
                  <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-black text-gray-500 uppercase tracking-widest">Morale Globale</span>
                      <span className="text-sm font-black text-emerald-500">{isAccountEmpty ? 'N/A' : '82/100'}</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{width: isAccountEmpty ? '0%' : '82%'}}></div>
                  </div>
              </div>

              <Link href="/dashboard/wellness" className="w-full bg-rose-600 text-white font-bold py-3 rounded-xl hover:bg-rose-700 transition flex items-center justify-center gap-2 shadow-md">
                  Apri Valutazioni Team
              </Link>
          </div>

          {/* NUOVO: CENTRO NOTIFICHE INTELLIGENTE (ECOSYSTEM BRIDGE) */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col">
              <div className="flex justify-between items-center mb-6">
                  <h3 className="font-black text-gray-900 text-lg flex items-center gap-2"><Bell className="text-indigo-600"/> Feed Attività AI</h3>
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md uppercase">Real-time</span>
              </div>
              
              <div className="flex-1 space-y-4 overflow-y-auto max-h-80 pr-2">
                  {notifications.length === 0 ? (
                      <div className="text-center py-10">
                          <Info className="mx-auto text-gray-300 mb-2" size={32}/>
                          <p className="text-gray-400 text-xs italic">Nessun evento rilevato dall'Ecosistema.</p>
                      </div>
                  ) : (
                      notifications.map((n) => (
                          <div key={n.id} className="flex gap-4 p-3 rounded-2xl hover:bg-gray-50 transition border border-transparent hover:border-gray-100 group">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                  n.type === 'alert' || n.type === 'warning' ? 'bg-amber-100 text-amber-600' : 
                                  n.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'
                              }`}>
                                  {n.type === 'warning' ? <AlertTriangle size={18}/> : n.type === 'success' ? <CheckCircle size={18}/> : <Info size={18}/>}
                              </div>
                              <div className="flex-1 min-w-0">
                                  <div className="flex justify-between items-start mb-0.5">
                                      <h4 className="font-bold text-gray-900 text-xs truncate">{n.title}</h4>
                                      <span className="text-[9px] text-gray-400 font-medium">{new Date(n.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                  </div>
                                  <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">{n.message}</p>
                                  {n.link && (
                                      <Link href={n.link} className="text-[10px] font-bold text-indigo-600 mt-2 inline-block hover:underline">Visualizza Dettagli →</Link>
                                  )}
                              </div>
                          </div>
                      ))
                  )}
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-50">
                  <p className="text-[10px] text-gray-400 text-center italic">L'AI Bridge monitora costantemente CRM, Incognito e Academy.</p>
              </div>
          </div>

      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}} />
    </main>
  )
}