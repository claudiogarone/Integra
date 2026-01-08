'use client'

import { createClient } from '../../utils/supabase/client'
import { useEffect, useState } from 'react'

export default function Dashboard() {
  const [filter, setFilter] = useState('Mese') 
  const [stats, setStats] = useState({ contacts: 0, appointments: 0, revenue: 0 })
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      const { count: contactCount } = await supabase.from('contacts').select('*', { count: 'exact', head: true })
      const { count: apptCount } = await supabase.from('appointments').select('*', { count: 'exact', head: true })
      
      if (user) {
        const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        setProfile(profileData)
      }

      setStats({ 
        contacts: contactCount || 0, 
        appointments: apptCount || 0, 
        revenue: (contactCount || 0) * 150 
      })
      setLoading(false)
    }
    getData()
  }, [supabase])

  const getChartData = () => {
    // Dati simulati per rendere evidente l'effetto
    if (filter === 'Giorno') return { leads: [20, 45, 30, 80, 40], sales: [100, 250, 150, 400], msgs: [10, 15, 8, 20, 25] }
    if (filter === 'Settimana') return { leads: [35, 55, 20, 60, 45], sales: [1500, 2000, 1000, 3000], msgs: [50, 80, 40, 90, 100] }
    return { leads: [45, 80, 50, 95, 60], sales: [5000, 8000, 6000, 9500], msgs: [200, 350, 150, 400, 500] }
  }
  const data = getChartData()

  // Calcolo Percentuale AI
  const aiLimit = profile?.ai_max_limit || 100
  const aiUsage = profile?.ai_usage_count || 0
  const aiPercent = Math.min((aiUsage / aiLimit) * 100, 100)

  if (loading) return <div className="p-10 text-[#00665E] animate-pulse">Caricamento Dashboard...</div>

  return (
    <main className="flex-1 p-8 overflow-auto bg-[#F8FAFC] text-gray-900 font-sans pb-20">
      
      {/* HEADER + FILTRI */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#00665E] tracking-tight">Dashboard Analitica</h1>
          <p className="text-gray-500 text-sm">Monitora le performance in tempo reale.</p>
        </div>
        
        {/* FILTRO TEMPORALE */}
        <div className="bg-white p-1 rounded-xl border border-gray-200 flex shadow-sm">
          {['Giorno', 'Settimana', 'Mese', 'Anno'].map((f) => (
            <button 
                key={f} 
                onClick={() => setFilter(f)} 
                className={`px-4 py-2 rounded-lg text-sm font-bold transition ${filter === f ? 'bg-[#00665E] text-white shadow-md' : 'text-gray-400 hover:text-[#00665E] hover:bg-gray-50'}`}
            >
                {f}
            </button>
          ))}
        </div>
      </div>

      {/* --- RIGA 1: KPI PRINCIPALI (Interattivi) --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        
        {/* KPI: NUOVI LEAD */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-xl hover:-translate-y-1 transition duration-300 group relative cursor-help">
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-3 py-1 rounded opacity-0 group-hover:opacity-100 transition shadow-lg pointer-events-none z-50 whitespace-nowrap">
            Contatti salvati nel CRM
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
          </div>
          <div className="flex justify-between items-start">
             <div><p className="text-gray-400 text-xs uppercase font-bold tracking-wider">Nuovi Lead</p><h3 className="text-3xl font-black text-gray-900 mt-2">{stats.contacts}</h3></div>
             <div className="p-3 bg-blue-50 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition">👥</div>
          </div>
          <p className="text-xs text-green-600 mt-3 font-bold bg-green-50 inline-block px-2 py-1 rounded">↑ Trend positivo</p>
        </div>

        {/* KPI: APPUNTAMENTI */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-xl hover:-translate-y-1 transition duration-300 group relative cursor-help">
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-3 py-1 rounded opacity-0 group-hover:opacity-100 transition shadow-lg pointer-events-none z-50 whitespace-nowrap">
            Appuntamenti futuri in Agenda
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
          </div>
          <div className="flex justify-between items-start">
             <div><p className="text-gray-400 text-xs uppercase font-bold tracking-wider">Appuntamenti</p><h3 className="text-3xl font-black text-[#00665E] mt-2">{stats.appointments}</h3></div>
             <div className="p-3 bg-teal-50 rounded-xl text-[#00665E] group-hover:bg-[#00665E] group-hover:text-white transition">📅</div>
          </div>
          <p className="text-xs text-gray-400 mt-3">In agenda oggi</p>
        </div>

        {/* KPI: REVENUE */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-xl hover:-translate-y-1 transition duration-300 group relative cursor-help">
           <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-3 py-1 rounded opacity-0 group-hover:opacity-100 transition shadow-lg pointer-events-none z-50 whitespace-nowrap">
            Valore stimato della pipeline
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
          </div>
          <div className="flex justify-between items-start">
             <div><p className="text-gray-400 text-xs uppercase font-bold tracking-wider">Vendite Stimate</p><h3 className="text-3xl font-black text-gray-900 mt-2">€ {stats.revenue}</h3></div>
             <div className="p-3 bg-green-50 rounded-xl text-green-600 group-hover:bg-green-600 group-hover:text-white transition">💰</div>
          </div>
          <p className="text-xs text-gray-400 mt-3">Pipeline totale</p>
        </div>

        {/* KPI: CREDITI AI */}
        <div className="bg-gradient-to-br from-[#00665E] to-teal-800 p-6 rounded-2xl border border-teal-900 shadow-lg text-white relative overflow-hidden group hover:scale-[1.02] transition duration-300">
           <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-[#00665E] text-xs font-bold px-3 py-1 rounded opacity-0 group-hover:opacity-100 transition shadow-lg pointer-events-none z-50 whitespace-nowrap">
            Rinnovo il 1° del mese
          </div>
          <div className="flex justify-between items-end mb-4 relative z-10">
            <h3 className="font-bold text-white text-sm">🤖 Crediti AI</h3>
            <span className="text-[10px] bg-white text-[#00665E] px-2 py-1 rounded font-bold">BASE</span>
          </div>
          <div className="w-full bg-black/20 rounded-full h-3 mb-2 overflow-hidden relative z-10 backdrop-blur-sm">
            <div className={`h-full rounded-full ${aiPercent > 90 ? 'bg-red-400' : 'bg-white'}`} style={{ width: `${aiPercent}%` }}></div>
          </div>
          <span className="text-xs text-teal-100 relative z-10 font-medium">{aiUsage}/{aiLimit} messaggi usati</span>
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:blur-2xl transition"></div>
        </div>
      </div>

      {/* --- RIGA 2: GRAFICI INTERATTIVI --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        
        {/* GRAFICO 1: LEAD (Barre Verticali con Tooltip) */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative z-0">
          <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2"><span className="w-2 h-6 bg-blue-600 rounded-full"></span> Acquisizione Lead ({filter})</h3>
          
          <div className="flex items-end justify-between h-48 gap-3 relative">
            {data.leads.map((val, i) => (
              <div key={i} className="w-full flex flex-col items-center justify-end h-full gap-2 group relative">
                
                {/* TOOLTIP FLUTTUANTE (z-50 per stare sopra) */}
                <div className="absolute bottom-[110%] bg-gray-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all transform group-hover:-translate-y-1 shadow-xl z-50 pointer-events-none whitespace-nowrap">
                   {val} Nuovi Lead
                   <span className="block text-[9px] text-gray-400 font-normal">Clicca per dettagli</span>
                   {/* Triangolino */}
                   <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                </div>

                {/* BARRA (Overflow hidden solo qui dentro) */}
                <div className="w-full bg-gray-100 rounded-t-xl relative h-full flex items-end overflow-hidden">
                  <div 
                    className="w-full bg-blue-600 rounded-t-xl transition-all duration-500 group-hover:bg-blue-500 cursor-pointer" 
                    style={{ height: `${val}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* GRAFICO 2: VENDITE (Barre Orizzontali con Tooltip) */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2"><span className="w-2 h-6 bg-[#00665E] rounded-full"></span> Vendite per Canale</h3>
          <div className="space-y-8">
            
            {/* Canale WhatsApp */}
            <div className="group relative">
              <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500 font-medium group-hover:text-[#00665E] transition">🟢 WhatsApp</span>
                  <span className="text-gray-900 font-bold group-hover:scale-110 transition origin-right">€ {data.sales[3]}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3 relative">
                  <div className="bg-green-500 h-3 rounded-full shadow-md transition-all group-hover:bg-green-400" style={{ width: '45%' }}></div>
                  {/* Tooltip */}
                  <div className="absolute -top-8 left-[45%] -translate-x-1/2 bg-gray-900 text-white text-xs font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition z-10 pointer-events-none">
                    45% del totale
                  </div>
              </div>
            </div>

            {/* Canale Shop */}
            <div className="group relative">
              <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500 font-medium group-hover:text-pink-600 transition">🟣 Instagram Shop</span>
                  <span className="text-gray-900 font-bold group-hover:scale-110 transition origin-right">€ {data.sales[1]}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3 relative">
                  <div className="bg-pink-500 h-3 rounded-full shadow-md transition-all group-hover:bg-pink-400" style={{ width: '35%' }}></div>
                  <div className="absolute -top-8 left-[35%] -translate-x-1/2 bg-gray-900 text-white text-xs font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition z-10 pointer-events-none">
                    35% del totale
                  </div>
              </div>
            </div>

            {/* Canale Email */}
            <div className="group relative">
              <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500 font-medium group-hover:text-yellow-600 transition">📧 Email Marketing</span>
                  <span className="text-gray-900 font-bold group-hover:scale-110 transition origin-right">€ {data.sales[2]}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3 relative">
                  <div className="bg-[#00665E] h-3 rounded-full shadow-md transition-all group-hover:bg-teal-600" style={{ width: '20%' }}></div>
                  <div className="absolute -top-8 left-[20%] -translate-x-1/2 bg-gray-900 text-white text-xs font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition z-10 pointer-events-none">
                    20% del totale
                  </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* --- RIGA 3: MESSAGGI (Onda Interattiva) --- */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mb-8">
          <h3 className="font-bold text-gray-800 mb-4">💬 Traffico Messaggi ({filter})</h3>
          <div className="flex items-end justify-between h-48 gap-1 mt-6">
             {[10, 25, 15, 35, 45, 30, 50, 60, 40, 30, 45, 70, 50, 55, 35, 20, 10, 50, 80, 40].map((h, i) => (
               <div key={i} className="w-full h-full flex items-end group relative cursor-pointer">
                 {/* TOOLTIP ONDA */}
                 <div className="absolute bottom-[100%] left-1/2 -translate-x-1/2 mb-2 bg-purple-900 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-all group-hover:-translate-y-2 z-50 pointer-events-none whitespace-nowrap shadow-xl">
                    {h * 2} Msg
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-purple-900"></div>
                 </div>
                 
                 <div className="w-full bg-purple-100 rounded-t-sm border-b border-purple-200 relative overflow-hidden h-full flex items-end hover:bg-purple-200 transition">
                    <div 
                        className="w-full bg-purple-500 transition-all duration-300 group-hover:bg-purple-600 rounded-t-sm" 
                        style={{ height: `${h}%` }}
                    ></div>
                 </div>
               </div>
             ))}
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-2 font-medium"><span>Inizio {filter}</span><span>Fine {filter}</span></div>
      </div>

    </main>
  )
}