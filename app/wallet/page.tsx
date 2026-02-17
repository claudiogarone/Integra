'use client'

import { createClient } from '../../utils/supabase/client'
import { useState } from 'react'
import QRCode from "react-qr-code"

export default function CustomerWallet() {
  const [email, setEmail] = useState('')
  const [card, setCard] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
      e.preventDefault(); setLoading(true)
      const { data } = await supabase.from('loyalty_cards').select('*').eq('customer_email', email).single()
      if(data) setCard(data)
      else alert("Nessuna carta trovata con questa email.")
      setLoading(false)
  }

  if (card) return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-6 text-white">
          <h1 className="text-2xl font-black mb-6">Il tuo Wallet</h1>
          <div className="w-full max-w-sm bg-gradient-to-br from-[#00665E] to-teal-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden aspect-[1.58/1] flex flex-col justify-between">
              <div className="flex justify-between z-10"><span className="font-mono text-xs opacity-70">VIP MEMBER</span></div>
              <div className="z-10"><p className="text-4xl font-black">{card.points}</p><p className="text-xs opacity-70">Punti Totali</p></div>
              <div className="flex justify-between items-end z-10">
                  <div className="text-xs opacity-80">{card.customer_name}</div>
                  <div className="bg-white p-1 rounded"><QRCode value={card.code} size={40} /></div>
              </div>
          </div>
          <p className="mt-8 text-sm text-gray-400">Mostra questo codice in cassa.</p>
          <button onClick={() => setCard(null)} className="mt-4 text-xs underline">Esci</button>
      </div>
  )

  return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
          <form onSubmit={handleLogin} className="w-full max-w-sm text-center">
              <h1 className="text-3xl font-black text-[#00665E] mb-2">Benvenuto</h1>
              <p className="text-gray-500 mb-8">Inserisci la tua email per vedere la tua carta.</p>
              <input type="email" placeholder="latua@email.com" className="w-full p-4 bg-gray-50 rounded-xl border mb-4" value={email} onChange={e=>setEmail(e.target.value)} required />
              <button disabled={loading} className="w-full bg-[#00665E] text-white py-4 rounded-xl font-bold shadow-lg">{loading ? '...' : 'VEDI CARTA'}</button>
          </form>
      </div>
  )
}