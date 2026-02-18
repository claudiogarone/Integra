'use client'

import { createClient } from '../../../utils/supabase/client'
import { useEffect, useState, useRef } from 'react'

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'billing' | 'integrations'>('profile')
  
  // URL Dinamico
  const [publicBaseUrl, setPublicBaseUrl] = useState('')

  const [formData, setFormData] = useState({
    company_name: '', company_email: '', whatsapp_number: '', p_iva: '',
    address: '', logo_url: '', plan: 'Base'
  })

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    // Calcola l'URL base automaticamente dal browser
    if (typeof window !== 'undefined') {
        setPublicBaseUrl(window.location.origin)
    }

    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        
        if (data) {
          setFormData({
            company_name: data.company_name || '',
            company_email: data.company_email || user.email || '',
            whatsapp_number: data.whatsapp_number || '',
            p_iva: data.p_iva || '',
            address: data.address || '',
            logo_url: data.logo_url || '',
            plan: data.plan || 'Base'
          })
          if(data.logo_url) setLogoPreview(data.logo_url)
        }
      }
      setLoading(false)
    }
    getData()
  }, [])

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]; if (!file || !user) return
      setLogoPreview(URL.createObjectURL(file)); setSaving(true)
      const fileName = `logo_${user.id}.${file.name.split('.').pop()}`
      const { error } = await supabase.storage.from('products').upload(fileName, file, { upsert: true })
      if (!error) {
          const { data } = supabase.storage.from('products').getPublicUrl(fileName)
          setFormData(prev => ({ ...prev, logo_url: data.publicUrl }))
      } else { alert("Errore upload: " + error.message) }
      setSaving(false)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    const { error } = await supabase.from('profiles').update({
        company_name: formData.company_name, company_email: formData.company_email,
        whatsapp_number: formData.whatsapp_number, p_iva: formData.p_iva,
        address: formData.address, logo_url: formData.logo_url
    }).eq('id', user.id)
    
    if (!error) alert('✅ Impostazioni salvate!')
    else alert('Errore: ' + error.message)
    setSaving(false)
  }

  if (loading) return <div className="p-10 text-[#00665E] animate-pulse">Caricamento impostazioni...</div>

  return (
    <main className="flex-1 p-8 overflow-auto bg-[#F8FAFC] text-gray-900 font-sans">
      <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-black text-[#00665E]">Impostazioni</h1>
            <p className="text-gray-500 text-sm mt-1">Gestisci profilo e abbonamento.</p>
          </div>
          <div className={`px-4 py-2 rounded-xl font-bold text-sm border ${formData.plan === 'Base' ? 'bg-gray-100 text-gray-500 border-gray-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
              Piano {formData.plan}
          </div>
      </div>

      <div className="flex gap-1 bg-white p-1 rounded-xl border border-gray-200 w-fit mb-8 shadow-sm">
          <button onClick={() => setActiveTab('profile')} className={`px-6 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'profile' ? 'bg-[#00665E] text-white shadow' : 'text-gray-500 hover:bg-gray-50'}`}>🏢 Profilo Azienda</button>
          <button onClick={() => setActiveTab('billing')} className={`px-6 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'billing' ? 'bg-[#00665E] text-white shadow' : 'text-gray-500 hover:bg-gray-50'}`}>💳 Piano & Limiti</button>
          <button onClick={() => setActiveTab('integrations')} className={`px-6 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'integrations' ? 'bg-[#00665E] text-white shadow' : 'text-gray-500 hover:bg-gray-50'}`}>🔌 Integrazioni</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLONNA SINISTRA */}
        <div className="lg:col-span-2 space-y-6">
          
          {activeTab === 'profile' && (
              <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Dati Attività</h2>
                <form onSubmit={handleSave} className="space-y-6">
                    <div className="flex items-center gap-6">
                        <div onClick={() => fileInputRef.current?.click()} className="w-24 h-24 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-[#00665E] bg-gray-50 overflow-hidden">
                            {logoPreview ? <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" /> : <span className="text-xs text-gray-400">Carica Logo</span>}
                        </div>
                        <div>
                            <p className="font-bold text-gray-700">Logo Aziendale</p>
                            <button type="button" onClick={() => fileInputRef.current?.click()} className="text-[#00665E] text-sm font-bold hover:underline">Scegli file...</button>
                            <input type="file" ref={fileInputRef} onChange={handleLogoUpload} accept="image/*" className="hidden" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div><label className="text-xs font-bold text-gray-500 uppercase">Nome Azienda</label><input className="w-full bg-gray-50 border p-3 rounded-xl mt-1" value={formData.company_name} onChange={e => setFormData({...formData, company_name: e.target.value})} /></div>
                        <div><label className="text-xs font-bold text-gray-500 uppercase">Email Pubblica</label><input type="email" className="w-full bg-gray-50 border p-3 rounded-xl mt-1" value={formData.company_email} onChange={e => setFormData({...formData, company_email: e.target.value})} /></div>
                        <div><label className="text-xs font-bold text-gray-500 uppercase">WhatsApp</label><input className="w-full bg-gray-50 border p-3 rounded-xl mt-1" value={formData.whatsapp_number} onChange={e => setFormData({...formData, whatsapp_number: e.target.value})} /></div>
                        <div><label className="text-xs font-bold text-gray-500 uppercase">P.IVA</label><input className="w-full bg-gray-50 border p-3 rounded-xl mt-1" value={formData.p_iva} onChange={e => setFormData({...formData, p_iva: e.target.value})} /></div>
                        <div className="md:col-span-2"><label className="text-xs font-bold text-gray-500 uppercase">Indirizzo</label><input className="w-full bg-gray-50 border p-3 rounded-xl mt-1" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} /></div>
                    </div>
                    <button type="submit" disabled={saving} className="bg-[#00665E] text-white font-bold py-3 px-8 rounded-xl w-full md:w-auto">{saving ? 'Salvataggio...' : 'Salva Modifiche'}</button>
                </form>
              </div>
          )}

          {activeTab === 'billing' && (
              <div className="space-y-6">
                  <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-10 text-9xl">💎</div>
                      <h3 className="text-lg font-bold text-gray-900">Il tuo piano: <span className="text-[#00665E]">{formData.plan}</span></h3>
                      <p className="text-gray-500 text-sm mb-6">Ecco cosa include il tuo abbonamento.</p>

                      <div className="space-y-6 max-w-lg">
                          <LimitBar label="Prodotti Vetrina" used={3} max={10} color="bg-[#00665E]" />
                          <LimitBar label="Email Marketing / Mese" used={120} max={3000} color="bg-blue-600" />
                          <LimitBar label="Spazio Archiviazione (MB)" used={50} max={500} color="bg-orange-500" />
                          <LimitBar label="Crediti AI / Mese" used={5} max={50} color="bg-purple-600" />
                      </div>
                      
                      <div className="mt-8 pt-6 border-t border-gray-100">
                          <p className="text-xs text-gray-400 mb-2">Vuoi di più? Passa a Enterprise.</p>
                          <button className="text-[#00665E] font-bold text-sm border border-[#00665E] px-4 py-2 rounded-lg hover:bg-[#00665E] hover:text-white transition">Fai Upgrade</button>
                      </div>
                  </div>
              </div>
          )}

          {/* TAB INTEGRATIONS: Mantieni quello che hai, va bene */}
        </div>

        {/* COLONNA DESTRA (Link Pubblici) */}
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-4 text-sm">I Tuoi Link Pubblici</h3>
                <div className="space-y-4">
                    <div className="text-xs">
                        <span className="block text-gray-400 uppercase font-bold text-[10px] mb-1">🛒 Vetrina Digitale</span>
                        <div className="bg-gray-50 p-2 rounded border border-gray-200 break-all">
                             <a href={`${publicBaseUrl}/shop/${user?.id}`} target="_blank" className="text-blue-600 hover:underline font-mono">
                                {publicBaseUrl}/shop/{user?.id?.slice(0,5)}...
                             </a>
                        </div>
                    </div>
                    <div className="text-xs">
                        <span className="block text-gray-400 uppercase font-bold text-[10px] mb-1">📅 Prenotazioni Online</span>
                        <div className="bg-gray-50 p-2 rounded border border-gray-200 break-all">
                             <a href={`${publicBaseUrl}/book/${user?.id}`} target="_blank" className="text-blue-600 hover:underline font-mono">
                                {publicBaseUrl}/book/{user?.id?.slice(0,5)}...
                             </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>

      </div>
    </main>
  )
}

function LimitBar({label, used, max, color}: any) {
    const perc = Math.min((used/max)*100, 100);
    return (
        <div>
            <div className="flex justify-between text-xs font-bold text-gray-500 mb-1">
                <span>{label}</span> <span>{used} / {max}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{width: `${perc}%`}}></div>
            </div>
        </div>
    )
}