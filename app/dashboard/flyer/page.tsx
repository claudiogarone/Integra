'use client'

import { createClient } from '../../../utils/supabase/client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function MarketingPages() {
  const [activeTab, setActiveTab] = useState<'landing' | 'flyer'>('landing')
  const [pages, setPages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<any>(null)

  // Form State
  const [formData, setFormData] = useState({
    title: '', 
    slug: '', 
    headline: '',
    subheadline: '',
    cta_text: 'Contattaci su WhatsApp',
    cta_link: '',
    hero_image: '', 
    slides: [] as string[]
  })
  
  // Stato caricamento
  const [uploading, setUploading] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        const { data } = await supabase.from('marketing_pages').select('*').order('created_at', { ascending: false })
        if (data) setPages(data)
      }
      setLoading(false)
    }
    getData()
  }, [supabase])

  // --- FUNZIONE CARICAMENTO IMMAGINI/PDF ---
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isSlide: boolean = false) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    setUploading(true)
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}-${Math.random()}.${fileExt}`
    
    // Carica su bucket 'marketing'
    const { error: uploadError } = await supabase.storage
      .from('marketing')
      .upload(fileName, file)

    if (uploadError) {
      alert('Errore caricamento: ' + uploadError.message)
      setUploading(false)
      return
    }

    // Ottieni URL pubblico
    const { data: urlData } = supabase.storage.from('marketing').getPublicUrl(fileName)
    const publicUrl = urlData.publicUrl

    // Aggiorna stato
    if (isSlide) {
      setFormData(prev => ({ ...prev, slides: [...prev.slides, publicUrl] }))
    } else {
      setFormData(prev => ({ ...prev, hero_image: publicUrl }))
    }
    
    setUploading(false)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const finalSlug = formData.slug || `${formData.title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`

    const { data, error } = await supabase
      .from('marketing_pages')
      .insert({
        user_id: user.id,
        type: activeTab,
        title: formData.title,
        slug: finalSlug,
        headline: formData.headline,
        subheadline: formData.subheadline,
        cta_text: formData.cta_text,
        cta_link: formData.cta_link,
        hero_image: formData.hero_image || 'https://via.placeholder.com/800x400',
        slides: formData.slides
      })
      .select()

    if (!error && data) {
      setPages([data[0], ...pages])
      setIsModalOpen(false)
      setFormData({ title: '', slug: '', headline: '', subheadline: '', cta_text: 'Scrivici su WhatsApp', cta_link: '', hero_image: '', slides: [] })
    } else {
      alert('Errore: ' + error?.message)
    }
    setSaving(false)
  }

  const handleDelete = async (id: number) => {
    if(!confirm('Eliminare questa pagina?')) return
    const { error } = await supabase.from('marketing_pages').delete().eq('id', id)
    if (!error) setPages(pages.filter(p => p.id !== id))
  }

  return (
    <main className="flex-1 p-8 overflow-auto bg-black text-white">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Pagine & Volantini</h1>
          <p className="text-gray-400 text-sm">Crea siti web temporanei e cataloghi sfogliabili.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-yellow-600 text-black px-4 py-2 rounded font-bold hover:bg-yellow-500 shadow-lg shadow-yellow-600/20">
          + Crea Nuovo
        </button>
      </div>

      {/* TABS */}
      <div className="flex gap-4 border-b border-gray-800 mb-6">
        <button onClick={() => setActiveTab('landing')} className={`pb-2 px-4 ${activeTab === 'landing' ? 'border-b-2 border-yellow-500 text-yellow-500 font-bold' : 'text-gray-400'}`}>Landing Page (Sito Singolo)</button>
        <button onClick={() => setActiveTab('flyer')} className={`pb-2 px-4 ${activeTab === 'flyer' ? 'border-b-2 border-yellow-500 text-yellow-500 font-bold' : 'text-gray-400'}`}>Volantino (Sfoglia)</button>
      </div>

      {/* LISTA PAGINE */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pages.filter(p => p.type === activeTab).map((page) => (
          <div key={page.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden group hover:border-yellow-500/50 transition">
            <div className="h-40 bg-gray-800 relative">
              {/* Se è volantino mostra la prima slide, se è landing mostra la hero */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={page.type === 'landing' ? page.hero_image : (page.slides?.[0]?.includes('.pdf') ? 'https://via.placeholder.com/300x200?text=PDF+Document' : (page.slides?.[0] || 'https://via.placeholder.com/300'))} 
                className="w-full h-full object-cover opacity-60" 
                alt="Preview"
              />
              <div className="absolute top-2 right-2 bg-black/60 px-2 py-1 rounded text-xs">{page.views || 0} visite</div>
            </div>
            <div className="p-5">
              <h3 className="font-bold text-lg mb-1">{page.title}</h3>
              <div className="flex gap-2 mt-4">
                <Link href={`/p/${page.slug}`} target="_blank" className="flex-1 bg-gray-800 text-center py-2 rounded text-xs text-white hover:bg-gray-700">👁️ Vedi</Link>
                <button onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/p/${page.slug}`)
                  alert('Link copiato!')
                }} className="flex-1 bg-yellow-600 text-black font-bold text-center py-2 rounded text-xs hover:bg-yellow-500">🔗 Copia Link</button>
                <button onClick={() => handleDelete(page.id)} className="px-3 bg-red-900/20 text-red-400 rounded hover:bg-red-900/40">🗑️</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL CREAZIONE */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 p-8 rounded-2xl w-full max-w-2xl shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-400 text-2xl">×</button>
            <h2 className="text-2xl font-bold text-white mb-2">Crea {activeTab === 'landing' ? 'Landing Page' : 'Volantino'}</h2>
            <p className="text-gray-400 text-sm mb-6">Compila i campi qui sotto.</p>
            
            <form onSubmit={handleSave} className="space-y-6">
              
              {/* 1. INFO BASE */}
              <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                <h3 className="text-yellow-500 font-bold text-sm mb-4 uppercase">1. Impostazioni Link</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-white mb-1">Nome Interno</label>
                    <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-gray-950 border border-gray-700 rounded p-3 text-white focus:border-yellow-500 outline-none" placeholder="Es. Promo Natale" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-white mb-1">Link Personalizzato</label>
                    <input type="text" value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} className="w-full bg-gray-950 border border-gray-700 rounded p-3 text-white focus:border-yellow-500 outline-none" placeholder="Es. sconti-estivi" />
                    <p className="text-[10px] text-gray-500 mt-1">Link finale: integra.app/p/<b>...</b></p>
                  </div>
                </div>
              </div>

              {/* 2. CONTENUTO */}
              <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                <h3 className="text-blue-400 font-bold text-sm mb-4 uppercase">2. Contenuto & Immagini</h3>

                {activeTab === 'landing' ? (
                  <>
                    <div className="mb-4">
                      <label className="block text-sm font-bold text-white mb-1">Titolo Grande</label>
                      <input type="text" value={formData.headline} onChange={e => setFormData({...formData, headline: e.target.value})} className="w-full bg-gray-950 border border-gray-700 rounded p-3 text-white" placeholder="Es. SCONTI FINO AL 50%!" />
                    </div>
                    <div className="mb-4">
                       <label className="block text-sm font-bold text-white mb-1">Descrizione</label>
                       <textarea value={formData.subheadline} onChange={e => setFormData({...formData, subheadline: e.target.value})} className="w-full bg-gray-950 border border-gray-700 rounded p-3 text-white h-20" placeholder="Descrivi l'offerta..." />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-bold text-white mb-1">Foto Copertina</label>
                      <label className="cursor-pointer bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded flex items-center gap-2 transition w-fit">
                          <span>📸 Carica Foto</span>
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, false)} />
                      </label>
                      {uploading && <span className="text-xs text-yellow-500 animate-pulse ml-2">Caricamento...</span>}
                      {formData.hero_image && <div className="mt-2 h-20 w-32 bg-gray-900 rounded overflow-hidden border border-gray-600"><img src={formData.hero_image} className="h-full w-full object-cover" alt="preview" /></div>}
                    </div>
                  </>
                ) : (
                  <div className="mb-4">
                    <label className="block text-sm font-bold text-white mb-2">Pagine del Volantino (o PDF)</label>
                    
                    <label className="w-full cursor-pointer bg-gray-950 border-2 border-dashed border-gray-700 hover:border-yellow-500 h-24 rounded-lg flex flex-col items-center justify-center transition mb-4">
                      <span className="text-white text-sm font-bold">+ Aggiungi Pagina o PDF</span>
                      <span className="text-xs text-gray-500">Immagini (JPG/PNG) o Documenti PDF</span>
                      <input type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => handleImageUpload(e, true)} />
                    </label>
                    {uploading && <p className="text-center text-yellow-500 text-xs animate-pulse mb-2">Caricamento in corso...</p>}

                    {/* Anteprima Slides */}
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {formData.slides.map((s, i) => (
                        <div key={i} className="relative w-20 h-28 flex-shrink-0 border border-gray-600 rounded overflow-hidden bg-gray-800">
                           {s.includes('.pdf') ? (
                             <div className="flex items-center justify-center h-full text-red-400 font-bold text-xs">PDF</div>
                           ) : (
                             // eslint-disable-next-line @next/next/no-img-element
                             <img src={s} alt={`Pag ${i}`} className="w-full h-full object-cover" />
                           )}
                          <button type="button" onClick={() => setFormData(p => ({...p, slides: p.slides.filter((_, idx) => idx !== i)}))} className="absolute top-0 right-0 bg-red-600 text-white w-5 h-5 flex items-center justify-center font-bold text-xs">×</button>
                          <span className="absolute bottom-0 left-0 bg-black/70 text-white text-[9px] px-1">{i+1}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 3. AZIONE */}
              <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                <h3 className="text-green-400 font-bold text-sm mb-4 uppercase">3. Dove mandiamo i clienti?</h3>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="block text-sm font-bold text-white mb-1">Testo Bottone</label>
                     <input type="text" value={formData.cta_text} onChange={e => setFormData({...formData, cta_text: e.target.value})} className="w-full bg-gray-950 border border-gray-700 rounded p-3 text-white" />
                   </div>
                   <div>
                     <label className="block text-sm font-bold text-white mb-1">Link Destinazione</label>
                     <input type="text" value={formData.cta_link} onChange={e => setFormData({...formData, cta_link: e.target.value})} className="w-full bg-gray-950 border border-gray-700 rounded p-3 text-white" placeholder="https://wa.me/..." />
                   </div>
                </div>
              </div>

              <button type="submit" disabled={saving || uploading} className="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-bold py-4 rounded-lg text-lg transition shadow-lg shadow-yellow-600/20">
                {saving ? 'Pubblicazione...' : '🚀 Pubblica Ora'}
              </button>

            </form>
          </div>
        </div>
      )}
    </main>
  )
}