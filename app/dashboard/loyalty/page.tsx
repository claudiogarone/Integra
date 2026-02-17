'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'
import QRCode from "react-qr-code"
import Link from 'next/link'

export default function LoyaltyWalletPage() {
  const [card, setCard] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function initWallet() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // 1. Cerca se l'utente ha già una carta
      const { data, error } = await supabase
        .from('loyalty_cards')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (data) {
        setCard(data)
      } else {
        // 2. Se non ce l'ha, CREALA SUBITO (Auto-Enrollment)
        const newCode = 'CARD-' + Math.floor(100000 + Math.random() * 900000) // Es: CARD-849201
        const { data: newCard, error: createError } = await supabase
          .from('loyalty_cards')
          .insert({
            user_id: user.id,
            code: newCode,
            points: 50, // Regalo di benvenuto!
            tier: 'Bronze'
          })
          .select()
          .single()
        
        if (newCard) setCard(newCard)
      }
      setLoading(false)
    }
    initWallet()
  }, [])

  if (loading) return <div className="p-10 text-center animate-pulse text-[#00665E]">Caricamento Wallet...</div>

  return (
    <div className="p-8 min-h-screen bg-slate-50 flex flex-col items-center">
      
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-black text-[#00665E] mb-2 text-center">Il Tuo Wallet</h1>
        <p className="text-gray-500 text-center mb-8">Mostra questo codice in cassa per accumulare punti.</p>

        {/* --- LA CARTA DIGITALE --- */}
        <div className="relative w-full h-56 bg-gradient-to-br from-[#00665E] to-[#004d46] rounded-3xl shadow-2xl p-6 text-white overflow-hidden transform transition hover:scale-105 duration-300">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-xl"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-yellow-400/20 rounded-full -ml-10 -mb-10 blur-xl"></div>

            <div className="flex justify-between items-start relative z-10">
                <span className="font-mono text-xs opacity-70 tracking-widest">INTEGRA LOYALTY</span>
                <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm border border-white/10">
                    {card?.tier || 'MEMBER'}
                </span>
            </div>

            <div className="mt-8 relative z-10">
                <p className="text-sm opacity-80 mb-1">Saldo Punti</p>
                <h2 className="text-5xl font-black tracking-tighter">{card?.points || 0}</h2>
            </div>

            <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
                <div className="font-mono text-sm tracking-widest opacity-80">{card?.code || '...'}</div>
                <div className="text-xs opacity-60">Integra OS</div>
            </div>
        </div>

        {/* --- QR CODE --- */}
        <div className="mt-8 bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
            {card?.code && (
                <div className="p-4 bg-white border-2 border-dashed border-gray-200 rounded-xl">
                    <QRCode value={card.code} size={180} fgColor="#1e293b" />
                </div>
            )}
            <p className="mt-4 text-sm font-bold text-gray-800">{card?.code}</p>
            <p className="text-xs text-gray-400">Scansiona per accreditare</p>
        </div>

        {/* --- TASTO GESTIONE (Per il Negoziante) --- */}
        <div className="mt-10 text-center">
            <Link href="/dashboard/loyalty/terminal" className="text-xs text-gray-400 underline hover:text-[#00665E]">
                Sei un gestore? Vai al Terminale Punti
            </Link>
        </div>

      </div>
    </div>
  )
}