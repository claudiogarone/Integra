'use client'

import { createClient } from '../../../../utils/supabase/client'
import { useState } from 'react'
import { ArrowLeft, CheckCircle, Zap } from 'lucide-react'
import Link from 'next/link'

export default function PointTerminalPage() {
  const [code, setCode] = useState('')
  const [pointsToAdd, setPointsToAdd] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClient()

  const handleAddPoints = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError(null); setSuccess(null)

    try {
        // 1. Trova la carta
        const { data: card, error: fetchError } = await supabase
            .from('loyalty_cards')
            .select('*')
            .eq('code', code)
            .single()

        if (fetchError || !card) throw new Error("Carta non trovata! Controlla il codice.")

        // 2. Calcola nuovi punti
        const newPoints = (card.points || 0) + Number(pointsToAdd)

        // 3. Aggiorna DB
        const { error: updateError } = await supabase
            .from('loyalty_cards')
            .update({ points: newPoints })
            .eq('id', card.id)

        // 4. Salva transazione (Opzionale ma consigliato)
        await supabase.from('loyalty_transactions').insert({
            card_id: card.id,
            points_change: Number(pointsToAdd),
            description: 'Accredito manuale da Terminale'
        })

        if (updateError) throw updateError

        setSuccess(`Aggiunti ${pointsToAdd} punti a ${code}! Nuovo saldo: ${newPoints}`)
        setCode('')
        setPointsToAdd('')

    } catch (err: any) {
        setError(err.message)
    } finally {
        setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-6">
        
        <div className="w-full max-w-md">
            <Link href="/dashboard/loyalty" className="flex items-center text-gray-400 hover:text-white mb-8 transition">
                <ArrowLeft size={16} className="mr-2"/> Torna al Wallet
            </Link>

            <div className="bg-gray-800 p-8 rounded-3xl border border-gray-700 shadow-2xl">
                <div className="flex items-center justify-center w-16 h-16 bg-[#00665E] rounded-full mx-auto mb-6 shadow-[0_0_20px_rgba(0,102,94,0.5)]">
                    <Zap size={32} className="text-white" />
                </div>
                
                <h1 className="text-2xl font-black text-center mb-2">Terminale Punti</h1>
                <p className="text-gray-400 text-center text-sm mb-8">Digita il codice cliente per assegnare punti.</p>

                {success && (
                    <div className="bg-green-500/10 border border-green-500/50 text-green-400 p-4 rounded-xl mb-6 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                        <CheckCircle size={20}/>
                        <span className="text-sm font-bold">{success}</span>
                    </div>
                )}

                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl mb-6 text-sm font-bold text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleAddPoints} className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase ml-1">Codice Carta (es. CARD-123)</label>
                        <input 
                            type="text" 
                            value={code}
                            onChange={(e) => setCode(e.target.value.toUpperCase())}
                            placeholder="CARD-XXXXXX"
                            className="w-full bg-gray-900 border border-gray-700 p-4 rounded-xl text-white font-mono text-center tracking-widest text-lg focus:border-[#00665E] outline-none transition mt-1 placeholder:text-gray-700"
                            required
                        />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase ml-1">Punti da Aggiungere</label>
                        <input 
                            type="number" 
                            value={pointsToAdd}
                            onChange={(e) => setPointsToAdd(e.target.value)}
                            placeholder="50"
                            className="w-full bg-gray-900 border border-gray-700 p-4 rounded-xl text-white text-center text-lg focus:border-[#00665E] outline-none transition mt-1 font-bold"
                            required
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-[#00665E] hover:bg-[#00554e] text-white font-bold py-4 rounded-xl shadow-lg shadow-[#00665E]/20 transition transform active:scale-95 disabled:opacity-50 mt-4"
                    >
                        {loading ? 'Elaborazione...' : 'CONFERMA ACCREDITO'}
                    </button>
                </form>
            </div>
            
            <p className="text-center text-xs text-gray-600 mt-6">Integra OS Loyalty System v1.0</p>
        </div>
    </div>
  )
}