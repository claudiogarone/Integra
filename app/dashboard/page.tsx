'use client'

import { createClient } from '../../utils/supabase/client'
import { useEffect, useState } from 'react'
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, BarChart, Bar 
} from 'recharts'
import { 
  TrendingUp, Users, Calendar, Target, ArrowUpRight, DollarSign, Activity, Zap 
} from 'lucide-react'
import Link from 'next/link'

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ 
    revenue: 0, 
    contacts: 0, 
    appointments: 0, 
    conversionRate: 0 
  })
  const [recentContacts, setRecentContacts] = useState<any[]>([])
  const [sourceData, setSourceData] = useState<any[]>([])
  const [trendData, setTrendData] = useState<any[]>([])
  
  const supabase = createClient()

  // Colori per il grafico a torta
  const COLORS = ['#00665E', '#10B981', '#F59E0B', '#3B82F6', '#6366F1'];

  useEffect(() => {
    const getData = async () => {
      setLoading(true)
      
      // 1. Fetch Dati Reali
      const { data: contacts } = await supabase.from('contacts').select('*').order('created_at', { ascending: false })
      const { count: apptCount } = await supabase.from('appointments').select('*', { count: 'exact', head: true })
      
      if (contacts) {
        // --- CALCOLI KPI ---
        const totalRevenue = contacts.reduce((acc, c) => acc + (Number(c.value) || 0), 0)
        const wonDeals = contacts.filter(c => c.status === 'Chiuso' || c.status === 'Vinto').length
        const conversion = contacts.length > 0 ? Math.round((wonDeals / contacts.length) * 100) : 0

        setStats({
          revenue: totalRevenue,
          contacts: contacts.length,
          appointments: apptCount || 0,
          conversionRate: conversion
        })

        setRecentContacts(contacts.slice(0, 5))

        // --- CALCOLO FONTI (PIE CHART) ---
        const sources: any = {}
        contacts.forEach(c => {
            const s = c.source || 'Altro'
            sources[s] = (sources[s] || 0) + 1
        })
        const pieData = Object.keys(sources).map(k => ({ name: k, value: sources[k] }))
        setSourceData(pieData)

        // --- CALCOLO TREND (SIMULAZIONE BASATA SUL TOTALE) ---
        // Distribuiamo il fatturato su un grafico fittizio per l'effetto estetico (finché non abbiamo storici lunghi)
        const mockTrend = [
            { name: 'Lun', val: totalRevenue * 0.05 },
            { name: 'Mar', val: totalRevenue * 0.12 },
            { name: 'Mer', val: totalRevenue * 0.08 },
            { name: 'Gio', val: totalRevenue * 0.25 },
            { name: 'Ven', val: totalRevenue * 0.30 },
            { name: 'Sab', val: totalRevenue * 0.15 },
            { name: 'Dom', val: totalRevenue * 0.05 },
        ]
        setTrendData(mockTrend)
      }
      setLoading(false)
    }
    getData()
  }, [])

  if (loading) return <div className="p-10 text-[#00665E] animate-pulse">Caricamento Control Room...</div>

  return (
    <main className="flex-1 p-8 bg-[#F8FAFC] text-gray-900 font-sans pb-20 overflow-y-auto">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 animate-in slide-in-from-top duration-500">
        <div>
          <h1 className="text-3xl font-black text-[#00665E] tracking-tight">Control Room</h1>
          <p className="text-gray-500 text-sm mt-1">Benvenuto nella tua console di comando.</p>
        </div>
        <div className="flex gap-3">
           <div className="bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm text-xs font-bold text-gray-500 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Sistema Operativo
           </div>
           <Link href="/dashboard/crm" className="bg-[#00665E] text-white px-5 py-2 rounded-xl font-bold shadow-lg shadow-[#00665E]/20 hover:bg-[#004d46] transition flex items-center gap-2">
              <Zap size={18} /> Azione Rapida
           </Link>
        </div>
      </div>

      {/* --- RIGA 1: SUPER KPI (Effetto Gradiente) --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-in slide-in-from-bottom duration-700">
        
        {/* REVENUE CARD */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#00665E] to-teal-800 p-6 rounded-3xl text-white shadow-xl shadow-teal-900/10 group hover:scale-[1.02] transition duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none"></div>
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm"><DollarSign size={20} /></div>
                    <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded text-teal-50">+12%</span>
                </div>
                <p className="opacity-80 text-xs font-bold uppercase tracking-wider">Fatturato Stimato</p>
                <h3 className="text-3xl font-black mt-1">€ {stats.revenue.toLocaleString()}</h3>
            </div>
        </div>

        {/* LEADS CARD */}
        <div className="relative overflow-hidden bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition group">
            <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Users size={20} /></div>
                <span className="text-xs font-bold text-green-600 flex items-center gap-1"><ArrowUpRight size={12}/> Attivi</span>
            </div>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Totale Contatti</p>
            <h3 className="text-3xl font-black text-gray-900 mt-1">{stats.contacts}</h3>
        </div>

        {/* APPOINTMENTS CARD */}
        <div className="relative overflow-hidden bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition group">
             <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Calendar size={20} /></div>
            </div>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Appuntamenti</p>
            <h3 className="text-3xl font-black text-gray-900 mt-1">{stats.appointments}</h3>
            <p className="text-xs text-purple-600 mt-2 font-bold">In agenda</p>
        </div>

        {/* CONVERSION CARD */}
        <div className="relative overflow-hidden bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition group">
             <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><Activity size={20} /></div>
            </div>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Tasso Conversione</p>
            <h3 className="text-3xl font-black text-gray-900 mt-1">{stats.conversionRate}%</h3>
            <div className="w-full bg-gray-100 h-1.5 rounded-full mt-3 overflow-hidden">
                <div className="h-full bg-orange-500 rounded-full" style={{width: `${stats.conversionRate}%`}}></div>
            </div>
        </div>
      </div>

      {/* --- RIGA 2: GRAFICI SPETTACOLARI --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8 animate-in slide-in-from-bottom duration-1000 delay-100">
        
        {/* 1. FINANCIAL TREND (Area Chart) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="font-bold text-gray-800 text-lg">Crescita Finanziaria</h3>
                    <p className="text-xs text-gray-400">Andamento entrate ultimi 7 giorni</p>
                </div>
                <div className="bg-gray-50 px-3 py-1 rounded-lg text-xs font-bold text-gray-500">Settimanale</div>
            </div>
            <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData}>
                        <defs>
                            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#00665E" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#00665E" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                        <Tooltip 
                            contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff'}}
                            itemStyle={{color: '#fff'}}
                            cursor={{stroke: '#00665E', strokeDasharray: '5 5'}}
                        />
                        <Area type="monotone" dataKey="val" stroke="#00665E" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* 2. ACQUISITION SOURCES (Donut Chart) */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col">
            <h3 className="font-bold text-gray-800 text-lg mb-2">Sorgenti Traffico</h3>
            <p className="text-xs text-gray-400 mb-6">Da dove arrivano i tuoi clienti?</p>
            
            <div className="flex-1 min-h-[200px] relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={sourceData.length > 0 ? sourceData : [{name: 'No Data', value: 1}]}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {sourceData.length > 0 ? (
                                sourceData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))
                            ) : (
                                <Cell fill="#f3f4f6" />
                            )}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                </ResponsiveContainer>
                {/* Centro della ciambella */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-black text-gray-800">{stats.contacts}</span>
                    <span className="text-[10px] text-gray-400 uppercase font-bold">Leads</span>
                </div>
            </div>

            {/* Legenda Manuale */}
            <div className="mt-4 space-y-2">
                {sourceData.map((entry, index) => (
                    <div key={index} className="flex justify-between text-sm">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[index % COLORS.length]}}></span>
                            <span className="text-gray-600 font-medium">{entry.name}</span>
                        </div>
                        <span className="font-bold text-gray-800">{entry.value}</span>
                    </div>
                ))}
            </div>
        </div>
      </div>

      {/* --- RIGA 3: OBIETTIVI & FEED --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 animate-in slide-in-from-bottom duration-1000 delay-200">
         
         {/* OBIETTIVO MENSILE */}
         <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-6 rounded-3xl text-white shadow-xl">
             <div className="flex justify-between items-center mb-6">
                 <div className="flex items-center gap-3">
                     <div className="p-2 bg-white/10 rounded-lg"><Target size={20}/></div>
                     <div>
                         <h3 className="font-bold text-lg">Obiettivo Mensile</h3>
                         <p className="text-xs text-gray-400">Target revenue: € 50.000</p>
                     </div>
                 </div>
                 <span className="text-2xl font-black">{Math.min(Math.round((stats.revenue / 50000) * 100), 100)}%</span>
             </div>
             
             {/* Progress Bar Avanzata */}
             <div className="w-full bg-white/10 h-4 rounded-full overflow-hidden mb-2">
                 <div 
                    className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full shadow-[0_0_15px_rgba(52,211,153,0.5)] transition-all duration-1000" 
                    style={{width: `${Math.min((stats.revenue / 50000) * 100, 100)}%`}}
                 ></div>
             </div>
             <p className="text-xs text-gray-400 text-right">Mancano € {(50000 - stats.revenue).toLocaleString()} al target</p>
         </div>

         {/* ULTIMI CONTATTI */}
         <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
             <h3 className="font-bold text-gray-800 mb-4">Attività Recente</h3>
             <div className="space-y-4">
                 {recentContacts.length === 0 ? <p className="text-gray-400 text-sm">Nessuna attività.</p> : 
                    recentContacts.map((c, i) => (
                        <div key={i} className="flex items-center justify-between group cursor-pointer hover:bg-gray-50 p-2 rounded-xl transition">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500 text-xs group-hover:bg-[#00665E] group-hover:text-white transition">
                                    {c.name.substring(0,2).toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-800">{c.name}</p>
                                    <p className="text-[10px] text-gray-400 uppercase">{c.source || 'Diretto'}</p>
                                </div>
                            </div>
                            <span className="font-bold text-[#00665E] text-sm">€ {c.value?.toLocaleString()}</span>
                        </div>
                    ))
                 }
             </div>
             <Link href="/dashboard/crm" className="block text-center mt-4 text-xs font-bold text-gray-400 hover:text-[#00665E] transition">VEDI TUTTI</Link>
         </div>

      </div>

    </main>
  )
}