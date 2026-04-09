'use client'

import { createClient } from '../../../../utils/supabase/client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, Plus, Save, Trash2, Loader2, Target, TrendingUp, 
  Clock, AlertTriangle, CheckCircle2, Edit3, X, Bot, Sparkles
} from 'lucide-react'

const TIMING_OPTIONS = ['Mensile', 'Trimestrale', 'Annuale']
const UNIT_OPTIONS = [
  { value: 'numero', label: 'Numero', prefix: '' },
  { value: 'euro', label: 'Euro (€)', prefix: '€' },
  { value: 'percentuale', label: 'Percentuale (%)', prefix: '' },
]

const DEFAULT_OBJECTIVES = [
  { name: 'N° Clienti Visualizzato', ob_minimum: 500, ob_ideal: 800, timing: 'Mensile', unit: 'numero', category: 'funnel', sort_order: 1 },
  { name: 'N° Clienti in Trattativa', ob_minimum: 50, ob_ideal: 100, timing: 'Mensile', unit: 'numero', category: 'funnel', sort_order: 2 },
  { name: 'Volume Affari Mensile', ob_minimum: 30000, ob_ideal: 50000, timing: 'Mensile', unit: 'euro', category: 'revenue', sort_order: 3 },
  { name: 'Volume Affari Settore', ob_minimum: 10000, ob_ideal: 20000, timing: 'Trimestrale', unit: 'euro', category: 'revenue', sort_order: 4 },
]

