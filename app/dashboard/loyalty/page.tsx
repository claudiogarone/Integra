'use client'

import { createClient } from '../../../utils/supabase/client'
import { useEffect, useState } from 'react'
import { 
  CreditCard, Store, Plus, ShoppingCart, Settings, Save, Trash2, Image as ImageIcon 
} from 'lucide-react'
import QRCode from "react-qr-code"
import Link from 'next/link'

export default function LoyaltyConfigPage() {
  const [loading, setLoading] = useState(true)
  const [config, setConfig] = useState<any>({
      card_name: 'VIP Club', // Default
      card_color_primary: '#00665E', 
      card_color_secondary: '#004d46', 
      card_logo_url: '',
      max_cards_limit: 500, max_stores_limit: 5, points_per_euro: 1, points_for_feedback: 50
  })
  const [stores, setStores] = useState<any[]>([])
  const [cardsIssued, setCardsIssued] = useState(0)
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false)
  const [newStore, setNewStore] = useState({ name: '', address: '', discount_percent: 10 })

  const supabase = createClient()

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if(!user) return;

    let { data: settings } = await supabase.from('loyalty_settings').select('*').single()
    if (!settings) {
        const { data } = await supabase.from('loyalty_settings').insert({ user_id: user.id }).select().single()
        settings = data
    }
    setConfig(settings)

    const { data: storeList } = await supabase.from('loyalty_stores').select('*')
    setStores(storeList || [])

    const { count } = await supabase.from('loyalty_cards').select('*', { count: 'exact', head: true })
    setCardsIssued(count || 0)
    setLoading(false)
  }

  const handleSaveConfig = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return alert("Errore utente");
      await supabase.from('loyalty_settings').upsert({ user_id: user.id, ...config })
      alert("Configurazione salvata! 🎨")
  }

  const handleAddStore = async () => {
      if (stores.length >= config.max_stores_limit) return alert("⚠️ Limite negozi raggiunto. Acquista pacchetto.")
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return;
      
      const { data } = await supabase.from('loyalty_stores').insert({ user_id: user.id, ...newStore }).select()
      if (data) {
          setStores([...stores, data[0]])
          setIsStoreModalOpen(false)
          setNewStore({ name: '', address: '', discount_percent: 10 })
      }
  }

  const buyPackage = (type: 'cards' | 'stores') => {
      alert("Simulazione: Reindirizzamento a Stripe per pagamento 25€...")
      // Qui aggiorneremmo il DB dopo il pagamento
  }

  if (loading) return <div className="p-10 text-[#00665E] animate-pulse">Caricamento...</div>

  return (
    <main className="p-8 bg-[#F8FAFC] min-h-screen pb-20">
      
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-[#00665E]">Configurazione Carta</h1>
          <p className="text-gray-500 text-sm">Personalizza l'esperienza fedeltà.</p>
        </div>
        <div className="flex gap-3">
             <Link href="/dashboard/loyalty/report" className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl font-bold hover:bg-gray-50 flex items-center gap-2">
                 📊 Vai ai Report
             </Link>
             <button onClick={handleSaveConfig} className="bg-[#00665E] text-white px-6 py-2 rounded-xl font-bold shadow-lg hover:bg-[#004d46] flex items-center gap-2">
                 <Save size={18}/> Salva
             </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLONNA 1: DESIGN */}
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><CreditCard size={18}/> Design Carta</h3>
                
                {/* PREVIEW */}
                <div 
                    className="relative w-full aspect-[1.586/1] rounded-2xl shadow-2xl p-6 text-white overflow-hidden flex flex-col justify-between transition-all duration-500"
                    style={{ background: `linear-gradient(135deg, ${config.card_color_primary}, ${config.card_color_secondary})` }}
                >
                    <div className="flex justify-between items-start z-10">
                        <span className="font-mono text-sm font-bold tracking-widest uppercase shadow-black drop-shadow-md">
                            {config.card_name || 'FIDELITY CARD'}
                        </span>
                        {config.card_logo_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={config.card_logo_url} alt="Logo" className="w-8 h-8 object-contain bg-white/20 rounded-full backdrop-blur-md" />
                        ) : (
                            <div className="w-8 h-8 bg-white/20 rounded-full backdrop-blur-md flex items-center justify-center font-bold">L</div>
                        )}
                    </div>
                    <div className="z-10">
                        <p className="text-xs opacity-80">Livello Attuale</p>
                        <p className="text-xl font-black tracking-tighter">GOLD MEMBER</p>
                    </div>
                    <div className="flex justify-between items-end z-10">
                        <div className="text-xs font-mono opacity-80">Mario Rossi</div>
                        <div className="bg-white p-1 rounded"><QRCode value="DEMO" size={30} /></div>
                    </div>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                </div>

                {/* INPUTS */}
                <div className="mt-6 space-y-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">Nome Programma</label>
                        <input type="text" value={config.card_name} onChange={e => setConfig({...config, card_name: e.target.value})} className="w-full bg-gray-50 border border-gray-200 p-2 rounded-lg mt-1 outline-none" placeholder="Es. VIP Club" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase flex gap-1"><ImageIcon size={12}/> Logo URL (Link Immagine)</label>
                        <input type="text" value={config.card_logo_url} onChange={e => setConfig({...config, card_logo_url: e.target.value})} className="w-full bg-gray-50 border border-gray-200 p-2 rounded-lg mt-1 outline-none text-xs" placeholder="https://..." />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Colore 1</label>
                            <input type="color" value={config.card_color_primary} onChange={e => setConfig({...config, card_color_primary: e.target.value})} className="w-full h-8 rounded cursor-pointer mt-1" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Colore 2</label>
                            <input type="color" value={config.card_color_secondary} onChange={e => setConfig({...config, card_color_secondary: e.target.value})} className="w-full h-8 rounded cursor-pointer mt-1" />
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* COLONNA 2: NEGOZI E LIMITI */}
        <div className="lg:col-span-2 space-y-6">
            
            {/* BOX PACCHETTI */}
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-3xl p-6 text-white flex flex-col md:flex-row gap-6 shadow-xl">
                <div className="flex-1">
                    <div className="flex justify-between mb-2 text-sm font-bold">
                        <span>💳 Carte Emesse</span>
                        <span className="opacity-70">{cardsIssued} / {config.max_cards_limit}</span>
                    </div>
                    <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden mb-3"><div className="bg-teal-400 h-full" style={{width: `${Math.min((cardsIssued/config.max_cards_limit)*100, 100)}%`}}></div></div>
                    <button onClick={() => buyPackage('cards')} className="text-xs bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg w-full flex items-center justify-center gap-2 transition">
                        <ShoppingCart size={14}/> Aumenta (+500 a 25€)
                    </button>
                </div>
                <div className="flex-1">
                    <div className="flex justify-between mb-2 text-sm font-bold">
                        <span>🏪 Negozi</span>
                        <span className="opacity-70">{stores.length} / {config.max_stores_limit}</span>
                    </div>
                    <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden mb-3"><div className="bg-purple-400 h-full" style={{width: `${(stores.length/config.max_stores_limit)*100}%`}}></div></div>
                    <button onClick={() => buyPackage('stores')} className="text-xs bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg w-full flex items-center justify-center gap-2 transition">
                        <ShoppingCart size={14}/> Aumenta (+5 a 25€)
                    </button>
                </div>
            </div>

            {/* LISTA NEGOZI */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2"><Store size={20} className="text-[#00665E]"/> Punti Vendita</h3>
                    <button onClick={() => setIsStoreModalOpen(true)} className="bg-gray-50 text-gray-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-100 transition flex items-center gap-2">
                        <Plus size={16}/> Aggiungi
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {stores.map((store) => (
                        <div key={store.id} className="p-4 border border-gray-100 rounded-2xl bg-gray-50 flex justify-between">
                            <div>
                                <h4 className="font-bold text-sm text-gray-900">{store.name}</h4>
                                <p className="text-xs text-gray-500">{store.address}</p>
                                <span className="text-[10px] font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded mt-1 inline-block">Sconto {store.discount_percent}%</span>
                            </div>
                            <button className="text-gray-300 hover:text-red-500"><Trash2 size={16}/></button>
                        </div>
                    ))}
                </div>
            </div>
        </div>

      </div>

      {/* MODALE STORE */}
      {isStoreModalOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
             <div className="bg-white p-8 rounded-3xl max-w-md w-full shadow-2xl">
                <h3 className="text-xl font-black mb-4">Nuovo Negozio</h3>
                <div className="space-y-3">
                    <input type="text" placeholder="Nome" className="w-full p-3 border rounded-xl" value={newStore.name} onChange={e => setNewStore({...newStore, name: e.target.value})} />
                    <input type="text" placeholder="Indirizzo" className="w-full p-3 border rounded-xl" value={newStore.address} onChange={e => setNewStore({...newStore, address: e.target.value})} />
                    <input type="number" placeholder="Sconto %" className="w-full p-3 border rounded-xl" value={newStore.discount_percent} onChange={e => setNewStore({...newStore, discount_percent: Number(e.target.value)})} />
                </div>
                <div className="flex gap-3 mt-6">
                    <button onClick={() => setIsStoreModalOpen(false)} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-50 rounded-xl">Annulla</button>
                    <button onClick={handleAddStore} className="flex-1 bg-[#00665E] text-white py-3 rounded-xl font-bold">Aggiungi</button>
                </div>
             </div>
          </div>
      )}
    </main>
  )
}