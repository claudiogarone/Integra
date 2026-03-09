'use client'

import { createClient } from '../../../../utils/supabase/client'
import { useEffect, useState } from 'react'
import { 
  Store, Search, QrCode, CreditCard, ChevronRight, CheckCircle2, X, Loader2, ArrowLeft, LogOut, CheckCircle
} from 'lucide-react'
import Link from 'next/link'
import { Scanner } from '@yudiel/react-qr-scanner'

export default function LoyaltyTerminalPage() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  
  // Dati
  const [stores, setStores] = useState<any[]>([])
  const [settings, setSettings] = useState<any>(null)
  const [companyInfo, setCompanyInfo] = useState({ name: 'La Tua Azienda', logo: '' })
  
  // Stati Flusso
  const [activeStore, setActiveStore] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [foundCustomer, setFoundCustomer] = useState<any>(null)
  const [amountInput, setAmountInput] = useState('')
  const [processing, setProcessing] = useState(false)
  const [successTx, setSuccessTx] = useState<any>(null)
  const [showScanner, setShowScanner] = useState(false)

  // Inizializzazione flessibile in caso di problemi di importazione
  const supabase = createClient()

  useEffect(() => {
    const initTerminal = async () => {
      const devUserId = '00000000-0000-0000-0000-000000000000';
      setUser({ id: devUserId });

      const { data: profile } = await supabase.from('profiles').select('company_name, logo_url').eq('id', devUserId).single()
      if (profile) setCompanyInfo({ name: profile.company_name || 'La Tua Azienda', logo: profile.logo_url || '' })

      const { data: storesData } = await supabase.from('loyalty_stores').select('*').eq('user_id', devUserId)
      const { data: set } = await supabase.from('loyalty_settings').select('*').eq('user_id', devUserId).single()
      
      if (storesData) setStores(storesData)
      if (set) setSettings(set)
      
      setLoading(false)
    }
    initTerminal()
  }, [supabase])

  const handleSearchCustomer = async (e?: React.FormEvent, overrideQuery?: string) => {
      if(e) e.preventDefault();
      const query = overrideQuery || searchQuery;
      if(!query) return;
      
      setLoading(true)
      const { data: cards } = await supabase.from('loyalty_cards')
          .select('*, contacts(name, email, phone)')
          .eq('user_id', user.id)
          .or(`code.ilike.%${query}%,customer_email.ilike.%${query}%`)
          .limit(1)

      if (cards && cards.length > 0) {
          setFoundCustomer(cards[0])
          setShowScanner(false)
      } else {
          alert("❌ Carta non trovata. Verifica il codice o l'email. Se il cliente è nuovo, creagli una carta dal Report Fedeltà.")
      }
      setLoading(false)
  }

  const handleKeypad = (num: string) => {
      if (num === 'C') { setAmountInput('') } 
      else if (num === 'del') { setAmountInput(prev => prev.slice(0, -1)) } 
      else {
          if (amountInput.includes('.') && num === '.') return;
          if (amountInput.split('.')[1]?.length >= 2) return;
          setAmountInput(prev => prev + num)
      }
  }

  const processTransaction = async () => {
      const amount = parseFloat(amountInput)
      if (isNaN(amount) || amount <= 0) return alert("Inserisci un importo valido")
      
      setProcessing(true)
      const pointsToAward = Math.floor(amount * (settings?.points_per_euro || 1))
      
      try {
          // --- FIX MATEMATICO (Sicurezza anti NaN) ---
          const currentPoints = Number(foundCustomer.points) || 0;
          const currentTotalSpent = Number(foundCustomer.total_spent) || 0;

          const newPoints = currentPoints + pointsToAward;
          const newTotalSpent = currentTotalSpent + amount;

          let newTier = foundCustomer.tier || 'Bronze';
          if (newTotalSpent > 1000) newTier = 'Gold';
          if (newTotalSpent > 3000) newTier = 'Platinum';

          // 1. SALVATAGGIO PUNTI CARTA
          const { error: cardError } = await supabase.from('loyalty_cards').update({ 
              points: newPoints, 
              total_spent: newTotalSpent, 
              tier: newTier
          }).eq('id', foundCustomer.id);

          if (cardError) throw new Error("Errore aggiornamento Carta: " + cardError.message);

          // 2. SALVATAGGIO TRANSAZIONE POS
          const { error: txError } = await supabase.from('loyalty_transactions').insert({
              user_id: user.id,
              store_id: activeStore.id,
              card_id: foundCustomer.id,
              amount_spent: amount,
              points_awarded: pointsToAward
          });

          if(txError) throw new Error("Errore registrazione scontrino: " + txError.message);

          // 3. AGGIORNAMENTO CRM
          if (foundCustomer.contact_id && foundCustomer.contact_id !== 'null') {
             const { data: contact } = await supabase.from('contacts').select('value').eq('id', foundCustomer.contact_id).single()
             if (contact) {
                 const currentLtv = Number(contact.value || 0)
                 await supabase.from('contacts').update({ 
                     value: currentLtv + amount, status: 'Vinto', last_order_date: new Date().toISOString()
                 }).eq('id', foundCustomer.contact_id)
             }
          }

          // 4. INVIO EMAIL IN BACKGROUND
          const customerEmail = foundCustomer.contacts?.email || foundCustomer.customer_email;
          if (customerEmail) {
              fetch('/api/loyalty/emails', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                      type: 'points_added',
                      customerEmail: customerEmail,
                      customerName: foundCustomer.contacts?.name || foundCustomer.customer_name || 'Cliente VIP',
                      cardCode: foundCustomer.code,
                      points: pointsToAward,
                      amountSpent: amount,
                      companyName: companyInfo.name,
                      companyLogo: companyInfo.logo,
                      baseUrl: window.location.origin
                  })
              }).catch(e => console.error("Email in background fallita", e));
          }

          setSuccessTx({ amount, points: pointsToAward, newPoints })
          setAmountInput('')
          
      } catch (err: any) {
          alert("❌ " + err.message)
      } finally {
          setProcessing(false)
      }
  }

  const resetFlow = () => {
      setFoundCustomer(null)
      setSearchQuery('')
      setAmountInput('')
      setSuccessTx(null)
      setShowScanner(false)
  }

  if (loading && !activeStore) return <div className="p-10 text-[#00665E] animate-pulse font-bold text-center w-full h-screen flex items-center justify-center bg-[#F8FAFC]">Avvio Terminale POS...</div>

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col text-gray-900 font-sans selection:bg-[#00665E] selection:text-white relative overflow-hidden">
        
        <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-white shadow-sm relative z-10">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/loyalty" className="p-2 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 text-gray-600 transition"><ArrowLeft size={20}/></Link>
                <div>
                    <h1 className="text-xl font-black flex items-center gap-2 text-[#00665E] tracking-tight"><CreditCard size={24}/> INTEGRA POS</h1>
                    <p className="text-xs text-gray-500 font-bold mt-0.5">{activeStore ? `Stazione Operativa: ${activeStore.name}` : 'Seleziona Cassa'}</p>
                </div>
            </div>
            {activeStore && (
                <button onClick={() => setActiveStore(null)} className="text-xs font-bold bg-white text-gray-600 border border-gray-200 px-4 py-2.5 rounded-xl hover:bg-gray-50 transition flex items-center gap-2 shadow-sm">
                    <LogOut size={14}/> Cambia Cassa
                </button>
            )}
        </div>

        <div className="flex-1 flex items-center justify-center p-6 relative z-10">
            
            {/* STEP 1: SELEZIONE NEGOZIO (CASSA) */}
            {!activeStore && (
                <div className="w-full max-w-3xl bg-white p-10 rounded-[3rem] border border-gray-100 shadow-2xl animate-in zoom-in-95">
                    <h2 className="text-2xl font-black mb-8 text-center flex items-center justify-center gap-3 text-gray-900"><Store className="text-[#00665E]"/> Apri Terminale POS</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {stores.length === 0 && <p className="col-span-2 text-center text-gray-500 py-10 font-medium bg-gray-50 rounded-2xl border border-dashed border-gray-200">Nessun punto vendita configurato nel pannello Impostazioni.</p>}
                        {stores.map(store => (
                            <button key={store.id} onClick={() => setActiveStore(store)} className="bg-white border border-gray-200 p-6 rounded-3xl flex items-center gap-5 hover:border-[#00665E] hover:shadow-lg transition text-left group shadow-sm">
                                <div className="w-16 h-16 bg-[#00665E]/10 text-[#00665E] rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-[#00665E] group-hover:text-white transition"><Store size={28}/></div>
                                <div><h3 className="font-black text-lg text-gray-900">{store.name}</h3><p className="text-xs text-gray-500 font-mono mt-1 bg-gray-100 px-2 py-0.5 rounded inline-block border border-gray-200">ID: {store.store_code}</p></div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* STEP 2: RICERCA CLIENTE E SCONTRINO */}
            {activeStore && !successTx && (
                <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 h-full items-center animate-in slide-in-from-right">
                    
                    <div className="bg-white border border-gray-200 p-8 rounded-[2.5rem] shadow-xl flex flex-col h-[650px] relative overflow-hidden">
                        {!foundCustomer ? (
                            <div className="flex-1 flex flex-col justify-center relative z-10">
                                <div className="text-center mb-8">
                                    <div className="w-28 h-28 bg-[#00665E]/10 border-4 border-[#00665E]/20 rounded-[2rem] mx-auto flex items-center justify-center text-[#00665E] mb-6 shadow-inner"><QrCode size={48}/></div>
                                    <h2 className="text-3xl font-black mb-3 text-gray-900">Identifica Cliente</h2>
                                    <p className="text-sm text-gray-500 font-medium max-w-xs mx-auto">Usa la fotocamera o inserisci manualmente il codice VIP o l'email del cliente.</p>
                                </div>
                                
                                {showScanner ? (
                                    <div className="mb-6 bg-black rounded-3xl overflow-hidden relative h-64 border-4 border-[#00665E] shadow-xl">
                                        <Scanner onScan={(res) => { if(res && res.length>0) handleSearchCustomer(undefined, res[0].rawValue) }} styles={{ container: { width: '100%', height: '100%' } }} />
                                        <button onClick={() => setShowScanner(false)} className="absolute top-4 right-4 bg-white/20 p-2 rounded-full text-white z-50 hover:bg-rose-500 transition backdrop-blur-md"><X/></button>
                                    </div>
                                ) : (
                                    <button onClick={() => setShowScanner(true)} className="w-full mb-6 bg-gray-50 border border-gray-200 text-[#00665E] py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-gray-100 hover:border-[#00665E]/50 transition shadow-sm">
                                        <QrCode size={20}/> Attiva Fotocamera Lettore
                                    </button>
                                )}

                                <form onSubmit={handleSearchCustomer} className="relative">
                                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
                                    <input type="text" autoFocus placeholder="Digita Codice o Email..." className="w-full bg-white border-2 border-gray-200 p-5 pl-14 rounded-2xl text-lg font-bold font-mono text-gray-900 outline-none focus:border-[#00665E] transition placeholder:text-gray-400 shadow-inner" value={searchQuery} onChange={e => setSearchQuery(e.target.value.toUpperCase())} />
                                    <button type="submit" disabled={loading || !searchQuery} className="absolute right-3 top-1/2 -translate-y-1/2 bg-[#00665E] text-white p-3 rounded-xl hover:bg-[#004d46] transition disabled:opacity-50 shadow-md">
                                        {loading ? <Loader2 size={20} className="animate-spin"/> : <ChevronRight size={20}/>}
                                    </button>
                                </form>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col relative z-10">
                                <button onClick={resetFlow} className="absolute top-0 right-0 bg-gray-100 text-gray-500 p-2.5 rounded-full hover:bg-rose-100 hover:text-rose-600 transition z-20 shadow-sm"><X size={18}/></button>
                                <h3 className="text-xs font-black text-[#00665E] uppercase tracking-widest mb-6 flex items-center gap-2"><CheckCircle2 className="text-[#00665E]"/> Cliente Trovato</h3>
                                
                                <div className="p-8 rounded-[2rem] shadow-2xl mb-8 relative overflow-hidden text-white" style={{ background: `linear-gradient(135deg, ${settings?.card_color_primary || '#00665E'}, ${settings?.card_color_secondary || '#004d46'})` }}>
                                    <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '16px 16px' }}></div>
                                    <CreditCard className="absolute -right-10 -bottom-10 opacity-10" size={180}/>
                                    
                                    <p className="text-white/80 font-mono text-sm tracking-widest mb-2 font-bold drop-shadow-md">{foundCustomer.code}</p>
                                    <h2 className="text-3xl font-black text-white mb-8 line-clamp-1 drop-shadow-md">{foundCustomer.contacts?.name || foundCustomer.customer_name || 'Cliente VIP'}</h2>
                                    <div className="flex justify-between items-end relative z-10">
                                        <div><p className="text-[10px] text-white/80 uppercase font-black tracking-widest mb-1 drop-shadow-sm">Saldo Punti</p><p className="text-5xl font-black tracking-tighter drop-shadow-lg">{foundCustomer.points}</p></div>
                                        <div className="text-right"><p className="text-[10px] text-white/80 uppercase font-black tracking-widest mb-1 drop-shadow-sm">Livello</p><p className="text-xl font-bold bg-white/20 px-3 py-1 rounded-lg backdrop-blur-md shadow-sm">{foundCustomer.tier}</p></div>
                                    </div>
                                </div>

                                <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200 mt-auto flex items-center justify-between shadow-sm">
                                    <span className="text-sm font-bold text-gray-500">Regola Moltiplicatore:</span>
                                    <span className="font-black text-[#00665E] bg-[#00665E]/10 border border-[#00665E]/20 px-3 py-1.5 rounded-lg">1€ = {settings?.points_per_euro || 1} Punti</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className={`bg-white border border-gray-200 p-8 rounded-[2.5rem] shadow-xl flex flex-col h-[650px] transition-all duration-500 ${foundCustomer ? 'opacity-100 translate-x-0' : 'opacity-30 pointer-events-none translate-x-4'}`}>
                        <div className="text-center mb-8">
                            <p className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-3">Importo Scontrino</p>
                            <div className="bg-gray-50 border-2 border-gray-200 p-6 rounded-3xl shadow-inner flex items-center justify-center">
                                <span className="text-3xl text-gray-400 mr-2 font-light">€</span>
                                <span className={`text-6xl font-black tracking-tighter ${amountInput ? 'text-[#00665E]' : 'text-gray-300'}`}>{amountInput || '0.00'}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 flex-1">
                            {['1','2','3','4','5','6','7','8','9','C','0','.'].map(key => (
                                <button key={key} onClick={() => handleKeypad(key)} className={`text-3xl font-bold rounded-2xl transition active:scale-95 shadow-sm border ${key === 'C' ? 'bg-rose-50 text-rose-500 hover:bg-rose-100 border-rose-100' : 'bg-white text-gray-800 hover:bg-[#00665E] hover:text-white border-gray-200 hover:border-[#00665E]'}`}>{key}</button>
                            ))}
                        </div>

                        <button onClick={processTransaction} disabled={processing || !amountInput} className="w-full mt-6 bg-[#00665E] text-white font-black py-5 rounded-2xl text-xl hover:bg-[#004d46] transition shadow-[0_10px_30px_rgba(0,102,94,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3">
                            {processing ? <Loader2 className="animate-spin" size={24}/> : <CheckCircle2 size={28}/>}
                            {processing ? 'Elaborazione in corso...' : 'Emetti Punti e Chiudi'}
                        </button>
                    </div>
                </div>
            )}

            {successTx && (
                <div className="w-full max-w-xl bg-white p-12 rounded-[3rem] border border-emerald-200 shadow-2xl text-center animate-in zoom-in-95">
                    <div className="w-32 h-32 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner border-4 border-emerald-100 animate-bounce"><CheckCircle size={64}/></div>
                    <h2 className="text-4xl font-black text-gray-900 mb-2">Transazione Riuscita!</h2>
                    <p className="text-gray-500 mb-10 font-medium">I punti sono stati accreditati correttamente sul DB.</p>
                    
                    <div className="bg-gray-50 border border-gray-200 rounded-3xl p-8 mb-10 text-left shadow-sm">
                        <div className="flex justify-between mb-4 pb-4 border-b border-gray-200"><span className="text-gray-500 font-bold uppercase tracking-widest text-xs">Importo Speso</span><span className="font-black text-xl text-gray-900">€ {successTx.amount.toFixed(2)}</span></div>
                        <div className="flex justify-between mb-4 pb-4 border-b border-gray-200"><span className="text-gray-500 font-bold uppercase tracking-widest text-xs">Punti Guadagnati</span><span className="font-black text-2xl text-emerald-600">+{successTx.points}</span></div>
                        <div className="flex justify-between items-center"><span className="text-gray-500 font-bold uppercase tracking-widest text-xs">Nuovo Saldo Totale</span><span className="font-black text-3xl text-[#00665E]">{successTx.newPoints}</span></div>
                    </div>

                    <button onClick={resetFlow} className="w-full bg-[#00665E] text-white font-black py-5 rounded-2xl hover:bg-[#004d46] transition shadow-xl text-lg hover:scale-105">Avvia Nuova Operazione</button>
                </div>
            )}
        </div>
    </div>
  )
}