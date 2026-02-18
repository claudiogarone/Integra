'use client'

import { createClient } from '../../../utils/supabase/client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
// CORREZIONE IMPORT: Usiamo ../../ per puntare a app/actions
import { generateMarketingContent } from '../../actions/generate-marketing'

export default function MarketingPages() {
  const [activeTab, setActiveTab] = useState<'landing' | 'flyer'>('landing')
  const [pages, setPages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  // STATI DI GESTIONE
  const [editingId, setEditingId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [user, setUser] = useState<any>(null)
  
  // AI
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResponse, setAiResponse] = useState('')

  const supabase = createClient()

  // --- STATI DATI ---
  const initialSections = [
    { title: '', text: '', media: '' },
    { title: '', text: '', media: '' },
    { title: '', text: '', media: '' }
  ]
  const initialSocials = { facebook: '', instagram: '', tiktok: '', linkedin: '', youtube: '', email: '', website: '' }
  const initialStyle = { theme: 'modern', font: 'sans', titleColor: '#000000', textColor: '#4B5563' }
  const initialForm = {
    title: '', slug: '', description: '', 
    company_logo: '',
    show_appointments: false, show_products: false,
    cta_text: 'Contattaci', cta_link: '', slides: [] as string[]
  }

  const [sections, setSections] = useState(initialSections)
  const [clientSocials, setClientSocials] = useState(initialSocials)
  const [styleConfig, setStyleConfig] = useState(initialStyle)
  const [formData, setFormData] = useState(initialForm)

  useEffect(() => { fetchPages() }, [])

  const fetchPages = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setUser(user)
      const { data } = await supabase.from('marketing_pages').select('*').order('created_at', { ascending: false })
      if (data) setPages(data)
    }
    setLoading(false)
  }

  // --- LOGICA LIMITI & RESET ---
  const handleCreateNew = () => {
    const currentCount = pages.filter(p => p.type === activeTab).length
    const limit = activeTab === 'landing' ? 3 : 10

    if (currentCount >= limit) {
      alert(`⚠️ Hai raggiunto il limite di ${limit} ${activeTab === 'landing' ? 'Landing Pages' : 'Volantini'}. Eliminane uno per crearne di nuovi.`)
      return
    }

    // RESET COMPLETO
    setEditingId(null)
    setFormData(initialForm)
    setSections([{...initialSections[0]}, {...initialSections[1]}, {...initialSections[2]}]) 
    setClientSocials({...initialSocials})
    setStyleConfig({...initialStyle})
    setAiResponse('')
    setAiPrompt('')
    setIsModalOpen(true)
  }

  // --- LOGICA MODIFICA ---
  const handleEdit = (page: any) => {
    setEditingId(page.id)
    setActiveTab(page.type) 
    
    setFormData({
      title: page.title, slug: page.slug, description: page.subheadline || '',
      company_logo: page.company_logo || '',
      show_appointments: page.show_appointments || false,
      show_products: page.show_products || false,
      cta_text: page.cta_text || 'Contattaci',
      cta_link: page.cta_link || '',
      slides: page.slides || []
    })
    
    const loadedSections = page.sections && page.sections.length === 3 ? page.sections : initialSections
    setSections(loadedSections)
    
    setClientSocials(page.client_socials || initialSocials)
    setStyleConfig(page.style_config || initialStyle)
    
    setAiResponse('')
    setIsModalOpen(true)
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: string, index?: number) => {
    const file = e.target.files?.[0]; if (!file || !user) return
    setUploading(true)
    const fileName = `${user.id}-${Date.now()}.${file.name.split('.').pop()}`
    const { error } = await supabase.storage.from('marketing').upload(fileName, file)
    
    if (!error) {
      const { data } = supabase.storage.from('marketing').getPublicUrl(fileName)
      if (target === 'logo') setFormData({ ...formData, company_logo: data.publicUrl })
      if (target === 'flyer') setFormData({ ...formData, slides: [...formData.slides, data.publicUrl] })
      if (target === 'section' && typeof index === 'number') {
        const newSecs = sections.map((sec, i) => i === index ? { ...sec, media: data.publicUrl } : sec)
        setSections(newSecs)
      }
    } else {
        alert("Errore upload: " + error.message)
    }
    setUploading(false)
  }

  const updateSection = (index: number, field: 'title' | 'text', value: string) => {
    const newSecs = sections.map((sec, i) => i === index ? { ...sec, [field]: value } : sec)
    setSections(newSecs)
  }

  // --- FUNZIONE AI CORRETTA E ROBUSTA ---
  const askAI = async () => {
    if (!aiPrompt.trim()) return alert("Inserisci una richiesta per l'AI (es. 'Volantino per pizzeria').")
    
    setAiLoading(true)
    try {
        const typeContext = activeTab === 'landing' ? "una sezione di Landing Page" : "una descrizione introduttiva per un Volantino Digitale"
        
        // Chiamata Server Action
        const res = await generateMarketingContent(`Contesto cliente: ${aiPrompt}. Scrivi un titolo accattivante e un testo persuasivo per ${typeContext}.`)
        
        if (res.error) {
            alert("Errore AI: " + res.error)
        } else if (res.text) {
            setAiResponse(res.text)
        } else {
            alert("L'AI non ha restituito testo. Riprova.")
        }
    } catch (err: any) {
        console.error("Errore chiamata AI:", err)
        alert("Errore di connessione. Controlla la console.")
    } finally {
        setAiLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const finalSlug = formData.slug || `${formData.title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`

    const payload = {
      user_id: user.id, type: activeTab, title: formData.title, slug: finalSlug, subheadline: formData.description,
      company_logo: formData.company_logo, sections: sections, style_config: styleConfig,
      client_socials: clientSocials, show_appointments: formData.show_appointments,
      show_products: formData.show_products, slides: formData.slides,
      cta_text: formData.cta_text, cta_link: formData.cta_link
    }

    let error
    if (editingId) {
       const { error: err } = await supabase.from('marketing_pages').update(payload).eq('id', editingId)
       error = err
    } else {
       const { error: err } = await supabase.from('marketing_pages').insert(payload)
       error = err
    }

    if (!error) { fetchPages(); setIsModalOpen(false) } else { alert('Errore: ' + error.message) }
    setSaving(false)
  }

  const handleDelete = async (id: number) => {
    if(!confirm('Eliminare definitivamente?')) return
    await supabase.from('marketing_pages').delete().eq('id', id)
    fetchPages()
  }

  if (loading) return <div className="p-10 text-[#00665E] animate-pulse">Caricamento Volantini...</div>

  return (
    <main className="flex-1 p-8 overflow-auto bg-[#F8FAFC] text-gray-900 font-sans">
      <div className="flex justify-between items-center mb-8">
        <div><h1 className="text-3xl font-black text-[#00665E]">Pagine & Volantini</h1><p className="text-gray-500">Crea la vetrina della tua azienda.</p></div>
        <button onClick={handleCreateNew} className="bg-[#00665E] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#004d46] shadow-lg shadow-[#00665E]/20">+ Crea Nuovo</button>
      </div>

      <div className="flex gap-6 border-b border-gray-200 mb-8">
        <button onClick={() => setActiveTab('landing')} className={`pb-3 px-2 text-sm font-bold border-b-2 transition ${activeTab === 'landing' ? 'border-[#00665E] text-[#00665E]' : 'border-transparent text-gray-400'}`}>Landing Page</button>
        <button onClick={() => setActiveTab('flyer')} className={`pb-3 px-2 text-sm font-bold border-b-2 transition ${activeTab === 'flyer' ? 'border-[#00665E] text-[#00665E]' : 'border-transparent text-gray-400'}`}>Volantini</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pages.filter(p => p.type === activeTab).map((page) => (
          <div key={page.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition group">
            <div className="h-40 bg-gray-50 relative flex items-center justify-center p-4">
               {/* eslint-disable-next-line @next/next/no-img-element */}
              {page.type === 'landing' ? <img src={page.company_logo || '/logo-integra.png'} className="h-16 object-contain" alt="Logo"/> : <img src={page.slides?.[0] || 'https://via.placeholder.com/300'} className="w-full h-full object-cover" alt="Flyer"/>}
            </div>
            <div className="p-6">
              <h3 className="font-bold text-lg text-gray-900 mb-1 truncate">{page.title}</h3>
              <p className="text-xs text-gray-400 mb-4">Views: {page.views || 0}</p>
              <div className="flex gap-2">
                <Link href={`/p/${page.slug}`} target="_blank" className="flex-1 bg-gray-100 text-center py-2 rounded-lg text-xs font-bold hover:bg-gray-200 text-gray-600">👁️ Vedi</Link>
                <button onClick={() => handleEdit(page)} className="flex-1 bg-[#00665E]/10 text-[#00665E] font-bold py-2 rounded-lg text-xs hover:bg-[#00665E]/20">✏️ Modifica</button>
                <button onClick={() => handleDelete(page.id)} className="px-3 text-red-400 hover:bg-red-50 rounded-lg">🗑️</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-md">
          <div className="bg-white p-8 rounded-3xl w-full max-w-4xl shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-gray-400 text-2xl hover:text-gray-800">×</button>
            <h2 className="text-2xl font-black text-gray-900 mb-6">{editingId ? 'Modifica' : 'Crea'} {activeTab === 'landing' ? 'Landing Page' : 'Volantino'}</h2>
            
            <form onSubmit={handleSave} className="space-y-8">
              {/* NOME E SLUG */}
              <div className="grid grid-cols-2 gap-4">
                 <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:border-[#00665E]" placeholder="Nome Interno (es. Promo Estate)" />
                 <input type="text" value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} className="bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:border-[#00665E]" placeholder="Link Pubblico (es. promo-estate)" />
              </div>

              {/* AI CHATBOT FIXATO */}
              <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 shadow-sm">
                 <div className="flex justify-between items-center mb-2">
                    <h3 className="text-xs font-bold text-purple-700 uppercase">✨ Assistente AI</h3>
                    <span className="text-[10px] text-purple-400 bg-white px-2 py-0.5 rounded-full border border-purple-100">Suggerimenti Testi</span>
                 </div>
                 <div className="flex gap-2">
                    <input value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} type="text" placeholder="Es: Descrivi un ristorante di sushi elegante..." className="flex-1 bg-white border border-purple-200 text-sm rounded-lg p-2 outline-none focus:border-purple-500" />
                    <button type="button" onClick={askAI} disabled={aiLoading} className="bg-purple-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed">
                        {aiLoading ? 'Pensando...' : 'Chiedi all\'AI'}
                    </button>
                 </div>
                 {aiResponse && <div className="mt-3 bg-white p-3 rounded-lg text-sm text-gray-700 border border-purple-100 leading-relaxed shadow-inner whitespace-pre-wrap">{aiResponse}</div>}
              </div>

              {/* STILE E LOGO */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Logo */}
                 <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                    <h3 className="font-bold text-[#00665E] mb-2 text-sm uppercase">Logo Aziendale</h3>
                    <div className="flex items-center gap-4">
                      <label className="cursor-pointer bg-white border border-gray-300 px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:border-[#00665E] transition">📤 Carica Logo <input type="file" className="hidden" onChange={(e) => handleUpload(e, 'logo')} /></label>
                      {formData.company_logo && <img src={formData.company_logo} className="h-10 object-contain" alt="Logo"/>}
                    </div>
                 </div>
                 {/* Stile */}
                 <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100">
                    <h3 className="font-bold text-blue-800 mb-2 text-sm uppercase">Personalizzazione Grafica</h3>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                       <select value={styleConfig.theme} onChange={e => setStyleConfig({...styleConfig, theme: e.target.value})} className="bg-white border rounded p-2 text-xs"><option value="modern">Moderno (Bianco/Teal)</option><option value="elegant">Elegante (Crema)</option><option value="bold">Impact (Scuro)</option></select>
                       <select value={styleConfig.font} onChange={e => setStyleConfig({...styleConfig, font: e.target.value})} className="bg-white border rounded p-2 text-xs"><option value="sans">Sans (Moderno)</option><option value="serif">Serif (Classico)</option><option value="mono">Mono (Tecnico)</option></select>
                    </div>
                    <div className="flex gap-2 items-center text-xs text-gray-500">
                       <span className="font-bold">Colori:</span> Titoli <input type="color" value={styleConfig.titleColor} onChange={e => setStyleConfig({...styleConfig, titleColor: e.target.value})} className="cursor-pointer w-6 h-6 p-0 border-0" />
                       Testi <input type="color" value={styleConfig.textColor} onChange={e => setStyleConfig({...styleConfig, textColor: e.target.value})} className="cursor-pointer w-6 h-6 p-0 border-0" />
                    </div>
                 </div>
              </div>

              {/* === TAB SPECIFICI === */}
              {activeTab === 'landing' ? (
                // LANDING PAGE: 3 BLOCCHI
                <div className="space-y-4">
                  <h3 className="font-bold text-[#00665E] border-b border-gray-200 pb-2">3 Sezioni di Contenuto</h3>
                  {sections.map((sec, i) => (
                    <div key={i} className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm relative group">
                      <span className="absolute top-4 right-4 text-xs font-bold text-gray-300 bg-gray-50 px-2 py-1 rounded">BLOCCO {i+1}</span>
                      <div className="space-y-3">
                        <input type="text" placeholder={`Titolo Sezione ${i+1}`} value={sec.title} onChange={e => updateSection(i, 'title', e.target.value)} className="w-full font-bold text-lg outline-none placeholder-gray-300 border-b border-transparent focus:border-gray-200 transition" />
                        <textarea placeholder="Testo descrittivo..." value={sec.text} onChange={e => updateSection(i, 'text', e.target.value)} className="w-full text-sm text-gray-600 outline-none resize-none h-20 bg-transparent placeholder-gray-300" />
                        <div className="flex items-center gap-3 mt-2">
                           <label className="cursor-pointer text-xs bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg font-bold text-gray-600 transition">🖼️ {sec.media ? 'Sostituisci Media' : 'Carica Foto/Video'} <input type="file" className="hidden" onChange={(e) => handleUpload(e, 'section', i)} /></label>
                           {sec.media && <div className="h-10 w-16 bg-gray-100 rounded overflow-hidden border border-gray-200"><img src={sec.media} className="w-full h-full object-cover" alt="media"/></div>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // VOLANTINO: DESCRIZIONE + SLIDES
                <div className="space-y-4">
                  <h3 className="font-bold text-[#00665E] border-b border-gray-200 pb-2">Configurazione Volantino</h3>
                  <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm">
                      <label className="block text-xs font-bold text-gray-500 mb-1">Descrizione / Intro (Opzionale)</label>
                      <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm h-24 outline-none focus:border-[#00665E]" placeholder="Scrivi qui un testo introduttivo per i tuoi clienti..." />
                  </div>
                  <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200 border-dashed">
                    <label className="w-full cursor-pointer bg-white border border-gray-300 h-24 rounded-xl flex flex-col items-center justify-center font-bold text-[#00665E] hover:bg-teal-50 transition shadow-sm">
                      <span>+ Aggiungi Pagine Volantino (Foto/PDF)</span>
                      <span className="text-xs text-gray-400 font-normal mt-1">Clicca per caricare</span>
                      <input type="file" className="hidden" onChange={e => handleUpload(e, 'flyer')} />
                    </label>
                    {/* Anteprima Slides */}
                    {formData.slides.length > 0 && (
                      <div className="flex gap-3 mt-4 overflow-x-auto pb-2">
                        {formData.slides.map((s,i) => (
                          <div key={i} className="relative group flex-shrink-0">
                            <div className="h-24 w-20 rounded-lg overflow-hidden border border-gray-300 bg-white shadow-sm">
                               {s.includes('.pdf') ? <div className="h-full w-full flex items-center justify-center text-red-500 font-bold text-xs bg-red-50">PDF</div> : <img src={s} className="h-full w-full object-cover" alt="slide"/>}
                            </div>
                            <div className="absolute top-1 left-1 bg-black/70 text-white text-[9px] px-1 rounded">{i+1}</div>
                            <button type="button" onClick={()=>setFormData({...formData, slides: formData.slides.filter((_,x)=>x!==i)})} className="absolute -top-2 -right-2 bg-red-500 text-white w-5 h-5 rounded-full text-xs flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition">×</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* INTEGRAZIONI */}
              <div className="bg-[#00665E]/5 p-5 rounded-2xl border border-[#00665E]/10 flex flex-wrap gap-6">
                 <h4 className="w-full text-xs font-bold text-[#00665E] uppercase opacity-70">Bottoni Integrazione</h4>
                 <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm"><input type="checkbox" checked={formData.show_appointments} onChange={e => setFormData({...formData, show_appointments: e.target.checked})} className="accent-[#00665E]" /><span className="text-sm font-medium">Prenota Appuntamento</span></label>
                 <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm"><input type="checkbox" checked={formData.show_products} onChange={e => setFormData({...formData, show_products: e.target.checked})} className="accent-[#00665E]" /><span className="text-sm font-medium">Vedi Vetrina Prodotti</span></label>
              </div>

              {/* SOCIAL & FOOTER */}
              <div className="bg-purple-50/50 p-5 rounded-2xl border border-purple-100">
                <h3 className="font-bold text-purple-800 mb-4 text-sm uppercase">🔗 Link Social & Contatti (Footer)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input type="text" placeholder="Facebook URL" value={clientSocials.facebook} onChange={e => setClientSocials({...clientSocials, facebook: e.target.value})} className="bg-white border border-gray-200 p-2 rounded-lg text-sm focus:border-purple-400 outline-none" />
                  <input type="text" placeholder="Instagram URL" value={clientSocials.instagram} onChange={e => setClientSocials({...clientSocials, instagram: e.target.value})} className="bg-white border border-gray-200 p-2 rounded-lg text-sm focus:border-purple-400 outline-none" />
                  <input type="text" placeholder="TikTok URL" value={clientSocials.tiktok} onChange={e => setClientSocials({...clientSocials, tiktok: e.target.value})} className="bg-white border border-gray-200 p-2 rounded-lg text-sm focus:border-purple-400 outline-none" />
                  <input type="text" placeholder="LinkedIn URL" value={clientSocials.linkedin} onChange={e => setClientSocials({...clientSocials, linkedin: e.target.value})} className="bg-white border border-gray-200 p-2 rounded-lg text-sm focus:border-purple-400 outline-none" />
                  <input type="text" placeholder="YouTube URL" value={clientSocials.youtube} onChange={e => setClientSocials({...clientSocials, youtube: e.target.value})} className="bg-white border border-gray-200 p-2 rounded-lg text-sm focus:border-purple-400 outline-none" />
                  <input type="text" placeholder="Email Contatto" value={clientSocials.email} onChange={e => setClientSocials({...clientSocials, email: e.target.value})} className="bg-white border border-gray-200 p-2 rounded-lg text-sm focus:border-purple-400 outline-none" />
                  <input type="text" placeholder="Sito Web" value={clientSocials.website} onChange={e => setClientSocials({...clientSocials, website: e.target.value})} className="bg-white border border-gray-200 p-2 rounded-lg text-sm focus:border-purple-400 outline-none" />
                </div>
              </div>

              <button type="submit" disabled={saving || uploading} className="w-full bg-[#00665E] text-white font-bold py-4 rounded-xl text-lg shadow-xl shadow-[#00665E]/20 hover:bg-[#004d46] transition transform active:scale-[0.99]">
                {saving ? 'Salvataggio...' : '🚀 Pubblica Ora'}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}