'use client'

import { createClient } from '../../../utils/supabase/client'
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link' // Importiamo Link per la navigazione

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'billing' | 'integrations'>('profile')
  
  // Dati del modulo (Aggiunto company_email)
  const [formData, setFormData] = useState({
    company_name: '',
    company_email: '', // NUOVO
    whatsapp_number: '',
    p_iva: '',
    address: '',
    logo_url: '',
    plan: 'Base'
  })

  // Per upload logo
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  const supabase = createClient()

  // Base URL per i link pubblici (usa il tuo dominio reale)
  const publicBaseUrl = 'https://integra-theta.vercel.app' 

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        if (data) {
          setFormData({
            company_name: data.company_name || '',
            company_email: data.company_email || user.email || '', // Fallback su email login se manca
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
  }, [supabase])

  // Gestione Upload Logo
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file || !user) return

      setLogoPreview(URL.createObjectURL(file))
      setSaving(true)

      const fileExt = file.name.split('.').pop()
      const fileName = `logo_${user.id}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('products') 
        .upload(fileName, file, { upsert: true })

      if (uploadError) {
          alert("Errore upload logo: " + uploadError.message)
          setSaving(false)
          return
      }

      const { data: urlData } = supabase.storage.from('products').getPublicUrl(fileName)
      setFormData(prev => ({ ...prev, logo_url: urlData.publicUrl }))
      setSaving(false)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const { error } = await supabase
      .from('profiles')
      .update({
        company_name: formData.company_name,
        company_email: formData.company_email, // SALVIAMO LA NUOVA EMAIL
        whatsapp_number: formData.whatsapp_number,
        p_iva: formData.p_iva,
        address: formData.address,
        logo_url: formData.logo_url
      })
      .eq('id', user.id)

    if (!error) {
      alert('✅ Impostazioni salvate con successo!')
    } else {
      alert('Errore: ' + error.message)
    }
    setSaving(false)
  }

  if (loading) return <div className="p-10 text-[#00665E] animate-pulse">Caricamento impostazioni...</div>

  return (
    <main className="flex-1 p-8 overflow-auto bg-[#F8FAFC] text-gray-900 font-sans">
      <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-black text-[#00665E] tracking-tight">Impostazioni</h1>
            <p className="text-gray-500 text-sm mt-1">Gestisci profilo aziendale e abbonamento.</p>
          </div>
          {/* Badge Piano Attuale */}
          <div className={`px-4 py-2 rounded-xl font-bold text-sm border ${
              formData.plan === 'Base' ? 'bg-gray-100 text-gray-500 border-gray-200' : 
              formData.plan === 'Enterprise' ? 'bg-purple-50 text-purple-700 border-purple-200' :
              'bg-amber-50 text-amber-700 border-amber-200'
          }`}>
              Piano {formData.plan}
          </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex gap-1 bg-white p-1 rounded-xl border border-gray-200 w-fit mb-8 shadow-sm">
          <button onClick={() => setActiveTab('profile')} className={`px-6 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'profile' ? 'bg-[#00665E] text-white shadow' : 'text-gray-500 hover:bg-gray-50'}`}>🏢 Profilo Azienda</button>
          <button onClick={() => setActiveTab('billing')} className={`px-6 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'billing' ? 'bg-[#00665E] text-white shadow' : 'text-gray-500 hover:bg-gray-50'}`}>💳 Piano & Limiti</button>
          <button onClick={() => setActiveTab('integrations')} className={`px-6 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'integrations' ? 'bg-[#00665E] text-white shadow' : 'text-gray-500 hover:bg-gray-50'}`}>🔌 Integrazioni</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLONNA SINISTRA (Contenuto Principale) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* --- TAB: PROFILO --- */}
          {activeTab === 'profile' && (
              <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">Dati Attività</h2>
                
                <form onSubmit={handleSave} className="space-y-6">
                    
                    {/* Upload Logo */}
                    <div className="flex items-center gap-6">
                        <div onClick={() => fileInputRef.current?.click()} className="w-24 h-24 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-[#00665E] hover:bg-[#00665E]/5 transition overflow-hidden bg-gray-50">
                            {logoPreview ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-gray-400 text-xs text-center px-2">Carica Logo</span>
                            )}
                        </div>
                        <div>
                            <p className="font-bold text-gray-700">Logo Aziendale</p>
                            <p className="text-xs text-gray-400 mb-2">Apparirà su preventivi e fatture PDF.</p>
                            <button type="button" onClick={() => fileInputRef.current?.click()} className="text-[#00665E] text-sm font-bold hover:underline">Scegli file...</button>
                            <input type="file" ref={fileInputRef} onChange={handleLogoUpload} accept="image/*" className="hidden" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Nome Azienda</label>
                            <input type="text" value={formData.company_name} onChange={e => setFormData({...formData, company_name: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 mt-1 outline-none focus:border-[#00665E]" placeholder="Es. Pastaorosa SRL" />
                        </div>
                        {/* CAMPO EMAIL AGGIUNTO */}
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Email Pubblica</label>
                            <input type="email" value={formData.company_email} onChange={e => setFormData({...formData, company_email: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 mt-1 outline-none focus:border-[#00665E]" placeholder="info@azienda.it" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">WhatsApp (No +)</label>
                            <input type="text" value={formData.whatsapp_number} onChange={e => setFormData({...formData, whatsapp_number: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 mt-1 outline-none focus:border-[#00665E]" placeholder="39333..." />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Partita IVA</label>
                            <input type="text" value={formData.p_iva} onChange={e => setFormData({...formData, p_iva: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 mt-1 outline-none focus:border-[#00665E]" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">Indirizzo Sede</label>
                            <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 mt-1 outline-none focus:border-[#00665E]" />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                        <button type="submit" disabled={saving} className="bg-[#00665E] hover:bg-[#004d46] text-white font-bold py-3 px-8 rounded-xl transition shadow-lg shadow-[#00665E]/20">
                            {saving ? 'Salvataggio...' : 'Salva Modifiche'}
                        </button>
                    </div>
                </form>
              </div>
          )}

          {/* --- TAB: PIANO & FATTURAZIONE --- */}
          {activeTab === 'billing' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-10">
                          <span className="text-9xl">💎</span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">Il tuo piano: <span className="text-[#00665E]">{formData.plan}</span></h3>
                      <p className="text-gray-500 text-sm mb-6">Limiti attuali e stato abbonamento.</p>

                      <div className="space-y-4 max-w-md">
                          <div>
                              <div className="flex justify-between text-xs font-bold text-gray-500 mb-1"><span>Prodotti Vetrina</span> <span>{formData.plan === 'Base' ? '10 Max' : '150 Max'}</span></div>
                              <div className="w-full bg-gray-100 rounded-full h-2"><div className={`bg-[#00665E] h-2 rounded-full ${formData.plan === 'Base' ? 'w-[70%]' : 'w-[20%]'}`}></div></div>
                          </div>
                      </div>
                  </div>
              </div>
          )}

          {/* --- TAB: INTEGRAZIONI --- */}
          {activeTab === 'integrations' && (
             <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Stato Connessioni</h2>
                
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-xl shadow-sm">🧠</div>
                            <div>
                                <h4 className="font-bold text-gray-900">Claude AI / Vision</h4>
                                <p className="text-xs text-green-600 font-bold">● Connesso e Operativo</p>
                            </div>
                        </div>
                        <button className="text-gray-400 text-xs font-bold" disabled>Attivo</button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-xl shadow-sm">📅</div>
                            <div>
                                <h4 className="font-bold text-gray-900">Calendari Esterni</h4>
                                <p className="text-xs text-gray-400">Google, Outlook, Apple</p>
                            </div>
                        </div>
                        {/* ORA QUESTO LINK PORTA ALL'AGENDA */}
                        <Link href="/dashboard/agenda" className="text-[#00665E] text-xs font-bold hover:underline bg-[#00665E]/10 px-3 py-1.5 rounded-lg">
                             Gestisci in Agenda
                        </Link>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-xl shadow-sm">💬</div>
                            <div>
                                <h4 className="font-bold text-gray-900">WhatsApp Business</h4>
                                <p className="text-xs text-gray-400">{formData.whatsapp_number ? '✅ Configurato' : '⚠️ Non collegato'}</p>
                            </div>
                        </div>
                        {/* Questo porta correttamente al tab Profilo */}
                        <button onClick={() => setActiveTab('profile')} className="text-[#00665E] text-xs font-bold hover:underline">
                            Modifica
                        </button>
                    </div>
                </div>
             </div>
          )}

        </div>

        {/* COLONNA DESTRA (Info Rapide - Link Aggiornati) */}
        <div className="space-y-6">
            <div className="bg-[#00665E]/5 p-6 rounded-2xl border border-[#00665E]/10">
                <h3 className="font-bold text-[#00665E] mb-2 text-sm">💡 Consiglio</h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                    Carica il logo e imposta l'email corretta: appariranno automaticamente nell'intestazione dei tuoi Preventivi PDF.
                </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-4 text-sm">I Tuoi Link Pubblici</h3>
                <div className="space-y-4">
                    <div className="text-xs">
                        <span className="block text-gray-400 uppercase font-bold text-[10px] mb-1">🛒 Vetrina Digitale</span>
                        <div className="bg-gray-50 p-2 rounded border border-gray-200 break-all">
                             <a href={`${publicBaseUrl}/shop/${user?.id}`} target="_blank" className="text-blue-600 hover:underline">
                                {publicBaseUrl}/shop/{user?.id?.slice(0,8)}...
                             </a>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1">Invia questo link ai clienti per vendere.</p>
                    </div>
                    
                    <div className="text-xs">
                        <span className="block text-gray-400 uppercase font-bold text-[10px] mb-1">📅 Prenotazioni Online</span>
                        <div className="bg-gray-50 p-2 rounded border border-gray-200 break-all">
                             <a href={`${publicBaseUrl}/book/${user?.id}`} target="_blank" className="text-blue-600 hover:underline">
                                {publicBaseUrl}/book/{user?.id?.slice(0,8)}...
                             </a>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1">Link diretto per prendere appuntamenti.</p>
                    </div>
                </div>
            </div>
        </div>

      </div>
    </main>
  )
}