'use client'

import { createClient } from '../../../../utils/supabase/client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, RefreshCw, Loader2, Filter, Eye, Users, Target, 
  TrendingUp, AlertTriangle, CheckCircle2, Clock, Zap
} from 'lucide-react'

const STAGES = ['Visualizzato', 'Richiesta', 'Promo Inviata', 'Offerta', 'Trattativa', 'Vinto']
const STAGE_COLORS = ['#93C5FD', '#60A5FA', '#A78BFA', '#F59E0B', '#F97316', '#10B981']

export default function PipelinePage() {
  const [loading, setLoading] = useState(true)
  const [pipeline, setPipeline] = useState<any[]>([])
  const [stageStats, setStageStats] = useState<any[]>([])
  const [sources, setSources] = useState<any[]>([])
  const [filterStage, setFilterStage] = useState('all')
  const [filterHealth, setFilterHealth] = useState('all')

  const fetchPipeline = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/crm/pipeline')
      const data = await res.json()
      setPipeline(data.pipeline || [])
      setStageStats(data.stageStats || [])
      setSources(data.sources || [])
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => { fetchPipeline() }, [])

  const filtered = pipeline.filter(p => {
    if (filterStage !== 'all' && p.status !== filterStage) return false
    if (filterHealth !== 'all' && p.health !== filterHealth) return false
    return true
  })

  const healthIcon = (h: string) => {
    if (h === 'green') return <CheckCircle2 size={14} className="text-emerald-500"/>
    if (h === 'yellow') return <Clock size={14} className="text-yellow-500"/>
    return <AlertTriangle size={14} className="text-red-500"/>
  }

  if (loading) return <div className="p-10 text-[#00665E] animate-pulse font-bold flex items-center gap-2"><Loader2 className="animate-spin"/>Caricamento Pipeline...</div>

  return (
    <main className="flex-1 p-8 overflow-auto bg-[#F8FAFC] font-sans pb-20">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/crm" className="bg-white p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition shadow-sm text-gray-600"><ArrowLeft size={20}/></Link>
          <div>
            <h1 className="text-3xl font-black text-[#00665E] tracking-tight">Pipeline di Vendita</h1>
            <p className="text-gray-500 text-sm mt-1">Stato del processo commerciale per ogni contatto.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchPipeline} className="bg-white border border-gray-200 text-gray-600 px-4 py-2.5 rounded-xl font-bold hover:bg-gray-50 shadow-sm flex items-center gap-2 text-sm"><RefreshCw size={16}/>Aggiorna</button>
        </div>
      </div>

      {/* FUNNEL VISUALE SVG */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 mb-8">
        <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2"><TrendingUp size={18} className="text-[#00665E]"/>Funnel Commerciale (6 Stadi)</h3>
        <div className="flex items-end justify-center gap-2 h-64">
          {stageStats.map((stage, idx) => {
            const maxCount = Math.max(...stageStats.map(s => s.count), 1)
            const heightPercent = Math.max((stage.count / maxCount) * 100, 8)
            return (
              <div key={idx} className="flex flex-col items-center gap-2 flex-1">
                <span className="text-2xl font-black text-gray-900">{stage.count}</span>
                <div 
                  className="w-full rounded-t-xl transition-all duration-700 relative group cursor-pointer"
                  style={{ height: `${heightPercent}%`, backgroundColor: STAGE_COLORS[idx], minHeight: '32px' }}
                >
                  {/* Health dots */}
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex gap-1">
                    {stage.greenCount > 0 && <span className="w-2 h-2 rounded-full bg-emerald-500" title={`${stage.greenCount} OK`}/>}
                    {stage.yellowCount > 0 && <span className="w-2 h-2 rounded-full bg-yellow-400" title={`${stage.yellowCount} Attenzione`}/>}
                    {stage.redCount > 0 && <span className="w-2 h-2 rounded-full bg-red-500" title={`${stage.redCount} Critico`}/>}
                  </div>
                  {/* Tooltip */}
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-20 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs p-3 rounded-xl shadow-xl z-10 w-40 pointer-events-none transition">
                    <p className="font-bold">{stage.stage}</p>
                    <p>Valore: €{stage.totalValue.toLocaleString()}</p>
                    <p>🟢{stage.greenCount} 🟡{stage.yellowCount} 🔴{stage.redCount}</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center leading-tight">{stage.stage}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* FILTRI */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-wrap gap-4 items-center">
        <Filter size={16} className="text-gray-400"/>
        <select className="text-xs p-2.5 border rounded-lg outline-none bg-gray-50 font-bold" value={filterStage} onChange={e => setFilterStage(e.target.value)}>
          <option value="all">Tutti gli Stadi</option>
          {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="text-xs p-2.5 border rounded-lg outline-none bg-gray-50 font-bold" value={filterHealth} onChange={e => setFilterHealth(e.target.value)}>
          <option value="all">Tutti gli Stati</option>
          <option value="green">🟢 In salute</option>
          <option value="yellow">🟡 Attenzione</option>
          <option value="red">🔴 Critico</option>
        </select>
        <span className="text-xs text-gray-500 font-bold ml-auto">{filtered.length} contatti</span>
      </div>

      {/* GRIGLIA PIPELINE */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-gray-400">Contatto</th>
                {STAGES.map((stage, i) => (
                  <th key={i} className="px-3 py-4 text-center text-[10px] font-black uppercase tracking-wider text-gray-400">{stage}</th>
                ))}
                <th className="px-4 py-4 text-right text-[10px] font-black uppercase tracking-wider text-gray-400">Valore</th>
                <th className="px-4 py-4 text-center text-[10px] font-black uppercase tracking-wider text-gray-400">Salute</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 && <tr><td colSpan={9} className="text-center py-10 text-gray-400">Nessun contatto nella pipeline.</td></tr>}
              {filtered.map(item => (
                <tr key={item.id} className="hover:bg-blue-50/30 transition group">
                  <td className="px-6 py-4">
                    <span className="font-bold text-gray-900 block">{item.name}</span>
                    <span className="text-[10px] text-gray-400">{item.email}</span>
                  </td>
                  {STAGES.map((stage, sIdx) => (
                    <td key={sIdx} className="px-3 py-4 text-center">
                      <div className={`w-8 h-8 rounded-lg mx-auto transition ${
                        item.stageIndex > sIdx ? 'bg-emerald-100 border-2 border-emerald-300' :
                        item.stageIndex === sIdx ? `border-2 ${item.health === 'green' ? 'bg-emerald-500 border-emerald-600' : item.health === 'yellow' ? 'bg-yellow-400 border-yellow-500' : 'bg-red-500 border-red-600'}` :
                        'bg-gray-100 border border-gray-200'
                      }`}>
                        {item.stageIndex === sIdx && <div className="w-full h-full flex items-center justify-center text-white text-[10px] font-black">●</div>}
                        {item.stageIndex > sIdx && <div className="w-full h-full flex items-center justify-center text-emerald-600 text-[10px]">✓</div>}
                      </div>
                    </td>
                  ))}
                  <td className="px-4 py-4 text-right font-mono font-bold text-gray-900">€{item.ltv.toLocaleString()}</td>
                  <td className="px-4 py-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {healthIcon(item.health)}
                      <span className="text-[10px] text-gray-500">{item.daysSinceLastActivity}gg</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CANALI ACQUISIZIONE */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 mt-8">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Zap size={16} className="text-yellow-500"/>Canali di Acquisizione</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {sources.map((src, i) => (
            <div key={i} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <p className="text-sm font-bold text-gray-700">{src.name}</p>
              <p className="text-2xl font-black text-[#00665E]">{src.count}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
