'use client'

import { createClient } from '../../utils/supabase/client'
import { useState } from 'react'
import { Search, Zap, CheckCircle, Calculator, ArrowRight, Camera, X } from 'lucide-react'
import { Scanner } from '@yudiel/react-qr-scanner'

export default function PosTerminal() {
  const [step, setStep] = useState(1) 
  const [storeCode, setStoreCode] = useState('')
  const [pin, setPin] = useState('')
  const [store, setStore] = useState<any>(null)
  const [config, setConfig] = useState<any>(null)
  
  const [searchQuery, setSearchQuery] = useState('') 
  const [customer, setCustomer] = useState<any>(null)
  const [amountEuro, setAmountEuro] = useState('')
  
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [showScanner, setShowScanner] = useState(false)

  const supabase = createClient()

  const handleStoreLogin = async (e: React.FormEvent) => {
      e.preventDefault(); setLoading(true)
      const { data: storeData } = await supabase.from('loyalty_stores').select('*').eq('store_code', storeCode).eq('pin_code', pin).single()
      if (!storeData) { alert("Credenziali errate"); setLoading(false); return }
      
      const { data: settings } = await supabase.from('loyalty_settings').select('*').eq('user_id', storeData.user_id).single()
      setStore(storeData); setConfig(settings || { points_per_euro: 1 }); setStep(2); setLoading(false)
  }

  const handleFindCustomer = async (e?: React.FormEvent, queryOverride?: string) => {
      if(e) e.preventDefault();
      const q = queryOverride || searchQuery;
      if(!q) return;
      
      setLoading(true)
      // Cerca esatta corrispondenza su codice o email
      let { data: card } = await supabase.from('loyalty_cards').select('*').or(`code.eq.${q},customer_email.eq.${q}`).single()

      if (card) {
          setCustomer(card); setStep(3)
      } else {
          const confirmCreate = window.confirm(`Cliente non trovato: ${q}\nCreare nuova carta?`)
          if(confirmCreate) {
             const name = prompt("Nome Cliente:")
             if(name) await createNewCustomer(name, q)
          }
      }
      setLoading(false)
  }

  const createNewCustomer = async (name: string, emailOrCode: string) => {
      const isCode = emailOrCode.startsWith('CARD-');
      const newCode = isCode ? emailOrCode : 'CARD-' + Math.floor(100000 + Math.random() * 900000);
      const email = isCode ? '' : emailOrCode; 

      const { data: newCard } = await supabase.from('loyalty_cards').insert({
          user_id: store.user_id, customer_email: email, customer_name: name, code: newCode, points: 50, tier: 'Bronze'
      }).select().single()

      if (newCard) {
          setCustomer(newCard); alert(`Carta attivata!`); setStep(3)
      }
  }

  const handleTransaction = async (e: React.FormEvent) => {
      e.preventDefault(); setLoading(true)
      const euro = parseFloat(amountEuro)
      const pointsEarned = Math.floor(euro * (config.points_per_euro || 1))
      
      await supabase.from('loyalty_cards').update({
          points: (customer.points || 0) + pointsEarned,
          total_spent: (customer.total_spent || 0) + euro,
          last_order_date: new Date().toISOString()
      }).eq('id', customer.id)

      await supabase.from('loyalty_transactions').insert({
          card_id: customer.id, store_id: store.id, points_change: pointsEarned, description: `Acquisto €${euro}`
      })

      setSuccessMsg(`✅ +${pointsEarned} Punti`); setLoading(false)
      setTimeout(() => { setSuccessMsg(''); setStep(2); setCustomer(null); setSearchQuery(''); setAmountEuro('') }, 3000)
  }

  // --- LOGICA SCANNER AGGIORNATA ---
  const handleScan = (results: any[]) => {
      if (results && results.length > 0) {
          const code = results[0].rawValue; // Estrae il valore dal QR
          setSearchQuery(code);
          setShowScanner(false);
          // Avvia la ricerca automaticamente
          handleFindCustomer(undefined, code);
      }
  }

  if (step === 1) return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
          <form onSubmit={handleStoreLogin} className="bg-white p-8 rounded-3xl w-full max-w-sm shadow-2xl">
              <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-[#00665E] rounded-full flex items-center justify-center mx-auto mb-4"><Zap className="text-white" size={30}/></div>
                  <h1 className="text-2xl font-black text-gray-900">POS Login</h1>
              </div>
              <input type="text" placeholder="Codice Negozio" className="w-full p-4 bg-gray-50 border rounded-xl mb-3 text-center uppercase font-bold" value={storeCode} onChange={e=>setStoreCode(e.target.value)} required />
              <input type="password" placeholder="PIN" className="w-full p-4 bg-gray-50 border rounded-xl mb-6 text-center font-bold text-2xl tracking-widest" value={pin} onChange={e=>setPin(e.target.value)} maxLength={4} required />
              <button disabled={loading} className="w-full bg-[#00665E] text-white py-4 rounded-xl font-bold">{loading ? '...' : 'ACCEDI'}</button>
          </form>
      </div>
  )

  return (
    <div className="min-h-screen bg-[#F0F2F5] font-sans pb-20">
       <div className="bg-[#00665E] text-white p-6 shadow-lg rounded-b-3xl flex justify-between items-center">
           <div><h2 className="font-bold text-lg">{store.name}</h2></div>
           <button onClick={() => setStep(1)} className="text-xs bg-black/20 px-3 py-1 rounded-lg">Esci</button>
       </div>

       <div className="p-6 max-w-md mx-auto -mt-6">
           {successMsg ? (
               <div className="bg-green-500 text-white p-8 rounded-3xl text-center shadow-xl animate-in zoom-in">
                   <CheckCircle size={64} className="mx-auto mb-4"/><h2 className="text-2xl font-black mb-2">Fatto!</h2><p>{successMsg}</p>
               </div>
           ) : (
               <>
                   {step === 2 && (
                       <div className="bg-white p-6 rounded-3xl shadow-xl animate-in slide-in-from-bottom">
                           {showScanner ? (
                               <div className="mb-4 bg-black rounded-2xl overflow-hidden relative h-72">
                                   {/* SCANNER SENZA COMPONENTI EXTRA (SOLO VIDEO) */}
                                   <Scanner 
                                        onScan={handleScan} 
                                        styles={{ container: { width: '100%', height: '100%' } }}
                                   />
                                   <button onClick={() => setShowScanner(false)} className="absolute top-4 right-4 bg-white/20 p-2 rounded-full text-white z-50"><X/></button>
                                   <p className="absolute bottom-4 w-full text-center text-white text-xs z-50 bg-black/50 py-1">Inquadra il QR Code</p>
                               </div>
                           ) : (
                               <>
                                   <h3 className="text-xl font-black text-gray-800 mb-6 text-center">Identifica Cliente</h3>
                                   <button onClick={() => setShowScanner(true)} className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold mb-4 flex items-center justify-center gap-2">
                                       <Camera size={20}/> SCANSIONA QR
                                   </button>
                                   <div className="relative mb-4">
                                       <Search className="absolute left-4 top-4 text-gray-400"/>
                                       <input type="text" placeholder="Oppure cerca Email..." className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-[#00665E] text-lg" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                                   </div>
                                   <button onClick={(e) => handleFindCustomer(e)} className="w-full bg-[#00665E] text-white py-4 rounded-xl font-bold">TROVA</button>
                               </>
                           )}
                       </div>
                   )}

                   {step === 3 && customer && (
                       <div className="bg-white p-6 rounded-3xl shadow-xl animate-in slide-in-from-right">
                           <div className="flex items-center gap-4 mb-8 border-b border-gray-100 pb-6">
                               <div className="w-14 h-14 bg-orange-500 rounded-full flex items-center justify-center text-white font-black text-xl">{customer.customer_name?.charAt(0)}</div>
                               <div><h3 className="text-xl font-black">{customer.customer_name}</h3><p className="text-sm text-gray-500">{customer.customer_email}</p>
                               <div className="flex gap-2 mt-1"><span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-bold">{customer.points} Punti</span></div></div>
                           </div>
                           <form onSubmit={handleTransaction}>
                               <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Importo (€)</label>
                               <div className="relative mb-2"><div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xl">€</div>
                               <input type="number" placeholder="0.00" className="w-full pl-10 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-[#00665E] text-3xl font-black" value={amountEuro} onChange={e => setAmountEuro(e.target.value)} step="0.01" autoFocus required /></div>
                               <div className="grid grid-cols-2 gap-3 mt-4">
                                   <button type="button" onClick={() => {setStep(2); setAmountEuro('');}} className="py-4 text-gray-500 font-bold hover:bg-gray-50 rounded-xl">Annulla</button>
                                   <button type="submit" className="bg-[#00665E] text-white py-4 rounded-xl font-bold shadow-lg text-lg">CONFERMA</button>
                               </div>
                           </form>
                       </div>
                   )}
               </>
           )}
       </div>
    </div>
  )
}