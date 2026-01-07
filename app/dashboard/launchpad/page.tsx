'use client'

import { createClient } from '../../../utils/supabase/client'
import { useEffect, useState } from 'react'

export default function LaunchpadPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<any>(null)
  
  // Dati Social
  const [links, setLinks] = useState({
    facebook: '',
    instagram: '',
    tiktok: '',
    google: ''
  })

  const supabase = createClient()

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        const { data } = await supabase
          .from('profiles')
          .select('facebook_link, instagram_link, tiktok_link, google_review_link')
          .eq('id', user.id)
          .single()
        
        if (data) {
          setLinks({
            facebook: data.facebook_link || '',
            instagram: data.instagram_link || '',
            tiktok: data.tiktok_link || '',
            google: data.google_review_link || ''
          })
        }
      }
      setLoading(false)
    }
    getData()
  }, [supabase])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    
    const { error } = await supabase
      .from('profiles')
      .update({
        facebook_link: links.facebook,
        instagram_link: links.instagram,
        tiktok_link: links.tiktok,
        google_review_link: links.google
      })
      .eq('id', user.id)

    if (!error) alert('✅ Collegamenti salvati! I QR Code sono aggiornati.')
    else alert('Errore: ' + error.message)
    
    setSaving(false)
  }

  // Funzione semplice per generare QR Code (usa API pubblica sicura)
  const getQR = (url: string) => {
    if (!url) return null
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(url)}`
  }

  if (loading) return <div className="p-10 text-white">Caricamento Launchpad...</div>

  return (
    <main className="flex-1 p-10 overflow-auto bg-black text-white">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Launchpad Social 🚀</h1>
          <p className="text-gray-400 text-sm">Collega i tuoi canali e genera gli strumenti per i clienti.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        
        {/* COLONNA SX: CONFIGURAZIONE LINK */}
        <div className="bg-gray-900 p-8 rounded-xl border border-gray-800 shadow-2xl">
          <h2 className="text-xl font-bold text-white mb-6">🔗 Incolla i tuoi Link</h2>
          <form onSubmit={handleSave} className="space-y-6">
            
            <div className="space-y-1">
              <label className="flex items-center gap-2 text-sm text-blue-400 font-bold">
                <span>📘</span> Facebook Page URL
              </label>
              <input 
                type="url" 
                value={links.facebook}
                onChange={e => setLinks({...links, facebook: e.target.value})}
                className="w-full bg-gray-950 border border-gray-700 rounded p-3 text-white focus:border-blue-500 outline-none placeholder-gray-600"
                placeholder="https://facebook.com/latuapagina"
              />
            </div>

            <div className="space-y-1">
              <label className="flex items-center gap-2 text-sm text-pink-400 font-bold">
                <span>📸</span> Instagram Profile URL
              </label>
              <input 
                type="url" 
                value={links.instagram}
                onChange={e => setLinks({...links, instagram: e.target.value})}
                className="w-full bg-gray-950 border border-gray-700 rounded p-3 text-white focus:border-pink-500 outline-none placeholder-gray-600"
                placeholder="https://instagram.com/iltuonome"
              />
            </div>

            <div className="space-y-1">
              <label className="flex items-center gap-2 text-sm text-white font-bold">
                <span>🎵</span> TikTok Profile URL
              </label>
              <input 
                type="url" 
                value={links.tiktok}
                onChange={e => setLinks({...links, tiktok: e.target.value})}
                className="w-full bg-gray-950 border border-gray-700 rounded p-3 text-white focus:border-gray-500 outline-none placeholder-gray-600"
                placeholder="https://tiktok.com/@iltuonome"
              />
            </div>

            <div className="space-y-1">
              <label className="flex items-center gap-2 text-sm text-yellow-500 font-bold">
                <span>⭐</span> Google Maps / Review Link
              </label>
              <input 
                type="url" 
                value={links.google}
                onChange={e => setLinks({...links, google: e.target.value})}
                className="w-full bg-gray-950 border border-gray-700 rounded p-3 text-white focus:border-yellow-500 outline-none placeholder-gray-600"
                placeholder="https://g.page/..."
              />
              <p className="text-[10px] text-gray-500">Utile per chiedere recensioni ai clienti.</p>
            </div>

            <button type="submit" disabled={saving} className="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-bold py-4 rounded-lg mt-4 transition">
              {saving ? 'Salvataggio...' : '💾 Salva e Genera QR'}
            </button>
          </form>
        </div>

        {/* COLONNA DX: ANTEPRIMA E QR CODE */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-xl border border-gray-700 text-center">
            <h3 className="text-xl font-bold text-white mb-2">📲 I tuoi Smart QR</h3>
            <p className="text-sm text-gray-400 mb-6">Scarica e stampa questi codici per il tuo negozio fisico.</p>

            <div className="grid grid-cols-2 gap-4">
              
              {/* FACEBOOK QR */}
              {links.facebook && (
                <div className="bg-white p-3 rounded-lg shadow-lg flex flex-col items-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={getQR(links.facebook) || ''} alt="FB QR" className="w-24 h-24 mb-2" />
                  <span className="text-black font-bold text-xs uppercase">Facebook</span>
                  <a href={getQR(links.facebook) || ''} download="qr-facebook.png" target="_blank" className="text-[10px] text-blue-600 hover:underline mt-1">Scarica PNG</a>
                </div>
              )}

              {/* INSTAGRAM QR */}
              {links.instagram && (
                <div className="bg-white p-3 rounded-lg shadow-lg flex flex-col items-center">
                   {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={getQR(links.instagram) || ''} alt="Insta QR" className="w-24 h-24 mb-2" />
                  <span className="text-black font-bold text-xs uppercase">Instagram</span>
                  <a href={getQR(links.instagram) || ''} download="qr-instagram.png" target="_blank" className="text-[10px] text-pink-600 hover:underline mt-1">Scarica PNG</a>
                </div>
              )}

              {/* TIKTOK QR */}
              {links.tiktok && (
                <div className="bg-white p-3 rounded-lg shadow-lg flex flex-col items-center">
                   {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={getQR(links.tiktok) || ''} alt="TikTok QR" className="w-24 h-24 mb-2" />
                  <span className="text-black font-bold text-xs uppercase">TikTok</span>
                  <a href={getQR(links.tiktok) || ''} download="qr-tiktok.png" target="_blank" className="text-[10px] text-gray-600 hover:underline mt-1">Scarica PNG</a>
                </div>
              )}

              {/* GOOGLE QR */}
              {links.google && (
                <div className="bg-white p-3 rounded-lg shadow-lg flex flex-col items-center border-2 border-yellow-500">
                   {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={getQR(links.google) || ''} alt="Google QR" className="w-24 h-24 mb-2" />
                  <span className="text-black font-bold text-xs uppercase">Recensioni</span>
                  <a href={getQR(links.google) || ''} download="qr-reviews.png" target="_blank" className="text-[10px] text-yellow-600 hover:underline mt-1">Scarica PNG</a>
                </div>
              )}
              
            </div>
            
            {!links.facebook && !links.instagram && !links.tiktok && !links.google && (
              <p className="text-gray-500 italic py-10">Inserisci i link a sinistra per vedere i QR Code.</p>
            )}

          </div>

          {/* BOX INFO UTILE */}
          <div className="bg-blue-900/20 border border-blue-800 p-6 rounded-xl">
             <h4 className="font-bold text-blue-400 mb-2">💡 A cosa serve?</h4>
             <p className="text-sm text-gray-300">
               Collegando i tuoi social qui, abiliteremo presto la <strong>Social Inbox</strong> per leggere i messaggi, e l'<strong>AI Agent</strong> potrà imparare dai tuoi post per rispondere meglio ai clienti.
             </p>
          </div>
        </div>

      </div>
    </main>
  )
}