export default function ObjectivesPage() {
  const [loading, setLoading] = useState(true)
  const [objectives, setObjectives] = useState<any[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingObj, setEditingObj] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [aiInsights, setAiInsights] = useState<any>(null)
  const [aiLoading, setAiLoading] = useState(false)

  const [form, setForm] = useState({
    name: '', ob_minimum: 0, ob_ideal: 0, current_value: 0, timing: 'Mensile', unit: 'numero', category: 'generale', sort_order: 0
  })

  const supabase = createClient()

  const fetchObjectives = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/crm/objectives')
      const data = await res.json()
      setObjectives(data.objectives || [])
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => { fetchObjectives() }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await fetch('/api/crm/objectives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingObj ? { ...form, id: editingObj.id } : form)
      })
      await fetchObjectives()
      setIsModalOpen(false)
      setEditingObj(null)
      setForm({ name: '', ob_minimum: 0, ob_ideal: 0, current_value: 0, timing: 'Mensile', unit: 'numero', category: 'generale', sort_order: 0 })
    } catch (e) { console.error(e) }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminare questo obiettivo?')) return
    await fetch('/api/crm/objectives', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    await fetchObjectives()
  }

  const initDefaults = async () => {
    if (!confirm('Vuoi creare i 4 obiettivi KPI predefiniti?')) return
    setSaving(true)
    for (const obj of DEFAULT_OBJECTIVES) {
      await fetch('/api/crm/objectives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(obj)
      })
    }
    await fetchObjectives()
    setSaving(false)
  }

  const runAiAnalysis = async () => {
    setAiLoading(true)
    try {
      const res = await fetch('/api/crm/ai-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          objectives: objectives.map(o => ({ name: o.name, minimum: o.ob_minimum, ideal: o.ob_ideal, current: o.current_value, timing: o.timing })),
          funnelData: [],
          totalContacts: 0,
          conversionRate: 0,
          churnRate: 0,
          topSources: []
        })
      })
      const data = await res.json()
      setAiInsights(data)
    } catch (e) { console.error(e) }
    setAiLoading(false)
  }

  const openEdit = (obj: any) => {
    setEditingObj(obj)
    setForm({ name: obj.name, ob_minimum: obj.ob_minimum, ob_ideal: obj.ob_ideal, current_value: obj.current_value, timing: obj.timing, unit: obj.unit || 'numero', category: obj.category || 'generale', sort_order: obj.sort_order || 0 })
    setIsModalOpen(true)
  }

  const getProgress = (obj: any) => {
    if (obj.ob_ideal <= 0) return 0
    return Math.min(Math.round((obj.current_value / obj.ob_ideal) * 100), 100)
  }

  const getStatus = (obj: any) => {
    if (obj.current_value >= obj.ob_ideal) return { label: 'IDEALE', color: 'text-emerald-600 bg-emerald-50 border-emerald-200', icon: <CheckCircle2 size={14}/> }
    if (obj.current_value >= obj.ob_minimum) return { label: 'MINIMO', color: 'text-yellow-600 bg-yellow-50 border-yellow-200', icon: <Clock size={14}/> }
    return { label: 'SOTTO SOGLIA', color: 'text-red-600 bg-red-50 border-red-200', icon: <AlertTriangle size={14}/> }
  }

  const unitPrefix = (unit: string) => UNIT_OPTIONS.find(u => u.value === unit)?.prefix || ''

  if (loading) return <div className="p-10 text-[#00665E] animate-pulse font-bold flex items-center gap-2"><Loader2 className="animate-spin"/>Caricamento Obiettivi KPI...</div>

  return (
    <main className="flex-1 p-8 overflow-auto bg-[#F8FAFC] font-sans pb-20">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/crm" className="bg-white p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition shadow-sm text-gray-600"><ArrowLeft size={20}/></Link>
          <div>
            <h1 className="text-3xl font-black text-[#00665E] tracking-tight">Obiettivi KPI Commerciali</h1>
            <p className="text-gray-500 text-sm mt-1">Obiettivo Minimo / Ideale / Timing per ogni area.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={runAiAnalysis} disabled={aiLoading || objectives.length === 0} className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg hover:scale-105 transition flex items-center gap-2 text-sm disabled:opacity-50">
            {aiLoading ? <Loader2 size={16} className="animate-spin"/> : <Bot size={16}/>} AI Analisi
          </button>
          {objectives.length === 0 && (
            <button onClick={initDefaults} disabled={saving} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg text-sm flex items-center gap-2 disabled:opacity-50">
              <Sparkles size={16}/> Crea KPI Predefiniti
            </button>
          )}
          <button onClick={() => { setEditingObj(null); setForm({ name: '', ob_minimum: 0, ob_ideal: 0, current_value: 0, timing: 'Mensile', unit: 'numero', category: 'generale', sort_order: objectives.length }); setIsModalOpen(true) }} className="bg-[#00665E] text-white px-5 py-2.5 rounded-xl font-bold shadow-lg text-sm flex items-center gap-2"><Plus size={16}/> Nuovo Obiettivo</button>
        </div>
      </div>

      {/* AI INSIGHTS PANEL */}
      {aiInsights && (
        <div className="bg-slate-900 text-white rounded-3xl p-8 mb-8 shadow-xl relative overflow-hidden animate-in slide-in-from-top">
          <button onClick={() => setAiInsights(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X size={20}/></button>
          <h3 className="text-xl font-black mb-2 flex items-center gap-2"><Sparkles className="text-indigo-400"/>Analisi AI degli Obiettivi</h3>
          <p className="text-sm text-slate-300 mb-6">{aiInsights.summary}</p>
          <div className="flex items-center gap-3 mb-6">
            <div className={`px-4 py-2 rounded-xl font-black text-lg ${aiInsights.overall_score?.includes('A') ? 'bg-emerald-500/20 text-emerald-400' : aiInsights.overall_score?.includes('B') ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'}`}>
              Score: {aiInsights.overall_score}
            </div>
          </div>
          <div className="space-y-3">
            {aiInsights.insights?.map((ins: any, i: number) => (
              <div key={i} className={`p-4 rounded-xl border-l-4 ${ins.type === 'alert' ? 'bg-red-900/30 border-red-500' : ins.type === 'warning' ? 'bg-yellow-900/30 border-yellow-500' : ins.type === 'success' ? 'bg-emerald-900/30 border-emerald-500' : 'bg-blue-900/30 border-blue-500'}`}>
                <h4 className="font-bold text-sm mb-1">{ins.title}</h4>
                <p className="text-xs text-slate-300">{ins.description}</p>
                {ins.action && <p className="text-xs text-indigo-400 font-bold mt-2">→ {ins.action}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* OBIETTIVI GRID */}
      {objectives.length === 0 ? (
        <div className="bg-white rounded-3xl border-2 border-dashed border-gray-200 p-16 text-center">
          <Target size={48} className="mx-auto text-gray-300 mb-4"/>
          <h3 className="text-xl font-black text-gray-900 mb-2">Nessun obiettivo configurato</h3>
          <p className="text-gray-500 text-sm mb-6">Crea i tuoi KPI da monitorare oppure usa i predefiniti.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {objectives.map((obj) => {
            const progress = getProgress(obj)
            const status = getStatus(obj)
            const minProgress = obj.ob_ideal > 0 ? Math.round((obj.ob_minimum / obj.ob_ideal) * 100) : 0
            
            return (
              <div key={obj.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition group">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-black text-gray-900">{obj.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{obj.timing}</span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border flex items-center gap-1 ${status.color}`}>{status.icon} {status.label}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button onClick={() => openEdit(obj)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400"><Edit3 size={14}/></button>
                    <button onClick={() => handleDelete(obj.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-400"><Trash2 size={14}/></button>
                  </div>
                </div>

                {/* BARRA PROGRESSO CON SOGLIE */}
                <div className="relative mb-4">
                  <div className="h-4 bg-gray-100 rounded-full overflow-hidden relative">
                    {/* Marker obiettivo minimo */}
                    <div className="absolute top-0 bottom-0 w-0.5 bg-yellow-500 z-10" style={{ left: `${minProgress}%` }}/>
                    {/* Barra progresso attuale */}
                    <div 
                      className={`h-full rounded-full transition-all duration-700 ${progress >= 100 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : progress >= minProgress ? 'bg-gradient-to-r from-blue-500 to-blue-400' : 'bg-gradient-to-r from-red-500 to-orange-400'}`} 
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-2 text-[10px] font-bold text-gray-400">
                    <span>0</span>
                    <span className="text-yellow-600">Min: {unitPrefix(obj.unit)}{Number(obj.ob_minimum).toLocaleString()}</span>
                    <span className="text-emerald-600">Ideale: {unitPrefix(obj.unit)}{Number(obj.ob_ideal).toLocaleString()}</span>
                  </div>
                </div>

                {/* VALORE ATTUALE */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-center">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Valore Attuale</p>
                  <p className="text-3xl font-black text-gray-900 mt-1">
                    {unitPrefix(obj.unit)}{Number(obj.current_value).toLocaleString()}{obj.unit === 'percentuale' ? '%' : ''}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{progress}% dell'obiettivo ideale</p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* MODALE CREA/MODIFICA OBIETTIVO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-black text-gray-900 flex items-center gap-2"><Target className="text-[#00665E]"/>{editingObj ? 'Modifica' : 'Nuovo'} Obiettivo KPI</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-900 bg-gray-200 rounded-full p-1.5"><X size={16}/></button>
            </div>
            <div className="p-6 space-y-4">
              <div><label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-1">Nome Obiettivo</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="es. N° Clienti Visualizzato" className="w-full p-3 rounded-xl border bg-gray-50 font-bold outline-none focus:border-[#00665E]"/></div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-1">OB. Minimo</label><input type="number" value={form.ob_minimum} onChange={e => setForm({...form, ob_minimum: Number(e.target.value)})} className="w-full p-3 rounded-xl border bg-gray-50 font-bold outline-none focus:border-[#00665E]"/></div>
                <div><label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-1">OB. Ideale</label><input type="number" value={form.ob_ideal} onChange={e => setForm({...form, ob_ideal: Number(e.target.value)})} className="w-full p-3 rounded-xl border bg-gray-50 font-bold outline-none focus:border-[#00665E]"/></div>
                <div><label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-1">Valore Attuale</label><input type="number" value={form.current_value} onChange={e => setForm({...form, current_value: Number(e.target.value)})} className="w-full p-3 rounded-xl border bg-gray-50 font-bold outline-none focus:border-[#00665E]"/></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-1">Timing</label>
                  <select value={form.timing} onChange={e => setForm({...form, timing: e.target.value})} className="w-full p-3 rounded-xl border bg-gray-50 font-bold outline-none cursor-pointer">
                    {TIMING_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div><label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-1">Unità</label>
                  <select value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} className="w-full p-3 rounded-xl border bg-gray-50 font-bold outline-none cursor-pointer">
                    {UNIT_OPTIONS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200">Annulla</button>
              <button onClick={handleSave} disabled={saving || !form.name} className="px-8 py-2.5 rounded-xl font-black text-white bg-[#00665E] hover:bg-[#004d46] shadow-lg flex items-center gap-2 disabled:opacity-50">
                {saving ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>} Salva
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
