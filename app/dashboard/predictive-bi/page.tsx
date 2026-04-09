'use client'

import { useEffect, useState } from 'react'
import {
  TrendingUp, TrendingDown, Minus, Brain, Sparkles, RefreshCw,
  AlertTriangle, CheckCircle2, Target, Users, Star, ShoppingBag,
  ArrowUpRight, ArrowDownRight, Lightbulb, BarChart3, Activity,
  Zap, ChevronRight
} from 'lucide-react'
import {
  LineChart, Line, AreaChart, Area, RadialBarChart, RadialBar,
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell
} from 'recharts'

type Predictions = {
  nextMonthRevenue: number
  leadConversionForecast: number
  churnRisk: number
  topOpportunity: string
  recommendations: string[]
  trend: 'crescita' | 'stabile' | 'calo'
}

const trendColor = (t: string) => t === 'crescita' ? '#00665E' : t === 'calo' ? '#ef4444' : '#f59e0b'
const trendIcon = (t: string) => t === 'crescita' ? <TrendingUp size={16}/> : t === 'calo' ? <TrendingDown size={16}/> : <Minus size={16}/>

// Generazione dati simulati per i grafici (in prod vengono dall'API reale)
const generateForecastData = (baseRevenue: number) => {
  const months = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu']
  return months.map((m, i) => ({
    name: m,
    attuale: Math.round(baseRevenue * (0.7 + i * 0.08) + Math.random() * 200),
    previsto: Math.round(baseRevenue * (0.75 + i * 0.1)),
  }))
}

