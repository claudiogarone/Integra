'use client'

import { createClient } from '../../../utils/supabase/client'
import { useEffect, useState, useRef } from 'react'
import { toPng } from 'html-to-image'
import { 
    Settings, Download, Share2, MapPin, 
    Image as ImageIcon, Type, Sparkles, Send, 
    Loader2, CheckCircle2, Copy, Radio, Tv, Map as MapIcon, Newspaper, BrainCircuit, Activity, Search, Plus, Trash2, Globe, X, Edit3, Target, Calendar, ShieldAlert
} from 'lucide-react'

export default function LaunchpadPage() {
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [exporting, setExporting] = useState(false)
  
  const [user, setUser] = useState<any>(null)
  const [userData, setUserData] = useState<any>({})
  const [activeTab, setActiveTab] = useState<'flyer' | 'qr' | 'radar'>('flyer')
  const [currentPlan, setCurrentPlan] = useState('Base')

  // LIMITI E CONTATORI
  const aiMediaPlanLimits: any = { 'Base': 3, 'Enterprise': 20, 'Ambassador': 'Illimitati' }
  const qrLimits: any = { 'Base': 2, 'Enterprise': 10, 'Ambassador': 999 }
  const [mediaPlansUsed, setMediaPlansUsed] = useState(0)
  
  const flyerRef = useRef<HTMLDivElement>(null)
  const plannerFormRef = useRef<HTMLFormElement>(null)

  // --- DATI PRESI DA SETTINGS ---
  const [links, setLinks] = useState({ facebook: '', instagram: '', tiktok: '', google: '', whatsapp: '', website: '' })
  
  // --- QR CUSTOM DINAMICI E MODIFICA ---
  const [customQRs, setCustomQRs] = useState<{id: string, label: string, url: string}[]>([])
  const [newQRForm, setNewQRForm] = useState({ label: '', url: '' })
  const [editingQrId, setEditingQrId] = useState<string | null>(null) // STATO PER LA MODIFICA

  // --- STATI PER PERSONALIZZAZIONE FLYER ---
  const [customTitle, setCustomTitle] = useState('')
  const [customDesc, setCustomDesc] = useState('')
  const [bgImage, setBgImage] = useState<string | null>(null)
  const [format, setFormat] = useState<'A4' | 'Post' | 'Story'>('A4')
  const [flyerConfig, setFlyerConfig] = useState({ target: 'Generico', zona: 'Locale', settore: 'B2C' })
  const [aiCopyLoading, setAiCopyLoading] = useState(false)

  // --- STATI RADAR MEDIA LOCALI ---
  const [searchCity, setSearchCity] = useState('')
  const [isScanning, setIsScanning] = useState(false)
  const [localMedia, setLocalMedia] = useState<any[]>([])
  
  const [budget, setBudget] = useState('')
  const [isPlanning, setIsPlanning] = useState(false)
  const [mediaPlan, setMediaPlan] = useState<any>(null)
  
  const [selectedPartner, setSelectedPartner] = useState<string>('')

  const supabase = createClient()

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return;
      setUser(user)

      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data) {
        setUserData(data)
        setCurrentPlan(data.plan || 'Base')
        setMediaPlansUsed(data.media_plans_used || 0)
        setSearchCity(data.city || 'Milano') 
        setLinks({
          facebook: data.social_links?.facebook || '',
          instagram: data.social_links?.instagram || '',
          tiktok: data.social_links?.tiktok || '',
          google: data.google_review_link || data.social_links?.google || '',
          whatsapp: data.whatsapp_number || '',
          website: data.websites?.main || ''
        })
        setCustomQRs(data.social_links?.custom_qrs || [])
      }
      setLoading(false)
    }
    getData()
  }, [supabase])

  // ==========================================
  // LOGICA QR CODE PERSONALIZZATI MIGLIORATA
  // ==========================================
  const handleSaveCustomQR = async () => {
      if(!newQRForm.label || !newQRForm.url) return alert("Inserisci Nome e URL validi.");
      
      let newQRs = [];
      
      if (editingQrId) {
          // MODIFICA ESISTENTE
          newQRs = customQRs.map(qr => qr.id === editingQrId ? { ...qr, label: newQRForm.label, url: newQRForm.url } : qr);
      } else {
          // CREAZIONE NUOVO (Controllo Limiti Reale)
          const limit = qrLimits[currentPlan] || 2;
          if (customQRs.length >= limit) return alert(`⚠️ Limite raggiunto. Il tuo piano ${currentPlan} permette la creazione di massimo ${limit} QR Custom.`);
          newQRs = [...customQRs, { id: Date.now().toString(), label: newQRForm.label, url: newQRForm.url }];
      }

      setCustomQRs(newQRs);
      setNewQRForm({ label: '', url: '' });
      setEditingQrId(null);

      // Salva nel DB
      const updatedSocialLinks = { ...(userData.social_links || {}), custom_qrs: newQRs };
      await supabase.from('profiles').update({ social_links: updatedSocialLinks }).eq('id', user.id);
  }

  const handleEditCustomQR = (qr: any) => {
      setNewQRForm({ label: qr.label, url: qr.url });
      setEditingQrId(qr.id);
      window.scrollTo({ top: 0, behavior: 'smooth' }); // Scorre in alto per comodità
  }

  const handleDeleteCustomQR = async (id: string) => {
      if(!confirm("Vuoi davvero eliminare questo QR Code?")) return;
      const newQRs = customQRs.filter(qr => qr.id !== id);
      setCustomQRs(newQRs);
      if(editingQrId === id) { setEditingQrId(null); setNewQRForm({label:'', url:''}); }
      const updatedSocialLinks = { ...(userData.social_links || {}), custom_qrs: newQRs };
      await supabase.from('profiles').update({ social_links: updatedSocialLinks }).eq('id', user.id);
  }

  // ==========================================
  // LOGICA STUDIO GRAFICO E AI
  // ==========================================
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if(file) setBgImage(URL.createObjectURL(file))
  }

  const handleAiCopy = async () => {
      setAiCopyLoading(true)
      try {
          const res = await fetch('/api/ai/launchpad', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  type: 'copy',
                  target: flyerConfig.target,
                  settore: flyerConfig.settore,
                  companyName: userData.company_name
              })
          });
          const data = await res.json();
          if (data.title) setCustomTitle(data.title);
          if (data.desc) setCustomDesc(data.desc);
      } catch (err) {
          alert("Errore generazione testo AI.");
      } finally {
          setAiCopyLoading(false)
      }
  }

  const downloadFlyer = async () => {
    if (flyerRef.current === null) return; setGenerating(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const dataUrl = await toPng(flyerRef.current, { cacheBust: false, pixelRatio: 2, quality: 1 })
      const link = document.createElement('a')
      link.download = `creativita-${format}-${userData.company_name || 'integra'}.png`
      link.href = dataUrl; link.click()
    } catch (err: any) { 
      alert("Errore nella generazione dell'immagine: " + err.message) 
    } finally { 
      setGenerating(false) 
    }
  }

  const exportSocialKit = async () => {
      if(flyerRef.current === null) return;
      setExporting(true)
      try {
          await new Promise(resolve => setTimeout(resolve, 300));
          const dataUrl = await toPng(flyerRef.current, { cacheBust: false, pixelRatio: 2, quality: 1 })
          const link = document.createElement('a')
          link.download = `post-social-${format}-${userData.company_name || 'azienda'}.png`
          link.href = dataUrl; link.click()

          const companyHashtag = userData.company_name ? `#${userData.company_name.replace(/\s+/g, '')}` : '#Business'
          const fullText = `${customTitle || getFlyerDesign().title}\n\n${customDesc || getFlyerDesign().sub}\n\n${companyHashtag} #Novità #Social`
          await navigator.clipboard.writeText(fullText)
          alert("✅ KIT PRONTO!\n\n1. L'immagine in alta risoluzione è stata scaricata.\n2. Il testo del post è stato COPIATO negli appunti.\n\n👉 Vai su Instagram o Facebook e fai 'Incolla'!")
      } catch (err: any) { 
          alert("Errore esportazione: " + err.message) 
      } finally { 
          setExporting(false) 
      }
  }

  // ==========================================
  // LOGICA RADAR MEDIA LOCALI
  // ==========================================
  const scanLocalMedia = async (e: React.FormEvent) => {
      e.preventDefault()
      setIsScanning(true)
      setLocalMedia([]) 
      setSelectedPartner('') 
      setMediaPlan(null) 
      
      try {
          const res = await fetch('/api/ai/launchpad', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ type: 'radar', city: searchCity, plan: currentPlan })
          });
          const data = await res.json();
          
          if(data.media) {
              const formattedMedia = data.media.map((m:any) => ({
                  ...m,
                  icon: m.type === 'Radio' ? <Radio/> : m.type === 'Stampa' ? <Newspaper/> : m.type === 'Outdoor' ? <MapIcon/> : <Tv/>
              }));
              setLocalMedia(formattedMedia);
          } else {
             throw new Error("Dati media non ricevuti")
          }
      } catch(e) {
          alert("Errore scansione AI. Riprova tra poco.");
      } finally {
          setIsScanning(false);
      }
  }

  const handleSelectPartner = (partnerName: string) => {
      setSelectedPartner(partnerName);
      setBudget(budget || '1000'); // Se non c'è budget, ne mette uno sensato
      if(plannerFormRef.current) {
          plannerFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Animazione per far capire dove guardare
          plannerFormRef.current.classList.add('ring-4', 'ring-[#00665E]', 'ring-offset-2', 'rounded-xl');
          setTimeout(() => plannerFormRef.current?.classList.remove('ring-4', 'ring-[#00665E]', 'ring-offset-2', 'rounded-xl'), 1500);
      }
  }

  const handleDiscoverPartner = async (media: any) => {
      try {
          const res = await fetch('/api/launchpad/discover', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  partnerId: media.id,
                  displayName: media.display_name,
                  type: media.type,
                  city: searchCity,
                  companyName: userData.company_name
              })
          });
          const data = await res.json();
          if (data.success) {
              alert("📩 RICHIESTA INVIATA!\n\nAbbiamo ricevuto la tua richiesta per scoprire l'identità di: " + media.display_name + ".\n\nIl team di IntegraOS ti contatterà via email entro 24h con i dettagli e il listino prezzi aggiornato.");
          } else {
              throw new Error(data.error);
          }
      } catch (err: any) {
          alert("Errore invio richiesta: " + err.message);
      }
  }

  const generateMediaPlan = async (e: React.FormEvent) => {
      e.preventDefault()
      if (currentPlan !== 'Ambassador' && mediaPlansUsed >= aiMediaPlanLimits[currentPlan]) {
          return alert(`⚠️ Hai esaurito i ${aiMediaPlanLimits[currentPlan]} Media Plan mensili del piano ${currentPlan}. Effettua l'upgrade!`)
      }

      setIsPlanning(true)
      try {
          const res = await fetch('/api/ai/launchpad', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  type: 'mediaplan',
                  city: searchCity,
                  budget: budget,
                  companyName: userData.company_name,
                  selectedPartner: selectedPartner
              })
          });

          const aiPlan = await res.json();
          if (aiPlan.error) throw new Error(aiPlan.error);

          setMediaPlan(aiPlan);

          const newUsage = mediaPlansUsed + 1;
          await supabase.from('profiles').update({ media_plans_used: newUsage }).eq('id', user.id);
          setMediaPlansUsed(newUsage);
          
          setSelectedPartner('');
      } catch (err: any) {
          alert("Errore generazione Media Plan: " + err.message);
      } finally {
          setIsPlanning(false)
      }
  }

  const downloadMediaPlan = () => {
      let content = `INTEGRA OS - MEDIA PLAN STRATEGICO\nZona: ${searchCity} | Budget Ottimizzato: €${budget}\n\n`;
      content += `=== STRATEGIA ===\n${mediaPlan.strategy}\n\n`;
      content += `=== ALLOCAZIONE BUDGET ===\n${mediaPlan.allocations.map((a:any) => `- ${a.channel}: €${a.amount} (Ritorno stimato: ${a.roi})`).join('\n')}\n\n`;
      if(mediaPlan.weekly_plan) {
          content += `=== PIANO D'AZIONE MENSILE ===\n${mediaPlan.weekly_plan.map((w:any) => `[${w.week}]: ${w.action}`).join('\n\n')}\n\n`;
      }
      content += `Documento generato dall'AI di IntegraOS.`;
      
      const blob = new Blob([content], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `MediaPlan_Dettagliato_${searchCity}.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
  }

  const getQR = (url: string) => url ? `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(url)}` : null

  const getFlyerDesign = () => {
      if(flyerConfig.target === 'Giovani') return { bg: 'from-fuchsia-600 to-violet-600', text: 'text-white', title: 'Unisciti alla Community 🚀', sub: 'Scannerizza e scopri le ultime vibes!' }
      if(flyerConfig.target === 'VIP') return { bg: 'from-slate-900 via-gray-900 to-black', text: 'text-yellow-400', title: 'Servizio Esclusivo ✨', sub: 'Inquadra per accedere ai vantaggi privati.' }
      if(flyerConfig.settore === 'B2B') return { bg: 'from-blue-900 to-slate-800', text: 'text-white', title: 'Cresciamo Insieme 📈', sub: 'Connettiti per soluzioni business avanzate.' }
      
      return { bg: 'from-white to-gray-100', text: 'text-[#00665E]', border: 'border-8 border-[#00665E]', title: 'Resta in Contatto', sub: 'Usa la fotocamera per scoprire i canali ufficiali.' }
  }

  const design = getFlyerDesign();
  
  // Uniamo canali base + custom (Fino a max 4 elementi per il volantino)
  const allChannels = [
      { id: 'instagram', url: links.instagram, icon: '📸', label: 'Instagram' },
      { id: 'facebook', url: links.facebook, icon: '📘', label: 'Facebook' },
      { id: 'whatsapp', url: links.whatsapp, icon: '💬', label: 'WhatsApp' },
      { id: 'website', url: links.website, icon: '🌐', label: 'Sito Web' },
      ...customQRs.map(qr => ({ id: qr.id, url: qr.url, icon: '🔗', label: qr.label }))
  ].filter(c => c.url !== '')
  
  const activeChannels = allChannels.slice(0, 4); // LIMITA SEMPRE A 4 NEL VOLANTINO

  if (loading) return <div className="p-10 text-[#00665E] animate-pulse font-bold">Avvio Motore Grafico e Sincronizzazione AI...</div>

  const formatStyles = {
      'A4': { width: '210mm', height: '297mm', scale: 'scale-[0.55]' },
      'Post': { width: '1080px', height: '1080px', scale: 'scale-[0.45]' },
      'Story': { width: '1080px', height: '1920px', scale: 'scale-[0.35]' }
  }

  const isPost = format === 'Post';

  return (
    <main className="flex-1 p-8 overflow-auto bg-[#F8FAFC] text-gray-900 font-sans relative pb-20 min-h-screen">
      
      {/* HEADER E LIMITI */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-200">
        <div>
          <h1 className="text-3xl font-black text-[#00665E] tracking-tight flex items-center gap-3"><Sparkles size={32} className="text-[#00665E]"/> Launchpad Marketing</h1>
          <p className="text-gray-500 text-sm mt-1">Crea grafiche AI, genera QR Code e pianifica il budget pubblicitario sul territorio.</p>
        </div>
        
        <div className="flex flex-col items-end mt-4 md:mt-0">
            <div className="bg-[#00665E]/10 border border-[#00665E]/20 px-4 py-2 rounded-xl flex items-center gap-3 shadow-sm">
                <BrainCircuit className={currentPlan === 'Ambassador' ? "text-[#00665E]" : mediaPlansUsed >= aiMediaPlanLimits[currentPlan] * 0.9 ? "text-rose-500" : "text-[#00665E]"} size={20}/>
                <div className="flex flex-col items-start">
                    <span className="text-[9px] font-bold text-[#00665E] uppercase tracking-widest">Piani Marketing Generati</span>
                    <span className={`font-bold text-sm ${currentPlan === 'Ambassador' ? 'text-[#00665E]' : mediaPlansUsed >= aiMediaPlanLimits[currentPlan] * 0.9 ? 'text-rose-600' : 'text-[#00665E]'}`}>
                        {currentPlan === 'Ambassador' ? 'Illimitati' : `${mediaPlansUsed} / ${aiMediaPlanLimits[currentPlan]}`}
                    </span>
                </div>
            </div>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex flex-wrap gap-2 mb-8 sticky top-0 z-20 bg-[#F8FAFC] py-2">
          <button onClick={() => setActiveTab('flyer')} className={`px-5 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-2 ${activeTab === 'flyer' ? 'bg-[#00665E] text-white shadow-lg' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'}`}><ImageIcon size={16}/> Studio Grafico AI</button>
          <button onClick={() => setActiveTab('qr')} className={`px-5 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-2 ${activeTab === 'qr' ? 'bg-[#00665E] text-white shadow-lg' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'}`}><Share2 size={16}/> Cavalieri QR Code</button>
          <button onClick={() => setActiveTab('radar')} className={`px-5 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-2 ${activeTab === 'radar' ? 'bg-[#00665E] text-white shadow-lg' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'}`}><MapPin size={16}/> Radar & Media Planner AI</button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: STUDIO GRAFICO E VOLANTINI                           */}
      {/* ========================================================= */}
      {activeTab === 'flyer' && (
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start animate-in fade-in">
        
        <div className="xl:col-span-5 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm relative overflow-hidden">
                <h2 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2"><Type size={20} className="text-[#00665E]"/> Contenuto Grafica</h2>
                
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Formato Output</label>
                        <div className="flex gap-2 bg-gray-50 p-1 rounded-xl">
                            {['A4', 'Post', 'Story'].map(f => (
                                <button key={f} onClick={() => setFormat(f as any)} className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${format === f ? 'bg-white shadow text-[#00665E]' : 'text-gray-500 hover:text-gray-800'}`}>{f === 'A4' ? 'Stampa (A4)' : f === 'Post' ? 'Quadrato' : 'Story'}</button>
                            ))}
                        </div>
                    </div>

                    <div className="border-t border-gray-100 pt-4 pb-2">
                        <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Stile e Target per il Copywriter AI</label>
                        <div className="grid grid-cols-3 gap-2">
                            {['Generico', 'Giovani', 'VIP'].map(t => (
                                <button key={t} onClick={() => setFlyerConfig({...flyerConfig, target: t})} className={`p-2 rounded-lg text-xs font-bold border transition ${flyerConfig.target === t ? 'bg-[#00665E] text-white border-[#00665E]' : 'bg-gray-50 text-gray-600'}`}>{t}</button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Titolo</label>
                            <button onClick={handleAiCopy} disabled={aiCopyLoading} className="text-[10px] text-[#00665E] bg-[#00665E]/10 px-2 py-1 rounded font-bold flex items-center gap-1 hover:bg-[#00665E]/20 disabled:opacity-50">
                                {aiCopyLoading ? <Loader2 size={10} className="animate-spin"/> : <Sparkles size={10}/>} Genera con AI
                            </button>
                        </div>
                        <input type="text" value={customTitle} onChange={e=>setCustomTitle(e.target.value)} placeholder="Es: Grande Apertura!" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:border-[#00665E] transition" />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Testo / Descrizione</label>
                        <textarea value={customDesc} onChange={e=>setCustomDesc(e.target.value)} placeholder="Descrivi l'offerta..." className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-medium text-sm outline-none focus:border-[#00665E] h-20 resize-none transition" />
                    </div>

                    <div className="pt-2">
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Immagine Sfondo Personalizzata</label>
                        {bgImage && (
                            <div className="flex items-center gap-2 mb-2">
                                <img src={bgImage} className="w-10 h-10 rounded-md object-cover border"/>
                                <button onClick={() => setBgImage(null)} className="text-xs text-red-500 font-bold hover:underline">Rimuovi</button>
                            </div>
                        )}
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer" />
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm text-gray-900">
                <h2 className="text-lg font-black mb-2 flex items-center gap-2"><Send size={20} className="text-[#00665E]"/> Esportazione Pronta All'Uso</h2>
                <p className="text-xs text-gray-500 mb-6">Scarica la grafica e copia il testo ottimizzato in automatico per incollarlo nei tuoi profili social.</p>

                <div className="space-y-4">
                    <button onClick={exportSocialKit} disabled={exporting} className="w-full bg-[#00665E] text-white font-bold py-4 rounded-xl hover:bg-[#004d46] transition shadow-lg shadow-[#00665E]/20 flex items-center justify-center gap-2 text-sm disabled:opacity-50">
                        {exporting ? <Loader2 className="animate-spin" size={18}/> : <><Copy size={18}/> Esporta Kit Social (Img + Testo)</>}
                    </button>
                    
                    <button onClick={downloadFlyer} disabled={generating} className="w-full bg-gray-100 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-200 transition flex items-center justify-center gap-2 text-sm border border-gray-200">
                        {generating ? <Loader2 className="animate-spin" size={16}/> : <><Download size={16}/> Scarica Solo Immagine PNG</>}
                    </button>
                </div>
            </div>
        </div>

        {/* ANTEPRIMA GRAFICA OTTIMIZZATA CON GRIGLIE FIXATE */}
        <div className="xl:col-span-7 flex justify-center bg-gray-200/50 p-8 rounded-3xl border border-gray-200 overflow-hidden shadow-inner min-h-[700px] items-center relative">
            {activeChannels.length === 0 && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center text-center p-8">
                    <Settings size={48} className="text-gray-400 mb-4"/>
                    <h3 className="text-2xl font-black text-gray-800 mb-2">Nessun Canale Collegato</h3>
                    <p className="text-gray-600 font-medium max-w-md mx-auto">Inserisci i link nel Tab "Cavalieri QR Code" o in Impostazioni per popolare questa grafica con i tuoi codici scansionabili.</p>
                </div>
            )}

            <div className={`relative shadow-2xl transition-all duration-500 hover:scale-[0.57] ${formatStyles[format].scale} overflow-hidden`} style={{width: formatStyles[format].width, height: formatStyles[format].height, transformOrigin: 'center center'}}>
                
                <div ref={flyerRef} className={`w-full h-full flex flex-col relative overflow-hidden bg-gradient-to-br ${design.bg} ${design.border || ''}`}>
                    {bgImage && <img src={bgImage} alt="Background" className="absolute inset-0 w-full h-full object-cover opacity-60 z-0" crossOrigin="anonymous" />}
                    
                    <div className={`text-center z-10 relative ${isPost ? 'p-10 pt-16' : 'p-16 pt-24'}`}>
                        {userData.logo_url ? (
                            <img src={userData.logo_url} alt="Logo" className={`${isPost ? 'h-24 mb-6' : 'h-40 mb-12'} object-contain mx-auto bg-white/20 backdrop-blur-md rounded-3xl p-4 shadow-2xl`} crossOrigin="anonymous"/>
                        ) : (
                            <div className={`${isPost ? 'w-20 h-20 mb-6 text-2xl' : 'w-32 h-32 mb-12 text-4xl'} bg-white/20 backdrop-blur-sm rounded-3xl mx-auto flex items-center justify-center shadow-lg`}>🏢</div>
                        )}
                        <h1 className={`font-black uppercase tracking-tight ${isPost ? 'mb-4' : 'mb-6'} ${design.text} drop-shadow-lg leading-tight ${isPost ? 'text-6xl' : format === 'A4' ? 'text-7xl' : 'text-8xl'}`}>
                            {customTitle || design.title}
                        </h1>
                        <p className={`font-medium opacity-90 mx-auto ${design.text} ${isPost ? 'text-2xl max-w-2xl line-clamp-2' : format === 'A4' ? 'text-3xl max-w-2xl' : 'text-4xl max-w-3xl'}`}>
                            {customDesc || design.sub}
                        </p>
                    </div>

                    {/* GRIGLIA DINAMICA CHE NON TRANCIA MAI */}
                    <div className={`flex-1 flex flex-col justify-center items-center z-10 w-full relative ${isPost ? 'px-10 pb-6' : 'p-16'}`}>
                        <div className={`grid w-full ${
                            activeChannels.length === 1 ? 'grid-cols-1 max-w-sm mx-auto' : 
                            activeChannels.length === 2 ? 'grid-cols-2 max-w-3xl mx-auto gap-8' : 
                            (isPost ? 'grid-cols-2 gap-4 max-w-2xl mx-auto' : 'grid-cols-2 gap-10 max-w-4xl mx-auto') // 3 o 4 elementi -> sempre 2x2
                        }`}>
                            {activeChannels.map((chan, i) => (
                                <div key={i} className={`flex flex-col items-center bg-white/95 backdrop-blur-sm shadow-2xl ${isPost && activeChannels.length > 2 ? 'p-6 rounded-3xl' : 'p-10 rounded-[3rem]'}`}>
                                    <img src={getQR(chan.url)!} alt={chan.label} className={`w-full aspect-square mix-blend-multiply ${isPost && activeChannels.length > 2 ? 'mb-4' : 'mb-8'}`} crossOrigin="anonymous"/>
                                    <div className={`flex items-center justify-center gap-2 font-black text-gray-900 truncate w-full ${isPost && activeChannels.length > 2 ? 'text-xl' : 'text-3xl'}`}>
                                        <span>{chan.icon}</span> <span className="truncate">{chan.label}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className={`mt-auto text-center z-10 bg-black/10 backdrop-blur-md relative ${isPost ? 'p-8' : 'p-16'}`}>
                        <h3 className={`${isPost ? 'text-3xl' : 'text-4xl'} font-black tracking-widest uppercase ${design.text}`}>{userData.company_name || 'La Tua Azienda'}</h3>
                        <div className={`mt-4 flex justify-center font-bold opacity-90 ${design.text} ${isPost ? 'text-lg gap-6' : 'text-2xl gap-10'}`}>
                            {userData.city && <span>📍 {userData.city}</span>}
                            {links.whatsapp && <span>📞 {links.whatsapp}</span>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: SINGOLI QR CODE & CREATORE QR CUSTOM CON MODIFICA    */}
      {/* ========================================================= */}
      {activeTab === 'qr' && (
          <div className="space-y-6 animate-in fade-in">
              <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                      <div>
                          <h3 className="font-black text-2xl text-gray-900 flex items-center gap-2"><Share2 className="text-[#00665E]"/> Gestione e Cavalieri QR Code</h3>
                          <p className="text-sm text-gray-500 mt-1">Scarica i codici ad alta definizione o crea nuovi link personalizzati (es. Menu Digitale, Promozioni).</p>
                      </div>
                      <div className="bg-[#00665E]/10 text-[#00665E] px-4 py-2 rounded-xl text-xs font-bold border border-[#00665E]/20 shadow-sm">
                          QR Personalizzati Creati: <span className="text-lg">{customQRs.length}</span> / {qrLimits[currentPlan] === 999 ? '∞' : qrLimits[currentPlan]}
                      </div>
                  </div>
                  
                  {/* AGGIUNTA / MODIFICA QR PERSONALIZZATO */}
                  <div className={`border p-6 rounded-2xl mb-8 flex flex-col md:flex-row gap-4 items-end transition-all ${editingQrId ? 'bg-amber-50 border-amber-300 ring-4 ring-amber-100' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex-1 w-full">
                          <label className="text-[10px] font-bold text-gray-500 uppercase flex justify-between">
                              Nome/Etichetta (es. Menu)
                              {editingQrId && <span className="text-amber-600 font-black">Modalità Modifica Attiva</span>}
                          </label>
                          <input type="text" placeholder="Es. Scarica il nostro Menu" value={newQRForm.label} onChange={e => setNewQRForm({...newQRForm, label: e.target.value})} className={`w-full mt-1 p-3 rounded-xl border outline-none font-bold ${editingQrId ? 'focus:border-amber-500 border-amber-200' : 'focus:border-[#00665E] focus:ring-4 focus:ring-[#00665E]/10'}`} />
                      </div>
                      <div className="flex-1 w-full">
                          <label className="text-[10px] font-bold text-gray-500 uppercase">Link URL di destinazione</label>
                          <input type="url" placeholder="https://..." value={newQRForm.url} onChange={e => setNewQRForm({...newQRForm, url: e.target.value})} className={`w-full mt-1 p-3 rounded-xl border outline-none text-[#00665E] font-mono text-sm ${editingQrId ? 'focus:border-amber-500 border-amber-200' : 'focus:border-[#00665E] focus:ring-4 focus:ring-[#00665E]/10'}`} />
                      </div>
                      <div className="flex gap-2 w-full md:w-auto">
                          {editingQrId && (
                              <button onClick={() => { setEditingQrId(null); setNewQRForm({label:'', url:''}); }} className="bg-white text-gray-600 border border-gray-300 font-bold px-4 py-3.5 rounded-xl hover:bg-gray-100 transition shadow-sm flex items-center justify-center">
                                  Annulla
                              </button>
                          )}
                          <button onClick={handleSaveCustomQR} className={`${editingQrId ? 'bg-amber-500 hover:bg-amber-600' : 'bg-[#00665E] hover:bg-[#004d46]'} text-white font-bold px-6 py-3.5 rounded-xl transition shadow-md w-full md:w-auto flex items-center justify-center gap-2`}>
                              {editingQrId ? <><CheckCircle2 size={18}/> Salva Modifiche</> : <><Plus size={18}/> Aggiungi QR</>}
                          </button>
                      </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                      {/* Canali predefiniti */}
                      {links.instagram && <QRCodeCard url={links.instagram} icon="📸" label="Instagram" color="text-pink-600" />}
                      {links.facebook && <QRCodeCard url={links.facebook} icon="📘" label="Facebook" color="text-blue-600" />}
                      {links.whatsapp && <QRCodeCard url={`https://wa.me/${links.whatsapp}`} icon="💬" label="WhatsApp" color="text-green-500" />}
                      {links.google && <QRCodeCard url={links.google} icon="⭐" label="Recensioni" color="text-yellow-600" />}
                      {links.tiktok && <QRCodeCard url={links.tiktok} icon="🎵" label="TikTok" color="text-black" />}
                      {links.website && <QRCodeCard url={links.website} icon="🌐" label="Sito Web" color="text-slate-600" />}
                      
                      {/* Canali Custom con Modifica ed Elimina */}
                      {customQRs.map(qr => (
                          <div key={qr.id} className="relative group">
                              <div className="absolute -top-3 -right-3 flex gap-1 z-10 opacity-0 group-hover:opacity-100 transition">
                                  <button onClick={() => handleEditCustomQR(qr)} className="bg-amber-500 text-white p-2 rounded-full shadow-lg hover:scale-110" title="Modifica"><Edit3 size={14}/></button>
                                  <button onClick={() => handleDeleteCustomQR(qr.id)} className="bg-red-500 text-white p-2 rounded-full shadow-lg hover:scale-110" title="Elimina"><Trash2 size={14}/></button>
                              </div>
                              <QRCodeCard url={qr.url} icon="🔗" label={qr.label} color="text-[#00665E]" />
                          </div>
                      ))}
                  </div>
                  
                  {Object.values(links).every(l => l === '') && customQRs.length === 0 && (
                      <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-3xl mt-4">
                          <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"><Settings size={32} className="text-gray-400"/></div>
                          <h4 className="font-bold text-gray-800 text-lg">Nessun Link Configurato</h4>
                          <p className="text-gray-500 text-sm mt-2">Aggiungi un QR Custom qui sopra, oppure vai in Impostazioni per inserire i tuoi social principali.</p>
                      </div>
                  )}
              </div>
          </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: RADAR MEDIA LOCALI E AI MEDIA PLANNER                */}
      {/* ========================================================= */}
      {activeTab === 'radar' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in">
              
              {/* RADAR CONFIGURATION E AI INPUT */}
              <div className="lg:col-span-5 space-y-6">
                  <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-[#00665E]/10 rounded-full blur-3xl pointer-events-none"></div>
                      <h2 className="text-xl font-black text-gray-900 mb-2 relative z-10 flex items-center gap-2"><MapPin className="text-[#00665E]"/> Cerca Editori Locali</h2>
                      <p className="text-sm text-gray-500 mb-6 relative z-10">L'Intelligenza Artificiale analizzerà il territorio della città indicata per suggerirti i migliori partner pubblicitari locali.</p>

                      <form onSubmit={scanLocalMedia} className="relative z-10 flex gap-2">
                          <input type="text" required value={searchCity} onChange={e=>setSearchCity(e.target.value)} placeholder="Es. Roma, Milano, Napoli..." className="flex-1 bg-gray-50 border border-gray-200 p-3 rounded-xl outline-none focus:border-[#00665E] focus:ring-4 focus:ring-[#00665E]/10 font-bold text-sm"/>
                          <button type="submit" disabled={isScanning || !searchCity} className="bg-[#00665E] text-white font-bold px-6 py-3 rounded-xl hover:bg-[#004d46] transition disabled:opacity-50 flex items-center gap-2 shadow-md">
                              {isScanning ? <Loader2 size={16} className="animate-spin"/> : <Search size={16}/>} Scansiona AI
                          </button>
                      </form>
                  </div>

                  {/* MEDIA PLANNER AI */}
                  <div className="bg-white border-2 border-[#00665E]/20 rounded-3xl p-6 shadow-sm text-gray-900 relative overflow-hidden">
                      <BrainCircuit className="absolute -right-4 -bottom-4 text-[#00665E]/10" size={120}/>
                      <h2 className="text-xl font-black mb-2 flex items-center gap-2 relative z-10 text-gray-900"><Sparkles className="text-[#00665E]"/> AI Media Planner Mensile</h2>
                      <p className="text-xs text-gray-500 mb-4 relative z-10 leading-relaxed">Inserisci il budget mensile. L'AI genererà una strategia di allocazione fondi e un piano d'azione per le 4 settimane del mese ottimizzato per il ROI.</p>

                      <form ref={plannerFormRef} onSubmit={generateMediaPlan} className="relative z-10 transition-all p-1">
                          
                          {/* MOSTRA PARTNER SELEZIONATO SE PRESENTE */}
                          {selectedPartner && (
                              <div className="bg-[#00665E]/10 border border-[#00665E]/20 p-4 rounded-xl mb-4 flex items-center justify-between shadow-inner">
                                  <div>
                                      <p className="text-[10px] text-[#00665E] font-bold uppercase tracking-widest flex items-center gap-1"><Target size={12}/> Partner Inserito a Forza</p>
                                      <p className="text-sm font-bold text-gray-900 mt-1">{selectedPartner}</p>
                                  </div>
                                  <button type="button" onClick={() => setSelectedPartner('')} className="text-gray-400 hover:text-rose-500 bg-white p-2 rounded-lg transition border border-gray-200"><X size={16}/></button>
                              </div>
                          )}

                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Budget Mensile (€)</label>
                          <input type="number" required min="100" value={budget} onChange={e=>setBudget(e.target.value)} placeholder="Es. 1500" className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl outline-none focus:border-[#00665E] font-black text-2xl text-gray-900 mb-4 shadow-inner"/>
                          <button type="submit" disabled={isPlanning || !budget} className="w-full bg-[#00665E] text-white font-black py-4 rounded-xl hover:bg-[#004d46] transition shadow-[0_10px_30px_rgba(0,102,94,0.2)] flex justify-center items-center gap-2 disabled:opacity-50">
                              {isPlanning ? <Loader2 size={18} className="animate-spin"/> : <Activity size={18}/>} Genera Masterplan AI
                          </button>
                      </form>
                  </div>
              </div>

              {/* RISULTATI RADAR E PLANNER */}
              <div className="lg:col-span-7 flex flex-col h-full space-y-6">
                  
                  {/* RISULTATO MEDIA PLANNER AI (CON LE SETTIMANE!) */}
                  {mediaPlan && (
                      <div className="bg-white border border-[#00665E]/20 rounded-3xl p-8 shadow-md animate-in slide-in-from-top-4">
                          <div className="flex justify-between items-start border-b border-gray-100 pb-4 mb-6">
                              <div>
                                  <h3 className="font-black text-2xl text-[#00665E] flex items-center gap-2"><CheckCircle2 className="text-emerald-500"/> Masterplan Elaborato</h3>
                                  <p className="text-sm font-bold text-[#00665E] mt-1">Focus Zona: {searchCity} | Budget: €{budget}</p>
                              </div>
                              <button onClick={downloadMediaPlan} className="text-[#00665E] hover:bg-[#00665E]/10 p-3 rounded-xl transition font-bold text-sm flex items-center gap-2 shadow-sm border border-[#00665E]/20"><Download size={16}/> Salva TXT</button>
                          </div>
                          
                          <div className="mb-8">
                              <h4 className="text-xs font-black uppercase text-gray-400 tracking-widest mb-3">Analisi Strategica</h4>
                              <p className="text-sm font-medium text-gray-700 leading-relaxed bg-[#00665E]/10/50 p-5 rounded-2xl border border-[#00665E]/20">{mediaPlan.strategy}</p>
                          </div>

                          <div className="mb-8">
                              <h4 className="text-xs font-black uppercase text-gray-400 tracking-widest mb-3">Allocazione Fondi Suggerita</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {mediaPlan.allocations?.map((item:any, i:any) => (
                                      <div key={i} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:border-[#00665E]/30 transition">
                                          <p className="font-bold text-gray-900 text-sm flex items-center gap-2 line-clamp-1" title={item.channel}>
                                              <span className="w-2 h-2 rounded-full bg-[#00665E]/100 inline-block shrink-0"></span> 
                                              {item.channel}
                                          </p>
                                          <div className="flex justify-between items-end mt-3">
                                              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">ROI: {item.roi}</span>
                                              <span className="font-black text-lg text-[#00665E]">€ {item.amount}</span>
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          </div>

                          {/* NUOVO: PIANO SETTIMANALE */}
                          {mediaPlan.weekly_plan && (
                              <div>
                                  <h4 className="text-xs font-black uppercase text-gray-400 tracking-widest mb-3 flex items-center gap-2"><Calendar size={14}/> Roadmap Mensile (Action Plan)</h4>
                                  <div className="space-y-3 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-[#00665E]/10 before:via-[#00665E]/20 before:to-transparent">
                                      {mediaPlan.weekly_plan.map((step:any, i:number) => (
                                          <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                                              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-[#00665E]/100 text-white shadow-md shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 relative z-10 text-xs font-black">
                                                  W{i+1}
                                              </div>
                                              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition">
                                                  <h5 className="font-black text-[#00665E] text-sm mb-1">{step.week}</h5>
                                                  <p className="text-xs text-gray-600 leading-relaxed font-medium">{step.action}</p>
                                              </div>
                                          </div>
                                      ))}
                                  </div>
                              </div>
                          )}
                      </div>
                  )}

                  {/* RISULTATO RADAR AI REALE */}
                  <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm flex-1 flex flex-col">
                      <h3 className="font-black text-gray-900 mb-6 flex items-center gap-2"><MapPin className="text-gray-400"/> Editori Locali {searchCity ? `suggeriti per ${searchCity}` : ''}</h3>
                      
                      {!isScanning && localMedia.length === 0 && (
                          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 opacity-50 py-10 text-center">
                              <MapIcon size={48} className="mb-4 mx-auto"/>
                              <p className="font-bold">Inserisci la città nel pannello di sinistra per chiedere all'AI i partner migliori sul tuo territorio.</p>
                          </div>
                      )}

                      {isScanning && (
                          <div className="flex-1 flex flex-col items-center justify-center text-[#00665E] py-10">
                              <Loader2 size={40} className="animate-spin mb-4"/>
                              <p className="font-bold">L'Intelligenza Artificiale sta mappando il territorio locale...</p>
                          </div>
                      )}

                      {localMedia.length > 0 && !isScanning && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in">
                              {localMedia.map(media => (
                                  <div key={media.id} className="p-4 rounded-2xl border border-gray-100 bg-gray-50 flex flex-col justify-between gap-4 group hover:bg-white hover:border-[#00665E]/20 hover:shadow-md transition">
                                      <div className="flex items-start gap-4">
                                          <div className="w-10 h-10 bg-white text-[#00665E] rounded-xl flex items-center justify-center shadow-sm border border-gray-100 shrink-0 group-hover:bg-[#00665E]/10 transition">
                                              {media.icon || <Globe size={20}/>}
                                          </div>
                                          <div>
                                              <h4 className="font-bold text-gray-900 text-sm leading-tight line-clamp-2" title={media.is_sponsored ? media.name : media.display_name}>
                                                  {media.is_sponsored ? (
                                                      <span className="flex items-center gap-1.5 text-blue-600">
                                                          <ShieldAlert size={14}/> {media.name}
                                                      </span>
                                                  ) : (
                                                      media.display_name
                                                  )}
                                              </h4>
                                              <p className="text-[10px] text-gray-500 font-medium mt-1 uppercase tracking-widest">{media.type}</p>
                                          </div>
                                      </div>
                                      
                                      <div className="bg-white p-3 rounded-xl border border-gray-100 text-xs">
                                          <div className="flex justify-between mb-1"><span className="text-gray-500">Copertura:</span><span className="font-bold text-gray-800">{media.reach}</span></div>
                                          <div className="flex justify-between mb-1"><span className="text-gray-500">Costo:</span><span className={`font-bold ${media.cost.includes('Alto') ? 'text-rose-500' : 'text-emerald-500'}`}>{media.cost}</span></div>
                                          <div className="flex justify-between"><span className="text-gray-500">Match AI:</span><span className="font-black text-[#00665E]">{media.match}%</span></div>
                                      </div>
                                      
                                      {/* BOTTONE DINAMICO: SPONSOR VS LEAD */}
                                      {media.is_sponsored ? (
                                          <button onClick={() => handleSelectPartner(media.name)} className="w-full bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 hover:border-transparent font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-2 text-xs shadow-sm">
                                              <Target size={14}/> Includi nel Piano
                                          </button>
                                      ) : (
                                          <button onClick={() => handleDiscoverPartner(media)} className="w-full bg-[#00665E] hover:bg-[#004d46] text-white font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-2 text-xs shadow-lg shadow-[#00665E]/20">
                                              <Search size={14}/> Richiedi Identità Partner
                                          </button>
                                      )}
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>
              </div>

          </div>
      )}

    </main>
  )
}

function QRCodeCard({ url, icon, label, color }: { url: string, icon: string, label: string, color: string }) {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(url)}`
    return (
        <div className="bg-gray-50 p-6 rounded-3xl flex flex-col items-center text-center border border-gray-200 hover:border-[#00665E] hover:shadow-xl transition group h-full">
            <div className="bg-white p-2 rounded-2xl shadow-sm mb-4 w-full aspect-square border border-gray-100 overflow-hidden flex items-center justify-center">
                <img src={qrUrl} alt={label} className="max-w-full max-h-full object-contain mix-blend-multiply group-hover:scale-105 transition duration-300" crossOrigin="anonymous" />
            </div>
            <span className={`text-sm font-black uppercase ${color} mb-3 flex items-center justify-center gap-2 w-full`}><span className="text-xl">{icon}</span> {label}</span>
            <a href={qrUrl} download={`qr-${label}.png`} target="_blank" className="mt-auto text-xs text-gray-600 bg-white border border-gray-200 font-bold px-4 py-2 rounded-xl hover:bg-[#00665E] hover:text-white hover:border-[#00665E] transition w-full shadow-sm">Scarica in HD</a>
        </div>
    )
}