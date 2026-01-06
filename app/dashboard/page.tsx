'use client'

import { createClient } from '../../utils/supabase/client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function Dashboard() {
  const [filter, setFilter] = useState('Mese') // Stato Filtro
  const [stats, setStats] = useState({ contacts: 0, appointments: 0, revenue: 0 })
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      // 1. Dati KPI
      const { count: contactCount } = await supabase.from('contacts').select('*', { count: 'exact', head: true })
      const { count: apptCount } = await supabase.from('appointments').select('*', { count: 'exact', head: true })
      
      // 2. Dati Profilo (Crediti AI)
      if (user) {
        const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        setProfile(profileData)
      }

      setStats({ 
        contacts: contactCount || 0, 
        appointments: apptCount || 0, 
        revenue: (contactCount || 0) * 150 // Revenue simulata basata sui contatti
      })
      setLoading(false)
    }
    getData()
  }, [supabase])

  // Dati simulati che cambiano col filtro
  const getChartData = () => {
    if (filter === 'Giorno') return { leads: [2, 5, 3, 8, 4], sales: [100, 250, 150, 400], msgs: [10, 15, 8, 20, 25] }
    if (filter === 'Settimana') return { leads: [15, 25, 10, 30, 20], sales: [1500, 2000, 1000, 3000], msgs: [50, 80, 40, 90, 100] }
    return { leads: [45, 80, 50, 95, 60], sales: [5000, 8000, 6000, 9500], msgs: [200, 350, 150, 400, 500] }
  }
  const data = getChartData()

  // Calcolo Percentuale AI
  const aiLimit = profile?.ai_max_limit || 100
  const aiUsage = profile?.ai_usage_count || 0
  const aiPercent = Math.min((aiUsage / aiLimit) * 100, 100)

  if (loading) return <div className="p-10 text-white">Caricamento Dashboard...</div>

  return (
    <main className="flex-1 p-8 overflow-auto bg-black text-white">
      {/* HEADER + FILTRI */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Analitica</h1>
          <p className="text-gray-400 text-sm">Monitora le performance in tempo reale.</p>
        </div>
        
        {/* FILTRO TEMPORALE */}
        <div className="bg-gray-900 p-1 rounded-lg border border-gray-700 flex">
          {['Giorno', 'Settimana', 'Mese', 'Anno'].map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded text-sm font-bold transition ${filter === f ? 'bg-yellow-600 text-black shadow' : 'text-gray-400 hover:text-white'}`}>{f}</button>
          ))}
        </div>
      </div>

      {/* --- RIGA 1: KPI PRINCIPALI --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 hover:border-yellow-500/50 transition">
          <p className="text-gray-400 text-xs uppercase font-bold tracking-wider">Nuovi Lead</p>
          <h3 className="text-3xl font-bold text-white mt-2">{stats.contacts}</h3>
          <p className="text-xs text-green-500 mt-2">↑ Trend positivo</p>
        </div>
        <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 hover:border-yellow-500/50 transition">
          <p className="text-gray-400 text-xs uppercase font-bold tracking-wider">Appuntamenti</p>
          <h3 className="text-3xl font-bold text-yellow-500 mt-2">{stats.appointments}</h3>
          <p className="text-xs text-gray-400 mt-2">In agenda</p>
        </div>
        <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 hover:border-yellow-500/50 transition">
          <p className="text-gray-400 text-xs uppercase font-bold tracking-wider">Vendite Stimate</p>
          <h3 className="text-3xl font-bold text-green-400 mt-2">€ {stats.revenue}</h3>
          <p className="text-xs text-gray-400 mt-2">Pipeline totale</p>
        </div>
        {/* KPI AI */}
        <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 relative overflow-hidden">
          <div className="flex justify-between items-end mb-2 relative z-10">
            <h3 className="font-bold text-white text-sm">🤖 Crediti AI</h3>
            <span className="text-[10px] bg-yellow-600 text-black px-2 rounded font-bold">BASE</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2 mb-2 overflow-hidden relative z-10">
            <div className={`h-full ${aiPercent > 90 ? 'bg-red-500' : 'bg-yellow-500'}`} style={{ width: `${aiPercent}%` }}></div>
          </div>
          <span className="text-xs text-gray-400 relative z-10">{aiUsage}/{aiLimit} messaggi usati</span>
        </div>
      </div>

      {/* --- RIGA 2: GRAFICI LEAD & VENDITE (Dinamici) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        
        {/* GRAFICO 1: LEAD GENERATION (Barre Blu) */}
        <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
          <h3 className="font-bold text-white mb-4">📈 Acquisizione Lead ({filter})</h3>
          <div className="flex items-end justify-between h-48 gap-2">
            {['Periodo 1', 'Periodo 2', 'Periodo 3', 'Periodo 4', 'Periodo 5'].map((lbl, i) => (
              <div key={i} className="w-full flex flex-col items-center gap-2 group">
                <div className="w-full bg-gray-800 rounded-t-lg relative h-full flex items-end">
                  <div className="w-full bg-blue-600 rounded-t-lg transition-all duration-500 group-hover:bg-blue-500" style={{ height: `${data.leads[i]}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* GRAFICO 2: VENDITE PER CANALE (Progress Bars) */}
        <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
          <h3 className="font-bold text-white mb-4">💰 Vendite per Canale ({filter})</h3>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-1"><span className="text-gray-300">🟢 WhatsApp</span><span className="text-white font-bold">€ {data.sales[3]}</span></div>
              <div className="w-full bg-gray-800 rounded-full h-2"><div className="bg-green-500 h-2 rounded-full" style={{ width: '45%' }}></div></div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1"><span className="text-gray-300">🟣 Instagram Shop</span><span className="text-white font-bold">€ {data.sales[1]}</span></div>
              <div className="w-full bg-gray-800 rounded-full h-2"><div className="bg-pink-500 h-2 rounded-full" style={{ width: '35%' }}></div></div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1"><span className="text-gray-300">📧 Email Marketing</span><span className="text-white font-bold">€ {data.sales[2]}</span></div>
              <div className="w-full bg-gray-800 rounded-full h-2"><div className="bg-yellow-500 h-2 rounded-full" style={{ width: '20%' }}></div></div>
            </div>
          </div>
        </div>
      </div>

      {/* --- RIGA 3: FUNNEL & MESSAGGI --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* GRAFICO 3: MARKETING FUNNEL */}
        <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 col-span-1">
          <h3 className="font-bold text-white mb-6">🔻 Conversion Funnel</h3>
          <div className="flex flex-col items-center gap-1">
            <div className="w-full bg-gray-800 p-2 text-center text-xs text-gray-300 rounded">Visitatori Sito</div>
            <div className="w-[80%] bg-blue-900/40 p-2 text-center text-xs text-blue-200 rounded">Lead Contattati</div>
            <div className="w-[60%] bg-blue-800/60 p-2 text-center text-xs text-blue-100 rounded">In Trattativa</div>
            <div className="w-[40%] bg-yellow-600 text-black font-bold p-2 text-center text-xs rounded shadow-lg shadow-yellow-600/20">Vendite Concluse</div>
          </div>
        </div>

        {/* GRAFICO 4: MESSAGGI RICEVUTI (Onda) */}
        <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 col-span-2">
          <h3 className="font-bold text-white mb-4">💬 Traffico Messaggi ({filter})</h3>
          <div className="flex items-end justify-between h-40 gap-1">
             {/* Simulazione onda grafica */}
             {[10, 15, 12, 20, 25, 18, 30, 35, 20, 15, 22, 40, 25, 30, 18, 12].map((h, i) => (
               <div key={i} className="w-full bg-gray-800 rounded-t h-full flex items-end">
                 <div className="w-full bg-purple-600/50 hover:bg-purple-500 transition-all" style={{ height: `${h + (filter === 'Giorno' ? 10 : 30)}%` }}></div>
               </div>
             ))}
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2"><span>Inizio Periodo</span><span>Fine Periodo</span></div>
        </div>
      </div>

      {/* --- RIGA 4: PROBABILITÀ SUCCESSO (AI PREDICTION - Nomi Generici) --- */}
      <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
        <h3 className="font-bold text-white mb-4 flex items-center gap-2">🎯 Previsione Successo Campagne <span className="text-[10px] bg-blue-900 text-blue-200 px-2 rounded">AI BETA</span></h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-black/40 p-4 rounded-lg border border-gray-800">
            <div className="flex justify-between mb-2"><span className="text-sm font-medium">Campagna "Saldi Stagionali"</span><span className="text-green-500 font-bold">Alta (88%)</span></div>
            <div className="w-full bg-gray-700 h-2 rounded-full"><div className="bg-green-500 h-2 rounded-full" style={{ width: '88%' }}></div></div>
          </div>
          <div className="bg-black/40 p-4 rounded-lg border border-gray-800">
            <div className="flex justify-between mb-2"><span className="text-sm font-medium">Promo "Nuovi Arrivi"</span><span className="text-yellow-500 font-bold">Media (65%)</span></div>
            <div className="w-full bg-gray-700 h-2 rounded-full"><div className="bg-yellow-500 h-2 rounded-full" style={{ width: '65%' }}></div></div>
          </div>
          <div className="bg-black/40 p-4 rounded-lg border border-gray-800">
            <div className="flex justify-between mb-2"><span className="text-sm font-medium">Newsletter Informativa</span><span className="text-blue-400 font-bold">Stabile (50%)</span></div>
            <div className="w-full bg-gray-700 h-2 rounded-full"><div className="bg-blue-400 h-2 rounded-full" style={{ width: '50%' }}></div></div>
          </div>
        </div>
      </div>
    </main>
  )
}