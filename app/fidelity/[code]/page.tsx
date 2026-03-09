'use client'

import { createClient } from '../../../utils/supabase/client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import QRCode from "react-qr-code"
import { Gift, Star, Store, MapPin, Loader2, Award } from 'lucide-react'

export default function PublicFidelityCard() {
  const params = useParams()
  const code = params?.code as string

  const [loading, setLoading] = useState(true)
  const [card, setCard] = useState<any>(null)
  const [settings, setSettings] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [stores, setStores] = useState<any[]>([])

  const supabase = createClient()

  useEffect(() => {
      const loadCard = async () => {
          if(!code) return;

          // Trova la carta e i dati del cliente
          const { data: cardData } = await supabase.from('loyalty_cards')
              .select('*, contacts(name, email)')
              .eq('code', code)
              .single()

          if (cardData) {
              setCard(cardData)
              
              // Carica le configurazioni dell'azienda proprietaria della carta
              const { data: set } = await supabase.from('loyalty_settings').select('*').eq('user_id', cardData.user_id).single()
              if (set) setSettings(set)

              const { data: prof } = await supabase.from('profiles').select('company_name, logo_url').eq('id', cardData.user_id).single()
              if (prof) setProfile(prof)

              const { data: str } = await supabase.from('loyalty_stores').select('*').eq('user_id', cardData.user_id)
              if (str) setStores(str)
          }

          setLoading(false)
      }
      loadCard()
  }, [code, supabase])

  if (loading) return <div className="h-screen w-screen flex flex-col items-center justify-center bg-gray-100"><Loader2 className="animate-spin text-gray-400 mb-4" size={40}/><p className="text-gray-500 font-bold">Caricamento Wallet...</p></div>
  if (!card) return <div className="h-screen w-screen flex items-center justify-center bg-gray-100 text-red-500 font-bold">Carta non trovata o disattivata.</div>

  const primaryColor = settings?.card_color_primary || '#00665E'
  const secondaryColor = settings?.card_color_secondary || '#004d46'
  const nextTierPoints = card.tier === 'Platinum' ? null : (card.tier === 'Gold' ? 3000 : 1000)
  const progressPercent = nextTierPoints ? Math.min((card.points / nextTierPoints) * 100, 100) : 100

  return (
      <main className="min-h-screen bg-slate-900 pb-10 flex flex-col items-center font-sans text-slate-800">
          
          {/* HEADER BRAND */}
          <div className="w-full max-w-md p-6 flex flex-col items-center text-center text-white mb-4 mt-6">
              {settings?.card_logo_url || profile?.logo_url ? (
                  <img src={settings.card_logo_url || profile.logo_url} alt="Logo" className="h-16 object-contain mb-4 bg-white/10 p-2 rounded-2xl backdrop-blur-sm" />
              ) : (
                  <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-sm"><Store size={32}/></div>
              )}
              <h1 className="text-2xl font-black tracking-wider uppercase">{profile?.company_name || 'VIP Club'}</h1>
          </div>

          {/* CARTA STILE APPLE WALLET */}
          <div className="w-[90%] max-w-md relative transition-transform hover:scale-[1.02]">
              <div 
                  className="rounded-[2rem] shadow-2xl p-8 text-white flex flex-col justify-between relative overflow-hidden"
                  style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`, minHeight: '480px' }}
              >
                  {/* Pattern Sfondo */}
                  <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
                  <Award className="absolute -right-10 -bottom-10 opacity-10" size={250}/>

                  <div className="relative z-10 text-center">
                      <p className="text-sm font-bold opacity-80 uppercase tracking-widest mb-1">{settings?.card_name || 'Fidelity Card'}</p>
                      <p className="text-2xl font-black">{card.contacts?.name || 'Cliente VIP'}</p>
                  </div>

                  <div className="relative z-10 flex flex-col items-center bg-white rounded-3xl p-6 shadow-inner mt-8 mb-8 text-gray-900">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Mostra in Cassa</p>
                      <QRCode value={card.code} size={180} />
                      <p className="mt-4 font-mono font-black text-xl tracking-widest">{card.code}</p>
                  </div>

                  <div className="relative z-10 flex justify-between items-end">
                      <div>
                          <p className="text-xs uppercase tracking-widest font-bold opacity-80 mb-1">Punti Totali</p>
                          <p className="text-5xl font-black">{card.points.toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                          <p className="text-xs uppercase tracking-widest font-bold opacity-80 mb-1">Livello</p>
                          <p className="text-xl font-black bg-white/20 px-3 py-1 rounded-lg backdrop-blur-md">{card.tier}</p>
                      </div>
                  </div>
              </div>
          </div>

          {/* PROGRESSO E INFO SOTTO LA CARTA */}
          <div className="w-[90%] max-w-md mt-6 space-y-4">
              
              {nextTierPoints && (
                  <div className="bg-white rounded-3xl p-6 shadow-xl">
                      <div className="flex justify-between text-sm font-bold text-gray-800 mb-2">
                          <span>Sblocca Livello Superiore</span>
                          <span>{card.points} / {nextTierPoints}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-1000" style={{width: `${progressPercent}%`, backgroundColor: primaryColor}}></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-3 text-center font-medium">Ti mancano solo {nextTierPoints - card.points} punti per il prossimo traguardo!</p>
                  </div>
              )}

              <div className="bg-slate-800 rounded-3xl p-6 text-white shadow-xl">
                  <h3 className="font-black mb-4 text-slate-300 flex items-center gap-2"><MapPin size={18}/> Usa i punti nei nostri store</h3>
                  <div className="space-y-3">
                      {stores.length === 0 && <p className="text-xs text-slate-500">Nessun punto vendita configurato.</p>}
                      {stores.map(store => (
                          <div key={store.id} className="flex justify-between items-center border-b border-slate-700 pb-3 last:border-0 last:pb-0">
                              <div>
                                  <p className="font-bold text-sm">{store.name}</p>
                                  <p className="text-xs text-slate-400">{store.address}</p>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>

          </div>
      </main>
  )
}