export default function PredictiveBIPage() {
  const [predictions, setPredictions] = useState<Predictions | null>(null)
  const [loading, setLoading] = useState(true)
  const [aiEnhanced, setAiEnhanced] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string>('')

  const fetchPredictions = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/predictive-bi')
      const data = await res.json()
      if (data.predictions) {
        setPredictions(data.predictions)
        setAiEnhanced(data.aiEnhanced || false)
        setLastUpdated(new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }))
      }
    } catch (err) {
      // Fallback demo locale
      setPredictions({
        nextMonthRevenue: 4850,
        leadConversionForecast: 28,
        churnRisk: 12,
        topOpportunity: 'Upsell ai clienti con ordini ripetuti nell\'ultimo trimestre',
        recommendations: [
          '🎯 Win Rate sotto il 25%: implementa uno script di follow-up a 48h dal preventivo.',
          '✅ Sentiment clienti positivo: chiedi ai top-client una testimonianza.',
          '📈 12 lead attivi: prioritizza i già convertiti per l\'upsell.',
        ],
        trend: 'crescita'
      })
    }
    setLoading(false)
  }

  useEffect(() => { fetchPredictions() }, [])

  const chartData = predictions ? generateForecastData(predictions.nextMonthRevenue) : []

  const gaugeData = predictions ? [
    { name: 'Conversione', value: predictions.leadConversionForecast, fill: '#00665E' },
  ] : []

  const churnGaugeData = predictions ? [
    { name: 'Churn Risk', value: predictions.churnRisk, fill: predictions.churnRisk > 40 ? '#ef4444' : predictions.churnRisk > 20 ? '#f59e0b' : '#10b981' },
  ] : []

  if (loading) return (
    <div className="p-10 flex flex-col items-center justify-center min-h-[50vh] gap-6">
      <div className="relative">
        <Brain size={48} className="text-[#00665E]/30"/>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-[#00665E] border-t-transparent rounded-full animate-spin border-4"></div>
        </div>
      </div>
      <div className="text-center">
        <p className="font-black text-[#00665E] text-lg">Analisi Predittiva in corso...</p>
        <p className="text-gray-400 text-sm mt-1">L'AI sta elaborando i tuoi dati aziendali</p>
      </div>
    </div>
  )

  return (
    <main className="flex-1 p-8 bg-[#F8FAFC] text-gray-900 font-sans min-h-screen pb-20">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-4 border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-3xl font-black text-[#00665E] tracking-tight flex items-center gap-3">
            <Brain size={28}/> Predictive Business Intelligence
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Previsioni AI sul futuro della tua azienda basate sui dati reali della piattaforma
            {lastUpdated && <span className="ml-2 text-gray-400">· Aggiornato alle {lastUpdated}</span>}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {aiEnhanced ? (
            <span className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[10px] font-black px-3 py-1.5 rounded-full flex items-center gap-1 uppercase tracking-widest">
              <Sparkles size={12}/> AI Enhanced
            </span>
          ) : (
            <span className="bg-gray-100 text-gray-500 text-[10px] font-black px-3 py-1.5 rounded-full flex items-center gap-1 uppercase tracking-widest">
              Demo Mode
            </span>
          )}
          <button onClick={fetchPredictions} disabled={loading}
            className="bg-white border border-gray-200 text-[#00665E] px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-gray-50 transition shadow-sm disabled:opacity-50">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''}/> Aggiorna
          </button>
        </div>
      </div>

      {predictions && (
        <>
          {/* KPI HERO ROW */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">

            {/* Fatturato Previsto */}
            <div className="bg-gradient-to-br from-[#00665E] to-teal-700 rounded-3xl p-6 text-white shadow-xl shadow-[#00665E]/20 relative overflow-hidden">
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full"></div>
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-white/5 rounded-full"></div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-3">Fatturato Prossimo Mese</p>
              <p className="text-4xl font-black mb-1">€{(predictions.nextMonthRevenue || 0).toLocaleString('it-IT')}</p>
              <div className={`flex items-center gap-1.5 text-xs font-bold mt-2 ${predictions.trend === 'crescita' ? 'text-emerald-300' : predictions.trend === 'calo' ? 'text-red-300' : 'text-amber-300'}`}>
                {trendIcon(predictions.trend)}
                Trend: {predictions.trend.toUpperCase()}
              </div>
            </div>

            {/* Tasso Conversione Previsto */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm relative">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Conversione Lead Prevista</p>
              <div className="flex items-end gap-3">
                <p className="text-4xl font-black text-[#00665E]">{predictions.leadConversionForecast}%</p>
                <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold mb-1">
                  <ArrowUpRight size={14}/> +5% vs attuale
                </div>
              </div>
              <div className="mt-4 h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#00665E] to-teal-400 rounded-full transition-all duration-1000" style={{ width: `${predictions.leadConversionForecast}%` }}></div>
              </div>
              <div className="flex justify-between mt-1 text-[9px] text-gray-400 font-bold"><span>0%</span><span>100%</span></div>
            </div>

            {/* Churn Risk */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm relative">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Rischio Abbandono Clienti</p>
              <div className="flex items-end gap-3">
                <p className={`text-4xl font-black ${predictions.churnRisk > 40 ? 'text-red-500' : predictions.churnRisk > 20 ? 'text-amber-500' : 'text-emerald-500'}`}>
                  {predictions.churnRisk}%
                </p>
                {predictions.churnRisk > 20 && <AlertTriangle size={20} className="text-amber-500 mb-1"/>}
                {predictions.churnRisk <= 20 && <CheckCircle2 size={20} className="text-emerald-500 mb-1"/>}
              </div>
              <div className="mt-4 h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${predictions.churnRisk}%`, background: predictions.churnRisk > 40 ? '#ef4444' : predictions.churnRisk > 20 ? '#f59e0b' : '#10b981' }}></div>
              </div>
              <p className="text-[9px] text-gray-400 font-bold mt-1">{predictions.churnRisk <= 20 ? '✅ Rischio basso' : predictions.churnRisk <= 40 ? '⚠️ Rischio moderato' : '🚨 Rischio critico'}</p>
            </div>

            {/* Top Opportunity */}
            <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-3xl p-6 text-white shadow-xl shadow-purple-500/20 relative overflow-hidden">
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full"></div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-3">
                <Lightbulb size={12} className="inline mr-1"/> Migliore Opportunità
              </p>
              <p className="font-black text-lg leading-tight text-white">{predictions.topOpportunity}</p>
            </div>
          </div>

          {/* GRAFICO FATTURATO */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
            <div className="xl:col-span-2 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="font-black text-gray-800 flex items-center gap-2"><BarChart3 size={18} className="text-[#00665E]"/> Proiezione Fatturato 6 Mesi</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Confronto tra dato reale (attuale) e previsione AI</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorAttuale" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00665E" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#00665E" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorPrevisto" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false}/>
                  <YAxis tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `€${v.toLocaleString()}`}/>
                  <Tooltip formatter={(v: any) => `€${Number(v).toLocaleString('it-IT')}`} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontWeight: 700, fontSize: 12 }}/>
                  <Legend wrapperStyle={{ fontSize: 11, fontWeight: 700 }}/>
                  <Area type="monotone" dataKey="attuale" stroke="#00665E" strokeWidth={2.5} fill="url(#colorAttuale)" name="Attuale"/>
                  <Area type="monotone" dataKey="previsto" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#colorPrevisto)" name="Previsto AI" strokeDasharray="5 5"/>
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* RACCOMANDAZIONI AI */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col">
              <h2 className="font-black text-gray-800 flex items-center gap-2 mb-6"><Zap size={18} className="text-amber-500"/> Azioni Consigliate</h2>
              <div className="space-y-4 flex-1">
                {(predictions.recommendations || []).map((rec, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-2xl hover:bg-[#00665E]/5 transition group cursor-default">
                    <div className="w-6 h-6 bg-[#00665E]/10 rounded-full flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-[#00665E]/20 transition">
                      <span className="text-[10px] font-black text-[#00665E]">{i + 1}</span>
                    </div>
                    <p className="text-xs text-gray-700 leading-relaxed font-medium">{rec}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl border border-purple-100">
                <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest flex items-center gap-1">
                  <Brain size={10}/> {aiEnhanced ? 'Analisi Gemini AI' : 'Modalità Demo'}
                </p>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  {aiEnhanced ? 'Previsioni basate sui tuoi dati reali' : 'Collega le API key per previsioni personalizzate'}
                </p>
              </div>
            </div>
          </div>

          {/* BANNER NEXT STEPS */}
          <div className="bg-gradient-to-r from-[#00665E] via-teal-700 to-[#004d46] rounded-3xl p-8 text-white shadow-xl shadow-[#00665E]/20 flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 70% 50%, white, transparent 60%)' }}></div>
            <div className="flex-1 relative z-10">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-2">Intelligence → Azione</p>
              <h3 className="text-2xl font-black leading-tight">Il tuo prossimo obiettivo intelligente</h3>
              <p className="text-white/70 text-sm mt-2 max-w-md">
                Basandosi sul trend <strong>{predictions.trend}</strong> rilevato, l'AI suggerisce di attivare una campagna di <strong>nurturing automatica</strong> sui lead inattivi degli ultimi 30 giorni.
              </p>
            </div>
            <div className="flex gap-3 relative z-10 shrink-0">
              <a href="/dashboard/nurturing" className="bg-white text-[#00665E] font-black px-6 py-3 rounded-2xl text-sm hover:bg-white/90 transition shadow-lg flex items-center gap-2">
                Vai al Nurturing <ChevronRight size={16}/>
              </a>
              <a href="/dashboard/marketing" className="bg-white/20 text-white font-bold px-6 py-3 rounded-2xl text-sm hover:bg-white/30 transition border border-white/30 flex items-center gap-2">
                Campagne Marketing
              </a>
            </div>
          </div>
        </>
      )}
    </main>
  )
}
