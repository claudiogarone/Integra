'use client'

import { createClient } from '../../../utils/supabase/client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { 
    Building, MapPin, Phone, Mail, Globe, Share2, Clock, 
    CalendarCheck, ShoppingBag, Copy, CheckCircle, Plus, Trash2, Bot, Handshake,
    Receipt, Leaf, Palette, Gift, Workflow, FileText, CreditCard, 
    Mic, Database, HeartPulse, EyeOff, Link2, Radar, Target, LayoutTemplate, Activity,
    MessageCircle, Users, BrainCircuit, Loader2, Zap, AlertTriangle, Info, SkipForward, XCircle
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

  // --- NATIVE INBOX CHANNELS ---
  const [telegramToken, setTelegramToken] = useState('')
  const [telegramBotEnabled, setTelegramBotEnabled] = useState(true)
  const [telegramStatus, setTelegramStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [telegramStatusMsg, setTelegramStatusMsg] = useState('')
  const [whatsappToken, setWhatsappToken] = useState('')
  const [whatsappPhoneNumberId, setWhatsappPhoneNumberId] = useState('')
  const [whatsappBotEnabled, setWhatsappBotEnabled] = useState(false)
  const [waWebhookCopied, setWaWebhookCopied] = useState(false)
  // Facebook Messenger
  const [fbPageToken, setFbPageToken] = useState('')
  const [fbPageId, setFbPageId] = useState('')
  const [fbBotEnabled, setFbBotEnabled] = useState(false)
  const [fbWebhookCopied, setFbWebhookCopied] = useState(false)
  // Instagram DM
  const [igPageToken, setIgPageToken] = useState('')
  const [igBusinessId, setIgBusinessId] = useState('')
  const [igBotEnabled, setIgBotEnabled] = useState(false)
  const [igWebhookCopied, setIgWebhookCopied] = useState(false)
  // SMS via Twilio
  const [smsSid, setSmsSid] = useState('')
  const [smsAuthToken, setSmsAuthToken] = useState('')
  const [smsNumber, setSmsNumber] = useState('')
  const [smsBotEnabled, setSmsBotEnabled] = useState(false)
  const [smsWebhookCopied, setSmsWebhookCopied] = useState(false)
  // Email inbound IMAP
  const [imapEmail, setImapEmail] = useState('')
  const [imapPassword, setImapPassword] = useState('')
  const [imapHost, setImapHost] = useState('') // Vuoto = auto-detect
  const [emailBotEnabled, setEmailBotEnabled] = useState(false)
  const [emailCopied, setEmailCopied] = useState(false)
  const [emailTestStatus, setEmailTestStatus] = useState<'idle'|'loading'|'ok'|'error'>('idle')
  const [emailTestMsg, setEmailTestMsg] = useState('')
  const [emailSyncing, setEmailSyncing] = useState(false)
  const [emailSyncMsg, setEmailSyncMsg] = useState('')
  const [botPrompt, setBotPrompt] = useState('Sei un cordiale e professionale assistente clienti. Rispondi in modo conciso ma esaustivo.')

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
    ai_settings: { allow_auto_booking: false },
    voice_budget_limit: 100,
    voice_current_spend: 0
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
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return;
        setUser(user)
        
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        if (data) {
          const actualLogo = data.logo_url || data.company_logo || ''
          setFormData({
            company_name: data.company_name || '', 
            company_email: data.company_email || user.email || '',
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
            ai_settings: data.ai_settings || { allow_auto_booking: false },
            voice_budget_limit: data.voice_budget_limit || 100,
            voice_current_spend: data.voice_current_spend || 0
          })
          if(actualLogo) setLogoPreview(actualLogo)
        }
        
        const { count } = await supabase.from('affiliates').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
        if (count !== null) setAffiliatesCount(count)

        // Native Inbox Channels Fetch
        const { data: channels } = await supabase.from('inbox_channels').select('*').eq('user_id', user.id)
        if (channels) {
            const tg = channels.find((c: any) => c.provider === 'telegram')
            if (tg) { setTelegramToken(tg.access_token || ''); setTelegramBotEnabled(tg.bot_enabled); if (tg.bot_prompt) setBotPrompt(tg.bot_prompt); if (tg.access_token) setTelegramStatus('ok') }
            const wa = channels.find((c: any) => c.provider === 'whatsapp')
            if (wa) { setWhatsappToken(wa.access_token || ''); setWhatsappPhoneNumberId(wa.metadata?.phone_number_id || ''); setWhatsappBotEnabled(wa.bot_enabled); if (wa.bot_prompt) setBotPrompt(wa.bot_prompt) }
            const fb = channels.find((c: any) => c.provider === 'facebook')
            if (fb) { setFbPageToken(fb.access_token || ''); setFbPageId(fb.provider_id || ''); setFbBotEnabled(fb.bot_enabled) }
            const ig = channels.find((c: any) => c.provider === 'instagram')
            if (ig) { setIgPageToken(ig.access_token || ''); setIgBusinessId(ig.provider_id || ''); setIgBotEnabled(ig.bot_enabled) }
            const sms = channels.find((c: any) => c.provider === 'sms')
            if (sms) { setSmsSid(sms.metadata?.account_sid || ''); setSmsAuthToken(sms.access_token || ''); setSmsNumber(sms.provider_id || ''); setSmsBotEnabled(sms.bot_enabled) }
            const email = channels.find((c: any) => c.provider === 'email_imap')
            if (email) { setImapEmail(email.provider_id || ''); setEmailBotEnabled(email.bot_enabled); setImapHost(email.metadata?.imap_host || '') }
        }
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
        ai_settings: formData.ai_settings,
        voice_budget_limit: formData.voice_budget_limit
    })
    
    // Salva i canali Native Inbox
    if (telegramToken) {
        await supabase.from('inbox_channels').upsert({ 
            user_id: user.id, provider: 'telegram', provider_id: 'default_tg', name: 'Telegram Bot', 
            access_token: telegramToken, bot_enabled: telegramBotEnabled, bot_prompt: botPrompt 
        }, { onConflict: 'user_id,provider,provider_id' })
    }
    
    if (whatsappToken) {
        await supabase.from('inbox_channels').upsert({ 
            user_id: user.id, provider: 'whatsapp', provider_id: whatsappPhoneNumberId || 'default_wa', name: 'WhatsApp', 
            access_token: whatsappToken, bot_enabled: whatsappBotEnabled, bot_prompt: botPrompt,
            metadata: { phone_number_id: whatsappPhoneNumberId }
        }, { onConflict: 'user_id,provider,provider_id' })
    }

    if (fbPageToken && fbPageId) {
        await supabase.from('inbox_channels').upsert({ 
            user_id: user.id, provider: 'facebook', provider_id: fbPageId, name: 'Facebook Messenger', 
            access_token: fbPageToken, bot_enabled: fbBotEnabled, bot_prompt: botPrompt,
            metadata: { verify_token: user.id }
        }, { onConflict: 'user_id,provider,provider_id' })
    }

    if (igPageToken && igBusinessId) {
        await supabase.from('inbox_channels').upsert({ 
            user_id: user.id, provider: 'instagram', provider_id: igBusinessId, name: 'Instagram DM', 
            access_token: igPageToken, bot_enabled: igBotEnabled, bot_prompt: botPrompt
        }, { onConflict: 'user_id,provider,provider_id' })
    }

    if (smsSid && smsAuthToken && smsNumber) {
        await supabase.from('inbox_channels').upsert({ 
            user_id: user.id, provider: 'sms', provider_id: smsNumber, name: 'SMS Twilio', 
            access_token: smsAuthToken, bot_enabled: smsBotEnabled, bot_prompt: botPrompt,
            metadata: { account_sid: smsSid }
        }, { onConflict: 'user_id,provider,provider_id' })
    }

    if (imapEmail) {
        await supabase.from('inbox_channels').upsert({ 
            user_id: user.id, provider: 'email_imap', provider_id: imapEmail, name: 'Email IMAP', 
            access_token: imapPassword, bot_enabled: emailBotEnabled, bot_prompt: botPrompt,
            metadata: { imap_host: imapHost || null }
        }, { onConflict: 'user_id,provider,provider_id' })
    }

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

  const copyWaWebhook = () => {
      navigator.clipboard.writeText(`${publicBaseUrl}/api/inbox/webhook/whatsapp`)
      setWaWebhookCopied(true); setTimeout(() => setWaWebhookCopied(false), 2000)
  }
  const copyFbWebhook = () => {
      navigator.clipboard.writeText(`${publicBaseUrl}/api/inbox/webhook/facebook`)
      setFbWebhookCopied(true); setTimeout(() => setFbWebhookCopied(false), 2000)
  }
  const copyIgWebhook = () => {
      navigator.clipboard.writeText(`${publicBaseUrl}/api/inbox/webhook/instagram`)
      setIgWebhookCopied(true); setTimeout(() => setIgWebhookCopied(false), 2000)
  }
  const copySmsWebhook = () => {
      navigator.clipboard.writeText(`${publicBaseUrl}/api/inbox/webhook/sms`)
      setSmsWebhookCopied(true); setTimeout(() => setSmsWebhookCopied(false), 2000)
  }
  const copyEmailAddress = () => {
      navigator.clipboard.writeText(imapEmail)
      setEmailCopied(true); setTimeout(() => setEmailCopied(false), 2000)
  }

  const handleTestEmail = async () => {
      if (!imapEmail || !imapPassword) {
          setEmailTestStatus('error')
          setEmailTestMsg('Inserisci email e password prima di testare.')
          return
      }
      setEmailTestStatus('loading')
      setEmailTestMsg('')
      try {
          const params = new URLSearchParams({ email: imapEmail, password: imapPassword })
          if (imapHost) params.set('host', imapHost)
          const res = await fetch(`/api/inbox/email-poll?${params}`)
          const data = await res.json()
          if (!res.ok) throw new Error(data.error)
          setEmailTestStatus('ok')
          setEmailTestMsg(data.message)
      } catch (err: any) {
          setEmailTestStatus('error')
          setEmailTestMsg(err.message)
      }
  }

  const handleSyncEmail = async () => {
      if (!user) return
      setEmailSyncing(true)
      setEmailSyncMsg('')
      try {
          const res = await fetch('/api/inbox/email-poll', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: user.id })
          })
          const data = await res.json()
          if (!res.ok) throw new Error(data.error)
          setEmailSyncMsg(`✅ Sincronizzate ${data.importedCount} nuove email nell'Inbox.`)
      } catch (err: any) {
          setEmailSyncMsg(`❌ ${err.message}`)
      } finally {
          setEmailSyncing(false)
      }
  }

  const handleActivateTelegram = async () => {
      if (!telegramToken.trim()) {
          setTelegramStatus('error')
          setTelegramStatusMsg('Incolla il token del bot prima di attivare.')
          return
      }
      setTelegramStatus('loading')
      setTelegramStatusMsg('')
      try {
          const res = await fetch('/api/inbox/register/telegram', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ botToken: telegramToken })
          })
          const data = await res.json()
          if (!res.ok) throw new Error(data.error)
          setTelegramStatus('ok')
          setTelegramStatusMsg(data.message || `✅ ${data.botName} collegato con successo!`)
      } catch (err: any) {
          setTelegramStatus('error')
          setTelegramStatusMsg(err.message)
      }
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

                  {/* NATIVE INBOX CHANNELS */}
                  <div className="bg-gradient-to-br from-[#F8FAFC] to-blue-50 p-8 rounded-3xl border border-blue-100 shadow-sm relative overflow-hidden">
                      <div className="flex items-center gap-4 mb-2">
                          <div className="bg-[#00665E] text-white p-3 rounded-xl shadow-lg"><MessageCircle size={24}/></div>
                          <div>
                              <h3 className="text-xl font-black text-gray-900">Canali Omnichannel & AI</h3>
                              <p className="text-sm text-gray-600">Collega i tuoi canali social. I messaggi arriveranno nell'Inbox in tempo reale.</p>
                          </div>
                      </div>
                      <p className="text-xs text-[#00665E] font-bold mb-6 ml-1">✅ Gli endpoint webhook sono già configurati da IntegraOS — devi solo incollare le tue credenziali qui sotto.</p>

                      <div className="grid grid-cols-1 gap-6">
                          
                          {/* ── TELEGRAM ─────────────────────────────── */}
                          <div className={`bg-white p-5 rounded-2xl border shadow-sm transition ${telegramStatus === 'ok' ? 'border-[#00665E]' : 'border-gray-100 hover:border-blue-300'}`}>
                              <div className="flex justify-between items-start mb-4">
                                  <div className="flex items-center gap-3">
                                      <div className="bg-blue-100 text-blue-500 p-2.5 rounded-xl text-lg">✈️</div>
                                      <div>
                                          <div className="flex items-center gap-2">
                                              <h4 className="font-black text-gray-800">Bot Telegram</h4>
                                              {telegramStatus === 'ok' && <span className="text-[10px] bg-emerald-100 text-emerald-700 font-black px-2 py-0.5 rounded-full">✓ ATTIVO</span>}
                                          </div>
                                          <p className="text-xs text-gray-500">Ricevi messaggi Telegram nell'Inbox IntegraOS.</p>
                                      </div>
                                  </div>
                                  <label className="flex items-center gap-2 text-xs font-bold text-[#00665E] cursor-pointer">
                                      <input type="checkbox" checked={telegramBotEnabled} onChange={e => setTelegramBotEnabled(e.target.checked)} className="accent-[#00665E] w-4 h-4"/> 
                                      {telegramBotEnabled ? '🤖 AI Risponde' : '👤 Manuale'}
                                  </label>
                              </div>

                              {/* Guida step-by-step */}
                              <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl mb-4 text-xs text-blue-800 space-y-1.5 leading-relaxed">
                                  <p className="font-black text-blue-900 mb-2">📋 Come ottenere il Token (2 minuti):</p>
                                  <p><b>1.</b> Apri Telegram e cerca <b>@BotFather</b></p>
                                  <p><b>2.</b> Scrivi <code className="bg-blue-200 px-1 rounded">/newbot</code> e scegli un nome per il bot</p>
                                  <p><b>3.</b> BotFather ti invierà il <b>Token API</b> — copialo e incollalo qui sotto</p>
                                  <p><b>4.</b> Clicca <b>"Attiva Canale"</b> — IntegraOS configurerà tutto automaticamente</p>
                              </div>

                              <div className="flex gap-2">
                                  <input 
                                      type="text" 
                                      value={telegramToken} 
                                      onChange={e => { setTelegramToken(e.target.value); setTelegramStatus('idle') }} 
                                      placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11" 
                                      className="flex-1 bg-gray-50 border p-3 rounded-xl text-sm font-mono outline-none focus:border-[#00665E] text-gray-700" 
                                  />
                                  <button 
                                      onClick={handleActivateTelegram}
                                      disabled={telegramStatus === 'loading' || !telegramToken.trim()}
                                      className={`px-4 py-2 rounded-xl text-sm font-black transition shrink-0 flex items-center gap-1.5 ${
                                          telegramStatus === 'ok' 
                                              ? 'bg-emerald-500 text-white' 
                                              : 'bg-[#00665E] text-white hover:bg-[#004d46] disabled:opacity-40'
                                      }`}
                                  >
                                      {telegramStatus === 'loading' ? <><Loader2 size={14} className="animate-spin"/> Attivazione...</> 
                                       : telegramStatus === 'ok' ? <>✓ Attivo</> 
                                       : <>⚡ Attiva Canale</>}
                                  </button>
                              </div>
                              {telegramStatusMsg && (
                                  <p className={`text-xs mt-2 font-bold px-2 ${telegramStatus === 'error' ? 'text-red-500' : 'text-emerald-600'}`}>{telegramStatusMsg}</p>
                              )}
                          </div>

                          {/* ── WHATSAPP ─────────────────────────────── */}
                          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:border-emerald-300 transition">
                              <div className="flex justify-between items-start mb-4">
                                  <div className="flex items-center gap-3">
                                      <div className="bg-emerald-100 text-emerald-600 p-2.5 rounded-xl text-lg">📱</div>
                                      <div>
                                          <h4 className="font-black text-gray-800">WhatsApp Business</h4>
                                          <p className="text-xs text-gray-500">Meta Cloud API — gratuita fino a 1.000 conversazioni/mese.</p>
                                      </div>
                                  </div>
                                  <label className="flex items-center gap-2 text-xs font-bold text-emerald-600 cursor-pointer">
                                      <input type="checkbox" checked={whatsappBotEnabled} onChange={e => setWhatsappBotEnabled(e.target.checked)} className="accent-emerald-600 w-4 h-4"/> 
                                      {whatsappBotEnabled ? '🤖 AI Risponde' : '👤 Manuale'}
                                  </label>
                              </div>

                              {/* Guida step-by-step */}
                              <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl mb-4 text-xs text-emerald-900 space-y-1.5 leading-relaxed">
                                  <p className="font-black mb-2">📋 Come configurare WhatsApp (10 minuti):</p>
                                  <p><b>1.</b> Vai su <a href="https://developers.facebook.com" target="_blank" className="underline font-bold">developers.facebook.com</a> → Crea App → WhatsApp</p>
                                  <p><b>2.</b> In <b>WhatsApp → Configurazione</b> copia il <b>"Phone Number ID"</b></p>
                                  <p><b>3.</b> Genera un <b>Access Token Permanente</b> da Sistema Utente (non temporaneo!)</p>
                                  <p><b>4.</b> In <b>Webhook</b> incolla questo URL IntegraOS:</p>
                                  <div className="flex items-center gap-2 mt-1">
                                      <code className="bg-emerald-200 px-2 py-1 rounded text-[10px] flex-1 truncate">{publicBaseUrl}/api/inbox/webhook/whatsapp</code>
                                      <button onClick={copyWaWebhook} className="bg-emerald-600 text-white px-2 py-1 rounded text-[10px] font-black shrink-0 flex items-center gap-1">
                                          {waWebhookCopied ? <><CheckCircle size={10}/> Copiato</> : <><Copy size={10}/> Copia</>}
                                      </button>
                                  </div>
                                  <p><b>5.</b> Il <b>Verify Token</b> da inserire in Meta è il tuo User ID: <code className="bg-emerald-200 px-1 rounded">{user?.id?.substring(0,8)}...</code></p>
                              </div>

                              <div className="grid grid-cols-1 gap-3">
                                  <div>
                                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Phone Number ID</label>
                                      <input type="text" value={whatsappPhoneNumberId} onChange={e => setWhatsappPhoneNumberId(e.target.value)} placeholder="123456789012345" className="w-full bg-gray-50 border p-3 rounded-xl text-sm font-mono outline-none focus:border-emerald-500 text-gray-700" />
                                  </div>
                                  <div>
                                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Access Token Permanente</label>
                                      <input type="password" value={whatsappToken} onChange={e => setWhatsappToken(e.target.value)} placeholder="EAAI..." className="w-full bg-gray-50 border p-3 rounded-xl text-sm font-mono outline-none focus:border-emerald-500 text-gray-700" />
                                  </div>
                              </div>
                              <p className="text-[10px] text-gray-400 mt-3 font-medium">💾 Clicca <b>"Salva Tutto"</b> in alto a destra per confermare le credenziali WhatsApp.</p>
                          </div>

                          {/* AI PROMPT — mostrato se almeno un canale ha AI attiva */}
                          {(telegramBotEnabled || whatsappBotEnabled || fbBotEnabled || igBotEnabled || smsBotEnabled || emailBotEnabled) && (
                              <div className="bg-purple-50 p-5 rounded-2xl border border-purple-100 animate-in fade-in">
                                  <h4 className="font-bold text-purple-900 mb-2 flex items-center gap-2"><BrainCircuit size={16}/> Personalità Bot AI (Tutti i Canali)</h4>
                                  <p className="text-xs text-purple-700 mb-3">Un unico prompt per tutti i canali con AI attiva. Specifica il tono, i servizi, le FAQ e come comportarsi con i clienti.</p>
                                  <textarea value={botPrompt} onChange={e => setBotPrompt(e.target.value)} rows={4} className="w-full bg-white border border-purple-200 p-3 rounded-xl text-sm outline-none focus:border-purple-500 text-gray-700 resize-none" placeholder="Es: Sei l'assistente di [Nome Azienda]. Rispondi in italiano con tono professionale. Non dare prezzi senza prima chiedere email e telefono al cliente."/>
                              </div>
                          )}

                          {/* ── FACEBOOK MESSENGER ───────────────────── */}
                          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:border-blue-400 transition">
                              <div className="flex justify-between items-start mb-4">
                                  <div className="flex items-center gap-3">
                                      <div className="bg-blue-600 text-white p-2.5 rounded-xl text-lg">💬</div>
                                      <div>
                                          <h4 className="font-black text-gray-800">Facebook Messenger</h4>
                                          <p className="text-xs text-gray-500">Ricevi DM dalla tua Pagina Facebook.</p>
                                      </div>
                                  </div>
                                  <label className="flex items-center gap-2 text-xs font-bold text-blue-600 cursor-pointer">
                                      <input type="checkbox" checked={fbBotEnabled} onChange={e => setFbBotEnabled(e.target.checked)} className="accent-blue-600 w-4 h-4"/>
                                      {fbBotEnabled ? '🤖 AI Risponde' : '👤 Manuale'}
                                  </label>
                              </div>
                              <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl mb-4 text-xs text-blue-900 space-y-1.5 leading-relaxed">
                                  <p className="font-black mb-2">📋 Come configurare (10 minuti):</p>
                                  <p><b>1.</b> Vai su <a href="https://developers.facebook.com" target="_blank" className="underline font-bold">developers.facebook.com</a> → Crea App → Messenger</p>
                                  <p><b>2.</b> In <b>Messenger → Configurazione</b> copia il <b>Page ID</b> e genera un <b>Page Access Token</b></p>
                                  <p><b>3.</b> In <b>Webhook</b> incolla questo URL:</p>
                                  <div className="flex items-center gap-2 mt-1">
                                      <code className="bg-blue-200 px-2 py-1 rounded text-[10px] flex-1 truncate">{publicBaseUrl}/api/inbox/webhook/facebook</code>
                                      <button onClick={copyFbWebhook} className="bg-blue-600 text-white px-2 py-1 rounded text-[10px] font-black shrink-0 flex items-center gap-1">
                                          {fbWebhookCopied ? <><CheckCircle size={10}/> Copiato</> : <><Copy size={10}/> Copia</>}
                                      </button>
                                  </div>
                                  <p><b>4.</b> Verify Token: <code className="bg-blue-200 px-1 rounded">{user?.id?.substring(0,8)}...</code> — Clicca <b>"Salva Tutto"</b></p>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                  <div>
                                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Page ID</label>
                                      <input type="text" value={fbPageId} onChange={e => setFbPageId(e.target.value)} placeholder="123456789" className="w-full bg-gray-50 border p-3 rounded-xl text-sm font-mono outline-none focus:border-blue-500" />
                                  </div>
                                  <div>
                                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Page Access Token</label>
                                      <input type="password" value={fbPageToken} onChange={e => setFbPageToken(e.target.value)} placeholder="EAAI..." className="w-full bg-gray-50 border p-3 rounded-xl text-sm font-mono outline-none focus:border-blue-500" />
                                  </div>
                              </div>
                          </div>

                          {/* ── INSTAGRAM DM ─────────────────────────── */}
                          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:border-pink-400 transition">
                              <div className="flex justify-between items-start mb-4">
                                  <div className="flex items-center gap-3">
                                      <div className="bg-gradient-to-br from-pink-500 to-purple-600 text-white p-2.5 rounded-xl text-lg">📸</div>
                                      <div>
                                          <h4 className="font-black text-gray-800">Instagram DM</h4>
                                          <p className="text-xs text-gray-500">Account Professionale collegato a FB Business.</p>
                                      </div>
                                  </div>
                                  <label className="flex items-center gap-2 text-xs font-bold text-pink-600 cursor-pointer">
                                      <input type="checkbox" checked={igBotEnabled} onChange={e => setIgBotEnabled(e.target.checked)} className="accent-pink-600 w-4 h-4"/>
                                      {igBotEnabled ? '🤖 AI Risponde' : '👤 Manuale'}
                                  </label>
                              </div>
                              <div className="bg-pink-50 border border-pink-100 p-4 rounded-xl mb-4 text-xs text-pink-900 space-y-1.5 leading-relaxed">
                                  <p className="font-black mb-2">📋 Come configurare (stessa app di Facebook):</p>
                                  <p><b>1.</b> Nella stessa App Meta, aggiungi il prodotto <b>Instagram</b></p>
                                  <p><b>2.</b> Collega l'account IG Professionale alla Pagina Facebook</p>
                                  <p><b>3.</b> Copia l'<b>Instagram Business Account ID</b> dal pannello Meta</p>
                                  <p><b>4.</b> Usa lo stesso <b>Page Access Token</b> della Pagina FB collegata</p>
                                  <p><b>5.</b> In Webhook usa questo URL:</p>
                                  <div className="flex items-center gap-2 mt-1">
                                      <code className="bg-pink-200 px-2 py-1 rounded text-[10px] flex-1 truncate">{publicBaseUrl}/api/inbox/webhook/instagram</code>
                                      <button onClick={copyIgWebhook} className="bg-pink-600 text-white px-2 py-1 rounded text-[10px] font-black shrink-0 flex items-center gap-1">
                                          {igWebhookCopied ? <><CheckCircle size={10}/> Copiato</> : <><Copy size={10}/> Copia</>}
                                      </button>
                                  </div>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                  <div>
                                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Instagram Business ID</label>
                                      <input type="text" value={igBusinessId} onChange={e => setIgBusinessId(e.target.value)} placeholder="123456789" className="w-full bg-gray-50 border p-3 rounded-xl text-sm font-mono outline-none focus:border-pink-400" />
                                  </div>
                                  <div>
                                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Page Access Token (stesso di FB)</label>
                                      <input type="password" value={igPageToken} onChange={e => setIgPageToken(e.target.value)} placeholder="EAAI..." className="w-full bg-gray-50 border p-3 rounded-xl text-sm font-mono outline-none focus:border-pink-400" />
                                  </div>
                              </div>
                          </div>

                          {/* ── SMS (TWILIO) ──────────────────────────── */}
                          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:border-indigo-400 transition">
                              <div className="flex justify-between items-start mb-4">
                                  <div className="flex items-center gap-3">
                                      <div className="bg-indigo-100 text-indigo-600 p-2.5 rounded-xl text-lg">💬</div>
                                      <div>
                                          <h4 className="font-black text-gray-800">SMS (Twilio)</h4>
                                          <p className="text-xs text-gray-500">Ricevi e rispondi agli SMS dal tuo numero Twilio.</p>
                                      </div>
                                  </div>
                                  <label className="flex items-center gap-2 text-xs font-bold text-indigo-600 cursor-pointer">
                                      <input type="checkbox" checked={smsBotEnabled} onChange={e => setSmsBotEnabled(e.target.checked)} className="accent-indigo-600 w-4 h-4"/>
                                      {smsBotEnabled ? '🤖 AI Risponde' : '👤 Manuale'}
                                  </label>
                              </div>
                              <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl mb-4 text-xs text-indigo-900 space-y-1.5 leading-relaxed">
                                  <p className="font-black mb-2">📋 Come configurare Twilio (5 minuti):</p>
                                  <p><b>1.</b> Vai su <a href="https://console.twilio.com" target="_blank" className="underline font-bold">console.twilio.com</a> → copia <b>Account SID</b> e <b>Auth Token</b></p>
                                  <p><b>2.</b> Acquista un numero di telefono con SMS abilitati</p>
                                  <p><b>3.</b> In <b>Phone Numbers → Configura</b> imposta il Webhook "When a message comes in":</p>
                                  <div className="flex items-center gap-2 mt-1">
                                      <code className="bg-indigo-200 px-2 py-1 rounded text-[10px] flex-1 truncate">{publicBaseUrl}/api/inbox/webhook/sms</code>
                                      <button onClick={copySmsWebhook} className="bg-indigo-600 text-white px-2 py-1 rounded text-[10px] font-black shrink-0 flex items-center gap-1">
                                          {smsWebhookCopied ? <><CheckCircle size={10}/> Copiato</> : <><Copy size={10}/> Copia</>}
                                      </button>
                                  </div>
                              </div>
                              <div className="grid grid-cols-1 gap-3">
                                  <div className="grid grid-cols-2 gap-3">
                                      <div>
                                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Account SID</label>
                                          <input type="text" value={smsSid} onChange={e => setSmsSid(e.target.value)} placeholder="ACxxxxxxxxxxxx" className="w-full bg-gray-50 border p-3 rounded-xl text-sm font-mono outline-none focus:border-indigo-400" />
                                      </div>
                                      <div>
                                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Auth Token</label>
                                          <input type="password" value={smsAuthToken} onChange={e => setSmsAuthToken(e.target.value)} placeholder="••••••••" className="w-full bg-gray-50 border p-3 rounded-xl text-sm font-mono outline-none focus:border-indigo-400" />
                                      </div>
                                  </div>
                                  <div>
                                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Numero Twilio (con prefisso)</label>
                                      <input type="text" value={smsNumber} onChange={e => setSmsNumber(e.target.value)} placeholder="+39012345678" className="w-full bg-gray-50 border p-3 rounded-xl text-sm font-mono outline-none focus:border-indigo-400" />
                                  </div>
                              </div>
                          </div>

                          {/* ── EMAIL INBOUND ─────────────────────────── */}
                          {/* ── EMAIL (IMAP) ───────────────────────────── */}
                          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:border-amber-400 transition">
                              <div className="flex justify-between items-start mb-4">
                                  <div className="flex items-center gap-3">
                                      <div className="bg-amber-100 text-amber-600 p-2.5 rounded-xl text-lg">📧</div>
                                      <div>
                                          <div className="flex items-center gap-2">
                                              <h4 className="font-black text-gray-800">Email (Gmail, Outlook, Aruba...)</h4>
                                              {emailTestStatus === 'ok' && <span className="text-[10px] bg-emerald-100 text-emerald-700 font-black px-2 py-0.5 rounded-full">✓ CONNESSA</span>}
                                          </div>
                                          <p className="text-xs text-gray-500">Le email ricevute compaiono nell'Inbox come conversazioni.</p>
                                      </div>
                                  </div>
                                  <label className="flex items-center gap-2 text-xs font-bold text-amber-600 cursor-pointer">
                                      <input type="checkbox" checked={emailBotEnabled} onChange={e => setEmailBotEnabled(e.target.checked)} className="accent-amber-500 w-4 h-4"/>
                                      {emailBotEnabled ? '🤖 AI Risponde' : '👤 Manuale'}
                                  </label>
                              </div>

                              <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl mb-4 text-xs text-amber-900 space-y-1.5 leading-relaxed">
                                  <p className="font-black mb-1">📋 Funziona con qualsiasi provider (3 minuti):</p>
                                  <p><b>1.</b> Inserisci la tua email aziendale qui sotto</p>
                                  <p><b>2.</b> Per <b>Gmail</b>: vai su <a href="https://myaccount.google.com/apppasswords" target="_blank" className="underline font-bold">account.google.com/apppasswords</a> → genera una "Password per le app" (non usare la password normale)</p>
                                  <p><b>3.</b> Per <b>Outlook/Hotmail</b>: abilita IMAP in Impostazioni → Sincronizza email → IMAP</p>
                                  <p><b>4.</b> Per <b>email del sito</b> (Aruba, SiteGround, ecc.): usa email e password del pannello di controllo hosting</p>
                                  <p><b>5.</b> Clicca <b>"Testa Connessione"</b> — IntegraOS verifica e poi sincronizza automaticamente</p>
                              </div>

                              <div className="grid grid-cols-1 gap-3 mb-3">
                                  <div>
                                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Indirizzo Email</label>
                                      <input
                                          type="email"
                                          value={imapEmail}
                                          onChange={e => { setImapEmail(e.target.value); setEmailTestStatus('idle') }}
                                          placeholder="info@miazienda.it oppure mia@gmail.com"
                                          className="w-full bg-gray-50 border p-3 rounded-xl text-sm outline-none focus:border-amber-400"
                                      />
                                  </div>
                                  <div>
                                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Password (o App Password per Gmail)</label>
                                      <input
                                          type="password"
                                          value={imapPassword}
                                          onChange={e => { setImapPassword(e.target.value); setEmailTestStatus('idle') }}
                                          placeholder="••••••••••••"
                                          className="w-full bg-gray-50 border p-3 rounded-xl text-sm font-mono outline-none focus:border-amber-400"
                                      />
                                  </div>
                                  <div>
                                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Server IMAP (opzionale — lascia vuoto per auto-detect)</label>
                                      <input
                                          type="text"
                                          value={imapHost}
                                          onChange={e => setImapHost(e.target.value)}
                                          placeholder="es. imap.miohosting.it (lascia vuoto per Gmail, Outlook, Libero, ecc.)"
                                          className="w-full bg-gray-50 border p-3 rounded-xl text-sm font-mono outline-none focus:border-amber-400"
                                      />
                                  </div>
                              </div>

                              <div className="flex gap-2">
                                  <button
                                      onClick={handleTestEmail}
                                      disabled={emailTestStatus === 'loading' || !imapEmail || !imapPassword}
                                      className={`flex-1 py-2.5 rounded-xl text-sm font-black transition flex items-center justify-center gap-2 ${
                                          emailTestStatus === 'ok' ? 'bg-emerald-500 text-white'
                                          : emailTestStatus === 'error' ? 'bg-red-500 text-white'
                                          : 'bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-40'
                                      }`}
                                  >
                                      {emailTestStatus === 'loading' ? <><Loader2 size={14} className="animate-spin"/> Verifica in corso...</>
                                       : emailTestStatus === 'ok' ? <>✓ Connessione OK</>
                                       : emailTestStatus === 'error' ? <>✗ Errore — riprova</>
                                       : <>🔌 Testa Connessione</>}
                                  </button>

                                  {emailTestStatus === 'ok' && (
                                      <button
                                          onClick={handleSyncEmail}
                                          disabled={emailSyncing}
                                          className="flex-1 py-2.5 rounded-xl text-sm font-black bg-[#00665E] text-white hover:bg-[#004d46] transition flex items-center justify-center gap-2 disabled:opacity-50"
                                      >
                                          {emailSyncing ? <><Loader2 size={14} className="animate-spin"/> Sincronizzazione...</> : <>📥 Sincronizza ora</>}
                                      </button>
                                  )}
                              </div>

                              {emailTestMsg && (
                                  <p className={`text-xs mt-2 font-bold px-1 ${emailTestStatus === 'error' ? 'text-red-500' : 'text-emerald-600'}`}>{emailTestMsg}</p>
                              )}
                              {emailSyncMsg && (
                                  <p className="text-xs mt-1 font-bold px-1 text-[#00665E]">{emailSyncMsg}</p>
                              )}
                              <p className="text-[10px] text-gray-400 mt-3 font-medium">💾 Salva Tutto per persistere le credenziali. IntegraOS non potrà leggere le email già lette in precedenza.</p>
                          </div>

                          {/* VOICE AI BUDGETING */}
                          <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100 shadow-sm mt-4">
                              <h4 className="font-black text-emerald-900 mb-2 flex items-center gap-2"><Mic size={20}/> Call Center Voice AI (Autonomo)</h4>
                              <p className="text-xs text-emerald-700 mb-6 leading-relaxed">Imposta un tetto massimo di spesa per il tuo centralino pilotato dall'Intelligenza Artificiale. Il costo per te è di circa <b>7€ / ora</b> di chiamate effettive. Se la soglia viene superata, i workflow automatici smetteranno di fare chiamate in uscita.</p>
                              
                              <div className="flex flex-col md:flex-row items-center gap-6 bg-white p-4 rounded-xl border border-emerald-200">
                                  <div className="w-full md:w-1/2">
                                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Tetto Massimo di Sicurezza Mensile (€)</label>
                                      <div className="relative">
                                          <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-500">€</span>
                                          <input type="number" min="10" step="5" className="w-full bg-gray-50 border p-3 pl-8 rounded-xl font-bold outline-none focus:border-emerald-500 transition text-gray-900" value={formData.voice_budget_limit} onChange={e => setFormData({...formData, voice_budget_limit: parseFloat(e.target.value) || 0})}/>
                                      </div>
                                  </div>

                                  <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-2">
                                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Spesa Corrente (Questo Mese)</p>
                                      <div className="flex items-end gap-2">
                                          <span className="text-2xl font-black text-emerald-600">€ {Number(formData.voice_current_spend || 0).toFixed(2)}</span>
                                          <span className="text-sm font-bold text-gray-400 mb-1">/ € {formData.voice_budget_limit}</span>
                                      </div>
                                      <div className="w-full bg-gray-100 h-2 rounded-full mt-2 overflow-hidden">
                                          <div className={`h-full ${formData.voice_current_spend >= formData.voice_budget_limit ? 'bg-red-500' : 'bg-emerald-500'}`} style={{width: `${Math.min((formData.voice_current_spend / (formData.voice_budget_limit || 1)) * 100, 100)}%`}}></div>
                                      </div>
                                  </div>
                              </div>
                          </div>

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