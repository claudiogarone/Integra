'use client'

import { createClient } from '../../../utils/supabase/client'
import { useEffect, useState, useRef } from 'react'
import { toPng } from 'html-to-image'

export default function LaunchpadPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  
  const [user, setUser] = useState<any>(null)
  const [userData, setUserData] = useState<any>({})
  const [activeTab, setActiveTab] = useState<'preview' | 'qr'>('preview')
  
  // Ref per il volantino da stampare
  const flyerRef = useRef<HTMLDivElement>(null)

  // Dati Social
  const [links, setLinks] = useState({
    facebook: '',
    instagram: '',
    tiktok: '',
    google: '',
    whatsapp: ''
  })

  const supabase = createClient()

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        const { data } = await supabase
          .from('profiles')
          .select('facebook_link, instagram_link, tiktok_link, google_review_link, company_name, whatsapp_number, plan, logo_url')
          .eq('id', user.id)
          .single()
        
        if (data) {
          setUserData(data) // Salviamo tutto il profilo per piano e logo
          setLinks({
            facebook: data.facebook_link || '',
            instagram: data.instagram_link || '',
            tiktok: data.tiktok_link || '',
            google: data.google_review_link || '',
            whatsapp: data.whatsapp_number || ''
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

    if (!error) {
        const btn = document.getElementById('saveBtn')
        if(btn) { btn.innerText = '✅ Salvato!'; setTimeout(() => btn.innerText = '💾 Salva Modifiche', 2000) }
    } else {
        alert('Errore: ' + error.message)
    }
    setSaving(false)
  }

  // Genera l'immagine del volantino
  const downloadFlyer = async () => {
    if (flyerRef.current === null) return
    setGenerating(true)

    try {
      const dataUrl = await toPng(flyerRef.current, { cacheBust: true, pixelRatio: 3 }) // Alta qualità
      const link = document.createElement('a')
      link.download = `kit-marketing-${userData.company_name || 'integra'}.png`
      link.href = dataUrl
      link.click()
    } catch (err) {
      console.error(err)
      alert("Errore nella generazione. Riprova.")
    } finally {
      setGenerating(false)
    }
  }

  // Link Unico (per ora usiamo il link recensioni o un social come fallback per il QR principale)
  // In futuro qui andrà il link alla pagina "Link-in-Bio" generata da te
  const mainQrLink = `https://integra-theta.vercel.app/shop/${user?.id}` // Esempio link vetrina
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(mainQrLink)}`

  const getQR = (url: string) => {
    if (!url) return null
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(url)}`
  }

  if (loading) return <div className="p-10 text-[#00665E] animate-pulse">Caricamento Launchpad...</div>

  return (
    <main className="flex-1 p-8 overflow-auto bg-[#F8FAFC] text-gray-900 font-sans relative">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2">
             <h1 className="text-3xl font-black text-[#00665E] tracking-tight">Launchpad Social 🚀</h1>
             <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded ${userData.plan === 'Base' ? 'bg-gray-200 text-gray-500' : 'bg-purple-100 text-purple-600'}`}>
                Piano {userData.plan}
             </span>
          </div>
          <p className="text-gray-500 text-sm mt-1">Centralizza la tua presenza digitale e stampa il materiale POP.</p>
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
                        <div className="absolute left-3 top-3.5 text-lg opacity-50">📘</div>
                        <input type="url" value={links.facebook} onChange={e => setLinks({...links, facebook: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-blue-500" placeholder="Link Pagina Facebook" />
                    </div>
                    <div className="relative group">
                        <div className="absolute left-3 top-3.5 text-lg opacity-50">📸</div>
                        <input type="url" value={links.instagram} onChange={e => setLinks({...links, instagram: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-pink-500" placeholder="Link Profilo Instagram" />
                    </div>
                    <div className="relative group">
                        <div className="absolute left-3 top-3.5 text-lg opacity-50">🎵</div>
                        <input type="url" value={links.tiktok} onChange={e => setLinks({...links, tiktok: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-black" placeholder="Link Profilo TikTok" />
                    </div>
                    <div className="relative group">
                        <div className="absolute left-3 top-3.5 text-lg opacity-50">⭐</div>
                        <input type="url" value={links.google} onChange={e => setLinks({...links, google: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-yellow-500" placeholder="Link Recensioni Google" />
                    </div>

                    <button id="saveBtn" type="submit" disabled={saving} className="w-full bg-[#00665E] hover:bg-[#004d46] text-white font-bold py-3 rounded-xl mt-2 transition shadow-lg shadow-[#00665E]/20">
                    {saving ? 'Salvataggio...' : '💾 Salva Modifiche'}
                    </button>
                </form>
            </div>

            {/* DOWNLOAD KIT CARD */}
            <div className={`rounded-3xl p-6 relative overflow-hidden group transition ${userData.plan === 'Base' ? 'bg-gray-100 border border-gray-300' : 'bg-gradient-to-r from-slate-800 to-slate-900 text-white'}`}>
                {userData.plan !== 'Base' && <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl"></div>}
                
                <div className="relative z-10">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className={`text-lg font-bold mb-1 ${userData.plan === 'Base' ? 'text-gray-800' : 'text-white'}`}>🖨️ Kit Marketing da Banco</h3>
                            <p className={`text-xs mb-4 max-w-[80%] ${userData.plan === 'Base' ? 'text-gray-500' : 'text-slate-300'}`}>
                                {userData.plan === 'Base' ? 'Versione Basic in B/N. Passa a Enterprise per il design a colori con logo.' : 'Design Premium a colori con il tuo logo pronto per la stampa.'}
                            </p>
                        </div>
                        <div className="text-3xl">🖼️</div>
                    </div>
                    
                    <button onClick={downloadFlyer} disabled={generating} className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${userData.plan === 'Base' ? 'bg-black text-white hover:bg-gray-800' : 'bg-white text-slate-900 hover:bg-slate-100'}`}>
                        {generating ? 'Generazione...' : 'Scarica Design PNG'}
                    </button>
                </div>
            </div>
        </div>

        {/* COLONNA DX: ANTEPRIMA TELEFONO / QR */}
        <div className="flex justify-center h-full">
            {activeTab === 'preview' ? (
                // MOCKUP TELEFONO
                <div className="relative w-[300px] h-[600px] bg-gray-900 rounded-[3rem] border-[8px] border-gray-900 shadow-2xl overflow-hidden flex flex-col">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-900 rounded-b-xl z-20"></div>
                    <div className="flex-1 bg-white overflow-y-auto pt-12 pb-8 px-6 flex flex-col items-center">
                        <div className="w-20 h-20 bg-gray-100 rounded-full mb-4 border-2 border-white shadow-md flex items-center justify-center overflow-hidden">
                            {userData.logo_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={userData.logo_url} alt="Logo" className="w-full h-full object-cover"/>
                            ) : ( <span className="text-2xl">🏢</span> )}
                        </div>
                        <h3 className="font-bold text-gray-900 text-lg text-center leading-tight">{userData.company_name || 'La Tua Azienda'}</h3>
                        <div className="w-full space-y-3 mt-6">
                            {links.whatsapp && <div className="w-full bg-green-500 text-white py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold shadow-sm"><span>💬</span> WhatsApp</div>}
                            {links.google && <div className="w-full bg-white border border-gray-200 text-gray-700 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold shadow-sm"><span>⭐</span> Lascia Recensione</div>}
                            {links.instagram && <div className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold shadow-sm"><span>📸</span> Instagram</div>}
                            {links.facebook && <div className="w-full bg-[#1877F2] text-white py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold shadow-sm"><span>📘</span> Facebook</div>}
                        </div>
                    </div>
                </div>
            ) : (
                // GRIGLIA QR
                <div className="w-full bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
                    <h3 className="font-bold text-gray-900 mb-4">I tuoi QR Code Singoli</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {links.facebook && <QRCodeCard url={links.facebook} icon="📘" label="Facebook" color="text-blue-600" />}
                        {links.instagram && <QRCodeCard url={links.instagram} icon="📸" label="Instagram" color="text-pink-600" />}
                        {links.tiktok && <QRCodeCard url={links.tiktok} icon="🎵" label="TikTok" color="text-black" />}
                        {links.google && <QRCodeCard url={links.google} icon="⭐" label="Google" color="text-yellow-600" />}
                    </div>
                </div>
            )}
        </div>

      </div>

      {/* --- ELEMENTO NASCOSTO: VOLANTINO DA STAMPARE --- */}
      {/* Viene posizionato fuori schermo ma renderizzato per html-to-image */}
      <div style={{ position: 'fixed', left: '-9999px', top: 0 }}>
          <div ref={flyerRef} className="w-[500px] h-[700px] flex flex-col items-center justify-between p-12 text-center"
               style={{ 
                   backgroundColor: userData.plan === 'Base' ? '#ffffff' : '#00665E', 
                   color: userData.plan === 'Base' ? '#000000' : '#ffffff',
                   border: userData.plan === 'Base' ? '10px solid #000000' : 'none'
               }}>
              
              <div className="mt-8">
                  {userData.plan !== 'Base' && userData.logo_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={userData.logo_url} alt="Logo" className="w-32 h-32 object-contain mx-auto mb-6 bg-white rounded-full p-2" />
                  )}
                  <h1 className="text-4xl font-black uppercase tracking-wider mb-2">
                      {userData.company_name || 'Seguici Ora'}
                  </h1>
                  <p className={`text-xl font-medium ${userData.plan === 'Base' ? 'text-gray-600' : 'text-teal-100'}`}>
                      {userData.plan === 'Base' ? 'Scansiona per connetterti' : 'Scopri le nostre novità esclusive'}
                  </p>
              </div>

              <div className="bg-white p-6 rounded-3xl shadow-2xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrCodeUrl} alt="QR Code" className="w-64 h-64 mix-blend-multiply" />
              </div>

              <div className="mb-8">
                  <p className="text-lg font-bold mb-2">INQUADRA IL CODICE</p>
                  <div className="flex justify-center gap-4 text-3xl opacity-80">
                      <span>📸</span>
                      <span>💬</span>
                      <span>⭐</span>
                  </div>
              </div>

              {userData.plan !== 'Base' && (
                  <div className="absolute bottom-4 text-[10px] text-white/50">
                      Powered by Integra OS
                  </div>
              )}
          </div>
      </div>

    </main>
  )
}

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