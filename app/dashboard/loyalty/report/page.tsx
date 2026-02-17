'use client'

import { createClient } from '../../../../utils/supabase/client'
import { useEffect, useState } from 'react'
import Papa from 'papaparse'
import { 
  BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie 
} from 'recharts'
import { 
  Download, ArrowLeft, TrendingUp, Users, Star, MessageSquare, CheckCircle, XCircle 
} from 'lucide-react'
import Link from 'next/link'

export default function LoyaltyReportPage() {
  const [loading, setLoading] = useState(true)
  const [cards, setCards] = useState<any[]>([])
  const [feedbacks, setFeedbacks] = useState<any[]>([])
  const [storeStats, setStoreStats] = useState<any[]>([])
  
  const supabase = createClient()

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    // 1. Carica Carte
    const { data: cardsData } = await supabase.from('loyalty_cards').select('*')
    setCards(cardsData || [])

    // 2. Simula Feedback AI (In futuro verranno dal DB)
    const mockFeedbacks = [
        { id: 1, user: 'Mario Rossi', text: 'Servizio eccellente e veloce!', rating: 5, ai_score: 95, verified: true },
        { id: 2, user: 'Luca Bianchi', text: 'Ok.', rating: 3, ai_score: 20, verified: false }, // AI rifiuta perché troppo breve
        { id: 3, user: 'Giulia Verdi', text: 'Pizza buona ma attesa lunga.', rating: 4, ai_score: 85, verified: true },
    ]
    setFeedbacks(mockFeedbacks)

    // 3. Simula Statistiche Negozi (Pivot)
    setStoreStats([
        { name: 'Pizzeria Centro', points: 15000, visits: 120 },
        { name: 'Bar Sport', points: 5000, visits: 340 },
        { name: 'Negozio Bio', points: 8500, visits: 85 },
    ])
    
    setLoading(false)
  }

  const handleExport = () => {
      const csv = Papa.unparse(cards);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `loyalty_export_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
  }

  if (loading) return <div className="p-10 text-[#00665E] animate-pulse">Caricamento Intelligence...</div>

  return (
    <main className="p-8 bg-[#F8FAFC] min-h-screen pb-20">
        
        {/* HEADER */}
        <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/loyalty" className="bg-white p-2 rounded-xl border border-gray-200 hover:bg-gray-50"><ArrowLeft size={20}/></Link>
                <div>
                    <h1 className="text-3xl font-black text-[#00665E]">Monitor & Report</h1>
                    <p className="text-gray-500 text-sm">Analisi avanzata del programma fedeltà.</p>
                </div>
            </div>
            <button onClick={handleExport} className="bg-white border border-gray-200 text-[#00665E] px-4 py-2 rounded-xl font-bold hover:bg-gray-50 flex items-center gap-2">
                <Download size={18}/> Export Excel
            </button>
        </div>

        {/* KPI CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <p className="text-gray-400 text-xs font-bold uppercase">Carte Attive</p>
                <h3 className="text-3xl font-black text-gray-900 mt-1">{cards.length}</h3>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <p className="text-gray-400 text-xs font-bold uppercase">Punti Erogati</p>
                <h3 className="text-3xl font-black text-[#00665E] mt-1">{cards.reduce((acc, c) => acc + c.points, 0).toLocaleString()}</h3>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <p className="text-gray-400 text-xs font-bold uppercase">Spesa Totale (LTV)</p>
                <h3 className="text-3xl font-black text-blue-600 mt-1">€ {cards.reduce((acc, c) => acc + (c.total_spent || 0), 0).toLocaleString()}</h3>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <p className="text-gray-400 text-xs font-bold uppercase">Feedback Ricevuti</p>
                <h3 className="text-3xl font-black text-purple-600 mt-1">{feedbacks.length}</h3>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* 1. STORE PERFORMANCE (Pivot Chart) */}
            <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2"><TrendingUp size={20}/> Performance Negozi</h3>
                <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={storeStats}>
                            <XAxis dataKey="name" tick={{fontSize: 12}} />
                            <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '12px'}} />
                            <Bar dataKey="points" fill="#00665E" radius={[4, 4, 0, 0]} barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* 2. AI FEEDBACK MONITOR */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col">
                <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2"><MessageSquare size={20} className="text-purple-600"/> AI Feedback Check</h3>
                <div className="flex-1 overflow-y-auto space-y-4">
                    {feedbacks.map((fb) => (
                        <div key={fb.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                            <div className="flex justify-between items-start mb-1">
                                <span className="font-bold text-sm">{fb.user}</span>
                                <div className="flex gap-1">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} size={10} className={i < fb.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} />
                                    ))}
                                </div>
                            </div>
                            <p className="text-xs text-gray-600 italic mb-2">"{fb.text}"</p>
                            
                            {/* AI VERDICT */}
                            <div className={`flex items-center gap-2 text-[10px] font-bold px-2 py-1 rounded-lg ${fb.verified ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {fb.verified ? <CheckCircle size={12}/> : <XCircle size={12}/>}
                                {fb.verified ? `AI Approvato (Score: ${fb.ai_score})` : `AI Rifiutato (Score: ${fb.ai_score})`}
                            </div>
                            {fb.verified && <p className="text-[10px] text-gray-400 mt-1">+50 Punti assegnati</p>}
                        </div>
                    ))}
                </div>
            </div>

        </div>

        {/* 3. TABELLA CLIENTI COMPLETA */}
        <div className="mt-8 bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-bold text-gray-800">Anagrafica Carte Fedeltà</h3>
                <input type="text" placeholder="Cerca cliente o codice..." className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-[#00665E]" />
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50 uppercase font-bold text-gray-400 text-[10px] tracking-wider">
                        <tr>
                            <th className="px-6 py-4">Codice</th>
                            <th className="px-6 py-4">Livello</th>
                            <th className="px-6 py-4 text-right">Punti</th>
                            <th className="px-6 py-4 text-right">Spesa Tot.</th>
                            <th className="px-6 py-4 text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {cards.map((card) => (
                            <tr key={card.id} className="hover:bg-gray-50 transition">
                                <td className="px-6 py-4 font-mono font-bold text-gray-800">{card.code}</td>
                                <td className="px-6 py-4"><span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-bold">{card.tier}</span></td>
                                <td className="px-6 py-4 text-right font-bold text-[#00665E]">{card.points}</td>
                                <td className="px-6 py-4 text-right">€ {card.total_spent || 0}</td>
                                <td className="px-6 py-4 text-center"><span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

    </main>
  )
}