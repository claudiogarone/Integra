'use client'

import { createClient } from '../../../utils/supabase/client'
import { useEffect, useState } from 'react'
import { 
  CreditCard, Store, Plus, ShoppingCart, Settings, Shield, Edit3, Trash2, Save 
} from 'lucide-react'
import QRCode from "react-qr-code"
import Link from 'next/link'

export default function LoyaltyConfigPage() {
  const [loading, setLoading] = useState(true)
  const [config, setConfig] = useState<any>({
      card_color_primary: '#00665E', card_color_secondary: '#004d46', 
      max_cards_limit: 500, max_stores_limit: 5, points_per_euro: 1, points_for_feedback: 50
  })
  const [stores, setStores] = useState<any[]>([])
  const [cardsIssued, setCardsIssued] = useState(0)
  
  // Modale Negozio
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false)
  const [newStore, setNewStore] = useState({ name: '', address: '', discount_percent: 10 })

  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if(!user) return;

    // Carica Settings
    let { data: settings } = await supabase.from('loyalty_settings').select('*').single()
    if (!settings) {
        // Se non esiste, crea default
        const { data } = await supabase.from('loyalty_settings').insert({ user_id: user.id }).select().single()
        settings = data
    }
    setConfig(settings)

    // Carica Negozi
    const { data: storeList } = await supabase.from('loyalty_stores').select('*')
    setStores(storeList || [])

    // Conta carte emesse
    const { count } = await supabase.from('loyalty_cards').select('*', { count: 'exact', head: true })
    setCardsIssued(count || 0)

    setLoading(false)
  }

  const handleSaveConfig = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      await supabase.from('loyalty_settings').upsert({ user_id: user.id, ...config })
      alert("Configurazione salvata! 🎨")
  }

  const handleAddStore = async () => {
      if (stores.length >= config.max_stores_limit) {
          return alert("⚠️ Hai raggiunto il limite di 5 negozi del Piano Base.\n\nAcquista il pacchetto 'Expansion' (+5 Negozi) a 25€.")
      }
      
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase.from('loyalty_stores').insert({
          user_id: user.id, ...newStore
      }).select()
      
      if (data) {
          setStores([...stores, data[0]])
          setIsStoreModalOpen(false)
          setNewStore({ name: '', address: '', discount_percent: 10 })
      }
  }

  // Funzione finta per simulare acquisto pacchetto
  const buyPackage = (type: 'cards' | 'stores') => {
      const confirm = window.confirm(`Vuoi acquistare il pacchetto ${type === 'cards' ? '+500 Card' : '+5 Negozi'} al costo di 25€?`)
      if(confirm) {
          // Qui andrebbe la chiamata a Stripe
          alert("🎉 Acquisto simulato con successo! I limiti sono stati aumentati.")
          if(type === 'cards') setConfig({...config, max_cards_limit: config.max_cards_limit + 500})
          else setConfig({...config, max_stores_limit: config.max_stores_limit + 5})
      }
  }

  if (loading) return <div className="p-10 text-[#00665E] animate-pulse">Caricamento Loyalty Config...</div>

  return (
    <main className="p-8 bg-[#F8FAFC] min-h-screen pb-20">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-[#00665E] tracking-tight">Fidelity Configuration</h1>
          <p className="text-gray-500 text-sm">Disegna la tua carta e gestisci i negozi affiliati.</p>
        </div>
        <div className="flex gap-3">
             <Link href="/dashboard/loyalty/report" className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl font-bold hover:bg-gray-50 flex items-center gap-2">
                 📊 Monitor & Report
             </Link>
             <button onClick={handleSaveConfig} className="bg-[#00665E] text-white px-6 py-2 rounded-xl font-bold shadow-lg hover:bg-[#004d46] flex items-center gap-2">
                 <Save size={18}/> Salva Modifiche
             </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLONNA 1: PREVIEW CARTA & STILE */}
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><CreditCard size={18}/> Anteprima Live</h3>
                
                {/* CARD PREVIEW */}
                <div 
                    className="relative w-full aspect-[1.586/1] rounded-2xl shadow-2xl p-6 text-white overflow-hidden flex flex-col justify-between transition-all duration-500"
                    style={{ background: `linear-gradient(135deg, ${config.card_color_primary}, ${config.card_color_secondary})` }}
                >
                    <div className="flex justify-between items-start z-10">
                        <span className="font-mono text-xs opacity-70 tracking-widest uppercase">VIP CARD</span>
                        <div className="w-8 h-8 bg-white/20 rounded-full backdrop-blur-md"></div>
                    </div>
                    <div className="z-10">
                        <p className="text-sm opacity-80">Saldo Punti</p>
                        <p className="text-4xl font-black tracking-tighter">1.250</p>
                    </div>
                    <div className="flex justify-between items-end z-10">
                        <div className="text-xs font-mono opacity-60">CARD-XXXX-XXXX</div>
                        <div className="bg-white p-1 rounded"><QRCode value="DEMO" size={30} /></div>
                    </div>
                    
                    {/* Decorazioni Sfondo */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                </div>

                {/* CONTROLLI COLORE */}
                <div className="mt-6 space-y-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">Colore Primario</label>
                        <div className="flex gap-2 mt-1">
                            <input type="color" value={config.card_color_primary} onChange={e => setConfig({...config, card_color_primary: e.target.value})} className="h-10 w-10 rounded cursor-pointer border-none" />
                            <input type="text" value={config.card_color_primary} onChange={e => setConfig({...config, card_color_primary: e.target.value})} className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 text-sm font-mono" />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">Colore Secondario</label>
                        <div className="flex gap-2 mt-1">
                            <input type="color" value={config.card_color_secondary} onChange={e => setConfig({...config, card_color_secondary: e.target.value})} className="h-10 w-10 rounded cursor-pointer border-none" />
                            <input type="text" value={config.card_color_secondary} onChange={e => setConfig({...config, card_color_secondary: e.target.value})} className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 text-sm font-mono" />
                        </div>
                    </div>
                </div>
            </div>

            {/* REGOLE PUNTI */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Settings size={18}/> Regole & AI</h3>
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">Punti per ogni Euro (€)</label>
                        <input type="number" value={config.points_per_euro} onChange={e => setConfig({...config, points_per_euro: e.target.value})} className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl mt-1 font-bold text-[#00665E]" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">Bonus Recensione AI</label>
                        <input type="number" value={config.points_for_feedback} onChange={e => setConfig({...config, points_for_feedback: e.target.value})} className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl mt-1 font-bold text-purple-600" />
                        <p className="text-[10px] text-gray-400 mt-1">L'AI verificherà se la recensione è autentica prima di assegnare i punti.</p>
                    </div>
                </div>
            </div>
        </div>

        {/* COLONNA 2 & 3: LIMITI & NEGOZI */}
        <div className="lg:col-span-2 space-y-6">
            
            {/* LIMITI PIANO */}
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-3xl p-8 text-white flex flex-col md:flex-row justify-between items-center gap-8 shadow-xl">
                <div className="flex-1 w-full">
                    <div className="flex justify-between mb-2">
                        <span className="text-sm font-bold flex items-center gap-2"><CreditCard size={16}/> Carte Emesse</span>
                        <span className="text-xs opacity-70">{cardsIssued} / {config.max_cards_limit}</span>
                    </div>
                    <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden mb-4">
                        <div className="bg-teal-400 h-full rounded-full" style={{width: `${Math.min((cardsIssued/config.max_cards_limit)*100, 100)}%`}}></div>
                    </div>
                    <button onClick={() => buyPackage('cards')} className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition flex items-center gap-1">
                        <ShoppingCart size={12}/> Acquista +500 Card (25€)
                    </button>
                </div>

                <div className="w-px h-24 bg-white/10 hidden md:block"></div>

                <div className="flex-1 w-full">
                    <div className="flex justify-between mb-2">
                        <span className="text-sm font-bold flex items-center gap-2"><Store size={16}/> Negozi Attivi</span>
                        <span className="text-xs opacity-70">{stores.length} / {config.max_stores_limit}</span>
                    </div>
                    <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden mb-4">
                        <div className="bg-purple-400 h-full rounded-full" style={{width: `${(stores.length/config.max_stores_limit)*100}%`}}></div>
                    </div>
                    <button onClick={() => buyPackage('stores')} className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition flex items-center gap-1">
                        <ShoppingCart size={12}/> Acquista +5 Negozi (25€)
                    </button>
                </div>
            </div>

            {/* LISTA NEGOZI */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <Store size={20} className="text-[#00665E]"/> Negozi Convenzionati
                    </h3>
                    <button onClick={() => setIsStoreModalOpen(true)} className="bg-gray-50 text-gray-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-100 transition flex items-center gap-2">
                        <Plus size={16}/> Aggiungi Negozio
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {stores.map((store) => (
                        <div key={store.id} className="p-4 border border-gray-100 rounded-2xl hover:shadow-md transition group relative bg-slate-50">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-bold text-gray-900">{store.name}</h4>
                                    <p className="text-xs text-gray-500 mb-2">{store.address || 'Indirizzo non impostato'}</p>
                                    <div className="flex gap-2">
                                        <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] font-bold">Sconto {store.discount_percent}%</span>
                                        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold">Attivo</span>
                                    </div>
                                </div>
                                <button className="text-gray-300 hover:text-red-500 transition"><Trash2 size={16}/></button>
                            </div>
                        </div>
                    ))}
                    {stores.length === 0 && (
                        <div className="col-span-2 text-center py-10 text-gray-400 text-sm border-2 border-dashed border-gray-100 rounded-2xl">
                            Nessun negozio configurato. Aggiungine uno per iniziare.
                        </div>
                    )}
                </div>
            </div>
        </div>

      </div>

      {/* MODALE AGGIUNGI NEGOZIO */}
      {isStoreModalOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
             <div className="bg-white p-8 rounded-3xl max-w-md w-full relative shadow-2xl animate-in zoom-in-95">
                <h3 className="text-xl font-black text-gray-900 mb-6">Aggiungi Negozio</h3>
                <div className="space-y-4">
                    <div><label className="text-xs font-bold uppercase text-gray-500">Nome Insegna</label><input type="text" value={newStore.name} onChange={e => setNewStore({...newStore, name: e.target.value})} className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-[#00665E]" placeholder="Es. Pizzeria Da Michele" /></div>
                    <div><label className="text-xs font-bold uppercase text-gray-500">Indirizzo</label><input type="text" value={newStore.address} onChange={e => setNewStore({...newStore, address: e.target.value})} className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-[#00665E]" placeholder="Via Roma 1, Milano" /></div>
                    <div><label className="text-xs font-bold uppercase text-gray-500">Sconto Default (%)</label><input type="number" value={newStore.discount_percent} onChange={e => setNewStore({...newStore, discount_percent: Number(e.target.value)})} className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-[#00665E]" /></div>
                </div>
                <div className="flex gap-3 mt-8">
                    <button onClick={() => setIsStoreModalOpen(false)} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-50 rounded-xl">Annulla</button>
                    <button onClick={handleAddStore} className="flex-1 bg-[#00665E] text-white py-3 rounded-xl font-bold shadow-lg">Aggiungi</button>
                </div>
             </div>
          </div>
      )}

    </main>
  )
}