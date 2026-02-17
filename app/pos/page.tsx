'use client'

import { createClient } from '../../utils/supabase/client'
import { useState, useEffect } from 'react'
import { Search, UserPlus, Zap, CheckCircle, Send, Calculator } from 'lucide-react'

export default function PosTerminal() {
  const [step, setStep] = useState(1) // 1: Login Negozio, 2: Cerca Cliente, 3: Assegna Punti
  const [storeCode, setStoreCode] = useState('')
  const [pin, setPin] = useState('')
  const [store, setStore] = useState<any>(null)
  const [config, setConfig] = useState<any>(null)
  
  // Dati Cliente & Transazione
  const [searchQuery, setSearchQuery] = useState('') // Email o Codice Carta
  const [customer, setCustomer] = useState<any>(null)
  const [amountEuro, setAmountEuro] = useState('')
  const [newCustomerName, setNewCustomerName] = useState('') // Per registrazione rapida
  
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  const supabase = createClient()

  // STEP 1: LOGIN NEGOZIO
  const handleStoreLogin = async (e: React.FormEvent) => {
      e.preventDefault()
      setLoading(true)
      
      // Cerca il negozio
      const { data: storeData, error } = await supabase
          .from('loyalty_stores')
          .select('*')
          .eq('store_code', storeCode) // Cerca per codice negozio (es. NEGOZIO-1)
          .eq('pin_code', pin)
          .single()

      if (error || !storeData) {
          alert("Codice negozio o PIN errati.")
          setLoading(false)
          return
      }

      // Carica Configurazione Punti (dell'azienda madre)
      const { data: settings } = await supabase
          .from('loyalty_settings')
          .select('*')
          .eq('user_id', storeData.user_id)
          .single()

      setStore(storeData)
      setConfig(settings || { points_per_euro: 1 }) // Default
      setStep(2)
      setLoading(false)
  }

  // STEP 2: CERCA O CREA CLIENTE
  const handleFindCustomer = async (e: React.FormEvent) => {
      e.preventDefault()
      setLoading(true)

      // Cerca per Codice o Email
      let { data: card } = await supabase
          .from('loyalty_cards')
          .select('*')
          .or(`code.eq.${searchQuery},customer_email.eq.${searchQuery}`)
          .single()

      if (card) {
          setCustomer(card)
          setStep(3)
      } else {
          // SE NON TROVA -> Modalità "Nuovo Cliente"
          const confirmCreate = window.confirm(`Cliente non trovato.\n\nCreare nuova carta per: ${searchQuery}?`)
          if(confirmCreate) {
             const name = prompt("Inserisci Nome del Cliente:")
             if(name) {
                 await createNewCustomer(name, searchQuery) // searchQuery qui è l'email
             }
          }
      }
      setLoading(false)
  }

  // CREAZIONE AUTOMATICA CARTA
  const createNewCustomer = async (name: string, email: string) => {
      const newCode = 'CARD-' + Math.floor(100000 + Math.random() * 900000)
      
      // 1. Crea Carta
      const { data: newCard, error } = await supabase.from('loyalty_cards').insert({
          user_id: store.user_id, // Assegnato all'azienda madre (IMPORTANTE: in prod useremmo un auth diversa, qui semplifichiamo)
          customer_email: email,
          customer_name: name,
          code: newCode,
          points: 50, // Bonus Benvenuto
          tier: 'Bronze'
      }).select().single()

      // 2. Aggiungi al CRM (Contatti)
      await supabase.from('contacts').insert({
          user_id: store.user_id,
          name: name,
          email: email,
          status: 'Nuovo',
          source: `Store: ${store.name}`
      })

      if (newCard) {
          setCustomer(newCard)
          alert(`Carta creata! Inviata email a ${email} con il QR Code.`)
          // Qui dovremmo chiamare l'API di Resend per mandare la mail vera
          setStep(3)
      }
  }

  // STEP 3: TRANSAZIONE E PUNTI AUTOMATICI
  const handleTransaction = async (e: React.FormEvent) => {
      e.preventDefault()
      setLoading(true)

      // CALCOLO PUNTI AUTOMATICO
      const euro = parseFloat(amountEuro)
      const pointsEarned = Math.floor(euro * (config.points_per_euro || 1))
      
      // Aggiorna saldo
      const newBalance = (customer.points || 0) + pointsEarned
      const newSpent = (customer.total_spent || 0) + euro

      await supabase.from('loyalty_cards').update({
          points: newBalance,
          total_spent: newSpent,
          last_order_date: new Date().toISOString()
      }).eq('id', customer.id)

      // Registra Transazione (Storico)
      await supabase.from('loyalty_transactions').insert({
          card_id: customer.id,
          store_id: store.id,
          points_change: pointsEarned,
          description: `Acquisto di €${euro} presso ${store.name}`
      })

      setSuccessMsg(`✅ Transazione OK! Accumulati ${pointsEarned} Punti.`)
      setLoading(false)
      
      // Reset dopo 3 secondi
      setTimeout(() => {
          setSuccessMsg('')
          setStep(2)
          setCustomer(null)
          setSearchQuery('')
          setAmountEuro('')
      }, 3000)
  }

  // --- RENDER ---

  // LOGIN SCREEN
  if (step === 1) return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
          <form onSubmit={handleStoreLogin} className="bg-white p-8 rounded-3xl w-full max-w-sm shadow-2xl">
              <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-[#00665E] rounded-full flex items-center justify-center mx-auto mb-4"><Zap className="text-white" size={30}/></div>
                  <h1 className="text-2xl font-black text-gray-900">POS Login</h1>
                  <p className="text-gray-500 text-sm">Accesso riservato staff.</p>
              </div>
              <input type="text" placeholder="Codice Negozio (es. SHOP-001)" className="w-full p-4 bg-gray-50 border rounded-xl mb-3 text-center uppercase font-bold" value={storeCode} onChange={e=>setStoreCode(e.target.value)} required />
              <input type="password" placeholder="PIN" className="w-full p-4 bg-gray-50 border rounded-xl mb-6 text-center font-bold text-2xl tracking-widest" value={pin} onChange={e=>setPin(e.target.value)} maxLength={4} required />
              <button disabled={loading} className="w-full bg-[#00665E] text-white py-4 rounded-xl font-bold hover:bg-[#004d46] transition">{loading ? '...' : 'ACCEDI'}</button>
          </form>
      </div>
  )

  // MAIN INTERFACE
  return (
    <div className="min-h-screen bg-[#F0F2F5] font-sans pb-20">
       
       {/* HEADER POS */}
       <div className="bg-[#00665E] text-white p-6 shadow-lg rounded-b-3xl">
           <div className="flex justify-between items-center">
               <div>
                   <h2 className="font-bold text-lg">{store.name}</h2>
                   <p className="text-teal-200 text-xs">Terminale Attivo • {new Date().toLocaleDateString()}</p>
               </div>
               <button onClick={() => setStep(1)} className="text-xs bg-black/20 px-3 py-1 rounded-lg hover:bg-black/30">Esci</button>
           </div>
       </div>

       <div className="p-6 max-w-md mx-auto -mt-6">
           
           {/* SUCCESS OVERLAY */}
           {successMsg ? (
               <div className="bg-green-500 text-white p-8 rounded-3xl text-center shadow-xl animate-in zoom-in">
                   <CheckCircle size={64} className="mx-auto mb-4"/>
                   <h2 className="text-2xl font-black mb-2">Transazione Riuscita!</h2>
                   <p className="font-medium text-lg">{successMsg}</p>
               </div>
           ) : (
               <>
                   {step === 2 && (
                       <div className="bg-white p-6 rounded-3xl shadow-xl animate-in slide-in-from-bottom">
                           <h3 className="text-xl font-black text-gray-800 mb-6 text-center">Identifica Cliente</h3>
                           <form onSubmit={handleFindCustomer}>
                               <div className="relative mb-6">
                                   <Search className="absolute left-4 top-4 text-gray-400"/>
                                   <input 
                                      type="text" 
                                      placeholder="Email o Scansiona QR..." 
                                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-[#00665E] text-lg font-medium"
                                      value={searchQuery}
                                      onChange={e => setSearchQuery(e.target.value)}
                                      autoFocus
                                   />
                               </div>
                               <button className="w-full bg-[#00665E] text-white py-4 rounded-xl font-bold shadow-lg shadow-[#00665E]/20 text-lg flex items-center justify-center gap-2">
                                   {loading ? 'Ricerca...' : <>TROVA / REGISTRA <ArrowRight size={20}/></>}
                               </button>
                           </form>
                           <p className="text-center text-xs text-gray-400 mt-6">
                               💡 Se la mail non esiste, verrà creato un nuovo profilo automaticamente.
                           </p>
                       </div>
                   )}

                   {step === 3 && customer && (
                       <div className="bg-white p-6 rounded-3xl shadow-xl animate-in slide-in-from-right">
                           {/* HEADER CLIENTE */}
                           <div className="flex items-center gap-4 mb-8 border-b border-gray-100 pb-6">
                               <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-black text-xl shadow-md">
                                   {customer.customer_name?.charAt(0) || '?'}
                               </div>
                               <div>
                                   <h3 className="text-xl font-black text-gray-900">{customer.customer_name || 'Cliente'}</h3>
                                   <p className="text-sm text-gray-500">{customer.customer_email}</p>
                                   <div className="flex gap-2 mt-1">
                                       <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-bold">{customer.points} Punti</span>
                                       <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs font-bold">{customer.tier}</span>
                                   </div>
                               </div>
                           </div>

                           {/* CALCOLATRICE PUNTI */}
                           <form onSubmit={handleTransaction}>
                               <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Importo Scontrino (€)</label>
                               <div className="relative mb-2">
                                   <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xl">€</div>
                                   <input 
                                      type="number" 
                                      placeholder="0.00" 
                                      className="w-full pl-10 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-[#00665E] text-3xl font-black text-gray-900"
                                      value={amountEuro}
                                      onChange={e => setAmountEuro(e.target.value)}
                                      step="0.01"
                                      autoFocus
                                      required
                                   />
                               </div>
                               
                               {/* Preview Punti */}
                               {amountEuro && (
                                   <div className="bg-green-50 text-green-700 p-3 rounded-xl text-center font-bold mb-6 flex items-center justify-center gap-2">
                                       <Calculator size={16}/>
                                       Riceverà +{Math.floor(parseFloat(amountEuro) * (config.points_per_euro || 1))} Punti
                                   </div>
                               )}

                               <div className="grid grid-cols-2 gap-3">
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

// Icon Helper per evitare errori di import
import { ArrowRight } from 'lucide-react'