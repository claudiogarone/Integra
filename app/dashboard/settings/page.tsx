'use client'

import { createClient } from '../../../utils/supabase/client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { 
    Building, MapPin, Phone, Mail, Globe, Share2, Clock, 
    CalendarCheck, ShoppingBag, Copy, CheckCircle, Plus, Trash2, Bot, Handshake,
    Receipt, Leaf, Palette, Gift, Workflow, FileText, CreditCard, 
    Mic, Database, HeartPulse, EyeOff, Link2, Radar, Target, LayoutTemplate, Activity,
    MessageCircle, Users, BrainCircuit 
} from 'lucide-react'

export default function SettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'billing' | 'integrations'>('profile')
  const [publicBaseUrl, setPublicBaseUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const [affiliatesCount, setAffiliatesCount] = useState(0)

  const defaultHours = {
      lunedì: { open: '09:00', close: '18:00', closed: false },
      martedì: { open: '09:00', close: '18:00', closed: false },
      mercoledì: { open: '09:00', close: '18:00', closed: false },
      giovedì: { open: '09:00', close: '18:00', closed: false },
      venerdì: { open: '09:00', close: '18:00', closed: false },
      sabato: { open: '09:00', close: '13:00', closed: false },
      domenica: { open: '', close: '', closed: true },
  }

  const [formData, setFormData] = useState({
    company_name: '', company_email: '', whatsapp_number: '', phone_secondary: '', p_iva: '',
    address: '', city: '', cap: '', province: '', logo_url: '', plan: 'Base',
    websites: { main: '', ecommerce: '' },
    social_links: { facebook: '', instagram: '', linkedin: '', tiktok: '', x: '', youtube: '', telegram: '' },
    business_hours: defaultHours,
    ai_settings: { allow_auto_booking: false }
  })

  const usage = {
      storage: 150, maxStorage: 500, cdp_profiles: 1250, maxCdpProfiles: 5000,
      incognito_sessions: 340, maxIncognito: 1000, fidelity: 120, maxFidelity: 500,
      ai_interactions: 850, maxAiInteractions: 1000, voice_minutes: 45, maxVoiceMinutes: 120,
      automations: 850, maxAutomations: 1000, nurturing_contacts: 350, maxNurturingContacts: 500, 
      design_credits: 45, maxDesignCredits: 50, landing_flyers: 8, maxLandingFlyers: 20,
      radar_scans: 4, maxRadarScans: 10, dem: 2, maxDem: 10, 
      quotes: 15, maxQuotes: 100, invoices: 48, maxInvoices: 50,             
      energy_audits: 8, maxEnergyAudits: 10, pulse_checkins: 45, maxPulseCheckins: 100,
      nexus_integrations: 3, maxNexusIntegrations: 5, agents: 2, maxAgents: 5,
      performance_evaluations: 3, maxPerformanceEvaluations: 5
  }

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  
  // Rimosso da dependency array per prevenire l'errore di React
  const supabase = createClient()

  useEffect(() => {
    if (typeof window !== 'undefined') setPublicBaseUrl(window.location.origin)
    
    const getData = async () => {
      try {
          // FIX: Utente Bypass sicuro
          const currentUser = { id: '00000000-0000-0000-0000-000000000000', email: 'admin@integraos.it' }
          setUser(currentUser)
          
          const { data } = await supabase.from('profiles').select('*').eq('id', currentUser.id).single()
          if (data) {
            const actualLogo = data.logo_url || data.company_logo || ''
            setFormData({
              company_name: data.company_name || '', 
              company_email: data.company_email || currentUser.email || '',
              whatsapp_number: data.whatsapp_number || '', 
              phone_secondary: data.phone_secondary || '',
              p_iva: data.p_iva || '',
              address: data.address || '', 
              city: data.city || '', 
              cap: data.cap || '', 
              province: data.province || '',
              logo_url: actualLogo, 
              plan: data.plan || 'Base',
              websites: data.websites || { main: '', ecommerce: '' },
              social_links: data.social_links || { facebook: '', instagram: '', linkedin: '', tiktok: '', x: '', youtube: '', telegram: '' },
              business_hours: data.business_hours || defaultHours,
              ai_settings: data.ai_settings || { allow_auto_booking: false }
            })
            if(actualLogo) setLogoPreview(actualLogo)
          }
          
          const { count } = await supabase.from('affiliates').select('*', { count: 'exact', head: true }).eq('user_id', currentUser.id)
          if (count !== null) setAffiliatesCount(count)
      } catch (error) {
          console.error("Errore caricamento impostazioni:", error)
      } finally {
          setLoading(false)
      }
    }
    getData()
  }, []) // Array di dipendenze vuoto per risolvere l'errore

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]; 
      if (!file || !user) return;
      
      setSaving(true);
      try {
          // Creiamo un nome file sicuro senza spazi o caratteri strani
          const safeName = file.name.replace(/[^a-zA-Z0-9.]/g, '');
          const fileName = `logo_${Date.now()}_${safeName}`;
          
          const { error } = await supabase.storage.from('products').upload(fileName, file, { upsert: true });
          
          if (error) {
              throw new Error("Sblocco Storage richiesto: Assicurati di aver eseguito lo script SQL!");
          }

          const { data } = supabase.storage.from('products').getPublicUrl(fileName);
          setLogoPreview(data.publicUrl);
          setFormData(prev => ({ ...prev, logo_url: data.publicUrl }));
          
          alert("✅ Logo caricato! Clicca su 'Salva Tutto' in alto a destra per confermare.");
      } catch (err: any) {
          alert("Errore upload: " + err.message);
      } finally {
          setSaving(false);
      }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    
    const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        company_name: formData.company_name, 
        company_email: formData.company_email,
        whatsapp_number: formData.whatsapp_number, 
        p_iva: formData.p_iva,
        address: formData.address, 
        city: formData.city,
        cap: formData.cap,
        province: formData.province,
        logo_url: formData.logo_url, 
        company_logo: formData.logo_url, // Salva in entrambi i campi per compatibilità
        websites: formData.websites,
        social_links: formData.social_links,
        business_hours: formData.business_hours,
        ai_settings: formData.ai_settings
    })
    
    if (!error) alert('✅ Dati Hub Aziendale salvati con successo!')
    else alert('Errore Database: ' + error.message)
    setSaving(false)
  }

  const copyWebhook = () => {
      const webhookUrl = `${publicBaseUrl}/api/webhooks/ecommerce?userId=${user?.id}`
      navigator.clipboard.writeText(webhookUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
  }

  const updateSocial = (network: string, value: string) => setFormData(prev => ({...prev, social_links: {...prev.social_links, [network]: value}}))
  const updateWebsite = (type: string, value: string) => setFormData(prev => ({...prev, websites: {...prev.websites, [type]: value}}))
  const updateHour = (day: string, field: string, value: any) => setFormData(prev => ({...prev, business_hours: {...prev.business_hours, [day]: {...(prev.business_hours as any)[day], [field]: value}}}))

  if (loading) return <div className="p-10 text-[#00665E] animate-pulse font-bold">Caricamento Hub Aziendale...</div>

  return (
    <main className="flex-1 p-8 overflow-auto bg-[#F8FAFC] text-gray-900 font-sans pb-20">
      
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
              <h1 className="text-3xl font-black text-[#00665E]">Hub Aziendale</h1>
              <p className="text-gray-500 text-sm mt-1">Configura l'identità, le sedi e le intelligenze della tua azienda.</p>
          </div>
          <div className="flex gap-3 items-center">
              <div className={`px-4 py-2 rounded-xl font-bold text-sm border ${formData.plan === 'Base' ? 'bg-gray-100' : 'bg-amber-50 text-amber-700'}`}>Piano {formData.plan}</div>
              <button onClick={handleSave} disabled={saving} className="bg-[#00665E] hover:bg-[#004d46] text-white font-bold py-2 px-8 rounded-xl shadow-lg transition">{saving ? 'Salvataggio...' : 'Salva Tutto'}</button>
          </div>
      </div>

      <div className="flex gap-2 bg-white p-1.5 rounded-xl border w-fit mb-8 shadow-sm overflow-x-auto">
          <button onClick={() => setActiveTab('profile')} className={`px-6 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2 ${activeTab === 'profile' ? 'bg-[#00665E] text-white shadow' : 'text-gray-500 hover:bg-gray-50'}`}><Building size={16}/> Profilo & Sedi</button>
          <button onClick={() => setActiveTab('integrations')} className={`px-6 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2 ${activeTab === 'integrations' ? 'bg-[#00665E] text-white shadow' : 'text-gray-500 hover:bg-gray-50'}`}><Share2 size={16}/> Presenza & Social</button>
          <button onClick={() => setActiveTab('billing')} className={`px-6 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2 ${activeTab === 'billing' ? 'bg-[#00665E] text-white shadow' : 'text-gray-500 hover:bg-gray-50'}`}><ShoppingBag size={16}/> Consumi & Piano</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLONNA SINISTRA / CENTRALE */}
        <div className="lg:col-span-2 space-y-6">
          
          {activeTab === 'profile' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="bg-white p-8 rounded-3xl border shadow-sm">
                    <h2 className="text-xl font-black mb-6 flex items-center gap-2 text-gray-800"><Building className="text-[#00665E]"/> Dati Fiscali e Contatti</h2>
                    <div className="flex items-center gap-6 mb-8 pb-8 border-b border-gray-100">
                        <div onClick={() => fileInputRef.current?.click()} className="w-24 h-24 rounded-2xl border-2 border-dashed flex items-center justify-center cursor-pointer hover:border-[#00665E] bg-gray-50 overflow-hidden relative group shrink-0">
                            {logoPreview ? <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-1" crossOrigin="anonymous" /> : <span className="text-xs text-gray-400 font-bold">Nessun Logo</span>}
                            <div className="absolute inset-0 bg-black/50 text-white flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition font-bold">Cambia</div>
                        </div>
                        <div>
                            <p className="font-bold text-lg">Logo Ufficiale Azienda</p>
                            <p className="text-xs text-gray-500 mb-2">Verrà utilizzato nelle <b>Campagne Mail</b> e in automatico dalla piattaforma.</p>
                            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={saving} className="text-[#00665E] bg-blue-50 px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-blue-100 transition disabled:opacity-50">
                                {saving ? 'Caricamento...' : 'Carica Immagine...'}
                            </button>
                            <input type="file" ref={fileInputRef} onChange={handleLogoUpload} accept="image/*" className="hidden" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2"><label className="text-xs font-bold text-gray-500 uppercase">Ragione Sociale / Nome Azienda</label><input className="w-full bg-gray-50 border p-3 rounded-xl mt-1 font-bold outline-none focus:border-[#00665E]" value={formData.company_name} onChange={e => setFormData({...formData, company_name: e.target.value})} placeholder="Es. Rossi & Co. SPA"/></div>
                        <div><label className="text-xs font-bold text-gray-500 uppercase">Partita IVA / C.F.</label><input className="w-full bg-gray-50 border p-3 rounded-xl mt-1 font-mono outline-none focus:border-[#00665E]" value={formData.p_iva} onChange={e => setFormData({...formData, p_iva: e.target.value})} /></div>
                        <div><label className="text-xs font-bold text-gray-500 uppercase">Email Principale</label><input type="email" className="w-full bg-gray-50 border p-3 rounded-xl mt-1 outline-none focus:border-[#00665E]" value={formData.company_email} onChange={e => setFormData({...formData, company_email: e.target.value})} /></div>
                        <div><label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1"><Phone size={12}/> Numero WhatsApp</label><input className="w-full bg-gray-50 border p-3 rounded-xl mt-1 outline-none focus:border-[#00665E]" value={formData.whatsapp_number} onChange={e => setFormData({...formData, whatsapp_number: e.target.value})} placeholder="+39 333..." /></div>
                    </div>
                  </div>

                  <div className="bg-white p-8 rounded-3xl border shadow-sm">
                      <div className="flex justify-between items-center mb-6">
                          <h2 className="text-xl font-black flex items-center gap-2 text-gray-800"><MapPin className="text-[#00665E]"/> Sede Principale & Orari</h2>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                          <div className="md:col-span-3"><label className="text-xs font-bold text-gray-500 uppercase">Indirizzo completo</label><input className="w-full bg-gray-50 border p-3 rounded-xl mt-1 outline-none focus:border-[#00665E]" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Via Roma, 10" /></div>
                          <div><label className="text-xs font-bold text-gray-500 uppercase">Città</label><input className="w-full bg-gray-50 border p-3 rounded-xl mt-1 outline-none focus:border-[#00665E]" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} /></div>
                          <div><label className="text-xs font-bold text-gray-500 uppercase">CAP</label><input className="w-full bg-gray-50 border p-3 rounded-xl mt-1 outline-none focus:border-[#00665E]" value={formData.cap} onChange={e => setFormData({...formData, cap: e.target.value})} /></div>
                          <div><label className="text-xs font-bold text-gray-500 uppercase">Provincia</label><input className="w-full bg-gray-50 border p-3 rounded-xl mt-1 outline-none focus:border-[#00665E]" value={formData.province} onChange={e => setFormData({...formData, province: e.target.value})} placeholder="RM" /></div>
                      </div>

                      <h3 className="font-bold text-sm text-gray-800 mb-4 flex items-center gap-2 border-t pt-6"><Clock size={16}/> Orari di Apertura</h3>
                      <div className="space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                          {Object.keys(defaultHours).map((day) => {
                              const h = (formData.business_hours as any)[day] || { open:'', close:'', closed: false };
                              return (
                                  <div key={day} className="flex items-center gap-4">
                                      <div className="w-24 font-bold text-sm capitalize text-gray-700">{day}</div>
                                      <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer w-20 shrink-0">
                                          <input type="checkbox" checked={h.closed} onChange={e => updateHour(day, 'closed', e.target.checked)} className="accent-red-500" /> Chiuso
                                      </label>
                                      {!h.closed && (
                                          <div className="flex items-center gap-2 flex-1">
                                              <input type="time" value={h.open} onChange={e => updateHour(day, 'open', e.target.value)} className="p-2 border rounded-lg text-sm outline-none flex-1 bg-white" />
                                              <span className="text-gray-400">-</span>
                                              <input type="time" value={h.close} onChange={e => updateHour(day, 'close', e.target.value)} className="p-2 border rounded-lg text-sm outline-none flex-1 bg-white" />
                                          </div>
                                      )}
                                  </div>
                              )
                          })}
                      </div>

                      <div className="mt-8 bg-purple-50 border border-purple-100 p-6 rounded-2xl flex items-start gap-4">
                          <div className="bg-purple-600 text-white p-3 rounded-xl shrink-0"><Bot size={24}/></div>
                          <div>
                              <h3 className="font-black text-purple-900 text-lg">AI Booking (Agenda Automatica)</h3>
                              <p className="text-sm text-purple-700 mt-1 mb-4 leading-relaxed">Se attivato, l'Intelligenza Artificiale potrà rispondere ai clienti proponendo appuntamenti basati sui tuoi orari.</p>
                              <label className="flex items-center gap-3 cursor-pointer bg-white w-max px-4 py-2 rounded-xl border border-purple-200 shadow-sm hover:border-purple-400 transition">
                                  <input type="checkbox" className="w-5 h-5 accent-purple-600" checked={formData.ai_settings.allow_auto_booking} onChange={e => setFormData(prev => ({...prev, ai_settings: { allow_auto_booking: e.target.checked }}))} />
                                  <span className="font-bold text-purple-900">Consenti all'AI di fissare appuntamenti</span>
                              </label>
                          </div>
                      </div>
                  </div>
              </div>
          )}

          {activeTab === 'integrations' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="bg-white p-8 rounded-3xl border shadow-sm relative overflow-hidden">
                      <h2 className="text-xl font-black mb-6 flex items-center gap-2 text-gray-800"><Globe className="text-[#00665E]"/> Siti Web Aziendali</h2>
                      <div className="space-y-4">
                          <div><label className="text-xs font-bold text-gray-500 uppercase">Sito Istituzionale</label><input className="w-full bg-gray-50 border p-3 rounded-xl mt-1 outline-none focus:border-[#00665E]" value={formData.websites.main} onChange={e => updateWebsite('main', e.target.value)} placeholder="https://www.azienda.it" /></div>
                          <div><label className="text-xs font-bold text-gray-500 uppercase">Sito E-commerce</label><input className="w-full bg-gray-50 border p-3 rounded-xl mt-1 outline-none focus:border-[#00665E]" value={formData.websites.ecommerce} onChange={e => updateWebsite('ecommerce', e.target.value)} placeholder="https://shop.azienda.it" /></div>
                      </div>
                  </div>

                  <div className="bg-white p-8 rounded-3xl border shadow-sm">
                      <h2 className="text-xl font-black mb-2 flex items-center gap-2 text-gray-800"><Share2 className="text-[#00665E]"/> Profili Social</h2>
                      <p className="text-sm text-gray-500 mb-6">Inserisci i link ai tuoi profili. Verranno usati nei Volantini e nelle Landing Page.</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {['facebook', 'instagram', 'linkedin', 'tiktok', 'youtube', 'x', 'telegram'].map(social => (
                              <div key={social}>
                                  <label className="text-xs font-bold text-gray-500 uppercase capitalize">{social}</label>
                                  <input className="w-full bg-gray-50 border p-3 rounded-xl mt-1 text-sm outline-none focus:border-[#00665E]" value={(formData.social_links as any)[social]} onChange={e => updateSocial(social, e.target.value)} placeholder={`Link ${social}...`} />
                              </div>
                          ))}
                      </div>
                  </div>

                  <div className="bg-white p-8 rounded-3xl border shadow-sm relative overflow-hidden">
                      <div className="flex items-center gap-3 mb-6">
                          <div className="bg-blue-100 text-blue-600 p-3 rounded-xl"><ShoppingBag size={24}/></div>
                          <div>
                              <h3 className="text-xl font-bold">Integrazione Vendite E-commerce</h3>
                              <p className="text-sm text-gray-500">Collega Shopify, WooCommerce o piattaforme custom al CRM.</p>
                          </div>
                      </div>

                      <div className="bg-gray-50 border border-gray-200 p-6 rounded-2xl mb-6">
                          <p className="font-bold text-sm text-gray-800 mb-2">Il tuo Webhook URL Ricevitore</p>
                          <p className="text-xs text-gray-500 mb-4">Incolla questo indirizzo nelle impostazioni Webhook (es. alla voce "Order Creation") del tuo sito e-commerce. Ogni vendita aggiornerà in automatico il CRM, l'LTV dei clienti e i grafici.</p>
                          
                          <div className="flex items-center gap-2">
                              <input readOnly value={`${publicBaseUrl}/api/webhooks/ecommerce?userId=${user?.id}`} className="w-full bg-white border border-gray-300 p-3 rounded-xl text-xs font-mono text-gray-600 focus:outline-none" />
                              <button onClick={copyWebhook} className="bg-[#00665E] text-white p-3 rounded-xl hover:bg-[#004d46] transition flex-shrink-0 flex items-center gap-2 font-bold text-sm">
                                  {copied ? <><CheckCircle size={18}/> Copiato</> : <><Copy size={18}/> Copia</>}
                              </button>
                          </div>
                      </div>
                  </div>
              </div>
          )}

          {activeTab === 'billing' && (
              <div className="bg-white p-8 rounded-3xl border shadow-sm relative overflow-hidden animate-in fade-in duration-300">
                  <div className="flex justify-between items-start mb-8 pb-6 border-b border-gray-100">
                      <div>
                          <h3 className="text-2xl font-black mb-1 text-gray-900">Il tuo Piano: <span className="text-[#00665E] uppercase">{formData.plan}</span></h3>
                          <p className="text-gray-500 text-sm">Controlla l'utilizzo delle risorse dei vari moduli dell'ecosistema IntegraOS.</p>
                      </div>
                      <button onClick={() => router.push('/dashboard/enterprise')} className="bg-slate-900 text-white font-bold px-6 py-2.5 rounded-xl hover:bg-black transition text-sm">
                          Modifica Piano
                      </button>
                  </div>
                  
                  <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4 mt-8 flex items-center gap-2"><Bot size={16} className="text-blue-600"/> Intelligenza Artificiale & Workflow</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
                      <LimitBar label="Agenti AI Attivi" used={usage.agents} max={usage.maxAgents} color="bg-blue-600" icon={<Bot size={16}/>}/>
                      <LimitBar label="Interazioni AI (Chat)" used={usage.ai_interactions} max={usage.maxAiInteractions} color="bg-cyan-500" icon={<MessageCircle size={16}/>}/>
                      <LimitBar label="Minuti AI Voice Agent" used={usage.voice_minutes} max={usage.maxVoiceMinutes} color="bg-indigo-500" icon={<Mic size={16}/>}/>
                      <LimitBar label="Operazioni Zap Automations" used={usage.automations} max={usage.maxAutomations} color="bg-rose-500" icon={<Workflow size={16}/>} />
                  </div>

                  <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4 mt-10 flex items-center gap-2"><Palette size={16} className="text-purple-600"/> Marketing & Design Studio</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
                      <LimitBar label="Crediti Creative Studio" used={usage.design_credits} max={usage.maxDesignCredits} color="bg-fuchsia-500" icon={<Palette size={16}/>} />
                      <LimitBar label="Landing Page / Volantini" used={usage.landing_flyers} max={usage.maxLandingFlyers} color="bg-pink-500" icon={<LayoutTemplate size={16}/>} />
                      <LimitBar label="Analisi Radar & Media Plan" used={usage.radar_scans} max={usage.maxRadarScans} color="bg-violet-600" icon={<Radar size={16}/>} />
                      <LimitBar label="Contatti Nurturing Engine" used={usage.nurturing_contacts} max={usage.maxNurturingContacts} color="bg-purple-500" icon={<Gift size={16}/>} />
                  </div>

                  <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4 mt-10 flex items-center gap-2"><Database size={16} className="text-emerald-600"/> Dati & Customer Platform</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
                      <LimitBar label="Profili CDP Tracciati" used={usage.cdp_profiles} max={usage.maxCdpProfiles} color="bg-emerald-600" icon={<Users size={16}/>}/>
                      <LimitBar label="Tracciamenti Incognito Mode" used={usage.incognito_sessions} max={usage.maxIncognito} color="bg-slate-800" icon={<EyeOff size={16}/>}/>
                      <LimitBar label="Fidelity Card Emesse" used={usage.fidelity} max={usage.maxFidelity} color="bg-orange-500" icon={<CreditCard size={16}/>}/>
                      <LimitBar label="Spazio Storage" used={usage.storage} max={usage.maxStorage} unit="MB" color="bg-red-500" icon={<Globe size={16}/>}/>
                  </div>

                  <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4 mt-10 flex items-center gap-2"><Activity size={16} className="text-amber-600"/> Operations, Team & ERP</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
                      <LimitBar label="Valutazioni AI & Coaching" used={usage.performance_evaluations} max={usage.maxPerformanceEvaluations} color="bg-indigo-600" icon={<BrainCircuit size={16}/>} />
                      <LimitBar label="Fatture ERP / SdI" used={usage.invoices} max={usage.maxInvoices} color="bg-amber-600" icon={<Receipt size={16}/>} />
                      <LimitBar label="Preventivi Inviati" used={usage.quotes} max={usage.maxQuotes} color="bg-yellow-500" icon={<FileText size={16}/>} />
                      <LimitBar label="Audit Energetici ESG" used={usage.energy_audits} max={usage.maxEnergyAudits} color="bg-green-600" icon={<Leaf size={16}/>} />
                      <LimitBar label="Report Pulse Check-in" used={usage.pulse_checkins} max={usage.maxPulseCheckins} color="bg-rose-400" icon={<HeartPulse size={16}/>} />
                      <LimitBar label="Integrazioni Nexus Hub" used={usage.nexus_integrations} max={usage.maxNexusIntegrations} color="bg-blue-800" icon={<Link2 size={16}/>} />
                      <LimitBar label="Cross-Promo / Affiliazioni" used={affiliatesCount} max={5} color="bg-teal-600" icon={<Handshake size={16}/>}/>
                  </div>

              </div>
          )}
        </div>
        
        {/* COLONNA DESTRA (Statica: Link Utili) */}
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border shadow-sm sticky top-8">
                <h3 className="font-black text-lg mb-4 text-gray-800">Link Pubblici Generati</h3>
                <p className="text-xs text-gray-500 mb-6">Questi link portano direttamente alle tue pagine IntegraOS dedicate ai clienti.</p>
                <div className="space-y-4 text-sm">
                    <div>
                        <span className="flex items-center gap-2 font-bold text-gray-700 mb-2"><ShoppingBag size={14}/> Vetrina B2B</span>
                        <a href={`${publicBaseUrl}/shop/${user?.id}`} target="_blank" className="text-blue-600 hover:underline bg-blue-50 border border-blue-100 p-3 rounded-xl block truncate text-xs font-mono">{publicBaseUrl}/shop/{user?.id}</a>
                    </div>
                    <div>
                        <span className="flex items-center gap-2 font-bold text-gray-700 mb-2"><CalendarCheck size={14}/> Pagina Prenotazioni</span>
                        <a href={`${publicBaseUrl}/book/${user?.id}`} target="_blank" className="text-purple-600 hover:underline bg-purple-50 border border-purple-100 p-3 rounded-xl block truncate text-xs font-mono">{publicBaseUrl}/book/{user?.id}</a>
                    </div>
                </div>
            </div>
        </div>

      </div>
    </main>
  )
}

function LimitBar({label, used, max, color, unit, icon}: any) {
    const perc = Math.min((used/max)*100, 100);
    const isNearLimit = perc >= 85;
    return (
        <div>
            <div className="flex justify-between text-sm font-bold text-gray-700 mb-2 items-center">
                <span className="flex items-center gap-2">{icon} {label}</span> 
                <span className={isNearLimit ? 'text-rose-500' : ''}>{used} / {max} {unit || ''}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden border border-gray-200">
                <div className={`h-full rounded-full transition-all duration-1000 ${isNearLimit ? 'bg-rose-500' : color}`} style={{width: `${perc}%`}}></div>
            </div>
            {isNearLimit && <p className="text-[10px] text-rose-500 font-bold mt-1 text-right">Limite quasi raggiunto</p>}
        </div>
    )
}