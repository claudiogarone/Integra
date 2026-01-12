'use client'

import { createClient } from '../../../utils/supabase/client'
import { useEffect, useState } from 'react'

export default function LaunchpadPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [companyName, setCompanyName] = useState('La Tua Azienda')
  const [activeTab, setActiveTab] = useState<'qr' | 'preview'>('preview') // Default su Preview Mobile
  
  // Dati Social
  const [links, setLinks] = useState({
    facebook: '',
    instagram: '',
    tiktok: '',
    google: '',
    whatsapp: '' // Aggiunto per completezza visiva se presente nel DB
  })

  const supabase = createClient()

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        const { data } = await supabase
          .from('profiles')
          .select('facebook_link, instagram_link, tiktok_link, google_review_link, company_name, whatsapp_number')
          .eq('id', user.id)
          .single()
        
        if (data) {
          setLinks({
            facebook: data.facebook_link || '',
            instagram: data.instagram_link || '',
            tiktok: data.tiktok_link || '',
            google: data.google_review_link || '',
            whatsapp: data.whatsapp_number || ''
          })
          if(data.company_name) setCompanyName(data.company_name)
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

    if (!error) {
        // Feedback visivo rapido senza alert bloccante
        const btn = document.getElementById('saveBtn')
        if(btn) { btn.innerText = '✅ Salvato!'; setTimeout(() => btn.innerText = '💾 Salva Modifiche', 2000) }
    } else {
        alert('Errore: ' + error.message)
    }
    setSaving(false)
  }

  const getQR = (url: string) => {
    if (!url) return null
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(url)}`
  }

  if (loading) return <div className="p-10 text-[#00665E] animate-pulse">Caricamento Launchpad...</div>

  return (
    <main className="flex-1 p-8 overflow-auto bg-[#F8FAFC] text-gray-900 font-sans">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#00665E] tracking-tight">Launchpad Social 🚀</h1>
          <p className="text-gray-500 text-sm mt-1">Centralizza la tua presenza digitale in un unico punto.</p>
        </div>
        <div className="flex gap-2">
            <button onClick={() => setActiveTab('preview')} className={`px-4 py-2 rounded-xl text-sm font-bold transition ${activeTab === 'preview' ? 'bg-[#00665E] text-white shadow' : 'bg-white text-gray-500 border border-gray-200'}`}>📱 Anteprima Mobile</button>
            <button onClick={() => setActiveTab('qr')} className={`px-4 py-2 rounded-xl text-sm font-bold transition ${activeTab === 'qr' ? 'bg-[#00665E] text-white shadow' : 'bg-white text-gray-500 border border-gray-200'}`}>🏁 Codici QR</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        
        {/* COLONNA SX: CONFIGURAZIONE */}
        <div className="space-y-6">
            <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">🔗 I tuoi Canali</h2>
                <form onSubmit={handleSave} className="space-y-5">
                    
                    <div className="relative group">
                        <div className="absolute left-3 top-3.5 text-lg opacity-50 group-focus-within:opacity-100 transition">📘</div>
                        <input type="url" value={links.facebook} onChange={e => setLinks({...links, facebook: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition" placeholder="Link Pagina Facebook" />
                    </div>

                    <div className="relative group">
                        <div className="absolute left-3 top-3.5 text-lg opacity-50 group-focus-within:opacity-100 transition">📸</div>
                        <input type="url" value={links.instagram} onChange={e => setLinks({...links, instagram: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:border-pink-500 focus:bg-white focus:ring-2 focus:ring-pink-100 outline-none transition" placeholder="Link Profilo Instagram" />
                    </div>

                    <div className="relative group">
                        <div className="absolute left-3 top-3.5 text-lg opacity-50 group-focus-within:opacity-100 transition">🎵</div>
                        <input type="url" value={links.tiktok} onChange={e => setLinks({...links, tiktok: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:border-black focus:bg-white focus:ring-2 focus:ring-gray-200 outline-none transition" placeholder="Link Profilo TikTok" />
                    </div>

                    <div className="relative group">
                        <div className="absolute left-3 top-3.5 text-lg opacity-50 group-focus-within:opacity-100 transition">⭐</div>
                        <input type="url" value={links.google} onChange={e => setLinks({...links, google: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:border-yellow-500 focus:bg-white focus:ring-2 focus:ring-yellow-100 outline-none transition" placeholder="Link Recensioni Google" />
                    </div>

                    <button id="saveBtn" type="submit" disabled={saving} className="w-full bg-[#00665E] hover:bg-[#004d46] text-white font-bold py-3 rounded-xl mt-2 transition shadow-lg shadow-[#00665E]/20">
                    {saving ? 'Salvataggio...' : '💾 Salva Modifiche'}
                    </button>
                </form>
            </div>

            {/* DOWNLOAD KIT CARD */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-3xl p-6 text-white relative overflow-hidden group cursor-pointer hover:shadow-xl transition">
                <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                <div className="relative z-10">
                    <h3 className="text-lg font-bold mb-1">🖨️ Kit Marketing da Banco</h3>
                    <p className="text-xs text-slate-300 mb-4 max-w-[80%]">Scarica il PDF pronto per la stampa con il QR Code unico che porta alla tua pagina Link-in-Bio.</p>
                    <button onClick={() => alert("Generazione PDF in corso... (Funzione simulata)")} className="bg-white text-slate-900 px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-100 transition">Scarica PDF A4</button>
                </div>
            </div>
        </div>

        {/* COLONNA DX: ANTEPRIMA TELEFONO / QR */}
        <div className="flex justify-center h-full">
            
            {activeTab === 'preview' ? (
                // MOCKUP TELEFONO
                <div className="relative w-[300px] h-[600px] bg-gray-900 rounded-[3rem] border-[8px] border-gray-900 shadow-2xl overflow-hidden flex flex-col">
                    {/* Notch */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-900 rounded-b-xl z-20"></div>
                    
                    {/* Screen Content */}
                    <div className="flex-1 bg-white overflow-y-auto pt-12 pb-8 px-6 flex flex-col items-center">
                        {/* Avatar Azienda */}
                        <div className="w-20 h-20 bg-gray-100 rounded-full mb-4 border-2 border-white shadow-md flex items-center justify-center text-2xl overflow-hidden">
                            🏢
                        </div>
                        <h3 className="font-bold text-gray-900 text-lg text-center leading-tight">{companyName}</h3>
                        <p className="text-xs text-gray-400 mb-8">@integra.os</p>

                        {/* Bottoni Link */}
                        <div className="w-full space-y-3">
                            {links.whatsapp && (
                                <div className="w-full bg-green-500 text-white py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold shadow-sm cursor-pointer hover:scale-105 transition">
                                    <span>💬</span> Scrivici su WhatsApp
                                </div>
                            )}
                            {links.google && (
                                <div className="w-full bg-white border border-gray-200 text-gray-700 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold shadow-sm cursor-pointer hover:bg-gray-50 transition">
                                    <span>⭐</span> Lascia una Recensione
                                </div>
                            )}
                            {links.instagram && (
                                <div className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold shadow-sm cursor-pointer hover:opacity-90 transition">
                                    <span>📸</span> Seguici su Instagram
                                </div>
                            )}
                            {links.facebook && (
                                <div className="w-full bg-[#1877F2] text-white py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold shadow-sm cursor-pointer hover:opacity-90 transition">
                                    <span>📘</span> Pagina Facebook
                                </div>
                            )}
                            {links.tiktok && (
                                <div className="w-full bg-black text-white py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold shadow-sm cursor-pointer hover:opacity-90 transition">
                                    <span>🎵</span> TikTok
                                </div>
                            )}
                            {(!links.facebook && !links.instagram && !links.tiktok && !links.google && !links.whatsapp) && (
                                <p className="text-center text-xs text-gray-300 italic mt-10">Aggiungi i link a sinistra per vederli apparire qui.</p>
                            )}
                        </div>

                        {/* Footer Telefono */}
                        <div className="mt-auto pt-8">
                            <p className="text-[10px] text-gray-300 uppercase tracking-widest font-bold">Powered by Integra</p>
                        </div>
                    </div>
                </div>
            ) : (
                // GRIGLIA QR CLASSICA
                <div className="w-full bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
                    <h3 className="font-bold text-gray-900 mb-4">I tuoi QR Code Singoli</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {links.facebook && <QRCodeCard url={links.facebook} icon="📘" label="Facebook" color="text-blue-600" />}
                        {links.instagram && <QRCodeCard url={links.instagram} icon="📸" label="Instagram" color="text-pink-600" />}
                        {links.tiktok && <QRCodeCard url={links.tiktok} icon="🎵" label="TikTok" color="text-black" />}
                        {links.google && <QRCodeCard url={links.google} icon="⭐" label="Google" color="text-yellow-600" />}
                    </div>
                    {(!links.facebook && !links.instagram && !links.tiktok && !links.google) && <p className="text-gray-400 text-sm italic text-center py-10">Nessun link configurato.</p>}
                </div>
            )}

        </div>

      </div>
    </main>
  )
}

// Componente Helper per le Card QR
function QRCodeCard({ url, icon, label, color }: { url: string, icon: string, label: string, color: string }) {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(url)}`
    return (
        <div className="bg-gray-50 p-3 rounded-2xl flex flex-col items-center text-center border border-gray-100 hover:border-gray-300 transition group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrUrl} alt={label} className="w-24 h-24 mb-2 mix-blend-multiply group-hover:scale-105 transition" />
            <span className={`text-xs font-bold uppercase ${color} mb-1`}>{icon} {label}</span>
            <a href={qrUrl} download={`qr-${label}.png`} target="_blank" className="text-[10px] text-gray-400 hover:text-[#00665E] font-bold border border-gray-200 bg-white px-2 py-1 rounded">Scarica</a>
        </div>
    )
}